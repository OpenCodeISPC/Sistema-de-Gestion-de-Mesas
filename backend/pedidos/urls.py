'''
La r en r'pedidos/' indica un Raw String (cadena cruda).
Desactiva los caracteres de escape de Python (como \n o \t),
haciendo que las barras invertidas \ se interpreten como texto literal.
Se usa en urls.py como buena práctica para evitar que Python confunda expresiones
de rutas (ej. \d, \w) con comandos especiales.
'''

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoViewSet

router = DefaultRouter()
router.register(r'pedidos', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('', include(router.urls)),
]