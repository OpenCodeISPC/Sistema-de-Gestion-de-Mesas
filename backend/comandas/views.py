from rest_framework import viewsets
from pedidos.models import Pedido
from pedidos.serializers import PedidoReadSerializer, PedidoWriteSerializer


class ComandaViewSet(viewsets.ModelViewSet):
    """
    Sirve los Pedidos activos como 'comandas' para las pantallas de
    Cocina/Barra. Ya no depende del modelo Comanda (eliminado).
    """
    queryset = Pedido.objects.filter(
        estado__in=['PENDIENTE', 'PREPARACION', 'LISTO']
    ).order_by('-fecha_hora')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return PedidoReadSerializer
        return PedidoWriteSerializer