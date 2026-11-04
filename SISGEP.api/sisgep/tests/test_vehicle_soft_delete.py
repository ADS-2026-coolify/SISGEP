from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from sisgep.models import (
    Banco,
    Cliente,
    Infracao,
    MunicipioApreensao,
    TabelaDetran,
    Usuario,
    Veiculo,
    VeiculoBanco,
    VeiculoDetran,
    VeiculoParticular,
)


class VeiculoSoftDeleteTests(APITestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_user(
            cpf='12345678901',
            nome_completo='Administrador de Teste',
            email='admin@example.com',
            telefone='11999999999',
            tipo_usuario=Usuario.TipoUsuario.ADMINISTRADOR,
            password='senha-de-teste-segura',
        )
        self.vehicle = Veiculo.objects.create(
            placa='ABC1234',
            marca='Marca',
            modelo='Modelo',
            cor='Prata',
            proprietario='Proprietário',
            usuario=self.admin,
        )
        self.client.force_authenticate(user=self.admin)

    def test_delete_preserves_vehicle_and_hides_it_from_api(self):
        response = self.client.delete(
            reverse('veiculo-detail', kwargs={'pk': self.vehicle.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.vehicle.refresh_from_db()
        self.assertIsNotNone(self.vehicle.excluido_em)
        self.assertEqual(self.vehicle.excluido_por, self.admin)
        self.assertTrue(Veiculo.objects.filter(pk=self.vehicle.pk).exists())
        list_response = self.client.get(reverse('veiculo-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(list_response.data, [])
        self.assertEqual(
            self.client.get(
                reverse('veiculo-detail', kwargs={'pk': self.vehicle.pk})
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.get(reverse('veiculo-inventario')).data,
            [],
        )
        admin_records = self.client.get(
            reverse('veiculo-registros-administrativos')
        )
        self.assertEqual(admin_records.status_code, status.HTTP_200_OK)
        self.assertEqual(len(admin_records.data), 1)
        self.assertEqual(admin_records.data[0]['excluido_por'], self.admin.pk)
        self.assertIsNotNone(admin_records.data[0]['excluido_em'])
        admin_detail = self.client.get(
            reverse(
                'veiculo-registro-administrativo',
                kwargs={'pk': self.vehicle.pk},
            )
        )
        self.assertEqual(admin_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(admin_detail.data['placa'], self.vehicle.placa)
        self.assertEqual(admin_detail.data['excluido_por'], self.admin.pk)
        self.assertEqual(
            admin_detail.data['excluido_por_nome'],
            self.admin.nome_completo,
        )
        self.assertIsNotNone(admin_detail.data['excluido_em'])

    def test_deleted_vehicle_is_not_listed_as_auction_eligible(self):
        self.vehicle.data_entrada = timezone.now() - timedelta(days=61)
        self.vehicle.save(update_fields=['data_entrada'])
        self.client.delete(
            reverse('veiculo-detail', kwargs={'pk': self.vehicle.pk})
        )

        response = self.client.get(reverse('veiculo-leilao'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_auction_only_lists_detran_vehicles_held_more_than_60_days(self):
        now = timezone.now()
        infraction = Infracao.objects.create(codigo='TESTE', descricao='Teste')
        municipality = MunicipioApreensao.objects.create(nome='Município de Teste', uf='SP')
        table = TabelaDetran.objects.create(
            guincho='100.00',
            estadia='10.00',
            ano_vigente=timezone.localdate(),
        )
        eligible = VeiculoDetran.objects.create(
            placa='DET1234',
            marca='Marca',
            modelo='Detran elegível',
            cor='Prata',
            proprietario='Proprietário',
            usuario=self.admin,
            data_entrada=now - timedelta(days=61),
            n_apreensao='AP-1',
            local='Local de teste',
            infracao=infraction,
            municipio=municipality,
            tabela=table,
        )
        VeiculoDetran.objects.create(
            placa='DET5678',
            marca='Marca',
            modelo='Detran com 60 dias',
            cor='Prata',
            proprietario='Proprietário',
            usuario=self.admin,
            data_entrada=now - timedelta(days=59),
            n_apreensao='AP-2',
            local='Local de teste',
            infracao=infraction,
            municipio=municipality,
            tabela=table,
        )
        client = Cliente.objects.create(
            nome='Cliente de Teste',
            cpf='123.456.789-00',
            telefone='11999999999',
            endereco='Rua de Teste, 1',
        )
        VeiculoParticular.objects.create(
            placa='PAR1234',
            marca='Marca',
            modelo='Particular antigo',
            cor='Prata',
            proprietario='Proprietário',
            usuario=self.admin,
            data_entrada=now - timedelta(days=61),
            guincho='100.00',
            diaria='10.00',
            cliente=client,
        )
        bank = Banco.objects.create(
            nome='Banco de Teste',
            cnpj='12.345.678/0001-90',
            telefone='11999999999',
            guincho_padrao='100.00',
            diaria_padrao='10.00',
        )
        VeiculoBanco.objects.create(
            placa='BAN1234',
            marca='Marca',
            modelo='Banco antigo',
            cor='Prata',
            proprietario='Proprietário',
            usuario=self.admin,
            data_entrada=now - timedelta(days=61),
            guincho_negociado='100.00',
            diaria_negociada='10.00',
            banco=bank,
        )

        response = self.client.get(reverse('veiculo-leilao'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([record['id'] for record in response.data], [eligible.pk])

    def test_operator_cannot_soft_delete_vehicle(self):
        operator = Usuario.objects.create_user(
            cpf='10987654321',
            nome_completo='Operador de Teste',
            email='operador@example.com',
            telefone='11888888888',
            tipo_usuario=Usuario.TipoUsuario.OPERADOR,
            password='senha-de-teste-segura',
        )
        self.client.force_authenticate(user=operator)

        response = self.client.delete(
            reverse('veiculo-detail', kwargs={'pk': self.vehicle.pk})
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.vehicle.refresh_from_db()
        self.assertIsNone(self.vehicle.excluido_em)
        self.assertIsNone(self.vehicle.excluido_por)
        self.assertEqual(
            self.client.get(
                reverse('veiculo-registros-administrativos')
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        self.assertEqual(
            self.client.get(
                reverse(
                    'veiculo-registro-administrativo',
                    kwargs={'pk': self.vehicle.pk},
                )
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
