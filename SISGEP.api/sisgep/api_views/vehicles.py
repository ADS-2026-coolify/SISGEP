from datetime import timedelta

from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from ..models import TabelaDetran, Veiculo
from ..permissions import IsAdministrador, IsVeiculoPermitido
from ..serializers import (
    VeiculoBancoSerializer,
    VeiculoDetranSerializer,
    VeiculoParticularSerializer,
    VeiculoSerializer,
)
from ..services.vehicle_service import (
    calcular_custo_saida,
    obter_municipio_apreensao,
    obter_tabela_detran,
    salvar_fotos_veiculo,
)
from ..validators import validar_imagem


class VeiculoViewSet(viewsets.ModelViewSet):
    queryset = Veiculo.objects.filter(
        excluido_em__isnull=True
    ).select_related(
        'veiculodetran__infracao',
        'veiculodetran__municipio',
        'veiculodetran__tabela',
        'veiculobanco__banco',
        'veiculoparticular__cliente',
    ).order_by('-data_entrada', '-id')
    serializer_class = VeiculoSerializer
    permission_classes = [IsVeiculoPermitido]

    def perform_destroy(self, instance):
        instance.excluido_em = timezone.now()
        instance.excluido_por = self.request.user
        instance.save(update_fields=['excluido_em', 'excluido_por'])

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[IsAdministrador],
        url_path='registros-administrativos',
    )
    def registros_administrativos(self, request):
        veiculos = Veiculo.objects.order_by('-data_entrada', '-id')
        serializer = self.get_serializer(veiculos, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=['get'],
        permission_classes=[IsAdministrador],
        url_path='registro-administrativo',
    )
    def registro_administrativo(self, request, pk=None):
        veiculo = get_object_or_404(Veiculo.objects.all(), pk=pk)
        serializer = self.get_serializer(veiculo)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='documento-url')
    def documento_url(self, request, pk=None):
        veiculo = self.get_object()
        tipo = request.query_params.get('tipo')

        if hasattr(veiculo, 'veiculodetran'):
            documentos = {
                'apreensao': veiculo.veiculodetran.documento_apreensao,
                'liberacao': veiculo.veiculodetran.documento_liberacao,
            }
        elif hasattr(veiculo, 'veiculobanco'):
            documentos = {
                'custodia': veiculo.veiculobanco.documento_custodia,
            }
        else:
            documentos = {}

        documento = documentos.get(tipo)
        if not documento:
            return Response(
                {'erro': 'Documento não encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        response = Response({'url': documento.url})
        response['Cache-Control'] = 'no-store'
        return response

    def create(self, request, *args, **kwargs):
        dados = request.data.dict()
        categoria = dados.get('categoria')
        placa = dados.get('placa', '').upper()
        fotos = request.FILES.getlist('fotos')

        if len(fotos) < 4:
            return Response(
                {'erro': 'É obrigatório anexar pelo menos 4 fotos do veículo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            for foto in fotos:
                validar_imagem(foto)
        except ValidationError as error:
            return Response(
                {'erro': error.messages},
                status=status.HTTP_400_BAD_REQUEST,
            )

        placa_recolhida = Veiculo.objects.filter(
            placa=placa,
            status_veiculo=Veiculo.StatusVeiculo.RECOLHIDO,
            excluido_em__isnull=True,
        ).exists()
        if placa_recolhida:
            return Response(
                {'erro': f'O veículo com a placa {placa} já está atualmente recolhido no pátio!'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not dados.get('proprietario'):
            dados['proprietario'] = 'NÃO IDENTIFICADO'

        if categoria == 'detran':
            if not request.FILES.get('documento_apreensao'):
                return Response(
                    {'erro': 'O termo de apreensão é obrigatório para veículos do DETRAN.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            data_entrada = parse_datetime(dados.get('data_entrada', ''))
            if data_entrada is None:
                data_entrada = timezone.now()
            elif timezone.is_naive(data_entrada):
                data_entrada = timezone.make_aware(data_entrada)

            tabela = obter_tabela_detran(data_entrada)
            municipio = obter_municipio_apreensao(
                dados.get('municipio_nome', 'Desconhecido')
            )
            dados['tabela'] = tabela.id
            dados['infracao'] = dados.get('infracao_id')
            dados['municipio'] = municipio.id
            serializer = VeiculoDetranSerializer(data=dados)
        elif categoria == 'banco':
            if not request.FILES.get('documento_custodia'):
                return Response(
                    {'erro': 'O mandado de busca/custódia é obrigatório para veículos de banco.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            dados['banco'] = dados.get('banco_id')
            serializer = VeiculoBancoSerializer(data=dados)
        elif categoria == 'particular':
            dados['cliente'] = dados.get('cliente_id')
            serializer = VeiculoParticularSerializer(data=dados)
        else:
            return Response(
                {'erro': 'Categoria inválida.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        veiculo = serializer.save(
            usuario=request.user if request.user.is_authenticated else None
        )
        salvar_fotos_veiculo(veiculo, request.FILES.getlist('fotos'))
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def registrar_saida(self, request, pk=None):
        veiculo = self.get_object()
        if veiculo.status_veiculo == Veiculo.StatusVeiculo.LIBERADO:
            return Response(
                {'erro': 'Este veículo já foi liberado.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data_saida = timezone.now()
        if hasattr(veiculo, 'veiculodetran'):
            veiculo_detran = veiculo.veiculodetran
            if (
                'documento_liberacao' not in request.FILES
                or not request.data.get('autorizado_por')
            ):
                return Response(
                    {
                        'erro': (
                            'O Ofício de Liberação e o Nome do Responsável são '
                            'obrigatórios para a categoria DETRAN.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            veiculo_detran.documento_liberacao = request.FILES['documento_liberacao']
            veiculo_detran.autorizado_por = request.data.get('autorizado_por')
            veiculo_detran.save()
        elif hasattr(veiculo, 'veiculobanco'):
            veiculo_banco = veiculo.veiculobanco
            if 'foto_saida' not in request.FILES:
                return Response(
                    {
                        'erro': (
                            'A anexação da foto do veículo é obrigatória no momento '
                            'da saída para a categoria BANCO.'
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            veiculo_banco.foto_saida = request.FILES['foto_saida']
            veiculo_banco.save()
        elif not hasattr(veiculo, 'veiculoparticular'):
            return Response(
                {'erro': 'Categoria de veículo não identificada ou inválida.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dias_no_patio, custo_total = calcular_custo_saida(veiculo, data_saida)
        veiculo.data_saida = data_saida
        veiculo.status_veiculo = Veiculo.StatusVeiculo.LIBERADO
        veiculo.observacoes = request.data.get('observacoes', veiculo.observacoes)
        veiculo.save()

        return Response(
            {
                'mensagem': 'Saída do veículo registrada com sucesso!',
                'dias_no_patio': dias_no_patio,
                'custo_total': f'{custo_total:.2f}',
                'data_saida': data_saida,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['get'])
    def inventario(self, request):
        veiculos_no_patio = self.queryset.filter(
            status_veiculo=Veiculo.StatusVeiculo.RECOLHIDO
        )
        serializer = self.get_serializer(veiculos_no_patio, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def leilao(self, request):
        limite_data = timezone.localdate() - timedelta(days=60)
        veiculos_leilao = self.queryset.filter(
            veiculodetran__isnull=False,
            status_veiculo=Veiculo.StatusVeiculo.RECOLHIDO,
            data_entrada__date__lte=limite_data,
        )
        serializer = self.get_serializer(veiculos_leilao, many=True)
        return Response(serializer.data)
