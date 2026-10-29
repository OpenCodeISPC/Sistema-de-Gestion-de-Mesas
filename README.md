# Sistema de Gestión de Mesas para Bares (SGMB)

SGMB es una aplicación web para centralizar la operación diaria de un bar: gestión de mesas, pedidos, comandas, productos, pagos y cierres de caja. El sistema está pensado para facilitar la coordinación entre el salón, la cocina, la barra y la caja.

## Objetivo

Reducir los errores y las demoras asociados a la gestión manual de un establecimiento gastronómico mediante una plataforma que organiza la información y permite consultar los cambios de los pedidos en tiempo real.

## Funcionalidades principales

### Usuarios y autenticación
- Registro e inicio de sesión.
- Autenticación mediante JWT.
- Integración con Google OAuth.
- Recuperación de contraseña mediante código OTP por correo electrónico.
- Protección de rutas del frontend y acceso según el rol del usuario.

Los roles contemplados por el sistema son `ADMIN`, `MOZO`, `CAJERO` y `COCINA`.

### Mesas y pedidos
- Visualización y gestión de mesas.
- Registro de pedidos asociados a una mesa.
- Consulta de los productos y detalles de cada pedido.
- Seguimiento de los estados de los pedidos.
- Actualización de información mediante WebSockets.

### Comandas de cocina y barra
- Visualización de pedidos en un tablero Kanban.
- Organización por estados: `PENDIENTE`, `PREPARACION` y `LISTO`.
- Alternancia entre los sectores Cocina y Barra.
- Actualización de las comandas sin depender de consultas repetidas desde la interfaz.

### Productos y stock
- Administración del catálogo de productos.
- Registro de precios, disponibilidad, categoría y stock.
- Uso de productos en los pedidos.

### Caja y pagos
- Registro de pagos y métodos de pago.
- Registro de propinas.
- Apertura, cierre y reapertura de caja.
- Consulta de información de los pagos.
- Exportación de cierres de caja a PDF.

### Auditoría
- Registro de operaciones relevantes del sistema.
- Almacenamiento de eventos de auditoría en MongoDB.
- Consulta de registros mediante los endpoints de la aplicación.

## Tecnologías

| Área | Tecnologías |
|---|---|
| Frontend | Angular 20, TypeScript, componentes standalone y Signals |
| Backend | Python 3.12, Django 6, Django REST Framework |
| Autenticación | JWT, Google OAuth |
| Comunicación en tiempo real | Django Channels, WebSockets y Redis |
| Base de datos relacional | PostgreSQL 16 |
| Auditoría | MongoDB 7 |
| Servidor ASGI | Uvicorn |
| Documentos PDF | ReportLab |
| Entorno local | Docker y Docker Compose |
| Pruebas E2E | Playwright con Python y patrón Page Object Model |

## Arquitectura general

La aplicación se organiza en tres partes principales:

- **Frontend:** interfaz desarrollada con Angular. Se ocupa de mostrar la información y permitir la interacción del personal.
- **Backend:** API desarrollada con Django REST Framework. Procesa las solicitudes, aplica reglas de negocio y gestiona los datos.
- **Persistencia y servicios:** PostgreSQL almacena los datos operativos; MongoDB se utiliza para los registros de auditoría; Redis sirve de soporte para la comunicación en tiempo real con Django Channels.

Para las actualizaciones de las comandas, el backend comunica los cambios al frontend mediante WebSockets. Angular recibe esos eventos y actualiza la interfaz para que el personal pueda ver el estado de los pedidos.

## Estructura del repositorio

```text
.
├── backend/                 # API Django, modelos, servicios y pruebas
├── frontend/                # Aplicación Angular
├── e2e/                     # Pruebas end-to-end con Playwright
├── docker-compose.yml       # Servicios para el entorno local
├── actualizar-entorno.sh   # Script de actualización del entorno Docker
├── CHANGELOG.md             # Registro de cambios
├── README-SCRIPT.md         # Guía complementaria del script
└── requirements.txt         # Dependencias Python del repositorio
```

Dentro del backend, las aplicaciones principales incluyen usuarios, mesas, pedidos, comandas, productos, caja y auditoría. En el frontend, las pantallas y servicios se organizan por funcionalidad.

## Requisitos previos

Para ejecutar el entorno local se necesita:

