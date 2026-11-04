"""Django models for the SISGEP application."""

from .banco import Banco
from .cliente import Cliente
from .infracao import Infracao
from .municipio import MunicipioApreensao
from .tabela_detran import TabelaDetran
from .usuario import Usuario, UsuarioManager
from .veiculo import FotosVeiculo, Veiculo, VeiculoBanco, VeiculoDetran, VeiculoParticular

__all__ = [
    'Banco',
    'Cliente',
    'FotosVeiculo',
    'Infracao',
    'MunicipioApreensao',
    'TabelaDetran',
    'Usuario',
    'UsuarioManager',
    'Veiculo',
    'VeiculoBanco',
    'VeiculoDetran',
    'VeiculoParticular',
]
