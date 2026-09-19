| Situación                                         | Comando                           |
| ------------------------------------------------- | --------------------------------- |
| Crear `requirements.txt`                          | `pip freeze > requirements.txt`   |
| Agregar una librería                              | `pip install nombre-libreria`     |
| Actualizar `requirements.txt` después de instalar | `pip freeze > requirements.txt`   |
| Instalar todo desde `requirements.txt`            | `pip install -r requirements.txt` |

🐳 COMANDOS DOCKER
| Comando                            | Sirve para      |
| ---------------------------------  | --------------- |
| `docker compose up -d`             | Levantar        |
| `docker compose down`              | Apagar          |
| `docker ps`                        | Status          | 
| `docker logs -f sgmb_backend`      | Logs
| `docker exec -it sgmb_backend bash`| Consola
| Despues de agregar nvas librerias en requirements.tx o package.json |
| `docker compose up -d --build`                      | 

| Comando: verificacion migraciones                  |Sirve                                                               |
| ---------------------------------------------------|--------------------------------------------------------------------|
| `python manage.py makemigrations --check --dry-run`|Verificar cambios pendientes en los modelos|OK =No changes detected |
| `python manage.py showmigrations`                  |Verificar migraciones no aplicadas en la BD|OK = casillas tienen [X]|


# Entrar a la terminal Bash del contenedor
docker exec -it sgmb_backend bash

# Ejecutar las migraciones (desde la terminal Bash root@...:/app#)
python manage.py makemigrations
python manage.py migrate

-----------------------
### Arrancar django: cd backend
python manage.py runserver 0.0.0.0:8000
### Arrancar angular: cd fronend
ng serve -o

###  Frontend (Angular): http://localhost:4200

###  Backend API (Django): http://localhost:8000/admin/


================================Sobre WebSocket===============================================
### Todas las apps que necesiten, SOLO LAS QUE NECESITEN, tiempo real tendrán su propio routing.py, consumers.py y signals.py.
### ---> "NOSOTROS USAMOS SOLO un websockt(pedidos)quien alimienta a los otras apps"
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

### Crear mesas en la bd, se ejecuta desde la raiz de proyecto:
docker exec -i sgmb_backend python manage.py shell << EOF
from mesas.models import Mesa

Mesa.objects.bulk_create([
    Mesa(numero=1, capacidad=4, estado="LIBRE", ubicacion="Salón principal"),
    Mesa(numero=2, capacidad=4, estado="OCUPADA", ubicacion="Salón principal"),
    Mesa(numero=3, capacidad=6, estado="RESERVADA", ubicacion="Salón principal"),
    Mesa(numero=4, capacidad=4, estado="LIBRE", ubicacion="Salón principal"),
    Mesa(numero=5, capacidad=6, estado="OCUPADA", ubicacion="Salón principal"),
    Mesa(numero=6, capacidad=2, estado="RESERVADA", ubicacion="Salón principal"),

    Mesa(numero=10, capacidad=2, estado="LIBRE", ubicacion="Terraza"),
    Mesa(numero=11, capacidad=4, estado="OCUPADA", ubicacion="Terraza"),
    Mesa(numero=12, capacidad=4, estado="LIBRE", ubicacion="Terraza"),
    Mesa(numero=13, capacidad=6, estado="RESERVADA", ubicacion="Terraza"),
])

print("✅ 10 mesas cargadas con éxito.")
EOF

------------------------------------------------------------------------------------------