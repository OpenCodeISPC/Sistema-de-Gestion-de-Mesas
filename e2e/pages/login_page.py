"""Page Object de la pantalla de Login (HU-LOGIN)."""

from playwright.sync_api import Page

from pages.base_page import BasePage
from pages.dashboard_page import DashboardPage


class LoginPage(BasePage):
    """Acciones de negocio sobre la pantalla publica de inicio de sesion."""

    _titulo = "[data-testid='login-titulo']"
    _email = "[data-testid='login-email']"
    _password = "[data-testid='login-password']"
    _submit = "[data-testid='login-submit']"
    _error = "[data-testid='login-error']"
    _exito = "[data-testid='login-exito']"

    def abrir(self) -> "LoginPage":
        """Abre la pantalla de login y espera a que este lista."""
        self._goto("")
        self._page.wait_for_selector(self._titulo)
        return self

    def ingresar_credenciales(self, email: str, password: str) -> "LoginPage":
        """Completa el formulario con las credenciales indicadas."""
        self._page.fill(self._email, email)
        self._page.fill(self._password, password)
        return self

    def enviar(self) -> "LoginPage":
        """Envia el formulario de login."""
        self._page.click(self._submit)
        return self

    def ingresar(self, email: str, password: str) -> DashboardPage:
        """Completa y envia el login; navega al dashboard si es exitoso."""
        self.ingresar_credenciales(email, password)
        self.enviar()
        return DashboardPage(self._page, self._base_url).esperar_carga()

    def mensaje_error(self) -> str:
        """Devuelve el texto de la alerta de error (espera a que aparezca)."""
        self._page.wait_for_selector(self._error)
        return self._page.inner_text(self._error)

    def mensaje_exito(self) -> str:
        """Devuelve el texto de la alerta de exito (espera a que aparezca)."""
        self._page.wait_for_selector(self._exito)
        return self._page.inner_text(self._exito)

    def esta_en_login(self) -> bool:
        """Indica si la pantalla visible es la de login."""
        return self._page.is_visible(self._titulo)
