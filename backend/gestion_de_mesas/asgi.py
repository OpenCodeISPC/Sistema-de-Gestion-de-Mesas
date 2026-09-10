"""
ASGI config for gestion_de_mesas project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/asgi/

-------------------Agrego WebSocket------------------------------------------
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
import pedidos.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "gestion_de_mesas.settings")

application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": URLRouter(pedidos.routing.websocket_urlpatterns),
    }
)
