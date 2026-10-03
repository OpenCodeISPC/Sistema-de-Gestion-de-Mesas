from django.db import transaction
from django.utils import timezone
from django.db.models import Sum
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from pedidos.models import Pedido

from auditoria.mongo import registrar_evento

from .models import CierreCaja, Pago
from .serializers import (
    CierreCajaReadSerializer,
    CierreCajaWriteSerializer,
    PagoReadSerializer,
    PagoWriteSerializer,
)


class PagoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar el CRUD de Pagos (cobros registrados en caja).

    Al registrar un cobro, el pedido pasa a CERRADO y la mesa se libera
    (siempre que no queden otros pedidos abiertos sobre la misma mesa)."""
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
        if CierreCaja.objects.filter(fecha_cierre=timezone.localdate()).exists():
            raise serializers.ValidationError(
                'La caja de hoy ya fue cerrada. No se pueden registrar más cobros.'
            )

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

        registrar_evento(
            tipo='PAGO_REGISTRADO',
            actor=pago.cajero.email if pago.cajero else None,
            detalle=f'Cobro de la mesa {pedido.mesa.numero}',
            datos={
                'id_pago': pago.id_pago,
                'id_pedido': pedido.id_pedido,
                'monto': pago.monto,
                'metodo_pago': pago.metodo_pago,
            },
        )


class CierreCajaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el cierre de caja diario (arqueo del día).

    Los montos por forma de pago se calculan automáticamente sobre los
    Pagos del día. `POST /api/cierres/` recibe solo el monto rendido y
    opcionalmente observaciones; la diferencia surge de comparar el
    monto rendido contra el efectivo esperado. Solo se permite un cierre
    por día (dato garantizado además por una restricción única en la BD).
    """
    queryset = CierreCaja.objects.all().order_by('-fecha_hora')

    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return CierreCajaReadSerializer
        return CierreCajaWriteSerializer

    def _calcular_totales_dia(self, dia):
        pagos_del_dia = Pago.objects.filter(fecha_hora__date=dia)
        monto_efectivo = pagos_del_dia.filter(
            metodo_pago='EFECTIVO'
        ).aggregate(total=Sum('monto'))['total'] or 0
        monto_tarjeta = pagos_del_dia.filter(
            metodo_pago='TARJETA'
        ).aggregate(total=Sum('monto'))['total'] or 0
        monto_transferencia = pagos_del_dia.filter(
            metodo_pago='TRANSFERENCIA'
        ).aggregate(total=Sum('monto'))['total'] or 0
        monto_otro = pagos_del_dia.filter(
            metodo_pago='OTRO'
        ).aggregate(total=Sum('monto'))['total'] or 0
        return {
            'monto_efectivo': monto_efectivo,
            'monto_tarjeta': monto_tarjeta,
            'monto_transferencia': monto_transferencia,
            'monto_otro': monto_otro,
            'total_cobrado': monto_efectivo + monto_tarjeta
            + monto_transferencia + monto_otro,
        }

    @action(detail=False, methods=['get'], url_path='resumen')
    def resumen(self, request):
        """Devuelve los totales del día actual y si la caja ya fue cerrada."""
        hoy = timezone.localdate()
        totales = self._calcular_totales_dia(hoy)
        cierre = CierreCaja.objects.filter(fecha_cierre=hoy).first()
        return Response({
            'fecha': hoy.isoformat(),
            **totales,
            'total_pagos': Pago.objects.filter(fecha_hora__date=hoy).count(),
            'cerrado': cierre is not None,
            'cierre': CierreCajaReadSerializer(cierre).data if cierre else None,
        })

    @action(detail=False, methods=['post'], url_path='reabrir')
    def reabrir(self, request):
        """Reabre la caja del día eliminando el cierre registrado.

        Se usa cuando caen más pedidos después de cerrar: borra el cierre
        de hoy para volver a permitir cobros. La acción queda auditada.
        """
        hoy = timezone.localdate()
        borrados, _ = CierreCaja.objects.filter(fecha_cierre=hoy).delete()
        if borrados == 0:
            raise serializers.ValidationError(
                'La caja de hoy ya está abierta, no hay cierre que reabrir.'
            )

        if self.request.user.is_authenticated:
            cajero = self.request.user
        else:
            cajero = None

        registrar_evento(
            tipo='CAJA_REABIERTA',
            actor=cajero.email if cajero else None,
            detalle=f'Reapertura de la caja del día {hoy}',
            datos={'fecha': hoy.isoformat()},
        )

        return Response({
            'fecha': hoy.isoformat(),
            'reabierta': True,
        })

    def create(self, request, *args, **kwargs):
        """Crea el cierre pero responde con el serializer de lectura completo
        (el write serializer solo trae lo que declara el cajero)."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = CierreCajaReadSerializer(serializer.instance).data
        headers = self.get_success_headers(output)
        return Response(output, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        """Calcula los totales del día, guarda el cierre y lo audita."""
        hoy = timezone.localdate()
        if CierreCaja.objects.filter(fecha_cierre=hoy).exists():
            raise serializers.ValidationError(
                {'fecha_cierre': 'La caja de hoy ya fue cerrada.'}
            )

        if self.request.user.is_authenticated:
            cajero = self.request.user
        else:
            cajero = None

        totales = self._calcular_totales_dia(hoy)
        total_rendido = serializer.validated_data.get('total_rendido', 0)
        diferencia = total_rendido - totales['monto_efectivo']

        cierre = serializer.save(
            fecha_cierre=hoy,
            cajero=cajero,
            monto_efectivo=totales['monto_efectivo'],
            monto_tarjeta=totales['monto_tarjeta'],
            monto_transferencia=totales['monto_transferencia'],
            monto_otro=totales['monto_otro'],
            total_cobrado=totales['total_cobrado'],
            diferencia=diferencia,
        )

        registrar_evento(
            tipo='CIERRE_CAJA',
            actor=cajero.email if cajero else None,
            detalle=f'Cierre de caja del día {hoy}',
            datos={
                'id_cierre': cierre.id_cierre,
                'total_cobrado': float(cierre.total_cobrado),
                'total_rendido': float(cierre.total_rendido),
                'diferencia': float(cierre.diferencia),
            },
        )