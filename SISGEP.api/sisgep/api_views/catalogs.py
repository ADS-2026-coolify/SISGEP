from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status, viewsets
from rest_framework.response import Response

from ..models import Banco, Cliente, Infracao, TabelaDetran
from ..permissions import IsAdministradorOuLeitura
from ..serializers import BancoSerializer, ClienteSerializer, InfracaoSerializer, TabelaDetranSerializer


class CadastroViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdministradorOuLeitura]


class ClienteViewSet(CadastroViewSet):
    queryset = Cliente.objects.all()
    serializer_class = ClienteSerializer


class BancoViewSet(CadastroViewSet):
    queryset = Banco.objects.all()
    serializer_class = BancoSerializer


class InfracaoViewSet(CadastroViewSet):
    queryset = Infracao.objects.all()
    serializer_class = InfracaoSerializer


class TabelaDetranViewSet(CadastroViewSet):
    queryset = TabelaDetran.objects.order_by('-ano_vigente', '-id')
    serializer_class = TabelaDetranSerializer

    def create(self, request, *args, **kwargs):
        dados = request.data.dict()

        if 'anoVigente' in dados:
            dados['ano_vigente'] = dados.pop('anoVigente')

        if 'ano_vigente' in dados and len(str(dados['ano_vigente'])) == 4:
            dados['ano_vigente'] = f"{dados['ano_vigente']}-01-01"

        for campo in ('guincho', 'estadia'):
            if campo in dados and isinstance(dados[campo], str):
                valor_limpo = dados[campo].replace('R$', '').replace(' ', '').replace(',', '.')
                dados[campo] = valor_limpo if valor_limpo else '0'

        data_vigencia = parse_date(str(dados.get('ano_vigente', '')))
        if data_vigencia and data_vigencia < timezone.localdate():
            return Response(
                {'erro': 'Não é possível criar uma tabela DETRAN com vigência retroativa.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=dados)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        tabela = self.get_object()
        hoje = timezone.localdate()
        data_vigencia = parse_date(str(request.data.get('ano_vigente', '')))
        if tabela.ano_vigente < hoje or (data_vigencia and data_vigencia < hoje):
            return Response(
                {'erro': 'Tabelas DETRAN de vigências anteriores não podem ser alteradas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        tabela = self.get_object()
        if tabela.ano_vigente < timezone.localdate():
            return Response(
                {'erro': 'Tabelas DETRAN de vigências anteriores não podem ser excluídas.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)
