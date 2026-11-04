import os

from django.core.exceptions import ValidationError


def validar_arquivo_anexado(arquivo, extensoes_permitidas, tipos_mime_permitidos, mensagem):
    if arquivo is None:
        return

    nome_arquivo = (arquivo.name or '').lower()
    extensao = os.path.splitext(nome_arquivo)[1]
    tipo_arquivo = (getattr(arquivo, 'content_type', '') or '').lower()

    if extensao in extensoes_permitidas or tipo_arquivo in tipos_mime_permitidos:
        return

    raise ValidationError(mensagem)


def validar_imagem(arquivo):
    validar_arquivo_anexado(
        arquivo,
        {'.jpg', '.jpeg', '.png', '.webp'},
        {'image/jpeg', 'image/png', 'image/webp'},
        'Formato de arquivo inválido. Use apenas JPG, JPEG, PNG ou WEBP.'
    )


def validar_documento(arquivo):
    validar_arquivo_anexado(
        arquivo,
        {'.pdf', '.jpg', '.jpeg', '.png', '.webp'},
        {'application/pdf', 'image/jpeg', 'image/png', 'image/webp'},
        'Formato de arquivo inválido. Use apenas PDF, JPG, JPEG, PNG ou WEBP.'
    )
