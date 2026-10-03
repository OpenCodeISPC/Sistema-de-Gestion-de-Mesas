from rest_framework import serializers
from .models import CierreCaja, Pago


class PagoReadSerializer(serializers.ModelSerializer):
    """Serializer para LECTURA (GET) - Devuelve datos listos para Angular."""
    numero_mesa = serializers.IntegerField(source='pedido.mesa.numero', read_only=True)
    estado_pedido = serializers.CharField(source='pedido.estado', read_only=True)
    nombre_cajero = serializers.SerializerMethodField()

    class Meta:
        model = Pago
        fields = [
            'id_pago',
            'pedido',
            'numero_mesa',
            'estado_pedido',
            'metodo_pago',
            'monto',
            'propina',
            'importe_recibido',
            'fecha_hora',
            'cajero',
            'nombre_cajero',
            'observaciones',
        ]

    def get_nombre_cajero(self, obj):
        """Devuelve el nombre completo del cajero que registró el cobro."""
        if obj.cajero:
            return f"{obj.cajero.nombre} {obj.cajero.apellido}"
        return None


class PagoWriteSerializer(serializers.ModelSerializer):
    """Serializer para ESCRITURA (POST/PUT) - Recibe los datos del cobro.
    El campo cajero se asigna automáticamente a partir del usuario autenticado
    (o queda nulo si la petición no trae token JWT)."""

    class Meta:
        model = Pago
        fields = [
            'id_pago',
            'pedido',
            'metodo_pago',
            'monto',
            'propina',
            'importe_recibido',
            'observaciones',
        ]
        read_only_fields = ['id_pago']
        extra_kwargs = {
            'propina': {'required': False},
            'importe_recibido': {'required': False},
            'observaciones': {'required': False},
        }

    def validate(self, attrs):
        monto = attrs.get('monto', 0)
        if monto <= 0:
            raise serializers.ValidationError(
                {'monto': 'El monto del cobro debe ser mayor a 0.'}
            )
        return attrs


class CierreCajaReadSerializer(serializers.ModelSerializer):
    """Serializer para LECTURA (GET) - Devuelve el cierre listo para Angular."""
    nombre_cajero = serializers.SerializerMethodField()

    class Meta:
        model = CierreCaja
        fields = [
            'id_cierre',
            'fecha_hora',
            'fecha_cierre',
            'cajero',
            'nombre_cajero',
            'monto_efectivo',
            'monto_tarjeta',
            'monto_transferencia',
            'monto_otro',
            'total_cobrado',
            'total_rendido',
            'diferencia',
            'observaciones',
        ]

    def get_nombre_cajero(self, obj):
        """Devuelve el nombre completo del cajero que realizó el cierre."""
        if obj.cajero:
            return f"{obj.cajero.nombre} {obj.cajero.apellido}"
        return None


class CierreCajaWriteSerializer(serializers.ModelSerializer):
    """Serializer para ESCRITURA (POST) - Solo recibe lo que declara el cajero."""
    class Meta:
        model = CierreCaja
        fields = ['total_rendido', 'observaciones']
        extra_kwargs = {
            'observaciones': {'required': False},
        }

    def validate_total_rendido(self, value):
        if value < 0:
            raise serializers.ValidationError(
                'El monto rendido no puede ser negativo.'
            )
        return value