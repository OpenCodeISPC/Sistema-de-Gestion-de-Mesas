"""Page Object de la pantalla de mesas y acceso al pedido de una mesa."""

from pages.base_page import BasePage
from pages.pedido_page import PedidoPage


class MesasPage(BasePage):
    """Acciones de negocio disponibles en la pantalla de mesas."""

    _pagina = "[data-testid='mesas-page']"
    _mesa = "[data-testid='mesa-card']"
    _estado_mesa = "[data-testid='mesa-estado']"

    def abrir(self) -> "MesasPage":
        """Abre la pantalla de mesas y espera su renderizacion."""
        self._goto("mesas")
        self._page.wait_for_selector(self._pagina)
        return self

    def seleccionar_mesa(self, numero: int) -> PedidoPage:
        """Selecciona una mesa por numero y devuelve su panel de pedido."""
        mesa = self._page.locator(
            f"{self._mesa}[data-mesa-numero='{numero}']"
        )
        mesa.click()
        return PedidoPage(self._page, self._base_url).esperar_carga()

    def numero_mesa_disponible(self) -> int:
        """Devuelve el numero de la primera mesa que se encuentra libre."""
        mesa = self._page.locator(f"{self._mesa}[data-mesa-estado='LIBRE']").first
        mesa.wait_for()
        numero = mesa.get_attribute("data-mesa-numero")
        if numero is None:
            raise RuntimeError("La mesa libre no tiene numero identificable.")
        return int(numero)

    def estado_mesa(self, numero: int) -> str:
        """Devuelve el estado visible de una mesa."""
        mesa = self._page.locator(
            f"{self._mesa}[data-mesa-numero='{numero}']"
        )
        return mesa.locator(self._estado_mesa).inner_text()

    def esperar_estado_mesa(self, numero: int, estado: str) -> "MesasPage":
        """Espera que una mesa muestre el estado indicado."""
        mesa = self._page.locator(
            f"{self._mesa}[data-mesa-numero='{numero}']"
        )
        mesa.locator(self._estado_mesa).filter(has_text=estado).wait_for()
        return self