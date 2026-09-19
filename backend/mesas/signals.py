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
    
    #Emite al mismo grupo que ya escucha Angular por ws://localhost:8000/ws/pedidos/ 
    async_to_sync(channel_layer.group_send)(
        'pedidos_group',
        {
            'type': 'emitir_evento', # Ejecuta el método emitir_evento del PedidoConsumer
            'event_type': 'MESA_CAMBIO_ESTADO',
            'data': MesaSerializer(instance).data
        }
    )