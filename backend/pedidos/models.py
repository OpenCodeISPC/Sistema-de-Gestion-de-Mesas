from django.db import models


class Pedido(models.Model):
    """Modelo para representar un pedido en el sistema de gestión de pedidos."""

    ESTADOS = [
        ("PENDIENTE", "Pendiente"),
        ("PREPARACION", "Preparación"),
        ("LISTO", "Listo"),
        ("ENTREGADO", "Entregado"),
        ("CERRADO", "Cerrado"),
        ("CANCELADO", "Cancelado"),
    ]

    id_pedido = models.AutoField(primary_key=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, choices=ESTADOS, default="PENDIENTE")

    estado_cocina = models.CharField(
        max_length=20, choices=ESTADOS, default="PENDIENTE"
    )
    estado_barra = models.CharField(max_length=20, choices=ESTADOS, default="PENDIENTE")

    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mesa = models.ForeignKey(
        "mesas.Mesa", on_delete=models.PROTECT, related_name="pedidos"
    )
    usuario = models.ForeignKey(
        "usuarios.Usuario", on_delete=models.PROTECT, related_name="pedidos"
    )

    class Meta:
        db_table = "pedidos"
        verbose_name = "Pedido"
        verbose_name_plural = "Pedidos"

    def __str__(self):
        """Devuelve una representación legible del pedido."""
        return f"Pedido {self.id_pedido} - Mesa {self.mesa.numero}"

    def save(self, *args, **kwargs):
        # Sincronizar el estado general solo si el pedido ya fue creado (tiene pk)
        # y si aún no está cerrado o entregado por la caja.
        if self.pk and self.estado in ["PENDIENTE", "PREPARACION", "LISTO"]:
            # Averiguamos si este pedido específico pidió cosas a cocina y/o barra
            tiene_cocina = self.detalles.filter(
                producto__categoria__iexact="COCINA"
            ).exists()
            tiene_barra = self.detalles.filter(
                producto__categoria__iexact="BARRA"
            ).exists()

            if tiene_cocina or tiene_barra:
                # Si un sector tiene productos, exigimos que esté 'LISTO'.
                # Si NO tiene productos de ese sector, lo damos por "listo" (True) automáticamente.
                cocina_ok = (self.estado_cocina == "LISTO") if tiene_cocina else True
                barra_ok = (self.estado_barra == "LISTO") if tiene_barra else True

                if (
                    self.estado_cocina == "PREPARACION"
                    or self.estado_barra == "PREPARACION"
                ):
                    self.estado = "PREPARACION"
                elif cocina_ok and barra_ok:
                    self.estado = "LISTO"
                else:
                    self.estado = "PENDIENTE"

        # guardamos en bd
        super().save(*args, **kwargs)


class DetallePedido(models.Model):
    """Modelo para representar el detalle de un pedido, que incluye los productos y sus cantidades."""

    id_detalle_pedido = models.AutoField(primary_key=True)
    pedido = models.ForeignKey(
        "pedidos.Pedido", on_delete=models.CASCADE, related_name="detalles"
    )
    producto = models.ForeignKey(
        "productos.Producto", on_delete=models.PROTECT, related_name="detalles_pedido"
    )
    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    observaciones = models.TextField(blank=True, null=True)

    class Meta:
        db_table = "detalle_pedidos"
        verbose_name = "Detalle Pedido"
        verbose_name_plural = "Detalle Pedidos"

    def __str__(self):
        """Devuelve una representación legible del detalle del pedido."""
        return f"Pedido {self.pedido.id_pedido} - Producto {self.producto.nombre} - Cantidad {self.cantidad}"
