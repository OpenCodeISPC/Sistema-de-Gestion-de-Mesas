from django.db import models


class Comanda(models.Model):
    ESTADO_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('PREPARACION', 'En Preparación'),
        ('LISTO', 'Listo'),
    ]
    SECTOR_CHOICES = [
        ('COCINA', 'Cocina'),
        ('BARRA', 'Barra'),
    ]

    numero_mesa = models.IntegerField(default=1)
    numero_pedido = models.IntegerField(default=1)
    tiempo_espera = models.CharField(max_length=50, default='10 min')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='PENDIENTE')
    sector = models.CharField(max_length=20, choices=SECTOR_CHOICES, default='COCINA')
    cliente = models.CharField(max_length=100, blank=True, null=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comanda #{self.id} - Mesa {self.numero_mesa} ({self.sector})"