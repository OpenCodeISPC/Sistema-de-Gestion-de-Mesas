from rest_framework import serializers
from models import Producto


class ProductoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producto
        fields = [
            "id_producto",
            "nombre",
            "descripcion",
            "precio",
            "stock",
            "categoria",
            "disponibilidad",
            "creado_en",
            "actualizado_en",
        ]
        # se puede enviar al front, pero el front no los puede modificar
        read_only_fields = ["id_producto", "creado_en", "actualizado_en"]

    def validate_precio(self, value):
        if value < 0:
            raise serializers.ValidationError("El precio no puede ser negativo")
        return value

    def validate_stock(self, value):
        if value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo")
        return value
