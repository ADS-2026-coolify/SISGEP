from collections import Counter
from datetime import datetime
from pathlib import Path

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction
from django.utils import timezone
from pypdf.errors import PdfReadError

from sisgep.models import (
    FotosVeiculo,
    Infracao,
    MunicipioApreensao,
    TabelaDetran,
    Veiculo,
    VeiculoDetran,
)
from sisgep.services.trv_import import TRVImportError, TRVRecord, parse_trv_pdf


def _aware_entry_date(value: datetime) -> datetime:
    return timezone.make_aware(value, timezone.get_current_timezone())


def _table_for_date(entry_date: datetime) -> TabelaDetran | None:
    date = timezone.localtime(entry_date).date()
    table = (
        TabelaDetran.objects.filter(ano_vigente__lte=date)
        .order_by('-ano_vigente', '-id')
        .first()
    )
    if table is not None:
        return table
    return TabelaDetran.objects.order_by('ano_vigente', 'id').first()


def _validate_batch(records: list[TRVRecord]) -> None:
    repeated_trvs = [
        code for code, count in Counter(record.trv_code for record in records).items()
        if count > 1
    ]
    repeated_plates = [
        plate for plate, count in Counter(record.plate for record in records).items()
        if count > 1
    ]
    if repeated_trvs or repeated_plates:
        details = []
        if repeated_trvs:
            details.append(f'códigos TRV repetidos: {", ".join(sorted(repeated_trvs))}')
        if repeated_plates:
            details.append(f'placas repetidas: {", ".join(sorted(repeated_plates))}')
        raise CommandError('O lote contém dados duplicados: ' + '; '.join(details))


def _database_preflight(
    records: list[TRVRecord],
) -> tuple[set[str], dict[str, tuple[Infracao, TabelaDetran]]]:
    trv_codes = [record.trv_code for record in records]
    existing_rows = list(
        VeiculoDetran.objects.filter(n_apreensao__in=trv_codes).prefetch_related('fotos')
    )
    existing_by_trv: dict[str, list[VeiculoDetran]] = {}
    for vehicle in existing_rows:
        existing_by_trv.setdefault(vehicle.n_apreensao, []).append(vehicle)

    skipped_trvs = set()
    pending_records = []
    conflicts = []
    for record in records:
        existing = existing_by_trv.get(record.trv_code, [])
        if not existing:
            pending_records.append(record)
            continue
        if len(existing) != 1:
            conflicts.append(
                f'{record.source_path.name}: já há mais de um registro com o mesmo TRV.'
            )
            continue

        vehicle = existing[0]
        if (
            vehicle.placa != record.plate
            or vehicle.status_veiculo != Veiculo.StatusVeiculo.RECOLHIDO
        ):
            conflicts.append(
                f'{record.source_path.name}: o TRV já existe, mas placa/status '
                'não correspondem ao lote.'
            )
        elif not vehicle.documento_apreensao or vehicle.fotos.count() != len(record.photos):
            conflicts.append(
                f'{record.source_path.name}: o TRV já existe, mas o documento '
                'ou as quatro fotos não estão completos.'
            )
        else:
            skipped_trvs.add(record.trv_code)

    if not pending_records:
        if conflicts:
            raise CommandError('\n'.join(conflicts))
        return skipped_trvs, {}

    pending_plates = [record.plate for record in pending_records]
    active_plates = set(
        Veiculo.objects.filter(
            placa__in=pending_plates,
            status_veiculo=Veiculo.StatusVeiculo.RECOLHIDO,
        ).values_list('placa', flat=True)
    )
    for record in pending_records:
        if record.plate in active_plates:
            conflicts.append(
                f'{record.source_path.name}: já existe outro veículo recolhido '
                'com essa placa.'
            )

    infraction_codes = {record.infraction_codes[0] for record in pending_records}
    infractions = {
        infraction.codigo: infraction
        for infraction in Infracao.objects.filter(codigo__in=infraction_codes)
    }
    for code in sorted(infraction_codes - infractions.keys()):
        conflicts.append(
            f'Infração principal {code} não está cadastrada no SISGEP.'
        )

    related_data = {}
    for record in pending_records:
        table = _table_for_date(_aware_entry_date(record.entry_date))
        if table is None:
            conflicts.append(
                f'{record.source_path.name}: não há tabela DETRAN cadastrada.'
            )
        elif record.infraction_codes[0] in infractions:
            related_data[record.trv_code] = (
                infractions[record.infraction_codes[0]],
                table,
            )

    if conflicts:
        raise CommandError('\n'.join(conflicts))
    return skipped_trvs, related_data


