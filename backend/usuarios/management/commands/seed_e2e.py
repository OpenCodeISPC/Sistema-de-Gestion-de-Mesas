"""
Comando de datos de prueba para la suite E2E (Playwright + Page Object Model).

Crea (de forma idempotente) un usuario con contraseña conocida por cada rol del
sistema, de manera que las pruebas E2E puedan:

  - Autenticarse: el flujo de login se parametriza con combinaciones validas e
    invalidas (email inexistente / contrasena incorrecta).
  - Ejecutar el CRUD de Productos con un usuario ADMIN.

Uso (desde la raiz del repo):

    docker exec -i sgmb_backend python manage.py seed_e2e

Credenciales de prueba (mismas que documenta e2e/README.md):

    admin@sgmb.com   / Password123   (ADMIN)
    mozo@sgmb.com    / Password123   (MOZO)
    cajero@sgmb.com  / Password123   (CAJERO)
    cocina@sgmb.com  / Password123   (COCINA)
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

Usuario = get_user_model()

PASSWORD_E2E = "Password123"

USUARIOS_E2E = [
    {"email": "admin@sgmb.com", "nombre": "Admin", "apellido": "SGMB", "rol": "ADMIN"},
    {"email": "mozo@sgmb.com", "nombre": "Mozo", "apellido": "SGMB", "rol": "MOZO"},
    {"email": "cajero@sgmb.com", "nombre": "Cajero", "apellido": "SGMB", "rol": "CAJERO"},
    {"email": "cocina@sgmb.com", "nombre": "Cocina", "apellido": "SGMB", "rol": "COCINA"},
]


class Command(BaseCommand):
    help = "Crea/actualiza los usuarios de prueba (E2E) con contrasena conocida por rol."

    def handle(self, *args, **options):
        for datos in USUARIOS_E2E:
            es_admin = datos["rol"] == "ADMIN"
            usuario, creado = Usuario.objects.get_or_create(
                email=datos["email"],
                defaults={
                    "nombre": datos["nombre"],
                    "apellido": datos["apellido"],
                    "rol": datos["rol"],
                    "is_active": True,
                    "is_staff": es_admin,
                    "is_superuser": es_admin,
                },
            )

            usuario.nombre = datos["nombre"]
            usuario.apellido = datos["apellido"]
            usuario.rol = datos["rol"]
            usuario.is_active = True
            usuario.is_staff = es_admin
            usuario.is_superuser = es_admin
            usuario.set_password(PASSWORD_E2E)
            usuario.save()

            accion = "creado" if creado else "actualizado"
            self.stdout.write(
                self.style.SUCCESS(
                    f"Usuario {accion}: {usuario.email} (rol {usuario.rol})"
                )
            )

        self.stdout.write(self.style.SUCCESS("SEED E2E listo."))
