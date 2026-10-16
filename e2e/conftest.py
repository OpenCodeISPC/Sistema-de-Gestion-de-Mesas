"""Configuracion global de la suite E2E (fixtures y autenticacion).

La suite se ejecuta contra la aplicacion "viva": la SPA Angular
(http://localhost:4200), el backend Django (http://localhost:8000) y la base de
datos PostgreSQL reales. Los usuarios de prueba se crean con el comando:

    docker exec -i sgmb_backend python manage.py seed_e2e

Las URLs y la contraseña pueden sobreescribirse con las variables de entorno
E2E_BASE_URL, E2E_API_URL y E2E_PASSWORD (ver e2e/.env.example).
"""

import os

import pytest
from playwright.sync_api import Page

from pages.login_page import LoginPage
from pages.productos_page import ProductosPage

APP_URL = os.getenv("E2E_BASE_URL", "http://localhost:4200")
API_URL = os.getenv("E2E_API_URL", "http://localhost:8000")
PASSWORD = os.getenv("E2E_PASSWORD", "Password123")

LOGIN_ENDPOINT = f"{API_URL.rstrip('/')}/api/auth/login/"

CREDENCIALES = {
    "admin": "admin@sgmb.com",
    "mozo": "mozo@sgmb.com",
    "cajero": "cajero@sgmb.com",
    "cocina": "cocina@sgmb.com",
}


def _iniciar_sesion_por_api(page: Page, rol: str) -> dict:
    """Autentica un rol contra la API y replica la sesion en localStorage.

    Se usa para los flujos que NO son el objeto de prueba (por ejemplo el CRUD),
    evitando acoplar esos tests al formulario de login. El Login en si se prueba
    mediante la interfaz en tests/test_auth.py.
    """
    page.goto(APP_URL, wait_until="domcontentloaded")
    respuesta = page.request.post(
        LOGIN_ENDPOINT,
        data={"email": CREDENCIALES[rol], "password": PASSWORD},
    )
    assert respuesta.ok, (
        f"No se pudo autenticar el rol '{rol}' via API "
        f"(HTTP {respuesta.status}). Verifica que exista el usuario "
        f"{CREDENCIALES[rol]} y que el backend este disponible."
    )
    datos = respuesta.json()
    page.evaluate(
        """([access, refresh, user]) => {
            localStorage.setItem('access', access);
            localStorage.setItem('refresh', refresh);
            localStorage.setItem('user', JSON.stringify(user));
        }""",
        [datos["access"], datos["refresh"], datos["user"]],
    )
    return datos["user"]


@pytest.fixture
def app_url() -> str:
    return APP_URL


@pytest.fixture
def api_url() -> str:
    return API_URL


@pytest.fixture
def password() -> str:
    return PASSWORD


@pytest.fixture
def credenciales() -> dict:
    return CREDENCIALES


@pytest.fixture
def login_page(page: Page, app_url: str) -> LoginPage:
    return LoginPage(page, app_url)


@pytest.fixture
def productos_como_admin(page: Page, app_url: str) -> ProductosPage:
    """Productos autenticado con el rol ADMIN."""
    _iniciar_sesion_por_api(page, "admin")
    return ProductosPage(page, app_url).abrir()


@pytest.fixture
def productos_como_mozo(page: Page, app_url: str) -> ProductosPage:
    """Productos autenticado con el rol MOZO (rol sin permisos de gestion)."""
    _iniciar_sesion_por_api(page, "mozo")
    return ProductosPage(page, app_url).abrir()
