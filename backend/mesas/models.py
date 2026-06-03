from django.db import models

class Mesa(models.Model):
    """Modelo para representar una mesa en el sistema de gestión de mesas."""
    ESTADOS = (
      ("LIBRE", "Libre"),
      ("OCUPADA", "Ocupada"),
      ("RESERVADA", "Reservada"),
      ("CERRADA", "Cerrada"),
  )
    id_mesa = models.AutoField(primary_key=True)
    numero = models.IntegerField(unique=True)
    capacidad = models.IntegerField()
    estado = models.CharField(max_length=20, choices=ESTADOS, default="LIBRE")
    ubicacion = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        db_table = "mesas"
        verbose_name = "Mesa"
        verbose_name_plural = "Mesas"

    def __str__(self):
        """Representación en cadena de la mesa."""
        return f" Mesa: {self.numero} - {self.estado}" 
