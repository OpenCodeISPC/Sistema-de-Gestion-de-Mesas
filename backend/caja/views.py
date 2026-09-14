from django.db import transaction
from rest_framework import viewsets

from pedidos.models import Pedido

from .models import Pago
from .serializers import PagoReadSerializer, PagoWriteSerializer


class PagoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar el CRUD de Pagos (cobros registrados en caja).

    Al registrar un cobro, el pedido pasa a CERRADO y la mesa se libera
    (siempre que no queden otros pedidos abiertos sobre la misma mesa).
    Filtra opcionalmente por query params:
    (?metodo_pago=EFECTIVO&pedido=1&cajero=1&fecha_desde=YYYY-MM-DD&fecha_hasta=YYYY-MM-DD).
    """
    queryset = Pago.objects.all().order_by('-fecha_hora')

    def get_serializer_class(self):
        # Utiliza un serializer optimizado según la acción (Lectura vs Escritura)
        if self.action in ['list', 'retrieve']:
            return PagoReadSerializer
        return PagoWriteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        metodo_pago = self.request.query_params.get('metodo_pago')
        pedido = self.request.query_params.get('pedido')
        cajero = self.request.query_params.get('cajero')
        fecha_desde = self.request.query_params.get('fecha_desde')
        fecha_hasta = self.request.query_params.get('fecha_hasta')

        if metodo_pago:
            queryset = queryset.filter(metodo_pago=metodo_pago)
        if pedido:
            queryset = queryset.filter(pedido_id=pedido)
        if cajero:
            queryset = queryset.filter(cajero_id=cajero)
        if fecha_desde:
            queryset = queryset.filter(fecha_hora__date__gte=fecha_desde)
        if fecha_hasta:
            queryset = queryset.filter(fecha_hora__date__lte=fecha_hasta)

        return queryset

    def perform_create(self, serializer):
        """Registra el cobro, cierra el pedido y libera la mesa si corresponde."""
        if self.request.user.is_authenticated:
            cajero = self.request.user
        else:
            cajero = serializer.validated_data.get('cajero')

        with transaction.atomic():
            pago = serializer.save(cajero=cajero)

            pedido = pago.pedido
            if pedido.estado != 'CERRADO':
                pedido.estado = 'CERRADO'
                pedido.save()

            # Liberar la mesa solo si no quedan más pedidos abiertos de la misma
            tiene_pedidos_abiertos = Pedido.objects.filter(mesa=pedido.mesa).exclude(
                estado__in=['CERRADO', 'CANCELADO']
            ).exists()

            if not tiene_pedidos_abiertos and pedido.mesa.estado != 'LIBRE':
                pedido.mesa.estado = 'LIBRE'
                pedido.mesa.save()