from rest_framework import serializers
from .models import Mesa

class MesaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mesa
        fields = [
            'id_mesa',
            'numero',
            'capacidad',
            'estado',
            'ubicacion'
        ]
        
        #validacion para asegurar que el nro de mesa sea positivo
        def validate_numero(self, value):
            if value <= 0:
                raise serializers.ValidationError("El numero de mesa debe ser mayor a 0")
            return value