"""Page Object del modulo de Productos (CRUD principal del sistema).

Expone las acciones de negocio del CRUD (crear, listar/buscar, editar y
eliminar) y la verificacion de permisos por rol, sin exponer selectores ni
esperas a los tests.
"""

from playwright.sync_api import Locator, Page

from pages.base_page import BasePage


class ProductosPage(BasePage):
    """Pantalla de administracion de productos."""

    _titulo = "[data-testid='productos-titulo']"
    _agregar = "[data-testid='productos-agregar']"
    _buscar = "[data-testid='productos-buscar']"
    _filtro_categoria = "[data-testid='productos-filtro-categoria']"
    _tabla = "[data-testid='productos-tabla']"
    _fila = "[data-testid='producto-fila']"
    _editar = "[data-testid='producto-editar']"
    _eliminar = "[data-testid='producto-eliminar']"
    _vacio = "[data-testid='productos-vacio']"
    _contador = "[data-testid='productos-contador']"

    _form = "[data-testid='producto-form']"
    _form_titulo = "[data-testid='producto-form-titulo']"
    _form_cerrar = "[data-testid='producto-form-cerrar']"
    _input_nombre = "[data-testid='producto-input-nombre']"
    _input_descripcion = "[data-testid='producto-input-descripcion']"
    _input_precio = "[data-testid='producto-input-precio']"
    _input_categoria = "[data-testid='producto-input-categoria']"
    _input_disponibilidad = "[data-testid='producto-input-disponibilidad']"
    _input_stock = "[data-testid='producto-input-stock']"
    _cancelar = "[data-testid='producto-cancelar']"
    _guardar = "[data-testid='producto-guardar']"

    def abrir(self) -> "ProductosPage":
        """Abre el modulo de productos y espera a que la tabla este lista."""
        self._goto("producto")
        self._page.wait_for_selector(self._titulo)
        return self

    def titulo(self) -> str:
        """Devuelve el titulo de la pantalla."""
        return self._page.inner_text(self._titulo)

    def contador(self) -> str:
        """Devuelve el texto del contador de resultados."""
        return self._page.inner_text(self._contador)

    def _fila_de(self, nombre: str) -> Locator:
        """Localiza la fila de la tabla que contiene el nombre indicado."""
        return self._page.locator(self._fila, has_text=nombre)

    def existe_producto(self, nombre: str) -> bool:
        """Indica si la tabla muestra (al menos) un producto con ese nombre."""
        return self._fila_de(nombre).count() > 0

    def contar_filas(self) -> int:
        """Devuelve la cantidad de productos visibles en la tabla."""
        return self._page.locator(self._fila).count()

    def esta_vacia(self) -> bool:
        """Indica si la tabla muestra el mensaje de 'sin resultados'."""
        return self._page.is_visible(self._vacio)

    def buscar(self, termino: str) -> "ProductosPage":
        """Escribe un termino en el buscador (filtra la tabla)."""
        self._page.fill(self._buscar, termino)
        return self

    def filtrar_por_categoria(self, categoria: str) -> "ProductosPage":
        """Filtra la tabla por categoria."""
        self._page.select_option(self._filtro_categoria, categoria)
        return self

    # ----- Permisos por rol -------------------------------------------------

    def es_visible_agregar(self) -> bool:
        """Indica si el boton 'Agregar producto' esta presente en la pantalla."""
        return self._page.is_visible(self._agregar)

    def es_visible_editar(self, nombre: str) -> bool:
        """Indica si la fila del producto muestra el boton de editar."""
        return self._fila_de(nombre).locator(self._editar).is_visible()

    def es_visible_eliminar(self, nombre: str) -> bool:
        """Indica si la fila del producto muestra el boton de eliminar."""
        return self._fila_de(nombre).locator(self._eliminar).is_visible()

    def formulario_visible(self) -> bool:
        """Indica si el formulario de alta/edicion esta abierto."""
        return self._page.is_visible(self._form)

    # ----- Formulario -------------------------------------------------------

    def abrir_formulario_crear(self) -> "ProductosPage":
        """Abre el formulario para crear un producto."""
        self._page.click(self._agregar)
        self._page.wait_for_selector(self._form)
        return self

    def abrir_formulario_editar(self, nombre: str) -> "ProductosPage":
        """Abre el formulario de edicion del producto indicado."""
        self._fila_de(nombre).locator(self._editar).click()
        self._page.wait_for_selector(self._form)
        return self

    def completar_formulario(
        self,
        nombre: str | None = None,
        descripcion: str | None = None,
        precio: str | None = None,
        categoria: str | None = None,
        disponibilidad: str | None = None,
        stock: str | None = None,
    ) -> "ProductosPage":
        """Completa los campos del formulario que se hayan indicado."""
        if nombre is not None:
            self._page.fill(self._input_nombre, nombre)
        if descripcion is not None:
            self._page.fill(self._input_descripcion, descripcion)
        if precio is not None:
            self._page.fill(self._input_precio, precio)
        if categoria is not None:
            self._page.select_option(self._input_categoria, categoria)
        if disponibilidad is not None:
            self._page.select_option(self._input_disponibilidad, disponibilidad)
        if stock is not None:
            self._page.fill(self._input_stock, stock)
        return self

    def guardar(self) -> "ProductosPage":
        """Guarda el formulario y espera a que se cierre."""
        self._page.click(self._guardar)
        self._page.wait_for_selector(self._form, state="detached")
        return self

    def cancelar(self) -> "ProductosPage":
        """Cancela el formulario y espera a que se cierre."""
        self._page.click(self._cancelar)
        self._page.wait_for_selector(self._form, state="detached")
        return self

    def crear_producto(
        self,
        nombre: str,
        descripcion: str = "Producto creado por la suite E2E",
        precio: str = "1500",
        categoria: str = "cocina",
        disponibilidad: str = "true",
        stock: str = "10",
    ) -> "ProductosPage":
        """Flujo de negocio completo: alta de un nuevo producto."""
        self.abrir_formulario_crear()
        self.completar_formulario(
            nombre=nombre,
            descripcion=descripcion,
            precio=precio,
            categoria=categoria,
            disponibilidad=disponibilidad,
            stock=stock,
        )
        self.guardar()
        return self

    def eliminar_producto(self, nombre: str, confirmar: bool = True) -> "ProductosPage":
        """Elimina el producto indicado manejando el dialogo de confirmacion."""
        fila = self._fila_de(nombre)
        self._page.once("dialog", lambda dialogo: dialogo.accept() if confirmar else dialogo.dismiss())
        fila.locator(self._eliminar).click()
        if confirmar:
            fila.wait_for(state="detached")
        return self

    def intentar_agregar_y_leer_dialogo(self) -> str:
        """Intenta crear un producto y devuelve el mensaje del dialogo mostrado."""
        mensajes: list[str] = []

        def _capturar(dialogo) -> None:
            mensajes.append(dialogo.message)
            dialogo.accept()

        self._page.once("dialog", _capturar)
        self._page.click(self._agregar)
        self._page.wait_for_timeout(100)
        return mensajes[0] if mensajes else ""
