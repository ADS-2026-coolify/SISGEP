from datetime import datetime, timedelta
from decimal import Decimal
from typing import TYPE_CHECKING, Iterable

from django.utils import timezone

from ..models import FotosVeiculo, MunicipioApreensao, TabelaDetran, Veiculo

if TYPE_CHECKING:
    from django.core.files.uploadedfile import UploadedFile


def calcular_dias_no_patio(data_entrada: datetime, data_saida: datetime) -> int:
    entrada_local = timezone.localtime(data_entrada).date()
    saida_local = timezone.localtime(data_saida).date()
    return (saida_local - entrada_local).days + 1


def obter_tabela_detran(data_entrada: datetime) -> TabelaDetran:
    data_vigencia = timezone.localtime(data_entrada).date()
    tabela = (
        TabelaDetran.objects.filter(ano_vigente__lte=data_vigencia)
        .order_by('-ano_vigente', '-id')
        .first()
    )
    if tabela is not None:
        return tabela

    tabela = TabelaDetran.objects.order_by('ano_vigente', 'id').first()
    if tabela is not None:
        return tabela

    return TabelaDetran.objects.create(
        guincho=285.50,
        estadia=42.80,
        ano_vigente=timezone.now().date(),
    )


def obter_municipio_apreensao(nome: str) -> MunicipioApreensao:
    municipio, _ = MunicipioApreensao.objects.get_or_create(
        nome=nome,
        defaults={'uf': 'SP'},
    )
    return municipio


def salvar_fotos_veiculo(
    veiculo: Veiculo,
    fotos: Iterable['UploadedFile'],
) -> None:
    for foto in fotos:
        FotosVeiculo.objects.create(veiculo=veiculo, caminho=foto)


def calcular_custo_saida(veiculo: Veiculo, data_saida: datetime) -> tuple[int, Decimal]:
    dias_no_patio = calcular_dias_no_patio(veiculo.data_entrada, data_saida)

    if hasattr(veiculo, 'veiculodetran'):
        veiculo_detran = veiculo.veiculodetran
        total_diarias = 0
        data_atual = timezone.localtime(veiculo.data_entrada).date()
        data_fim = timezone.localtime(data_saida).date()
        tabelas = list(TabelaDetran.objects.order_by('-ano_vigente', '-id'))

        while data_atual <= data_fim:
            tabela_vigente = next(
                (tabela for tabela in tabelas if tabela.ano_vigente <= data_atual),
                veiculo_detran.tabela,
            )
            total_diarias += tabela_vigente.estadia
            data_atual += timedelta(days=1)

        custo_total = veiculo_detran.tabela.guincho + total_diarias
    elif hasattr(veiculo, 'veiculobanco'):
        veiculo_banco = veiculo.veiculobanco
        custo_total = veiculo_banco.guincho_negociado + (
            veiculo_banco.diaria_negociada * dias_no_patio
        )
    elif hasattr(veiculo, 'veiculoparticular'):
        veiculo_particular = veiculo.veiculoparticular
        custo_total = veiculo_particular.guincho + (
            veiculo_particular.diaria * dias_no_patio
        )
    else:
        raise ValueError('Categoria de veículo não identificada ou inválida.')

    return dias_no_patio, custo_total
