from decimal import Decimal, InvalidOperation

from rest_framework import viewsets
from rest_framework.decorators import action
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from django.http import HttpResponse
from .models import Pedido
from .serializers import PedidoReadSerializer, PedidoWriteSerializer
from caja.pdf_utils import generar_factura_pedido


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

    @action(detail=True, methods=["get"], url_path="factura")
    def factura(self, request, pk=None):
        """Genera el PDF con el detalle de consumo (factura) del pedido.

        Acepta opcionalmente ?propina=<monto> para incluirla en el total.
        """
        pedido = self.get_object()

        try:
            propina = Decimal(str(request.query_params.get("propina", "0")))
        except (InvalidOperation, TypeError, ValueError):
            propina = Decimal("0")

        subtotal = Decimal(str(pedido.total))
        total = subtotal + propina

        detalles = [
            {
                "cantidad": detalle.cantidad,
                "nombre": detalle.producto.nombre,
                "precio_unitario": detalle.precio_unitario,
                "subtotal": detalle.subtotal,
            }
            for detalle in pedido.detalles.select_related("producto")
        ]

        mozo = None
        if pedido.usuario:
            mozo = f"{pedido.usuario.nombre} {pedido.usuario.apellido}".strip()

        buffer = generar_factura_pedido(
            numero_mesa=pedido.mesa.numero,
            mozo=mozo,
            fecha_hora=pedido.fecha_hora,
            detalles=detalles,
            subtotal=subtotal,
            propina=propina,
            total=total,
        )

        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="factura-pedido-{pedido.id_pedido}.pdf"'
        )
        return response


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
