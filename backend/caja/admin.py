from django.contrib import admin

from .models import Pago


@admin.register(Pago)
class PagoAdmin(admin.ModelAdmin):
    """Administración de pagos en el panel de Django."""
    list_display = (
        'id_pago',
        'pedido',
        'metodo_pago',
        'monto',
        'fecha_hora',
        'cajero',
    )
    list_filter = ('metodo_pago', 'fecha_hora')
    search_fields = ('pedido__id_pedido',)