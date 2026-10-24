
# Sistema de Gestión de Mesas para Bares (SGMB)

## Descripción del proyecto

El Sistema de Gestión de Mesas para Bares (SGMB) es una aplicación web diseñada para facilitar la administración de un establecimiento gastronómico. Permite gestionar mesas, pedidos, preparación de productos, stock, pagos y cierres de caja desde una plataforma centralizada.

El sistema busca mejorar la organización del trabajo, agilizar la atención al cliente y facilitar el seguimiento de las operaciones realizadas por el personal.

## Problemática

La administración manual de mesas, pedidos y pagos puede generar demoras, errores de registro y dificultades para coordinar las tareas entre el salón, la cocina, la barra y la caja.

SGMB busca centralizar estas operaciones y ofrecer información actualizada para mejorar la coordinación y el control del establecimiento.

## Público objetivo

El sistema está orientado a bares y establecimientos gastronómicos que necesitan organizar sus operaciones diarias mediante una herramienta digital.

Entre sus usuarios se encuentran administradores, mozos, personal de cocina y cajeros, con permisos diferenciados según sus responsabilidades.

## Funcionalidades principales

### Autenticación y gestión de usuarios

- Inicio de sesión mediante autenticación con JWT.
- Integración con Google OAuth 2.0.
- Recuperación de acceso mediante códigos OTP enviados por correo electrónico.
- Control de acceso basado en roles (RBAC).
- Roles contemplados: `ADMIN`, `MOZO`, `CAJERO` y `COCINA`.

### Gestión de mesas

- Visualización de las mesas del establecimiento.
- Identificación del estado de cada mesa.
- Administración de mesas ocupadas, libres, reservadas y cerradas.
- Actualización de información en tiempo real mediante WebSockets.

### Gestión de pedidos

- Registro y administración de pedidos.
- Seguimiento del estado de preparación.
- Coordinación entre el salón, la cocina y la barra.
- Gestión de productos y stock.

### Cocina y barra

- Visualización de pedidos pendientes.
- Organización de pedidos mediante un tablero Kanban.
- Seguimiento de los estados `PENDIENTE`, `EN PREPARACIÓN` y `LISTO`.

### Caja y pagos

- Registro de pagos.
- Cálculo de propinas del 10 %.
- Liberación automática de la mesa según el flujo de cierre implementado.
- Generación de comprobantes en PDF.
- Apertura, cierre y reapertura de caja.
- Generación de reportes de caja en PDF.

### Auditoría

- Registro de operaciones relevantes del sistema.
- Almacenamiento de eventos de auditoría en MongoDB.
- Procesamiento asíncrono de los registros.
- Exposición de una API para consultar la auditoría mediante `/api/auditoria`.
- Manejo de fallos de auditoría para reducir su impacto sobre la operación principal.

## Tecnologías utilizadas

### Frontend

- Angular 20.
- Componentes standalone.
- Signals para la gestión reactiva del estado.
- Comunicación con el backend mediante API REST.
- WebSockets para actualizaciones en tiempo real.

### Backend

- Python.
- Django 6.0.
- Django REST Framework.
- Django Channels para comunicación mediante WebSockets.
- Uvicorn y Daphne como componentes del entorno de ejecución ASGI.

### Bases de datos y servicios

- PostgreSQL 16: almacenamiento de datos relacionales.
- MongoDB 7: almacenamiento de registros de auditoría.
- Redis: soporte para la comunicación y gestión de canales en tiempo real.
- Docker y Docker Compose: ejecución y coordinación de los servicios.

### Herramientas adicionales

- Git y GitHub para el control de versiones.
- ReportLab para la generación de documentos PDF.
- Scripts de automatización para la actualización del entorno.

## Arquitectura del sistema

El proyecto organiza sus responsabilidades en capas para separar la interfaz de usuario, la lógica de negocio y el almacenamiento de información.

### Frontend

