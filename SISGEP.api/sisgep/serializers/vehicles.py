from rest_framework import serializers

from ..models import FotosVeiculo, Veiculo, VeiculoBanco, VeiculoDetran, VeiculoParticular
from .catalogs import (
    BancoSerializer,
    ClienteSerializer,
    InfracaoSerializer,
    TabelaDetranSerializer,
)


class FotosVeiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = FotosVeiculo
        fields = '__all__'


class VeiculoDetranSerializer(serializers.ModelSerializer):
    fotos = FotosVeiculoSerializer(many=True, read_only=True)
    categoria = serializers.CharField(read_only=True)
    infracao_info = InfracaoSerializer(source='infracao', read_only=True)
    tabela_info = TabelaDetranSerializer(source='tabela', read_only=True)
    municipio_info = serializers.CharField(source='municipio.nome', read_only=True)
    excluido_por_nome = serializers.CharField(
        source='excluido_por.nome_completo',
        read_only=True,
    )

    class Meta:
        model = VeiculoDetran
        fields = '__all__'


class VeiculoBancoSerializer(serializers.ModelSerializer):
    fotos = FotosVeiculoSerializer(many=True, read_only=True)
    categoria = serializers.CharField(read_only=True)
    banco_info = BancoSerializer(source='banco', read_only=True)
    excluido_por_nome = serializers.CharField(
        source='excluido_por.nome_completo',
        read_only=True,
    )
    guincho = serializers.DecimalField(source='guincho_negociado', max_digits=10, decimal_places=2, read_only=True)
    diaria = serializers.DecimalField(source='diaria_negociada', max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = VeiculoBanco
        fields = '__all__'


class VeiculoParticularSerializer(serializers.ModelSerializer):
    fotos = FotosVeiculoSerializer(many=True, read_only=True)
    categoria = serializers.CharField(read_only=True)
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    excluido_por_nome = serializers.CharField(
        source='excluido_por.nome_completo',
        read_only=True,
    )

    class Meta:
        model = VeiculoParticular
        fields = '__all__'


class VeiculoSerializer(serializers.ModelSerializer):
    fotos = FotosVeiculoSerializer(many=True, read_only=True)
    categoria = serializers.CharField(read_only=True)
    excluido_por_nome = serializers.CharField(
        source='excluido_por.nome_completo',
        read_only=True,
    )

    class Meta:
        model = Veiculo
        fields = '__all__'

    def to_representation(self, instance):
        if hasattr(instance, 'veiculodetran'):
            return VeiculoDetranSerializer(instance.veiculodetran, context=self.context).data
        if hasattr(instance, 'veiculobanco'):
            return VeiculoBancoSerializer(instance.veiculobanco, context=self.context).data
        if hasattr(instance, 'veiculoparticular'):
            return VeiculoParticularSerializer(instance.veiculoparticular, context=self.context).data

        return super().to_representation(instance)
