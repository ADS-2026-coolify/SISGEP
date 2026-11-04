from rest_framework.permissions import BasePermission, SAFE_METHODS


def is_administrador(usuario):
    return bool(
        usuario
        and usuario.is_authenticated
        and (
            usuario.tipo_usuario == usuario.TipoUsuario.ADMINISTRADOR
            or usuario.is_superuser
        )
    )


class IsAdministrador(BasePermission):
    message = 'Apenas administradores podem realizar esta operação.'

    def has_permission(self, request, view):
        return is_administrador(request.user)


class IsAdministradorOuLeitura(BasePermission):
    message = 'Apenas administradores podem alterar este cadastro.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return bool(request.user and request.user.is_authenticated)
        return is_administrador(request.user)


class IsVeiculoPermitido(BasePermission):
    message = 'Seu perfil não possui permissão para esta operação de veículo.'

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if view.action in {'registrar_saida', 'leilao'} or request.method in {'PUT', 'PATCH', 'DELETE'}:
            return is_administrador(request.user)

        return True
