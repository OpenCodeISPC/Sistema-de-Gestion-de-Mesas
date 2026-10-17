# Suite E2E - Verificacion y Validacion de Programas (Sprint 4)

Pruebas **end-to-end** del Sistema de Gestion de Mesas (SGMB) implementadas con
**Playwright** (Python) y el patron **Page Object Model (POM)**.

- **Rol responsable:** Arquitecto E2E Frontend (`AUT-E2E`).
- **Alcance:** flujos criticos de negocio sobre la aplicacion real (SPA Angular +
  backend Django + PostgreSQL), sin mocks.
- **Selectores:** `data-testid` (agregados en la SPA) como primera opcion.

---

## 1. Estructura

```
e2e/
├── conftest.py                 # Fixtures: URLs, credenciales y sesion via API
├── pytest.ini                  # Config de pytest + evidencias (trace/video/screenshot)
├── requirements.txt            # Dependencias de la suite
├── .env.example                # Variables de entorno (URLs y contraseña)
├── pages/                      # Page Objects (POM)
│   ├── base_page.py            #   Navegacion comun
│   ├── login_page.py           #   HU-LOGIN
│   ├── dashboard_page.py       #   Pantalla post-login
│   ├── mesas_page.py           #   HU-MESAS / RF01-RF02
│   ├── pedido_page.py          #   HU-MESAS / RF05
│   └── productos_page.py       #   HU-PROD / HU-PROD-PERM
├── tests/                      # Casos de prueba (sin selectores ni esperas)
│   ├── test_auth.py            #   Auth   -> TC-L-07, TC-L-08 (clase TestAuth)
│   ├── test_mesas_pedidos.py   #   Mesas y pedidos -> TC-L-04/TC-L-05
│   ├── test_productos_crud.py  #   Producto -> TC-L-01..03
│   └── test_productos_permisos.py  # Producto -> TC-L-26
├── reports/                    # reporte.html (generado, no versionado)
└── artifacts/                  # traces, videos y screenshots (generado, no versionado)
```

Reglas POM aplicadas: un Page Object por pantalla, localizadores privados y
unicos, metodos publicos con lenguaje de negocio, navegaciones que devuelven el
Page Object destino, Page Objects sin aserciones y tests sin selectores.

---

## 2. Requisitos previos

1. **Aplicacion levantada** (desde la raiz del repo):

   ```bash
   docker compose up -d
   ```

   Debe quedar disponible:
   - SPA Angular -> <http://localhost:4200>
   - API Django   -> <http://localhost:8000>

2. **Usuarios de prueba** (creados por el seed idempotente):

   ```bash
   docker exec -i sgmb_backend python manage.py seed_e2e
   ```

   | Rol    | Email            | Contrasena    |
   |--------|------------------|---------------|
   | ADMIN  | admin@sgmb.com   | Password123   |
   | MOZO   | mozo@sgmb.com    | Password123   |
   | CAJERO | cajero@sgmb.com  | Password123   |
   | COCINA | cocina@sgmb.com  | Password123   |

3. **Datos iniciales del salón y catálogo**:

   ```bash
   docker exec -i sgmb_backend python manage.py seed_mesas
   ```

   El flujo de mesas selecciona automáticamente la primera mesa en estado
   `LIBRE`. Para agregar el pedido debe existir al menos un producto activo de
   categoría `BARRA` en el catálogo.

4. **Python 3.11+** en el host (los servicios del front consumen
   `http://localhost:8000`, por eso la suite corre en el host y no en un
   contenedor).

---

## 3. Instalacion

```bash
cd e2e
python -m venv .venv
# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
playwright install chromium
```

Opcional: copiar `.env.example` a `.env` para sobreescribir URLs o contrasena.

---

## 3.1 Ejecucion

```bash
# Toda la suite
pytest

# Solo un archivo / test
pytest tests/test_auth.py
pytest tests/test_productos_crud.py::test_crear_producto

# Flujo de mesas y toma de pedidos
pytest tests/test_mesas_pedidos.py
pytest tests/test_mesas_pedidos.py::test_mozo_abre_mesa_y_confirma_pedido
```

Las URLs y credenciales se leen de variables de entorno (`E2E_BASE_URL`,
`E2E_API_URL`, `E2E_PASSWORD`) con valores por defecto para el entorno local.

---

## 4. Flujo E2E: gestión de mesas y toma de pedidos

El test `test_mesas_pedidos.py::test_mozo_abre_mesa_y_confirma_pedido`
automatiza el flujo de un usuario `MOZO`: selecciona una mesa `LIBRE`, abre el
comandero digital, agrega un producto de `BARRA`, confirma el pedido y verifica
que la mesa quede `Ocupada`. El caso cubre `RF01`, `RF02` y `RF05`, con
trazabilidad a `TC-L-04` / `TC-L-05`.

El flujo utiliza `MesasPage` y `PedidoPage` para encapsular selectores,
navegación y esperas, manteniendo el test sin selectores ni detalles técnicos.

