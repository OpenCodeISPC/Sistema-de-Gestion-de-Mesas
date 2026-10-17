# Evidencia del defecto HU-BUG#07 / TC-L-26

Prueba E2E: `e2e/tests/test_productos_permisos.py::test_mozo_no_deberia_ver_controles_de_gestion`

## Sintoma

Al iniciar sesion con el rol **MOZO** (sin permisos de gestion), la pantalla de
Productos muestra el boton **"+ Agregar producto"** y las acciones de fila
(editar / eliminar), controles reservados al rol **ADMIN**.

## Como reproducir

1. Levantar el entorno: `docker compose up -d` (frontend :4200, backend :8000).
2. Ejecutar solo el caso (sin el marcador `xfail`) para ver el fallo:
   `pytest tests/test_productos_permisos.py::test_mozo_no_deberia_ver_controles_de_gestion`
   (Playwright regenera `artifacts/` y `reports/reporte.html`).
3. Alternativa manual: iniciar sesion como `mozo@sgmb.com` / `Password123` y abrir
   `/producto`.

## Archivos

- `HU-BUG-07_mozo-ve-agregar-producto.png` — captura del fallo (Playwright,
  `--screenshot=only-on-failure`).


## Causa y ubicacion

`frontend/src/app/features/producto/producto.html` renderiza los controles de
gestion sin condicionar por rol (`esAdmin()` solo se usa en el `.ts`). El backend
si exige `IsAdminUser` en POST/PUT/PATCH/DELETE, por lo que es un defecto de
interfaz (minimo privilegio), no de autorizacion.

## Cierre sugerido

Envolver los controles en un `@if (esAdmin())`. Una vez corregido, el test pasara
a `XPASS`; entonces se quita el marcador `xfail` y queda como expectativa verde.

---

# Evidencia del flujo HU-MESAS / RF01-RF02-RF05 / TC-L-04-TC-L-05

Prueba E2E: `e2e/tests/test_mesas_pedidos.py::test_mozo_abre_mesa_y_confirma_pedido`

## Trazabilidad

| Elemento | Referencia |
|----------|------------|
| Historia de usuario | `HU-MESAS`: Como mozo, abrir una mesa libre y registrar un pedido |
| Requisitos funcionales | `RF01` visualizar mesas, `RF02` abrir/asignar mesa y `RF05` registrar consumo |
| Casos de prueba | `TC-L-04` / `TC-L-05` |
| Rol | `MOZO` |
| Page Objects | `e2e/pages/mesas_page.py` y `e2e/pages/pedido_page.py` |

## Resultado

La prueba finalizo correctamente con resultado `1 passed`. El caso verifica que
un usuario `MOZO` selecciona una mesa libre, abre el comandero digital, agrega
`Bebida E2E` al pedido, confirma la comanda y deja la mesa en estado `Ocupada`.

## Flujo validado

1. Se autentica un usuario con rol `MOZO`.
2. Se accede al mapa de mesas.
3. Se identifica y selecciona la primera mesa en estado `LIBRE`.
4. Se abre el panel de pedido de la mesa.
5. Se selecciona un producto disponible de la categoría `BARRA`.
6. Se verifica que el producto aparezca como ítem del pedido.
7. Se confirma el pedido.
8. Se verifica que la mesa cambie al estado `Ocupada`.

El test utiliza Page Object Model: los selectores `data-testid`, las esperas y
las acciones de pantalla están encapsulados en los Page Objects. El test
contiene únicamente el flujo de negocio y sus aserciones, sin selectores CSS ni
XPath absoluto.

## Archivos

- `HU-MESAS-TC-L-04-05/tests-test-mesas-pedidos-py-test-mozo-abre-mesa-y-confirma-pedido-chromium/test-finished-1.png`
  — captura del flujo exitoso.
- `HU-MESAS-TC-L-04-05/tests-test-mesas-pedidos-py-test-mozo-abre-mesa-y-confirma-pedido-chromium/video.webm`
  — video completo de la ejecución, cuando se genera con `--video=on`.

## Como regenerar la evidencia

Desde la carpeta `e2e/`, con Angular y Django levantados:

```powershell
python -m pytest tests/test_mesas_pedidos.py `
  --video=on `
  --screenshot=on `
  --output=evidencias/HU-MESAS-TC-L-04-05
```

La opción `--video=on` conserva el video incluso cuando la prueba pasa y
`--screenshot=on` conserva la captura final del navegador.
