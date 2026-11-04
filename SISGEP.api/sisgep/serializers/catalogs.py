from rest_framework import serializers

from ..models import Banco, Cliente, Infracao, TabelaDetran


class ClienteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cliente
        fields = '__all__'


class BancoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banco
        fields = '__all__'


class InfracaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Infracao
        fields = '__all__'


class TabelaDetranSerializer(serializers.ModelSerializer):
    class Meta:
        model = TabelaDetran
        fields = '__all__'