## 5. Evidencias (reporte y artefactos)

Configurado en `pytest.ini`; se generan automaticamente al correr pytest:

- **Reporte HTML:** `e2e/reports/reporte.html` (autocontenido, abrir en navegador).
- **Trace, video y screenshot** de cada test fallido en `e2e/artifacts/`.
  - Ver un trace: `playwright show-trace e2e/artifacts/<carpeta>/trace.zip`.

> Las carpetas `reports/` y `artifacts/` no se versionan (ver `.gitignore`).

---

## 6. Trazabilidad (US del Backlog / TC de la Planilla)

Los codigos `USxx` provienen del **Product Backlog** y los `TC-L-xx` de la
**Planilla de Test Cases** del equipo.

| US (Backlog) | Descripcion                                              | TC (Planilla) | Test E2E |
|--------------|----------------------------------------------------------|---------------|----------|
| US09         | Como administrador, iniciar sesion.                      | TC-L-07       | `test_auth.py::TestAuth::test_login_exitoso[TC-L-07-admin]` |
| US08         | Como mozo, iniciar sesion.                               | TC-L-07       | `test_auth.py::TestAuth::test_login_exitoso[TC-L-07-mozo]` |
| US09         | Rechazar credenciales invalidas (contrasena incorrecta). | TC-L-08       | `test_auth.py::TestAuth::test_login_password_invalido` |
| US09         | Rechazar credenciales invalidas (correo inexistente).    | TC-L-08       | `test_auth.py::TestAuth::test_login_email_inexistente` |
| US10         | Como administrador, agregar un producto.                 | TC-L-01       | `test_productos_crud.py::test_crear_producto` |
| US13         | Ver grilla/tabla de productos.                           | (sin TC propio) | `test_productos_crud.py::test_listar_y_buscar_producto` |
| US11         | Como administrador, editar un producto.                  | TC-L-02       | `test_productos_crud.py::test_editar_producto` |
| US12         | Como administrador, eliminar un producto.                | TC-L-03       | `test_productos_crud.py::test_eliminar_producto` |
| HU-MESAS     | Como mozo, abrir una mesa libre y registrar un pedido.     | TC-L-04/TC-L-05 | `test_mesas_pedidos.py::test_mozo_abre_mesa_y_confirma_pedido` |
| HU-BUG#07    | Usuarios sin permisos no pueden crear productos.         | TC-L-26       | `test_productos_permisos.py::test_mozo_no_deberia_ver_controles_de_gestion` |
| HU-BUG#07    | Usuarios sin permisos no pueden crear productos.         | TC-L-26       | `test_productos_permisos.py::test_mozo_al_intentar_agregar_recibe_acceso_denegado` |

**Notas de trazabilidad:**
- La planilla asigna `TC-L-07` a `US09`; el Backlog distingue `US08` (mozo) de
  `US09` (admin), por eso el login valido se parametriza bajo ambos.
- No existe un `TC` de listado/busqueda en la planilla; se cubre el criterio de
  `US13`.
- `TC-L-26` (HU-BUG#07) apunta al backend (403 con rol Cajero). En E2E se ejecuta
  con el rol MOZO y, ademas, detecta el defecto de UI descrito abajo.

---

## 7. Defecto detectado (evidencia de fallo)

`test_mozo_no_deberia_ver_controles_de_gestion` (asociado a **TC-L-26 /
HU-BUG#07**) detecta un defecto real y se marca como **`xfail(strict=True)`**:
documenta el fallo (`XFAIL` en la corrida) y, cuando el equipo lo corrija, pasara
a `XPASS` y hara fallar la suite para forzar la actualizacion del test. La
evidencia capturada del fallo se conserva en `e2e/evidencias/`.

- **Sintoma:** al iniciar sesion con el rol **MOZO**, la pantalla de Productos
  muestra el boton **"+ Agregar producto"** y las acciones de fila (editar /
  eliminar), controles reservados al rol **ADMIN**.
- **Impacto:** exposicion de funcionalidad no permitida al usuario (viola el
  principio de minimo privilegio). El backend si rechaza la operacion
  (`IsAdminUser`), por lo que es un defecto de interfaz, no de autorizacion.
- **Ubicacion:** `frontend/src/app/features/producto/producto.html` renderiza los
  controles sin condicionar por rol (`esAdmin()` solo se usa en el `.ts`).
- **Evidencia:** `e2e/evidencias/HU-BUG-07_mozo-ve-agregar-producto.{png,webm}` y
  el reporte HTML (`e2e/reports/reporte.html`) de la corrida del caso.
- **Relacion con la planilla:** es un defecto distinto de `BUG#007` (aquel era
  que el backend permitia crear a un Cajero; este es que la UI expone el control).
- **Cierre sugerido:** envolver los controles de gestion en un `@if (esAdmin())`
  y, una vez corregido, quitar el marcador `xfail` del test.
