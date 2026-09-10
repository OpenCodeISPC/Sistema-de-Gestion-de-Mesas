from rest_framework import viewsets
from rest_framework.response import Response
from .models import Pedido
from .serializers import (
    PedidoReadSerializer, 
    PedidoWriteSerializer
)

class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar CRUD completo de Pedidos.
    Filtra opcionalmente por query params (?estado=PENDIENTE&mesa=1).
    """
    queryset = Pedido.objects.all().order_by('-fecha_hora')

    def get_serializer_class(self):
        # Utiliza un serializer optimizado según la acción (Lectura vs Escritura)
        if self.action in ['list', 'retrieve']:
            return PedidoReadSerializer
        return PedidoWriteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get('estado')
        mesa = self.request.query_params.get('mesa')

        if estado:
            queryset = queryset.filter(estado=estado)
        if mesa:
            queryset = queryset.filter(mesa_id=mesa)

        return queryset