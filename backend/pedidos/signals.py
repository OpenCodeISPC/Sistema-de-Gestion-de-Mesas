# pedidos/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Pedido
from .serializers import PedidoReadSerializer # O el serializer que use para GET
from mesas.models import Mesa
from mesas.serializers import MesaSerializer

@receiver(post_save, sender=Pedido)
def notificar_cambio_pedido(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    
    
    # 1 Si se crea un nvo pedido, ocupamos la mesa(OCUPADA)
    if created and instance.mesa and instance.mesa.estado == 'LIBRE':
        instance.mesa.estado = 'OCUPADA'
        instance.mesa.save()
        
        # Notificamos el cambio de estado de la mesa por WebSocket a todas las pantallas de Mesas
        async_to_sync(channel_layer.group_send)(
            'pedidos_group',
            {
                'type': 'emitir_evento',
                'event_type': 'MESA_CAMBIO_ESTADO',
                'data': MesaSerializer(instance.mesa).data
            }
        )
    elif instance.estado == 'CERRADO' and instance.mesa:
        instance.mesa.estado = 'LIBRE'    
        instance.mesa.save()
        
        async_to_sync(channel_layer.group_send)(
            'pedidos_group',
            {
                'type': 'emiter_evento',
                'event_type': 'MESA_CAMBIO_ESTADO',
                'data': MesaSerializer(instance.mesa).data
            }
        )
        
    # 2. Notificamos el evento del pedido para la comanda de Cocina/Barra
    event_type = 'PEDIDO_CREADO' if created else 'PEDIDO_ESTADO_CAMBIADO'
    
    # Serializar los datos completos del pedido para la UI
    pedido_data = PedidoReadSerializer(instance).data

    # Emitir el mensaje a todos los conectados al WebSocket
    async_to_sync(channel_layer.group_send)(
        'pedidos_group',
        {
            'type': 'emitir_evento', # Llama al método emitir_evento en PedidoConsumer
            'event_type': event_type,
            'data': pedido_data
        }
    )