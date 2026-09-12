from rest_framework import serializers
from .models import Comanda


class ComandaSerializer(serializers.ModelSerializer):
    id_comanda = serializers.IntegerField(source='id', read_only=True)

    class Meta:
        model = Comanda
        fields = [
            'id', 
            'id_comanda', 
            'numero_mesa', 
            'numero_pedido', 
            'tiempo_espera', 
            'estado', 
            'sector', 
            'cliente'
        ]