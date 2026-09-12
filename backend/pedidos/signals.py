# pedidos/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Pedido
from .serializers import PedidoSerializer # O el serializer que uses para GET

@receiver(post_save, sender=Pedido)
def notificar_cambio_pedido(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    
    # Determinar el tipo de evento para Angular
    event_type = 'PEDIDO_CREADO' if created else 'PEDIDO_ESTADO_CAMBIADO'
    
    # Serializar los datos completos del pedido para la UI
    pedido_data = PedidoSerializer(instance).data

    # Emitir el mensaje a todos los conectados al WebSocket
    async_to_sync(channel_layer.group_send)(
        'pedidos_group',
        {
            'type': 'emitir_evento', # Llama al método emitir_evento en PedidoConsumer
            'event_type': event_type,
            'data': pedido_data
        }
    )