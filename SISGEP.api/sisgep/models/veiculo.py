from django.db import models
from django.utils import timezone

from .banco import Banco
from .cliente import Cliente
from .municipio import MunicipioApreensao
from .tabela_detran import TabelaDetran
from .usuario import Usuario
from ..validators import validar_documento, validar_imagem
from config.storage import documents_storage


class Veiculo(models.Model):
    class StatusVeiculo(models.TextChoices):
        RECOLHIDO = 'RECOLHIDO', 'Recolhido'
        LIBERADO = 'LIBERADO', 'Liberado'

    placa = models.CharField(max_length=10)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    cor = models.CharField(max_length=50)
    chassi = models.CharField(max_length=50, blank=True, null=True)
    proprietario = models.CharField(max_length=255)
    data_entrada = models.DateTimeField(default=timezone.now)
    data_saida = models.DateTimeField(blank=True, null=True)
    status_veiculo = models.CharField(max_length=15, choices=StatusVeiculo.choices, default=StatusVeiculo.RECOLHIDO)
    observacoes = models.TextField(blank=True, null=True)
    usuario = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True)
    excluido_em = models.DateTimeField(blank=True, null=True, editable=False)
    excluido_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        editable=False,
        related_name='veiculos_excluidos',
    )

    @property
    def categoria(self):
        if hasattr(self, 'veiculodetran'):
            return 'detran'
        if hasattr(self, 'veiculobanco'):
            return 'banco'
        if hasattr(self, 'veiculoparticular'):
            return 'particular'
        return 'base'


class VeiculoParticular(Veiculo):
    guincho = models.DecimalField(max_digits=10, decimal_places=2)
    diaria = models.DecimalField(max_digits=10, decimal_places=2)
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT)


class VeiculoBanco(Veiculo):
    documento_custodia = models.FileField(
        upload_to='documentos/banco/',
        storage=documents_storage,
        blank=True,
        null=True,
        validators=[validar_documento],
    )
    foto_saida = models.ImageField(upload_to='fotos/saida_banco/', blank=True, null=True)
    diaria_negociada = models.DecimalField(max_digits=10, decimal_places=2)
    guincho_negociado = models.DecimalField(max_digits=10, decimal_places=2)
    banco = models.ForeignKey(Banco, on_delete=models.PROTECT)


class VeiculoDetran(Veiculo):
    n_apreensao = models.CharField(max_length=100)
    local = models.CharField(max_length=255)
    documento_apreensao = models.FileField(
        upload_to='documentos/detran/apreensao/',
        storage=documents_storage,
        blank=True,
        null=True,
        validators=[validar_documento],
    )
    documento_liberacao = models.FileField(
        upload_to='documentos/detran/liberacao/',
        storage=documents_storage,
        blank=True,
        null=True,
        validators=[validar_documento],
    )
    autorizado_por = models.CharField(max_length=255, blank=True, null=True)

    infracao = models.ForeignKey('Infracao', on_delete=models.PROTECT)
    municipio = models.ForeignKey(MunicipioApreensao, on_delete=models.PROTECT)
    tabela = models.ForeignKey(TabelaDetran, on_delete=models.PROTECT)


class FotosVeiculo(models.Model):
    veiculo = models.ForeignKey(Veiculo, on_delete=models.CASCADE, related_name='fotos')
    caminho = models.ImageField(upload_to='fotos/checklist/', validators=[validar_imagem])
    data_up = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Foto de {self.veiculo.placa}'