def _create_vehicle(
    record: TRVRecord,
    infraction: Infracao,
    table: TabelaDetran,
) -> None:
    municipality = (
        MunicipioApreensao.objects.filter(
            nome__iexact=record.municipality,
            uf='SP',
        ).first()
    )
    if municipality is None:
        municipality = MunicipioApreensao.objects.create(
            nome=record.municipality,
            uf='SP',
        )

    additional_infractions = record.infraction_codes[1:]
    observations = None
    if additional_infractions:
        observations = (
            'Infrações adicionais registradas no TRV: '
            + ', '.join(additional_infractions)
        )

    vehicle = VeiculoDetran(
        placa=record.plate,
        marca=record.brand,
        modelo=record.model,
        cor=record.color,
        chassi=record.chassis,
        proprietario=record.owner,
        data_entrada=_aware_entry_date(record.entry_date),
        data_saida=None,
        status_veiculo=Veiculo.StatusVeiculo.RECOLHIDO,
        observacoes=observations,
        usuario=None,
        n_apreensao=record.trv_code,
        local=record.location,
        infracao=infraction,
        municipio=municipality,
        tabela=table,
    )
    source_pdf = ContentFile(
        record.source_path.read_bytes(),
        name=f'{record.trv_code}.pdf',
    )
    vehicle.documento_apreensao = source_pdf
    vehicle.full_clean(exclude=['usuario'])
    vehicle.save()

    for photo in record.photos:
        filename = (
            f'{record.trv_code}_{photo.filename_suffix}{photo.extension}'
        )
        saved_photo = FotosVeiculo(
            veiculo=vehicle,
            caminho=ContentFile(photo.data, name=filename),
        )
        saved_photo.full_clean()
        saved_photo.save()


class Command(BaseCommand):
    help = (
        'Lê TRVs em PDF; por padrão apenas mostra uma prévia. '
        'Use --commit para gravar os veículos.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            'pasta',
            help='Pasta que contém os arquivos PDF dos TRVs.',
        )
        parser.add_argument(
            '--commit',
            action='store_true',
            help='Grava os veículos, documentos e quatro fotos diagonais no banco/storage.',
        )

    def handle(self, **options):
        folder = Path(options['pasta']).expanduser()
        if not folder.is_dir():
            raise CommandError(f'A pasta não existe: {folder}')

        pdf_paths = sorted(
            path
            for path in folder.iterdir()
            if path.is_file() and path.suffix.lower() == '.pdf'
        )
        if not pdf_paths:
            raise CommandError(f'Nenhum arquivo PDF encontrado em: {folder}')

        records = []
        parse_errors = []
        for path in pdf_paths:
            try:
                records.append(parse_trv_pdf(path))
            except (OSError, PdfReadError, TRVImportError) as exc:
                parse_errors.append(f'{path.name}: {exc}')

        if parse_errors:
            raise CommandError(
                'A prévia foi interrompida; nenhum registro foi gravado:\n'
                + '\n'.join(parse_errors)
            )
        _validate_batch(records)

        self.stdout.write(
            f'Prévia: {len(records)} TRVs válidos; '
            '4 fotos diagonais serão associadas por veículo.'
        )
        for record in records:
            self.stdout.write(
                f'  {record.source_path.name}: placa {record.plate}, '
                f'TRV {record.trv_code}, {len(record.infraction_codes)} '
                f'infração(ões), {len(record.photos)} fotos.'
            )

        if not options['commit']:
            self.stdout.write(
                self.style.WARNING(
                    'Modo de prévia: o banco e o armazenamento não foram alterados. '
                    'Use --commit para importar.'
                )
            )
            return

        skipped_trvs, related_data = _database_preflight(records)
        imported = 0
        for record in records:
            if record.trv_code in skipped_trvs:
                self.stdout.write(f'Ignorado (já importado): {record.source_path.name}')
                continue

            infraction, table = related_data[record.trv_code]
            try:
                with transaction.atomic():
                    _create_vehicle(record, infraction, table)
            except (IntegrityError, OSError, ValidationError) as exc:
                raise CommandError(
                    f'Falha ao importar {record.source_path.name}: {exc}'
                ) from exc

            imported += 1
            self.stdout.write(f'Importado: {record.source_path.name}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Concluído: {imported} importado(s), '
                f'{len(skipped_trvs)} já existente(s).'
            )
        )
