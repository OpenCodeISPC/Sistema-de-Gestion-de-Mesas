# Sistema de Gestión de Mesas para Bares (SGMB)

## Descripción General
El Sistema de Gestión de Mesas para Bares (SGMB) es una aplicación web responsiva diseñada para optimizar la administración de mesas, comandas y la atención al cliente en tiempo real dentro de bares y restaurantes. El sistema prioriza una interfaz clara, rápida e intuitiva, optimizada para dispositivos móviles y tablets utilizados exclusivamente por el personal de salón (mozos).

## Grupo: OpenCode
* Cabrera Milagros Magaly
* Casarino Mariano
* Minoldo Aldo Alejandro
* Minoldo Nicolas Federico
* Moreno Juan Ignacio

---

## Problemática que Resuelve y Público Objetivo

### Problemática
En establecimientos gastronómicos pequeños y medianos, la gestión manual o con sistemas obsoletos genera:
* Errores frecuentes en la toma de pedidos y desorganización al coordinar las solicitudes entre salón y los centros de preparación.
* Demoras en la atención y falta de visibilidad del estado de las mesas en tiempo real.
* Inconvenientes y lentitud al calcular las cuentas finales de los consumos.

### Público Objetivo
Bares y restaurantes pequeños o medianos, enfocándose en el mozo como el usuario único que interactúa con la aplicación de salón.

---

## Alcance Definido (Scope)

### Incluido (MVP - Producto Mínimo Viable)
* **Autenticación Externa:** Sistema de registro e inicio de sesión integrando proveedores externos mediante OAuth (Google y GitHub).
* **Gestión de Mesas:** Visualización interactiva mediante un mapa con estados dinámicos (Libre, Ocupada, Reservada) y cálculo automatizado del consumo acumulado.
* **Gestión de Pedidos:** Alta, consulta y asociación de productos a una mesa en base a la disponibilidad en tiempo real controlada por stock en la base de datos (si el stock es cero, el producto no se visualiza).
* **Bifurcación de Pedidos:** División automática de las comandas confirmadas hacia Barra (bebidas) o Cocina (comidas) en estado inicial Pendiente, pasando luego a En preparación y Listo.
* **Segunda Pantalla para el Mozo:** Mapa de monitoreo secundario que notifica de forma asíncrona cuándo un pedido está listo para ser retirado.
* **Reportes y Auditoría:** Generación y descarga de resúmenes de consumo en formatos PDF y CSV.
* **Despliegue Local homogeneizado:** Configuración y empaquetamiento de todas las tecnologías para ejecutarse mediante contenedores Docker.

### Excluido explícitamente
* Integración con pasarelas de pago online externas (MercadoPago, Stripe, entre otras).
* Facturación electrónica obligatoria y conexión directa con impresoras térmicas de hardware.

---

## Stack Tecnológico Confirmado

### Frontend
* **Framework:** Angular 
* **Lenguajes:** HTML semántico, CSS, TypeScript
* **Librerías de Diseño:** Bootstrap y Tailwind CSS
* **Enfoque UX:** Interfaz adaptativa optimizada para tablets y celulares, con actualización por eventos.

### Backend y API
* **Framework Principal:** Django y Django REST Framework (Python)
* **Comunicación en Tiempo Real:** Django Channels y WebSockets para la sincronización inmediata del estado de los pedidos.

### Base de Datos y Almacenamiento
* **Relacional (PostgreSQL):** Base de datos principal y fuente de verdad del sistema. Almacena las entidades transaccionales esenciales: Mesas, Productos con control de stock, Pedidos y Usuarios.
* **No Relacional (MongoDB):** Base de datos secundaria dedicada al almacenamiento distribuido de logs de eventos, historial de acciones, auditoría del sistema y datos analíticos independientes.

---

## Arquitectura del Sistema y Distribución de Datos
El sistema implementa una arquitectura desacoplada estructurada en tres capas principales:

1. **Capa de Cliente (Frontend):** Aplicación SPA en Angular ejecutada en dispositivos móviles o tablets que consume servicios y se comunica bidireccionalmente mediante WebSockets.
2. **Capa de Lógica de Negocio (Backend):** Servidor API REST en Django que expone endpoints seguros y gestiona conexiones duplex concurrentes a través de Django Channels.
3. **Capa de Persistencia Distribuidora:** Separación responsiva de datos:
   * Las operaciones de lectura/escritura operativas impactan directamente en PostgreSQL.
   * Las actividades críticas generan registros automáticos de auditoría (logs) que se asientan asíncronamente en MongoDB de forma no relacional.

---

## Modelo de Trabajo y Sistema de Branching (Git)
El proyecto se desarrolla bajo el marco de trabajo ágil Scrum, estructurado en Sprints de 3 semanas con ceremonias de planificación, retrospectiva y sincronizaciones internas periódicas (Dailys). 

Para garantizar la estabilidad del código en el repositorio de GitHub, se implementa una estrategia estricta de ramificación:

### Ramas Estables
* `main`: Aloja el código de producción completamente testeado y representa las versiones oficiales de entrega del producto.
* `development`: Rama base de integración diaria. Es el punto donde se unifican los avances desarrollados por el equipo.
* `release`: Rama intermedia para la estabilización. Se crea previo a una entrega para la corrección de errores menores y ajustes finales antes de integrarse a `main`.

### Ramas de Trabajo Individual
Cada desarrollador trabaja de forma aislada en su entorno local partiendo desde `development` utilizando su propia rama nominal:
* `rama-aldo`
* `rama-nicolas`
* `rama-mili`
* `rama-mariano`
* `rama-juan`

*Nota:* Están prohibidos los commits directos sobre las ramas `main` o `development`. Toda integración requiere obligatoriamente la creación de un Pull Request (PR) y la aprobación mediante revisión de código (Code Review) por parte de otro miembro del equipo.

---

## Plan de Gestión de las Comunicaciones
El equipo establece canales y herramientas específicas para mantener la sincronización y la transparencia en el avance:
* **Sincronización Sincrónica:** Reuniones de Planificación y Retrospectiva cada 3 semanas vía Google Meet o Discord. Reuniones de sincronización corta (Dailys) dos veces por semana a través de chats grupales.
* **Gestión de Tareas:** Implementación de un tablero ágil digital en GitHub Projects estructurado en columnas de estado: To Do, In Progress, Testing y Done.
* **Comunicación Externa:** Consultas técnicas canalizadas durante las clases virtuales institucionales y entregas formales realizadas mediante el Aula Virtual al cierre de cada Sprint.

---

## Definition of Done (DoD)
Para que un requerimiento o tarea técnica se considere formalmente finalizado, debe cumplir con las siguientes directrices de calidad:
1. **Funcionalidad:** El código debe resolver la necesidad planteada, estar libre de errores de compilación y no generar conflictos de integración con la rama `development`.
2. **Estándares de Código:** Respetar el principio de responsabilidad única (SRP) y modularidad en componentes de Angular. En Django, seguir las convenciones de modelos y documentar mediante docstrings.
3. **Validación de Interfaz:** Control responsive comprobado en resoluciones móviles y tablets prioritarias.
4. **Documentación:** El avance técnico debe verse reflejado en la Wiki interna o en los manuales técnicos correspondientes antes de cerrar la tarea.
