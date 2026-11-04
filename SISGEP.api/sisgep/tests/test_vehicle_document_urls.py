from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from sisgep.models import (
    Cliente,
    Infracao,
    MunicipioApreensao,
    TabelaDetran,
    Usuario,
    Veiculo,
    VeiculoDetran,
    VeiculoParticular,
)
from sisgep.serializers import VeiculoSerializer


class VeiculoDocumentUrlTests(APITestCase):
    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            cpf='12345678901',
            nome_completo='Operador de Teste',
            email='operador@example.com',
            telefone='11999999999',
            password='senha-de-teste-segura',
        )
        self.veiculo = VeiculoDetran.objects.create(
            placa='ABC1234',
            marca='Marca',
            modelo='Modelo',
            cor='Prata',
            proprietario='Proprietário',
            n_apreensao='TRV123',
            local='Rua de Teste, 1',
            infracao=Infracao.objects.create(codigo='TESTE', descricao='Infração de teste'),
            municipio=MunicipioApreensao.objects.create(nome='Cidade de Teste', uf='SP'),
            tabela=TabelaDetran.objects.create(
                guincho='100.00',
                estadia='20.00',
                ano_vigente='2026-01-01',
            ),
            documento_liberacao='documentos/detran/liberacao/oficio.pdf',
        )
        self.client.force_authenticate(user=self.usuario)
        self.url = reverse(
            'veiculo-documento-url',
            kwargs={'pk': self.veiculo.pk},
        )

    def test_generates_a_fresh_download_url_for_each_request(self):
        storage = self.veiculo.documento_liberacao.storage
        with patch.object(storage, 'url', side_effect=['signed-url-1', 'signed-url-2']):
            first_response = self.client.get(self.url, {'tipo': 'liberacao'})
            second_response = self.client.get(self.url, {'tipo': 'liberacao'})

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(first_response.data, {'url': 'signed-url-1'})
        self.assertEqual(first_response['Cache-Control'], 'no-store')
        self.assertEqual(second_response.status_code, status.HTTP_200_OK)
        self.assertEqual(second_response.data, {'url': 'signed-url-2'})

    def test_returns_not_found_for_a_missing_document(self):
        self.veiculo.documento_liberacao = ''
        self.veiculo.save(update_fields=['documento_liberacao'])

        response = self.client.get(self.url, {'tipo': 'liberacao'})

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_requires_authentication(self):
        self.client.force_authenticate(user=None)

        response = self.client.get(self.url, {'tipo': 'liberacao'})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_detran_details_include_infraction_description(self):
        vehicle = Veiculo.objects.get(pk=self.veiculo.pk)

        data = VeiculoSerializer(vehicle).data

        self.assertEqual(data['infracao_info']['codigo'], 'TESTE')
        self.assertEqual(data['infracao_info']['descricao'], 'Infração de teste')

    def test_private_vehicle_details_include_customer_information(self):
        cliente = Cliente.objects.create(
            nome='Cliente de Teste',
            cpf='123.456.789-00',
            telefone='11988887777',
            email='cliente@example.com',
            endereco='Rua de Teste, 2',
        )
        particular = VeiculoParticular.objects.create(
            placa='XYZ1234',
            marca='Marca',
            modelo='Modelo',
            cor='Preto',
            proprietario='Cliente de Teste',
            guincho='120.00',
            diaria='30.00',
            cliente=cliente,
        )
        vehicle = Veiculo.objects.get(pk=particular.pk)

        data = VeiculoSerializer(vehicle).data

        self.assertEqual(data['cliente_info']['nome'], 'Cliente de Teste')
        self.assertEqual(data['cliente_info']['cpf'], '123.456.789-00')
        self.assertEqual(data['cliente_info']['telefone'], '11988887777')
        self.assertEqual(data['cliente_info']['email'], 'cliente@example.com')
        self.assertEqual(data['cliente_info']['endereco'], 'Rua de Teste, 2')