Desarrollado con Angular, se encarga de mostrar las interfaces, gestionar la interacción con los usuarios y comunicarse con el backend.

### Backend

Desarrollado con Django REST Framework, centraliza la lógica de negocio, valida las solicitudes y aplica las reglas de acceso correspondientes.

### Persistencia y servicios

PostgreSQL almacena los datos relacionales, mientras que MongoDB se utiliza para los registros de auditoría. Redis participa en la infraestructura de comunicación en tiempo real.

## Estructura del proyecto

El repositorio contiene los componentes necesarios para el desarrollo y la ejecución de la aplicación.

- `frontend/`: aplicación desarrollada con Angular.
- `backend/`: aplicación desarrollada con Django.
- Archivos de configuración de Docker y Docker Compose.
- Scripts de automatización del entorno.
- Archivos de documentación del proyecto.

La estructura interna de cada directorio organiza los componentes, servicios, modelos, vistas, configuraciones y pruebas correspondientes a cada tecnología.

## Requisitos previos

Para ejecutar el proyecto localmente se necesita:

- Git.
- Docker.
- Docker Compose.
- Un navegador web actualizado.

También se recomienda contar con un editor de código y las herramientas necesarias para trabajar con Angular y Django si se desea desarrollar o modificar la aplicación fuera de los contenedores.

## Instalación y ejecución

### 1. Clonar el repositorio

```bash
git clone https://github.com/OpenCodeISPC/Sistema-de-Gestion-de-Mesas.git
cd Sistema-de-Gestion-de-Mesas
```

### 2. Iniciar el entorno

El proyecto incluye un script de actualización del entorno llamado `actualizar-entorno.sh`.

Para ejecutarlo:

```bash
./actualizar-entorno.sh
```

El script contempla opciones para confirmar operaciones y conservar datos existentes. Antes de utilizarlo, se recomienda revisar las opciones disponibles y las acciones que realiza sobre los contenedores y volúmenes.

**Importante:** recrear o eliminar un volumen de PostgreSQL puede provocar la pérdida de los datos almacenados. Antes de ejecutar operaciones destructivas, realizar una copia de seguridad si se necesita conservar la información.

### 3. Ejecución mediante Docker Compose

**IMPORTANTE:** Configuración de variables de entorno
Antes de levantar los servicios por primera vez, es obligatorio crear el archivo de variables de entorno para el backend. Sin este archivo, el contenedor no podrá iniciar:

Navegar a la carpeta backend/.

Duplicar el archivo .env.example y renombrarlo como .env.desarrollo

Una vez configurado, iniciar los servicios mediante Docker Compose:

```bash
docker compose up --build
```

Si el backend reinicia continuamente y sus logs muestran
`password authentication failed for user "sgmb_user"`, el volumen de
PostgreSQL fue creado con credenciales anteriores. La corrección conserva los
datos existentes y crea el usuario esperado por Django:

```powershell
docker exec sgmb_postgres psql -U postgres -d postgres -c "CREATE ROLE sgmb_user LOGIN PASSWORD '1234';"
docker exec sgmb_postgres psql -U postgres -d postgres -c "ALTER ROLE sgmb_user CREATEDB;"
docker compose up -d backend
```

En una instalación nueva, `docker-compose.yml` toma las credenciales de
`backend/.env.desarrollo` para que PostgreSQL y Django utilicen el mismo
usuario desde el primer arranque. No se debe ejecutar `docker compose down -v`
salvo que se acepte perder los datos persistidos.

Para detener los servicios:

```bash
docker compose down
```

Antes de iniciar la aplicación, verificar que las variables de entorno y los servicios requeridos estén configurados correctamente.

### 4. Acceso a la aplicación

Una vez que los servicios estén iniciados, las direcciones locales documentadas para el entorno de desarrollo son:

- Frontend: `http://localhost:4200`
- Backend: `http://localhost:8000`
- API: `http://localhost:8000/api`

El panel de administración de Django se encuentra en la ruta habitual `/admin/`, siempre que esté habilitado en la configuración del proyecto.

