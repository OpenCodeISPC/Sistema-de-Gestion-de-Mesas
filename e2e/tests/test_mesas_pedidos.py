"""Prueba E2E del flujo de mesas y toma de pedidos del rol MOZO.

El caso cubre los requisitos RF01 (visualizar mesas), RF02 (abrir/asignar una
mesa) y RF05 (registrar el consumo), con trazabilidad a TC-L-04/TC-L-05.
"""

import pytest


@pytest.mark.e2e
def test_mozo_abre_mesa_y_confirma_pedido(mesas_como_mozo):
    """HU-MESAS - TC-L-04/TC-L-05: mozo registra un pedido en mesa libre."""
    numero_mesa = mesas_como_mozo.numero_mesa_disponible()
    pedido = mesas_como_mozo.seleccionar_mesa(numero_mesa)

    nombre_producto = pedido.agregar_producto_barra_disponible()
    assert pedido.producto_agregado(nombre_producto)

    pedido.confirmar_pedido()
    mesas_como_mozo.esperar_estado_mesa(numero_mesa, "Ocupada")
    assert mesas_como_mozo.estado_mesa(numero_mesa) == "Ocupada"
