from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .api_views import (
    BancoViewSet,
    ClienteViewSet,
    InfracaoViewSet,
    TabelaDetranViewSet,
    UsuarioViewSet,
    VeiculoViewSet,
)

# Criação do roteador para mapeamento automático
router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet)
router.register(r'clientes', ClienteViewSet)
router.register(r'bancos', BancoViewSet)
router.register(r'infracoes', InfracaoViewSet)
router.register(r'tabela-detran', TabelaDetranViewSet)
router.register(r'veiculos', VeiculoViewSet)

urlpatterns = [
    # Rotas de Autenticação (UC01 - Fazer Login)
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Rotas da API geradas pelo router
    path('', include(router.urls)),
]