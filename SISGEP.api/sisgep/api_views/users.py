import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from ..models import Usuario
from ..permissions import IsAdministrador
from ..serializers import UsuarioSerializer

logger = logging.getLogger(__name__)


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAdministrador]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response(
                {'erro': 'Autenticação necessária.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        return Response(self.get_serializer(request.user).data)

    @staticmethod
    def gerar_link_recuperacao(usuario):
        identificador = urlsafe_base64_encode(force_bytes(usuario.pk))
        token = default_token_generator.make_token(usuario)
        return f"{settings.FRONTEND_URL}/definir-senha/{identificador}/{token}"

    @staticmethod
    def enviar_email_seguro(**kwargs):
        try:
            send_mail(fail_silently=False, **kwargs)
            return True
        except Exception:
            logger.exception(
                "Falha ao enviar e-mail para %s",
                kwargs.get('recipient_list'),
            )
            return False

    def create(self, request, *args, **kwargs):
        dados = {chave: valor for chave, valor in request.data.items()}
        dados.pop('password', None)

        serializer = self.get_serializer(data=dados)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        usuario = serializer.save()
        link = self.gerar_link_recuperacao(usuario)
        mensagem = (
            f"Olá, {usuario.nome_completo}!\n\n"
            "Sua conta no SISGEP foi criada pelo administrador.\n"
            "Clique no link abaixo para criar sua senha e acessar o sistema:\n"
            f"{link}"
        )
        email_enviado = self.enviar_email_seguro(
            subject='Bem-vindo ao SISGEP - Defina sua senha',
            message=mensagem,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.email],
        )

        resposta = dict(serializer.data)
        if not email_enviado:
            resposta['aviso'] = (
                'Usuário criado, mas não foi possível enviar o e-mail de definição de senha. '
                'Use "Esqueci minha senha" mais tarde ou verifique a configuração de e-mail.'
            )
        return Response(resposta, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def esqueci_minha_senha(self, request):
        identificador = request.data.get('identificador')
        tipo = request.data.get('tipo')

        try:
            if tipo == 'cpf':
                cpf_limpo = ''.join(filter(str.isdigit, identificador))
                usuario = Usuario.objects.get(cpf=cpf_limpo)
            else:
                usuario = Usuario.objects.get(email=identificador)
        except Usuario.DoesNotExist:
            return Response(
                {'mensagem': 'Instruções enviadas se o usuário existir.'},
                status=status.HTTP_200_OK,
            )

        link = self.gerar_link_recuperacao(usuario)
        mensagem = (
            f"Olá, {usuario.nome_completo}.\n\n"
            "Você solicitou a recuperação de senha no SISGEP.\n"
            "Clique no link abaixo para criar uma nova senha:\n"
            f"{link}\n\n"
            "Se não foi você, ignore este e-mail."
        )
        self.enviar_email_seguro(
            subject='Recuperação de Senha - SISGEP',
            message=mensagem,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.email],
        )
        return Response(
            {'mensagem': 'E-mail de recuperação enviado!'},
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def redefinir_senha(self, request):
        codigo_base64 = request.data.get('uid')
        token = request.data.get('token')
        nova_senha = request.data.get('senha')

        try:
            identificador = force_str(urlsafe_base64_decode(codigo_base64))
            usuario = Usuario.objects.get(pk=identificador)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            usuario = None

        if usuario is not None and default_token_generator.check_token(usuario, token):
            usuario.set_password(nova_senha)
            usuario.save()
            return Response(
                {'mensagem': 'Senha redefinida com sucesso!'},
                status=status.HTTP_200_OK,
            )
        return Response(
            {'erro': 'O link é inválido ou já expirou.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
