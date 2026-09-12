from rest_framework import viewsets
from .models import Comanda
from .serializers import ComandaSerializer


class ComandaViewSet(viewsets.ModelViewSet):
    queryset = Comanda.objects.all()
    serializer_class = ComandaSerializer