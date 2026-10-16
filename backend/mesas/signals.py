"""
Se reutiliza el mismo canal WebSocket, de pedidos
WebsocketService recibe el evento 'MESA_CAMBIO_ESTADO'
y cualquier componente (ej. Mapa de Mesas o Caja) reacciona automáticamente.
No requieres tocar ni consumers.py ni routing.py.
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Mesa
from .serializers import MesaSerializer

@receiver(post_save, sender=Mesa)
def notificar_cambio_mesa(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()

    async_to_sync(channel_layer.group_send)(
        'comandas',
        {
            'type': 'comanda_event',
            'evento': {
                'type': 'MESA_CAMBIO_ESTADO',
                'data': MesaSerializer(instance).data
            }
        }
    )