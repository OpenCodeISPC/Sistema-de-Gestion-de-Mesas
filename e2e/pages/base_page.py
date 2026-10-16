"""Page Object base de la suite E2E (patron Page Object Model).

Centraliza la infraestructura comun a todas las pantallas: el acceso a la URL
base y la navegacion. Los Page Objects concretos NO deben conocer la URL
absoluta ni repetir la logica de navegacion.

Reglas del POM aplicadas: localizadores privados y unicos, metodos publicos con
lenguaje de negocio, navegaciones que devuelven el Page Object destino y
ausencia de aserciones dentro de las pantallas.
"""

from playwright.sync_api import Page


class BasePage:
    """Clase base para todos los Page Objects."""

    def __init__(self, page: Page, base_url: str) -> None:
        self._page = page
        self._base_url = base_url

    def _goto(self, ruta: str = "") -> "BasePage":
        """Navega a una ruta relativa de la SPA y devuelve esta instancia.

        Se espera 'domcontentloaded' (y no 'load') porque la SPA puede mantener
        subrecursos externos abiertos; la renderizacion se valida luego con
        `wait_for_selector` sobre los elementos `data-testid`.
        """
        destino = f"{self._base_url.rstrip('/')}/{ruta.lstrip('/')}"
        self._page.goto(destino, wait_until="domcontentloaded")
        return self
