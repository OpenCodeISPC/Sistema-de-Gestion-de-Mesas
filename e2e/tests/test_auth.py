"""Pruebas E2E del flujo de autenticacion (modulo Auth de la planilla).

Trazabilidad (ver e2e/README.md):
    - Backlog: US08 (como mozo, iniciar sesion) y US09 (como administrador,
      iniciar sesion).
    - Planilla de casos: TC-L-07 (login correcto) y TC-L-08 (credenciales
      invalidas).

La planilla referencia estos tests como
`Playwright - e2e/tests/test_auth.py::TestAuth::...`.
Los usuarios provienen del comando `python manage.py seed_e2e`.
"""

import pytest


class TestAuth:
    """Casos E2E del modulo Auth."""

    @pytest.mark.e2e
    @pytest.mark.parametrize(
        "rol",
        [
            pytest.param("admin", id="TC-L-07-admin"),
            pytest.param("mozo", id="TC-L-07-mozo"),
        ],
    )
    def test_login_exitoso(self, login_page, credenciales, password, rol):
        """US09/US08 - TC-L-07: un usuario activo accede al dashboard."""
        dashboard = login_page.abrir().ingresar(credenciales[rol], password)
        assert dashboard.texto_bienvenida() == "\u00a1Bienvenido!"

    def test_login_password_invalido(self, login_page, credenciales):
        """US09 - TC-L-08: una contrasena incorrecta es rechazada."""
        login_page.abrir().ingresar_credenciales(
            credenciales["admin"], "PasswordIncorrecta"
        ).enviar()
        assert login_page.mensaje_error() != ""
        assert login_page.esta_en_login()

    def test_login_email_inexistente(self, login_page, password):
        """US09 - TC-L-08 (variante correo inexistente): acceso rechazado."""
        login_page.abrir().ingresar_credenciales(
            "usuario.inexistente@sgmb.com", password
        ).enviar()
        assert login_page.mensaje_error() != ""
        assert login_page.esta_en_login()
