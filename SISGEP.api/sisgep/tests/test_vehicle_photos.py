import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from sisgep.models import Cliente, Usuario, Veiculo


class VeiculoPhotoCountTests(APITestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.media_directory.cleanup)
        self.admin = Usuario.objects.create_user(
            cpf='12345678901',
            nome_completo='Administrador de Teste',
            email='admin@example.com',
            telefone='11999999999',
            tipo_usuario=Usuario.TipoUsuario.ADMINISTRADOR,
            password='senha-de-teste-segura',
        )
        self.client_record = Cliente.objects.create(
            nome='Cliente de Teste',
            cpf='123.456.789-00',
            telefone='11999999999',
            endereco='Rua de Teste, 1',
        )
        self.client.force_authenticate(user=self.admin)

    def make_photos(self, count):
        return [
            SimpleUploadedFile(
                f'foto-{index}.jpg',
                b'conteudo de imagem',
                content_type='image/jpeg',
            )
            for index in range(count)
        ]

    def make_vehicle_data(self, photos):
        return {
            'categoria': 'particular',
            'placa': 'ABC1234',
            'marca': 'Marca',
            'modelo': 'Modelo',
            'cor': 'Prata',
            'cliente_id': str(self.client_record.pk),
            'guincho': '100.00',
            'diaria': '20.00',
            'fotos': photos,
        }

    def test_vehicle_requires_at_least_four_photos(self):
        with override_settings(MEDIA_ROOT=self.media_directory.name):
            response = self.client.post(
                reverse('veiculo-list'),
                self.make_vehicle_data(self.make_photos(3)),
                format='multipart',
            )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.data['erro'],
            'É obrigatório anexar pelo menos 4 fotos do veículo.',
        )
        self.assertFalse(Veiculo.objects.exists())

    def test_vehicle_accepts_more_than_four_photos(self):
        with override_settings(MEDIA_ROOT=self.media_directory.name):
            response = self.client.post(
                reverse('veiculo-list'),
                self.make_vehicle_data(self.make_photos(5)),
                format='multipart',
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        vehicle = Veiculo.objects.get(placa='ABC1234')
        self.assertEqual(vehicle.fotos.count(), 5)
        self.assertEqual(len(response.data['fotos']), 5)
        self.assertTrue(all(foto['caminho'] for foto in response.data['fotos']))
