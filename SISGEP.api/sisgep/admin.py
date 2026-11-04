from django.contrib import admin
from .models import Infracao, Cliente, Banco, TabelaDetran, Veiculo


@admin.register(Veiculo)
class VeiculoAdmin(admin.ModelAdmin):
    list_display = ('placa', 'marca', 'modelo', 'status_veiculo', 'excluido_em', 'excluido_por')
    list_filter = ('status_veiculo', 'excluido_em')
    search_fields = ('placa', 'marca', 'modelo')
    readonly_fields = ('excluido_em', 'excluido_por')

    def has_delete_permission(self, request, obj=None):
        return False


admin.site.register(Infracao)
admin.site.register(Cliente)
admin.site.register(Banco)
admin.site.register(TabelaDetran)