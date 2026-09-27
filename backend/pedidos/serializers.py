from rest_framework import serializers
from .models import Pedido, DetallePedido
from productos.serializers import ProductoSerializer # Asumiendo tu serializer de Producto


class DetallePedidoReadSerializer(serializers.ModelSerializer):
    """Serializer para LECTURA (GET) - Anida el objeto completo de Producto"""
    producto = ProductoSerializer(read_only=True)

    class Meta:
        model = DetallePedido
        fields = [
            'id_detalle_pedido',
            'pedido',
            'producto',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'observaciones'
        ]


class DetallePedidoWriteSerializer(serializers.ModelSerializer):
    """Serializer para ESCRITURA (POST/PUT) - Recibe solo el ID del Producto"""
    class Meta:
        model = DetallePedido
        fields = [
            'id_detalle_pedido',
            'producto',
            'cantidad',
            'precio_unitario',
            'subtotal',
            'observaciones'
        ]


class PedidoReadSerializer(serializers.ModelSerializer):
    """Serializer para LECTURA (GET) - Devuelve detalles y objetos anidados para Angular"""
    detalles = DetallePedidoReadSerializer(many=True, read_only=True)

    class Meta:
        model = Pedido
        fields = [
            'id_pedido',
            'fecha_hora',
            'estado',
            'total',
            'mesa',
            'usuario',
            'detalles'
        ]


class PedidoWriteSerializer(serializers.ModelSerializer):
    """Serializer para ESCRITURA (POST/PUT) - Permite crear el Pedido con sus detalles en una sola petición"""
    detalles = DetallePedidoWriteSerializer(many=True)

    class Meta:
        model = Pedido
        fields = [
            'id_pedido',
            'estado',
            'total',
            'mesa',
            'usuario',
            'detalles'
        ]
        # Hacemos 'usuario' y 'total' opcionales si los calculas en el backend
        extra_kwargs = {
            'usuario': {'required': False, 'allow_null': True},
            'total': {'required': False}
        }    

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles', [])
        
        # Asigna el usuario desde el request si está autenticado y no vino en el body
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['usuario'] = request.user

        # Asigna total inicial si no viene
        if 'total' not in validated_data:
            validated_data['total'] = 0

        pedido = Pedido.objects.create(**validated_data)
        
        total_calculado = 0
        for detalle_data in detalles_data:
            producto = detalle_data.get('producto')
            cantidad = detalle_data.get('cantidad', 1)
            
            # Obtiene precio_unitario del producto si no vino expresamente
            precio_unitario = detalle_data.get('precio_unitario') or getattr(producto, 'precio', 0)
            subtotal = precio_unitario * cantidad
            
            DetallePedido.objects.create(
                pedido=pedido,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio_unitario,
                subtotal=subtotal,
                observaciones=detalle_data.get('observaciones', '')
            )
            total_calculado += subtotal

        pedido.total = total_calculado
        pedido.save()
        return pedido

    def update(self, instance, validated_data):
        detalles_data = validated_data.pop('detalles', None)
        
        # Actualiza los campos directos del Pedido
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Si se envían nuevos detalles, reemplaza los anteriores
        if detalles_data is not None:
            instance.detalles.all().delete()
            for detalle_data in detalles_data:
                DetallePedido.objects.create(pedido=instance, **detalle_data)

        return instance