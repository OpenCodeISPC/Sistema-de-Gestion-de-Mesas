"""Pruebas E2E de control de acceso por rol en Productos.

Trazabilidad (ver e2e/README.md):
    - Planilla de casos: TC-L-26 (HU-BUG#07) - usuarios sin permisos (p. ej.
      MOZO/CAJERO) no pueden crear productos.
    - Backend: backend/productos/views.py exige IsAdminUser en POST/PUT/PATCH/
      DELETE.

TC-L-26 se implementa aqui en la capa E2E con el rol MOZO y, ademas, expone un
defecto de UI que la planilla no contempla: los controles de gestion se
renderizan para todos los roles. Por eso
`test_mozo_no_deberia_ver_controles_de_gestion` se marca como `xfail(strict=True)`:
documenta un defecto conocido (la corrida queda verde, ver `evidencias/`) y, en
cuanto el equipo lo corrija, pasara a `XPASS` y hara fallar la suite para forzar
la actualizacion del test.
"""

import pytest


@pytest.mark.xfail(
    strict=True,
    reason="DEFECTO HU-BUG#07/TC-L-26: el rol MOZO ve los controles de gestion "
    "(boton 'Agregar producto' y acciones de fila) reservados al rol ADMIN. "
    "Ver e2e/evidencias/.",
)
def test_mozo_no_deberia_ver_controles_de_gestion(productos_como_mozo):
    """HU-BUG#07 - TC-L-26 (DEFECTO DETECTADO: xfail conocido).

    Un usuario MOZO no debe visualizar el boton de alta de productos, reservado
    al rol ADMIN. El boton se renderiza igualmente => defecto de UI.
    """
    assert not productos_como_mozo.es_visible_agregar(), (
        "DEFECTO: el rol MOZO ve el boton 'Agregar producto', un control de "
        "gestion reservado al rol ADMIN (IsAdminUser en el backend)."
    )


def test_mozo_al_intentar_agregar_recibe_acceso_denegado(productos_como_mozo):
    """HU-BUG#07 - TC-L-26: la accion de gestion se bloquea."""
    mensaje = productos_como_mozo.intentar_agregar_y_leer_dialogo()
    assert "acceso denegado" in mensaje.lower()
    assert not productos_como_mozo.formulario_visible()
