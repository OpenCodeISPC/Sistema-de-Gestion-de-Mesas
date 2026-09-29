# Actualizar el entorno local (Docker)

Guía para dejar el entorno de desarrollo funcionando después de bajar los últimos cambios del repo (backend con WebSockets vía uvicorn)

## Antes de empezar

Necesitás tener listo lo siguiente:

1. **Traer los cambios del repo**
   ```bash
   git pull
   ```
2. **Tener el archivo `backend/.env.desarrollo`**


3. **Docker Desktop abierto y corriendo**

4. **Correr todo desde Git Bash (no CMD ni PowerShell).

## Ejecutar el script

Desde la raíz del proyecto (donde está `compose.yml`):

```bash
bash actualizar-entorno.sh
```

El script va a:
- Revisar y corregir el `.env` de la raíz (copia las credenciales de Postgres desde `backend/.env.desarrollo` si faltan, y saca configuraciones que no funcionan).
- Bajar los contenedores.
- Preguntar si querés borrar el volumen de Postgres (recomendado si es la primera vez que corrés esto después de los cambios — ver nota abajo).
- Reconstruir las imágenes (necesario porque se agregó una dependencia nueva).
- Levantar todo de nuevo y esperar a que el backend confirme que arrancó bien.

### Variantes

```bash
bash actualizar-entorno.sh --si         # no pregunta, borra el volumen de Postgres directamente
bash actualizar-entorno.sh --conservar  # NO borra el volumen (ver nota abajo)
```

### ¿Por qué borra el volumen de Postgres?

Si tu volumen de Postgres se creó en algún momento con otras credenciales (por ejemplo, con los valores por defecto en vez de las del proyecto), Postgres **no actualiza el usuario/contraseña** aunque cambies las variables de entorno — esos datos quedan grabados desde la primera vez que se inicializó el volumen. Borrarlo fuerza que se recree desde cero con las credenciales correctas.

**Se pierden los datos de prueba locales** (mesas, pedidos, etc.), pero se recrean solos: las migraciones y el `seed_mesas` corren automáticamente al levantar el backend.

Si preferís no perder tus datos, usá `--conservar` primero. Si al levantar ves en los logs `password authentication failed`, correlo de nuevo sin esa opción (o con `--si`).

## Verificar que quedó bien

- `docker logs sgmb_backend` debería mostrar `Application startup complete` sin errores de conexión a Postgres.
- Frontend: [http://localhost:4200](http://localhost:4200)
- Backend: [http://localhost:8000](http://localhost:8000)
- Probar el flujo completo: loguearse, crear un pedido desde una mesa, y verificar que aparece en la pantalla de **Comandas → Cocina** sin necesidad de refrescar la página (confirma que el WebSocket también quedó funcionando).

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `No existe backend/.env.desarrollo` | Falta pedir ese archivo a un compañero |
| `password authentication failed` | Volumen de Postgres con credenciales viejas → correr con `--si` |
| El script pide confirmación y no sabés qué hacer | Responder `s` es seguro en desarrollo; se pierden solo datos de prueba |
| Docker no responde / `Docker no está corriendo` | Abrir Docker Desktop antes de correr el script |

### NOTA: en caso de que docker quede colgado o corrupto

(limpiando tablas, colecciones o estados corruptos de bases de datos).

- ejecutar: 
- docker compose down -v --remove-orphans