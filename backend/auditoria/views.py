from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .mongo import listar_eventos, ping_db


class AuditoriaListView(APIView):
    """Expone la lectura de los eventos de auditoría almacenados en MongoDB."""

    def get(self, request):
        tipo = request.query_params.get('tipo')
        limite = request.query_params.get('limite', 100)
        eventos = listar_eventos(limite=limite, tipo=tipo)
        return Response(
            {
                'base_de_datos': 'MongoDB',
                'conectado': ping_db(),
                'cantidad': len(eventos),
                'eventos': eventos,
            },
            status=status.HTTP_200_OK,
        )