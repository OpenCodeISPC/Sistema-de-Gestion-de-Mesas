# pedidos/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import Pedido
from .serializers import PedidoReadSerializer
from mesas.models import Mesa
from mesas.serializers import MesaSerializer

@receiver(post_save, sender=Pedido)
def notificar_cambio_pedido(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()

    if created and instance.mesa and instance.mesa.estado == 'LIBRE':
        instance.mesa.estado = 'OCUPADA'
        instance.mesa.save()

        async_to_sync(channel_layer.group_send)(
            'comandas',
            {
                'type': 'comanda_event',
                'evento': {
                    'type': 'MESA_CAMBIO_ESTADO',
                    'data': MesaSerializer(instance.mesa).data
                }
            }
        )
    elif instance.estado == 'CERRADO' and instance.mesa:
        # Solo liberar la mesa si no quedan otros pedidos abiertos sobre ella
        otros_abiertos = Pedido.objects.filter(mesa=instance.mesa).exclude(
            estado__in=['CERRADO', 'CANCELADO']
        ).exclude(id_pedido=instance.id_pedido).exists()

        if not otros_abiertos and instance.mesa.estado != 'LIBRE':
            instance.mesa.estado = 'LIBRE'
            instance.mesa.save()

            async_to_sync(channel_layer.group_send)(
                'comandas',
                {
                    'type': 'comanda_event',
                    'evento': {
                        'type': 'MESA_CAMBIO_ESTADO',
                        'data': MesaSerializer(instance.mesa).data
                    }
                }
            )

    event_type = 'PEDIDO_CREADO' if created else 'PEDIDO_ESTADO_CAMBIADO'
    pedido_data = PedidoReadSerializer(instance).data

    async_to_sync(channel_layer.group_send)(
        'comandas',
        {
            'type': 'comanda_event',
            'evento': {
                'type': event_type,
                'data': pedido_data
            }
        }
    )