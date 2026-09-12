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
| `docker exec -it sgmb_backend bash`|
| Despues de agregar nvas librerias en requirements.tx o package.json |
| `docker compose up -d --build`                      | 

| Comando: verificacion migraciones                  |Sirve                                                               |
| ---------------------------------------------------|--------------------------------------------------------------------|
| `python manage.py makemigrations --check --dry-run`|Verificar cambios pendientes en los modelos|OK =No changes detected |
| `python manage.py showmigrations`                  |Verificar migraciones no aplicadas en la BD|OK = casillas tienen [X]|



### Arrancar django: cd backend
python manage.py runserver 0.0.0.0:8000
### Arrancar angular: cd fronend
ng serve -o


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
=================================================================================================