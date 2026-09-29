from rest_framework import viewsets
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from .models import Pedido
from .serializers import PedidoReadSerializer, PedidoWriteSerializer


class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar CRUD completo de Pedidos.
    Filtra opcionalmente por query params (?estado=PENDIENTE&mesa=1).
    """

    queryset = Pedido.objects.all().order_by("-fecha_hora")

    def get_serializer_class(self):
        # Utiliza un serializer optimizado según la acción (Lectura vs Escritura)
        if self.action in ["list", "retrieve"]:
            return PedidoReadSerializer
        return PedidoWriteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        estado = self.request.query_params.get("estado")
        mesa = self.request.query_params.get("mesa")

        if estado:
            queryset = queryset.filter(estado=estado)
        if mesa:
            queryset = queryset.filter(mesa_id=mesa)

        return queryset

    # pedidos/views.py


class ComandaViewSet(viewsets.ModelViewSet):
    # Trae el pedido si Cocina O Barra todavía tienen tareas pendientes
    queryset = Pedido.objects.filter(
        Q(estado_cocina__in=["PENDIENTE", "PREPARACION", "LISTO"])
        | Q(estado_barra__in=["PENDIENTE", "PREPARACION", "LISTO"])
    ).order_by("-fecha_hora")

    def get_serializer_class(self):
        if self.action in ["list", "retrieve"]:
            return PedidoReadSerializer
        return PedidoWriteSerializer
