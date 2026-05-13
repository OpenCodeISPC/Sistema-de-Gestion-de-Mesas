
# Sistema de Gestión de Mesas para Bares (SGMB)

## 📝 Descripción General
El **Sistema de Gestión de Mesas para Bares (SGMB)** es una aplicación web responsiva diseñada para optimizar la administración de mesas, comandas y la atención al cliente en tiempo real dentro de bares y restaurantes. El sistema prioriza una interfaz clara, rápida e intuitiva, optimizada para dispositivos móviles y tablets utilizados por el personal de salón.

## 👥 Grupo: OpenCode
*   Cabrera Milagros Magaly
*   Mariano Casarino
*   Minoldo Aldo Alejandro
*   Minoldo Nicolas Federico
*   Moreno Juan Ignacio

---

## 🎯 Problemática que Resuelve
En establecimientos gastronómicos pequeños y medianos, la gestión manual o con sistemas obsoletos genera:
*   Errores frecuentes en la toma de pedidos.
*   Demoras en la atención y falta de visibilidad del estado de las mesas.
*   Falta de coordinación eficiente entre la cocina y el salón.
*   Inconvenientes y lentitud al calcular las cuentas finales.

**Público Objetivo:** Bares y restaurantes pequeños/medianos, mozos, personal de atención y administradores.

---

## 🚀 Funcionalidades Principales (MVP)

### 📊 Gestión de Mesas
*   Visualización interactiva del estado de las mesas (libre, ocupada, reservada) mediante código de colores.
*   Apertura y cierre de mesas con cálculo automático del total a pagar.

### 📝 Gestión de Pedidos
*   Alta, modificación y asociación de productos a los pedidos de cada mesa.

### 🍳 Flujo de Cocina/Bar
*   Control de estados del pedido en tiempo real: `Pendiente` ➡️ `En preparación` ➡️ `Listo`.

### 🔄 Sincronización en Tiempo Real
*   Actualización automática entre múltiples dispositivos (mozos y cocina) concurrentes.

---

## 🛠️ Stack Tecnológico

### Frontend
*   **Framework:** Angular
*   **Lenguajes:** HTML / CSS / TypeScript
*   **Enfoque UX:** Interfaz tipo mapa de mesas optimizada para celulares y tablets.

### Backend & API
*   **Framework Principal:** Django & Django REST Framework
*   **Comunicación en Tiempo Real:** Django Channels (WebSockets) para sincronización inmediata.

### Base de Datos & Almacenamiento
*   **Relacional (PostgreSQL):** Fuente de verdad del sistema. Almacena mesas, pedidos, productos y usuarios.
*   **No Relacional (MongoDB):** Base secundaria orientada al registro de logs de eventos, historial de acciones y auditoría para reportes.

---

## 🗺️ Arquitectura General del Sistema
El sistema se compone de tres capas principales conectadas de la siguiente manera:
1.  **Clientes:** Dispositivos (PC, Celular, Tablet) interactuando con la interfaz de Angular.
2.  **API Gateway / Lógica:** Servidor Django que expone endpoints HTTP REST y conexiones WebSockets.
3.  **Persistencia:** Bifurcación de datos entre PostgreSQL (transaccional) y MongoDB (analítico/historial).

---

## 🔮 Mejoras Futuras
*   Sistema de notificaciones automáticas directas a la cocina.
*   Funcionalidad para división de cuentas entre clientes.
*   Módulo de reportes avanzados y estadísticas de ventas diarias.
*   Integración con pasarelas de pago digitales.
*   Panel administrativo avanzado para los dueños del local.
