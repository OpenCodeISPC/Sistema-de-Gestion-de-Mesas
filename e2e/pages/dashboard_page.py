"""Page Object del Dashboard (pantalla post-login)."""

from playwright.sync_api import Page

from pages.base_page import BasePage
from pages.productos_page import ProductosPage


class DashboardPage(BasePage):
    """Acciones de negocio disponibles una vez iniciada la sesion."""

    _bienvenido = "[data-testid='dashboard-bienvenido']"

    def esperar_carga(self) -> "DashboardPage":
        """Espera a que el dashboard este visible."""
        self._page.wait_for_selector(self._bienvenido)
        return self

    def texto_bienvenida(self) -> str:
        """Devuelve el texto del encabezado de bienvenida."""
        return self._page.inner_text(self._bienvenido)

    def ir_a_productos(self) -> ProductosPage:
        """Navega al modulo de Productos y devuelve su Page Object."""
        self._goto("producto")
        return ProductosPage(self._page, self._base_url).abrir()
