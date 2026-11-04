import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader
from pypdf.errors import PdfReadError
from pypdf.generic import ContentStream


class TRVImportError(ValueError):
    pass


@dataclass(frozen=True)
class TRVPhoto:
    label: str
    filename_suffix: str
    extension: str
    data: bytes


@dataclass(frozen=True)
class TRVRecord:
    source_path: Path
    trv_code: str
    plate: str
    brand: str
    model: str
    color: str
    chassis: str | None
    owner: str
    entry_date: datetime
    municipality: str
    location: str
    infraction_codes: tuple[str, ...]
    photos: tuple[TRVPhoto, ...]


PHOTO_LABELS = (
    ('Foto Diagonal Dianteira Esquerda', 'diagonal_dianteira_esquerda'),
    ('Foto Diagonal Dianteira Direita', 'diagonal_dianteira_direita'),
    ('Foto Diagonal Traseira Esquerda', 'diagonal_traseira_esquerda'),
    ('Foto Diagonal Traseira Direita', 'diagonal_traseira_direita'),
)

_MUNICIPALITY_NAMES_BY_CODE = {
    '06301': 'CÂNDIDO MOTA',
    '07267': 'TARUMÃ',
}

_FIELD_PATTERNS = {
    'TRV': re.compile(r'\bTRV\s*:\s*([A-Z0-9-]+)', re.IGNORECASE),
    'data/hora do recolhimento': re.compile(
        r'Data/Hora do Recolhimento\s*:\s*(\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2})',
        re.IGNORECASE,
    ),
    'placa': re.compile(r'\bPlaca\s*:\s*([A-Z0-9-]+)', re.IGNORECASE),
    'marca/modelo': re.compile(
        r'Marca/Modelo\s*:\s*(.+?)\s+(?:Esp.{0,2}cie|Chassi)\s*:',
        re.IGNORECASE,
    ),
    'chassi': re.compile(r'\bChassi\s*:\s*([A-Z0-9]+)', re.IGNORECASE),
    'cor': re.compile(r'\bCor\s*:\s*(\S+)', re.IGNORECASE),
    'proprietário': re.compile(
        r'(?m)^\s*Nome\s*:\s*(.*?)\s+CPF/CNPJ\s*:',
        re.IGNORECASE,
    ),
    'município': re.compile(
        r'Munic.{0,2}pio\s*:\s*(.*?)\s+C.{0,2}digo\s*:\s*(\d+)',
        re.IGNORECASE,
    ),
    'local': re.compile(r'(?m)^\s*Local\s*:\s*(.+)$', re.IGNORECASE),
}

_INFRACTION_ROW = re.compile(
    r'(?m)^\s*[A-Z0-9-]{6,}\s+(\d{4,6}-\d{1,2})(?:\s|$)',
    re.IGNORECASE,
)
_MIN_PHOTO_SIDE = 700
_ALLOWED_PHOTO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


def _extract_required(pattern: re.Pattern[str], text: str, field: str) -> str:
    match = pattern.search(text)
    if match is None:
        raise TRVImportError(f'Campo obrigatório não encontrado: {field}.')
    return match.group(1).strip()


def _extract_photos(reader: PdfReader) -> tuple[TRVPhoto, ...]:
    page = reader.pages[1]
    page_text = ' '.join((page.extract_text(extraction_mode='layout') or '').split())
    cursor = 0
    for label, _ in PHOTO_LABELS:
        position = page_text.casefold().find(label.casefold(), cursor)
        if position < 0:
            raise TRVImportError(f'Rótulo de foto não encontrado: {label}.')
        cursor = position + len(label)

    resources = page.get('/Resources')
    if resources is None:
        raise TRVImportError('A página de fotos não possui recursos de imagem.')
    xobjects = resources.get_object().get('/XObject')
    if xobjects is None:
        raise TRVImportError('A página de fotos não possui imagens incorporadas.')
    xobjects = xobjects.get_object()

    extracted_images = {}
    for image in page.images:
        if min(image.image.size) >= _MIN_PHOTO_SIDE:
            extracted_images[Path(image.name).stem] = image

    ordered_photos = []
    # The page's drawing operators follow the photo-caption order in these TRVs.
    for operands, operator in ContentStream(page.get_contents(), reader).operations:
        if operator != b'Do':
            continue

        image_name = str(operands[0]).lstrip('/')
        image_ref = xobjects.get(f'/{image_name}')
        if image_ref is None:
            continue
        image_object = image_ref.get_object()
        if image_object.get('/Subtype') != '/Image':
            continue
        width = int(image_object.get('/Width', 0))
        height = int(image_object.get('/Height', 0))
        if min(width, height) < _MIN_PHOTO_SIDE:
            continue

        image = extracted_images.get(image_name)
        if image is None:
            raise TRVImportError(
                f'Não foi possível extrair a imagem de foto {image_name}.'
            )
        extension = Path(image.name).suffix.lower()
        if extension not in _ALLOWED_PHOTO_EXTENSIONS:
            raise TRVImportError(
                f'Formato de imagem não permitido no PDF: {extension or "sem extensão"}.'
            )
        ordered_photos.append((extension, image.data))

    if len(ordered_photos) < len(PHOTO_LABELS):
        raise TRVImportError(
            f'Esperadas pelo menos {len(PHOTO_LABELS)} fotos diagonais; '
            f'encontradas {len(ordered_photos)} imagens.'
        )

    return tuple(
        TRVPhoto(label, suffix, extension, data)
        for (label, suffix), (extension, data) in zip(
            PHOTO_LABELS,
            ordered_photos[:len(PHOTO_LABELS)],
        )
    )