- Git.
- Docker Desktop o Docker Engine con Docker Compose.
- Un navegador web actualizado.

Para ejecutar las pruebas E2E fuera de Docker, también se necesita Python 3.11 o superior.

## Instalación y ejecución local

### 1. Clonar el repositorio

```bash
git clone https://github.com/OpenCodeISPC/Sistema-de-Gestion-de-Mesas.git
cd Sistema-de-Gestion-de-Mesas
```

### 2. Crear el archivo de configuración

Antes de iniciar Docker Compose, es obligatorio crear `backend/.env.desarrollo` a partir del archivo de ejemplo incluido en el repositorio.

Desde la raíz del proyecto:

**Linux, macOS o Git Bash**
```bash
cp backend/.env.desarrollo.example backend/.env.desarrollo
```

**Windows PowerShell**
```powershell
Copy-Item backend/.env.desarrollo.example backend/.env.desarrollo
```

Abrí `backend/.env.desarrollo` y completá los valores necesarios para el entorno local. En particular, revisá que las credenciales de PostgreSQL coincidan entre `POSTGRES_PASSWORD` y `DB_PASSWORD`, y configurá los datos de conexión de MongoDB y las claves requeridas por Django.

El archivo de ejemplo contiene campos que pueden estar vacíos y sirve como plantilla: copiarlo no reemplaza la revisión de su contenido. No publiques el archivo `backend/.env.desarrollo` ni agregues credenciales reales al repositorio.

### 3. Iniciar los servicios

Con Docker en ejecución, desde la raíz del proyecto ejecutá:

```bash
docker compose up --build
```

El archivo `docker-compose.yml` inicia los siguientes servicios:

- PostgreSQL.
- MongoDB.
- Redis.
- Backend Django.
- Frontend Angular.

Al iniciar, el backend ejecuta las migraciones y los comandos de carga inicial `seed_mesas` y `seed_e2e`. Estos comandos preparan datos de ejemplo para el entorno de desarrollo y las pruebas.

Para iniciar los servicios en segundo plano:

```bash
docker compose up --build -d
```

Para consultar el estado de los contenedores:

```bash
docker compose ps
```

Para revisar los logs del backend:

```bash
docker logs -f sgmb_backend
```

### 4. Acceder a la aplicación

Con los servicios iniciados, las direcciones locales son:

- **Frontend Angular:** http://localhost:4200
- **Backend Django:** http://localhost:8000
- **Administración de Django:** http://localhost:8000/admin/

La API está organizada bajo `/api/`, incluyendo las rutas de autenticación bajo `/api/auth/`.

### 5. Detener los servicios

```bash
docker compose down
```

Este comando detiene y elimina los contenedores, pero conserva los volúmenes de datos.

**Advertencia:** no ejecutes `docker compose down -v` salvo que quieras eliminar también los volúmenes y aceptes perder los datos persistidos localmente.

## Actualizar el entorno

El repositorio incluye `actualizar-entorno.sh` para ayudar a preparar el entorno local después de descargar cambios. La guía complementaria se encuentra en [`README-SCRIPT.md`](README-SCRIPT.md).

Desde Git Bash y la raíz del proyecto:

```bash
bash actualizar-entorno.sh
```

El script comprueba que Docker esté en ejecución y que exista `backend/.env.desarrollo`. Según la opción elegida, puede recrear el volumen de PostgreSQL.

Opciones disponibles:

```bash
bash actualizar-entorno.sh --conservar
bash actualizar-entorno.sh --si
```

- `--conservar`: evita borrar el volumen de PostgreSQL.
- `--si`: confirma directamente la operación que elimina ese volumen.

**Importante:** borrar el volumen de PostgreSQL elimina los datos locales almacenados en él. Usá esa opción únicamente si aceptás perder esos datos. Revisá `README-SCRIPT.md` antes de ejecutar el script.

## Usuarios y datos de prueba

Al iniciar el backend se ejecuta `seed_e2e`, que crea o actualiza usuarios de prueba con una contraseña conocida para facilitar las pruebas E2E.

| Rol | Usuario de prueba | Contraseña de desarrollo |
|---|---|---|
| ADMIN | `admin@sgmb.com` | `Password123` |
| MOZO | `mozo@sgmb.com` | `Password123` |
| CAJERO | `cajero@sgmb.com` | `Password123` |
| COCINA | `cocina@sgmb.com` | `Password123` |

