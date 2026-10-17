"""Page Object del panel de toma de pedidos."""

from pages.base_page import BasePage


class PedidoPage(BasePage):
    """Acciones de negocio del pedido asociado a una mesa."""

    _panel = "[data-testid='pedido-panel']"
    _agregar_barra = "[data-testid='pedido-agregar-barra']"
    _producto_barra = "[data-testid='pedido-producto-barra']"
    _item = "[data-testid='pedido-item']"
    _total = "[data-testid='pedido-total']"
    _confirmar = "[data-testid='pedido-confirmar']"

    def esperar_carga(self) -> "PedidoPage":
        """Espera a que el panel lateral del pedido sea visible."""
        self._page.wait_for_selector(self._panel)
        return self

    def agregar_producto_barra(self, nombre: str) -> "PedidoPage":
        """Agrega al pedido un producto disponible de la barra."""
        self._page.click(self._agregar_barra)
        selector = self._page.locator(self._producto_barra)
        opcion = selector.locator("option", has_text=nombre).first
        valor = opcion.get_attribute("value")
        if valor is None:
            raise ValueError(f"No se encontro el producto de barra '{nombre}'.")
        selector.select_option(value=valor)
        self._page.locator(self._item, has_text=nombre).wait_for()
        return self

    def agregar_producto_barra_disponible(self) -> str:
        """Agrega el primer producto real disponible y devuelve su nombre."""
        self._page.click(self._agregar_barra)
        selector = self._page.locator(self._producto_barra)
        selector.wait_for()
        opciones = selector.locator("option")
        for indice in range(opciones.count()):
            opcion = opciones.nth(indice)
            valor = opcion.get_attribute("value")
            if not valor:
                continue
            texto = opcion.inner_text()
            nombre = texto.split(" - $", maxsplit=1)[0].strip()
            selector.select_option(value=valor)
            self._page.locator(self._item, has_text=nombre).wait_for()
            return nombre
        raise RuntimeError("No hay productos de barra disponibles en el catalogo.")

    def producto_agregado(self, nombre: str) -> bool:
        """Indica si el pedido muestra el producto indicado."""
        return self._page.locator(self._item, has_text=nombre).count() > 0

    def total(self) -> str:
        """Devuelve el total visible del pedido."""
        return self._page.inner_text(self._total)

    def confirmar_pedido(self) -> "PedidoPage":
        """Confirma el pedido y espera a que la solicitud finalice."""
        self._page.click(self._confirmar)
        return self