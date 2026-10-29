| Situación                                         | Comando                           |
| ------------------------------------------------- | --------------------------------- |
| Crear `requirements.txt`                          | `pip freeze > requirements.txt`   |
| Agregar una librería                              | `pip install nombre-libreria`     |
| Actualizar `requirements.txt` después de instalar | `pip freeze > requirements.txt`   |
| Instalar todo desde `requirements.txt`            | `pip install -r requirements.txt` |

🐳 COMANDOS DOCKER
| Comando                                               | Sirve para              |
| ---------------------------------                     | ---------------         |
| `docker compose up -d`                                | Levantar                |
| `docker compose down`                                 | Apagar                  |
| `docker ps`                                           | Status                  | 
| `docker stop gestor_backend`                          | Stop                    |
| `docker compose restart backend`                      | Resetear
| `docker kill gestor_backend`                          | Detencion forzada       |
| `docker compose -p negocio-precios-stock down`        | Detengo mi otro proyecto|
| `docker logs -f sgmb_backend`                         | Logs                    |
| `docker exec -it sgmb_backend bash`                   | Consola                 |
| `docker exec -it sgmb_backend python manage.py shell` | Consola directa         |

# Despues de agregar nvas librerias en requirements.tx o package.json, DockerFile, docker-compose.yml RECONSTRUIR          
| `docker compose up -d --build`   
| docker compose up -d --build backend                                               | 

| docker-limpiar                                        | Limpieza del docker     |

----------------------------------------------------------------------------
# Procedimiento de emergencia si no me levanta el docker
- docker ps => VEO si no es tomado los puerto por otros proyecto(ej.negocio-precios)

# Verificar qué proceso ocupa el puerto
netstat -ano | findstr :8000
# Detener contenedor en conflicto de otro proyecto (ej. gestor_backend)
docker stop gestor_backend
# Detener el stack y limpiar redes aisladas
docker compose down --remove-orphans
# Levantar los servicios en segundo plano
docker compose up -d
# Validación Backend - Base de Datos:
docker exec -it sgmb_backend python manage.py check
- Criterio de éxito: La consola debe responder System check identified no issues (0 silenced).
----------------------------------------------------------------------------------


| Comando: verificacion migraciones                  |Sirve                                                               |
| ---------------------------------------------------|--------------------------------------------------------------------|
| `python manage.py makemigrations --check --dry-run`|Verificar cambios pendientes en los modelos|OK =No changes detected |
| `python manage.py showmigrations`                  |Verificar migraciones no aplicadas en la BD|OK = casillas tienen [X]|

------------------------------------------------------------------------------------------------------------------------------------------

# Testing en backend
- docker exec -it sgmb_backend coverage run manage.py test
# generas tu evidencia HTML
- docker exec -it sgmb_backend coverage html



### Arrancar django: cd backend
python manage.py runserver 0.0.0.0:8000
### Arrancar angular: cd fronend
ng serve -o

###  Frontend (Angular): http://localhost:4200

###  Backend API (Django): http://localhost:8000/admin/


================================Sobre WebSocket===============================================
### Todas las apps que necesiten tiempo real tendrán su propio routing.py, consumers.py y signals.py.
### "Nosotros usamos solo un websockt(pedidos)quien alimienta a los otras apps"
### Uso de AsyncWebsocketConsumer: La lógica para unirse a un grupo (group_add), desconectarse (group_discard) y reenviar eventos (send).
### Disparo automático: Las señales post_save / post_delete para emitir eventos cuando la BD cambia.

|Componente            | App pedidos       | App mesas        | Etc....
|`URL (routing.py)`    |`r'^ws/pedidos/$'` |`r'^ws/mesas/$'`  |
|`Consumer Class`      |`PedidoConsumer`   |`MesaConsumer`    |
|`Grupo de Redis`      |`'pedidos_group'`  |`'mesas_group'`   |
|`Modelo en Signal`    |`sender=Pedido`    |`sender=Mesa `    |
|`Tipos de Eventos`    |`PEDIDO_CREADO`    |`MESA_OCUPADA`    |

### Resumen: 
- El nombre del grupo en Redis (para no mezclar tráfico de salas).
- La ruta en routing.py.
- El modelo y serializer que usa la señal (signals.py).
==================================================================================
### limpiar mesas en la bd, se ejecuta desde la raiz de proyecto:
docker exec -it sgmb_backend python manage.py shell -c "from pedidos.models import Pedido; from mesas.models import Mesa; Pedido.objects.all().delete(); Mesa.objects.all().delete()"
-----------------------------------------

# Entrar a la terminal Bash del contenedor
docker exec -it sgmb_backend bash

# Ejecutar las migraciones (desde la terminal Bash root@...:/app#)
python manage.py makemigrations
python manage.py migrate
-------------------------------------------------------------------
# Resumen rápido:

    Terminal Bash (root@...:/app#): Para makemigrations, migrate, runserver, etc.

    Shell de Python (>>>): Solo para código Python/ORM como Mesa.objects.bulk_create(...).
---------------------------------------------------------------------------------    

- usario Admin-----------------------------------
email="admin@example.com",
    nombre="Admin",
    apellido="General",
    password="1234567*",
    rol="ADMIN"
-------------------------------------------   
- usario Mozo-----------------------------------
email="mozo@gmail.com",
    nombre="pepe",
    apellido="Mozo",
    password="1234567*",
    rol="MOZO"
-------------------------------------------     