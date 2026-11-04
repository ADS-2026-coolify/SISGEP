from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UsuarioManager(BaseUserManager):
    def create_user(self, cpf, nome_completo, password=None, **extra_fields):
        if not cpf:
            raise ValueError('O CPF é obrigatório.')
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        cpf = ''.join(filter(str.isdigit, cpf))

        user = self.model(cpf=cpf, nome_completo=nome_completo, username=cpf, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, cpf, nome_completo, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('tipo_usuario', Usuario.TipoUsuario.ADMINISTRADOR)
        return self.create_user(cpf, nome_completo, password, **extra_fields)


class Usuario(AbstractUser):
    class TipoUsuario(models.TextChoices):
        ADMINISTRADOR = 'ADMINISTRADOR', 'Administrador'
        OPERADOR = 'OPERADOR', 'Operador'

    groups = models.ManyToManyField('auth.Group', related_name='usuario_set', blank=True, verbose_name='groups')
    user_permissions = models.ManyToManyField('auth.Permission', related_name='usuario_set', blank=True, verbose_name='user permissions')

    cpf = models.CharField(max_length=11, unique=True, verbose_name='CPF')
    nome_completo = models.CharField(max_length=255, verbose_name='Nome Completo')
    telefone = models.CharField(max_length=20, verbose_name='Telefone')
    email = models.EmailField(unique=True, verbose_name='email address')
    tipo_usuario = models.CharField(max_length=15, choices=TipoUsuario.choices, default=TipoUsuario.OPERADOR, verbose_name='Tipo de Usuário')

    objects = UsuarioManager()

    USERNAME_FIELD = 'cpf'
    REQUIRED_FIELDS = ['nome_completo', 'email', 'telefone']

    class Meta:
        verbose_name = 'Usuário'
        verbose_name_plural = 'Usuários'

    def __str__(self):
        return f'{self.nome_completo} ({self.get_tipo_usuario_display()})'
