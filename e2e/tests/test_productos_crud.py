"""Pruebas E2E del CRUD del modulo de Productos.

Trazabilidad (ver e2e/README.md):
    - US10 (agregar producto)   -> TC-L-01
    - US11 (editar producto)    -> TC-L-02
    - US12 (eliminar producto)  -> TC-L-03
    - US13 (ver grilla/tabla)   -> sin TC propio en la planilla

Cada test crea su propio producto con un nombre unico para ser independiente y
repetible. Se ejecutan con el rol ADMIN, unico autorizado a gestionar productos.
"""

import uuid

import pytest


@pytest.fixture
def nombre_producto():
    """Nombre de producto unico por ejecucion de test."""
    return f"Producto E2E {uuid.uuid4().hex[:8]}"


def test_crear_producto(productos_como_admin, nombre_producto):
    """US10 - TC-L-01: alta exitosa de un producto nuevo."""
    pagina = productos_como_admin.crear_producto(nombre_producto)
    pagina.buscar(nombre_producto)
    assert pagina.existe_producto(nombre_producto)


def test_listar_y_buscar_producto(productos_como_admin, nombre_producto):
    """US13 - listado y busqueda en la grilla (sin TC propio en la planilla)."""
    productos_como_admin.crear_producto(nombre_producto).buscar(nombre_producto)
    assert productos_como_admin.contar_filas() == 1
    assert productos_como_admin.existe_producto(nombre_producto)


def test_editar_producto(productos_como_admin, nombre_producto):
    """US11 - TC-L-02: actualizacion de un producto existente."""
    nuevo_nombre = f"Editado E2E {uuid.uuid4().hex[:8]}"
    productos_como_admin.crear_producto(nombre_producto)
    productos_como_admin.buscar(nombre_producto)
    productos_como_admin.abrir_formulario_editar(nombre_producto)
    productos_como_admin.completar_formulario(nombre=nuevo_nombre)
    productos_como_admin.guardar()
    productos_como_admin.buscar(nuevo_nombre)
    assert productos_como_admin.existe_producto(nuevo_nombre)
    assert not productos_como_admin.existe_producto(nombre_producto)


def test_eliminar_producto(productos_como_admin, nombre_producto):
    """US12 - TC-L-03: eliminacion de un producto con confirmacion."""
    productos_como_admin.crear_producto(nombre_producto)
    productos_como_admin.buscar(nombre_producto)
    productos_como_admin.eliminar_producto(nombre_producto)
    assert not productos_como_admin.existe_producto(nombre_producto)
