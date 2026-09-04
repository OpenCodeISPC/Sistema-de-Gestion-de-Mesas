| Situación                                         | Comando                           |
| ------------------------------------------------- | --------------------------------- |
| Crear `requirements.txt`                          | `pip freeze > requirements.txt`   |
| Agregar una librería                              | `pip install nombre-libreria`     |
| Actualizar `requirements.txt` después de instalar | `pip freeze > requirements.txt`   |
| Instalar todo desde `requirements.txt`            | `pip install -r requirements.txt` |

🐳 COMANDOS DOCKER
| Comando                           | Sirve para      |
| --------------------------------- | --------------- |
| `docker compose up -d`            | Levantar        |
| `docker compose down`             | Apagar          |


| Comando: verificacion migraciones                  |Sirve                                                               |
| ---------------------------------------------------|--------------------------------------------------------------------|
| `python manage.py makemigrations --check --dry-run`|Verificar cambios pendientes en los modelos|OK =No changes detected |
| `python manage.py showmigrations`                  |Verificar migraciones no aplicadas en la BD|OK = casillas tienen [X]|



### Arrancar django: cd backend
python manage.py runserver 0.0.0.0:8000
### Arrancar angular: cd fronend
ng serve -o
