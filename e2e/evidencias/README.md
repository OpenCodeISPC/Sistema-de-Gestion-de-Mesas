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
- `HU-BUG-07_mozo-ve-agregar-producto.webm` — video de la corrida.

## Causa y ubicacion

`frontend/src/app/features/producto/producto.html` renderiza los controles de
gestion sin condicionar por rol (`esAdmin()` solo se usa en el `.ts`). El backend
si exige `IsAdminUser` en POST/PUT/PATCH/DELETE, por lo que es un defecto de
interfaz (minimo privilegio), no de autorizacion.

## Cierre sugerido

Envolver los controles en un `@if (esAdmin())`. Una vez corregido, el test pasara
a `XPASS`; entonces se quita el marcador `xfail` y queda como expectativa verde.