## Configuración y seguridad

Las credenciales y los datos sensibles deben gestionarse mediante variables de entorno o mecanismos de configuración apropiados para cada ambiente.

No se deben publicar contraseñas, claves secretas, tokens ni credenciales reales en el repositorio.

En particular, se recomienda verificar:

- La configuración de las credenciales de las bases de datos.
- Las claves utilizadas para JWT y Django.
- Las credenciales de integración con Google OAuth 2.0.
- La configuración del servicio de correo electrónico para los códigos OTP.
- La asignación de permisos según el rol del usuario.
- La protección de las operaciones administrativas en el backend.

Los usuarios no deben poder asignarse privilegios administrativos simplemente modificando una solicitud desde el frontend. La autorización debe validarse en el servidor.

## Pruebas

El proyecto contiene archivos de pruebas asociados al frontend y al backend.

Las pruebas deben utilizarse para verificar el comportamiento de las funcionalidades y detectar errores antes de integrar cambios.

Se recomienda documentar en esta sección:

- Los comandos específicos para ejecutar las pruebas de Angular.
- Los comandos específicos para ejecutar las pruebas de Django.
- Los requisitos de configuración necesarios para las pruebas.
- Los casos de prueba implementados y sus resultados.

Los comandos deben coincidir con la configuración real del proyecto y con las herramientas de testing utilizadas por el equipo.

## Control de versiones y trabajo colaborativo

El proyecto utiliza Git para el control de versiones y GitHub como plataforma de alojamiento del repositorio.

El desarrollo se organiza mediante ramas para facilitar el trabajo colaborativo, separar las funcionalidades y reducir los conflictos de integración.

### Reglas de trabajo

- No realizar commits directamente sobre `main` o `development`.
- Desarrollar las tareas en ramas de trabajo.
- Integrar los cambios mediante Pull Requests (PR).
- Realizar una revisión de código (Code Review) antes de integrar los cambios.
- Mantener las ramas actualizadas para reducir conflictos.

### Flujo de trabajo propuesto

1. Crear una rama de trabajo a partir de `development`.
2. Implementar la funcionalidad o corrección asignada.
3. Registrar los cambios mediante commits descriptivos.
4. Abrir un Pull Request hacia `development`.
5. Revisar el código y corregir las observaciones.
6. Integrar los cambios una vez aprobados.
7. Actualizar `main` cuando corresponda generar una versión estable.

Los nombres de las ramas y las convenciones de commits deben respetar los acuerdos establecidos por el equipo.

## Definition of Done (DoD)

Un requerimiento técnico se considera finalizado cuando cumple los criterios aplicables siguientes:

1. **Funcionalidad:** el código resuelve el requerimiento y no presenta errores de compilación ni conflictos de integración.
2. **Estándares de desarrollo:** se respeta el principio de responsabilidad única (SRP), se mantienen componentes modulares en Angular y se siguen las convenciones utilizadas en Django REST Framework.
3. **Responsividad:** se comprueba el funcionamiento de la interfaz en resoluciones móviles, tablets y escritorio cuando la tarea afecta a la interfaz.
4. **Pruebas:** se ejecutan las pruebas correspondientes y se verifican los casos principales de la funcionalidad modificada.
5. **Integración:** se comprueba que los cambios no afecten negativamente a las funcionalidades existentes.
6. **Revisión de código:** los cambios se integran mediante Pull Request y cuentan con la revisión requerida por el equipo.
7. **Documentación:** se actualiza la documentación interna y el `CHANGELOG.md` cuando corresponde.

## Equipo de desarrollo

El proyecto **Sistema de Gestión de Mesas para Bares (SGMB)** es desarrollado por el equipo de trabajo de OpenCodeISPC.

### Integrantes

- Cabrera Milagros Magaly
- Casarino Mariano
- Minoldo Aldo Alejandro
- Minoldo Nicolas Federico
- Moreno Juan Ignacio
