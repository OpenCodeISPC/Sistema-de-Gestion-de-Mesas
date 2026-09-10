# pedidos/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class PedidoConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_group_name = 'pedidos_group'

        # Unir el cliente al grupo global de pedidos
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Abandonar el grupo al desconectar
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Handler para recibir eventos emitidos al grupo y reenviarlos a Angular
    async def emitir_evento(self, event):
        # Formato que espera el WebsocketService de Angular
        await self.send(text_data=json.dumps({
            'type': event['event_type'],
            'data': event['data']
        }))