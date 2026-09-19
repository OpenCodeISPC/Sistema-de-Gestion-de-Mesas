from django.db import models


class Pago(models.Model):
    """Modelo para representar un cobro registrado en caja."""
    METODOS_PAGO = [
        ('EFECTIVO', 'Efectivo'),
        ('TARJETA', 'Tarjeta'),
        ('TRANSFERENCIA', 'Transferencia'),
        ('OTRO', 'Otro'),
    ]

    id_pago = models.AutoField(primary_key=True)
    pedido = models.ForeignKey(
        'pedidos.Pedido',
        on_delete=models.PROTECT,
        related_name='pagos',
    )
    metodo_pago = models.CharField(
        max_length=20,
        choices=METODOS_PAGO,
        default='EFECTIVO',
    )
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    propina = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    importe_recibido = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    cajero = models.ForeignKey(
        'usuarios.Usuario',
        on_delete=models.PROTECT,
        related_name='cobros',
        null=True,
        blank=True,
    )
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "pagos"
        verbose_name = "Pago"
        verbose_name_plural = "Pagos"

    def __str__(self):
        """Devuelve una representación legible del pago."""
        return f"Pago {self.id_pago} - Pedido {self.pedido_id} - {self.metodo_pago}"