Estas credenciales son exclusivamente para el entorno local de desarrollo y pruebas. El comando `seed_e2e` restablece la contraseña de esos usuarios cada vez que se ejecuta. **No utilices estas cuentas ni contraseñas en producción.**

Para volver a cargar las mesas de ejemplo:

```bash
docker exec -i sgmb_backend python manage.py seed_mesas
```

Para volver a preparar los usuarios y el producto de prueba E2E:

```bash
docker exec -i sgmb_backend python manage.py seed_e2e
```

## Pruebas

### Pruebas del backend

El backend incluye pruebas organizadas en las aplicaciones Django. Con los servicios y la configuración necesarios disponibles, pueden ejecutarse dentro del contenedor:

```bash
docker exec -i sgmb_backend python manage.py test
```

### Pruebas end-to-end (E2E)

La suite E2E utiliza **Playwright para Python** y el patrón **Page Object Model (POM)**. Los casos verifican flujos de autenticación, mesas, pedidos y operaciones de productos sobre la aplicación levantada.

La guía completa de instalación, configuración y ejecución está en [`e2e/README.md`](e2e/README.md).

Resumen de los pasos principales:

```bash
cd e2e
python -m venv .venv
```

Activá el entorno virtual:

**Windows PowerShell**
```powershell
.venv\Scripts\Activate.ps1
```

**Linux o macOS**
```bash
source .venv/bin/activate
```

Instalá las dependencias y el navegador de Playwright:

```bash
pip install -r requirements.txt
playwright install chromium
```

Ejecutá la suite:

```bash
pytest
```

Para correr un archivo específico:

```bash
pytest tests/test_auth.py
pytest tests/test_productos_crud.py
pytest tests/test_mesas_pedidos.py
```

Las pruebas E2E requieren que la aplicación esté levantada y que existan los usuarios y datos de prueba. Consultá `e2e/README.md` para conocer los requisitos y las variables de entorno opcionales.

## Seguridad y configuración

- No subas archivos `.env` ni credenciales reales a GitHub.
- Usá valores de desarrollo solo en entornos locales.
- Mantené protegidas las claves de Django, credenciales de bases de datos, claves de proveedores de correo y cualquier token.
- La autorización de las operaciones debe validarse en el backend, no solamente en la interfaz.
- No uses los usuarios E2E ni sus contraseñas conocidas en producción.

## Control de versiones y trabajo colaborativo

El equipo utiliza Git y GitHub para versionar el código y coordinar el desarrollo.

Reglas de trabajo acordadas:

- No realizar commits directamente sobre `main` o `development`.
- Trabajar en ramas para las tareas asignadas.
- Integrar cambios mediante Pull Requests (PR).
- Solicitar revisión de código antes de integrar cambios.
- Mantener actualizada la documentación relacionada con los cambios.

Flujo de trabajo habitual:

1. Crear una rama de trabajo a partir de `development`.
2. Implementar la tarea y registrar commits descriptivos.
3. Abrir un Pull Request hacia `development`.
4. Resolver las observaciones de la revisión.
5. Integrar el cambio una vez aprobado.
6. Actualizar `main` cuando corresponda generar una versión estable.

## Definition of Done (DoD)

Un requerimiento se considera finalizado cuando cumple los criterios aplicables:

1. **Funcionalidad:** resuelve el requerimiento sin errores conocidos de compilación o integración.
2. **Calidad del código:** respeta la responsabilidad única, la modularidad de Angular y las convenciones de Django REST Framework.
3. **Pruebas:** se ejecutan las pruebas pertinentes y se verifican los casos principales afectados por el cambio.
4. **Integración:** se comprueba que los cambios no rompan funcionalidades existentes.
5. **Revisión:** el Pull Request cuenta con la revisión requerida por el equipo.
6. **Interfaz:** cuando corresponda, se verifica la responsividad y la accesibilidad.
7. **Documentación:** se actualiza el README, el `CHANGELOG.md` u otra documentación afectada por el cambio.

## Equipo de desarrollo

Proyecto desarrollado por el equipo OpenCodeISPC.

- Cabrera Milagros Magaly
- Casarino Mariano
- Minoldo Aldo Alejandro
- Minoldo Nicolás Federico
- Moreno Juan Ignacio
