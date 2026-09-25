from django.core.management.base import BaseCommand
from mesas.models import Mesa
from pedidos.models import Pedido

class Command(BaseCommand):
    help = 'Puebla la tabla de mesas con datos iniciales si está vacía.'

    def handle(self, *args, **kwargs):
        if Mesa.objects.exists():
            self.stdout.write(self.style.SUCCESS('La tabla de mesas ya contiene datos. Omitiendo seed.'))
            return

        mesas_iniciales = [
            Mesa(numero=1, capacidad=4, estado="LIBRE", ubicacion="Salón principal"),
            Mesa(numero=2, capacidad=4, estado="OCUPADA", ubicacion="Salón principal"),
            Mesa(numero=3, capacidad=6, estado="RESERVADA", ubicacion="Salón principal"),
            Mesa(numero=4, capacidad=4, estado="LIBRE", ubicacion="Salón principal"),
            Mesa(numero=5, capacidad=6, estado="OCUPADA", ubicacion="Salón principal"),
            Mesa(numero=6, capacidad=2, estado="RESERVADA", ubicacion="Salón principal"),
            Mesa(numero=10, capacidad=2, estado="LIBRE", ubicacion="Terraza"),
            Mesa(numero=11, capacidad=4, estado="OCUPADA", ubicacion="Terraza"),
            Mesa(numero=12, capacidad=4, estado="LIBRE", ubicacion="Terraza"),
            Mesa(numero=13, capacidad=6, estado="RESERVADA", ubicacion="Terraza"),
        ]

        Mesa.objects.bulk_create(mesas_iniciales)
        self.stdout.write(self.style.SUCCESS('✅ 10 mesas cargadas con éxito.'))