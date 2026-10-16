from django.urls import path
from pedidos.consumers import ComandasConsumer, PedidoConsumer

websocket_urlpatterns = [
    path('ws/comandas/', ComandasConsumer.as_asgi()),
    path('ws/pedidos/', PedidoConsumer.as_asgi()),
]