def parse_trv_pdf(path: Path) -> TRVRecord:
    try:
        reader = PdfReader(str(path), strict=True)
    except (OSError, PdfReadError, ValueError) as exc:
        raise TRVImportError(f'Não foi possível abrir o PDF: {exc}') from exc

    if len(reader.pages) not in {2, 3}:
        raise TRVImportError(
            f'Formato inesperado: o TRV deve ter 2 ou 3 páginas, '
            f'mas possui {len(reader.pages)}.'
        )

    text = reader.pages[0].extract_text(extraction_mode='layout') or ''
    trv_code = _extract_required(_FIELD_PATTERNS['TRV'], text, 'código do TRV').upper()
    plate = _extract_required(_FIELD_PATTERNS['placa'], text, 'placa').upper()
    entry_date_text = _extract_required(
        _FIELD_PATTERNS['data/hora do recolhimento'],
        text,
        'data/hora do recolhimento',
    )
    try:
        entry_date = datetime.strptime(entry_date_text, '%d/%m/%Y %H:%M')
    except ValueError as exc:
        raise TRVImportError(
            f'Data/hora do recolhimento inválida: {entry_date_text}.'
        ) from exc

    brand_model = _extract_required(
        _FIELD_PATTERNS['marca/modelo'],
        text,
        'marca/modelo',
    )
    brand, separator, model = brand_model.partition('/')
    if not separator or not brand.strip() or not model.strip():
        raise TRVImportError(
            f'Marca/modelo em formato inesperado: {brand_model}.'
        )

    municipality_match = _FIELD_PATTERNS['município'].search(text)
    if municipality_match is None:
        raise TRVImportError('Campo obrigatório não encontrado: município.')
    municipality = ' '.join(municipality_match.group(1).split()).upper()
    municipality_code = municipality_match.group(2)
    municipality = _MUNICIPALITY_NAMES_BY_CODE.get(municipality_code, municipality)
    if '\ufffd' in municipality:
        raise TRVImportError(
            'O nome do município contém caractere ilegível e não há correção '
            f'cadastrada para o código DETRAN {municipality_code}.'
        )

    owner_match = _FIELD_PATTERNS['proprietário'].search(text)
    owner = ' '.join(owner_match.group(1).split()) if owner_match else ''
    if not owner:
        owner = 'NÃO IDENTIFICADO'
    elif len(owner) > 255:
        raise TRVImportError(
            'O nome do proprietário foi extraído com mais de 255 caracteres; '
            'o campo do SISGEP não comporta esse valor.'
        )

    infraction_codes = tuple(dict.fromkeys(_INFRACTION_ROW.findall(text)))
    if not infraction_codes:
        raise TRVImportError('Nenhum código de infração foi encontrado no TRV.')
    chassis_match = _FIELD_PATTERNS['chassi'].search(text)

    return TRVRecord(
        source_path=path,
        trv_code=trv_code,
        plate=plate,
        brand=brand.strip(),
        model=model.strip(),
        color=_extract_required(_FIELD_PATTERNS['cor'], text, 'cor').upper(),
        chassis=chassis_match.group(1).upper() if chassis_match else None,
        owner=owner,
        entry_date=entry_date,
        municipality=municipality,
        location=_extract_required(_FIELD_PATTERNS['local'], text, 'local'),
        infraction_codes=infraction_codes,
        photos=_extract_photos(reader),
    )
