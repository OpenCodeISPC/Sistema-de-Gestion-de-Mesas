"""
# Modelo de Usuario Personalizado

Se implementó un modelo de usuario personalizado utilizando
`AbstractBaseUser` y `PermissionsMixin` de Django.
Esta estrategia reemplaza al modelo `User` por defecto y permite
definir el correo electrónico como identificador único de autenticación
(`USERNAME_FIELD = "email"`).

Además, se implementó un `UsuarioManager` personalizado encargado de
la creación de usuarios y superusuarios, garantizando el almacenamiento
seguro de contraseñas mediante hashing a través del método `set_password()`.

## Ventajas de esta implementación

* Permite autenticar usuarios mediante correo electrónico en lugar de nombre de usuario.
* Mantiene compatibilidad con el sistema de permisos y grupos de Django gracias a `PermissionsMixin`.
* Facilita la integración con JWT (JSON Web Tokens) para autenticación en APIs REST.
* Permite agregar campos personalizados al usuario, como nombre, apellido y rol.
* Almacena las contraseñas de forma segura mediante algoritmos de hash provistos por Django.
* Escala mejor que el modelo estándar cuando se requieren reglas de negocio específicas.
* Compatible con el panel de administración de Django y con el sistema de autenticación nativo.

Esta implementación resulta adecuada para aplicaciones web modernas basadas en APIs,
donde se requiere autenticación mediante correo electrónico y control de acceso basado en roles.
"""


from django.db import models
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils import timezone

from .managers import UsuarioManager

class Usuario(AbstractBaseUser, PermissionsMixin):

    ROLES = (
        ("ADMIN", "Administrador"),
        ("MOZO", "Mozo"),
        ("CAJERO", "Cajero"),
        ("COCINA", "Cocina")
    )
    
    email = models.EmailField(unique=True)
    
    nombre = models.CharField(max_length=150)
    apellido = models.CharField(max_length=150)
    
    rol = models.CharField(
        max_length=20,
        choices=ROLES, default="MOZO"
    )
    
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nombre", "apellido"]
    
    objects = UsuarioManager()

    class Meta:
        db_table = "usuarios"
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"

    def __str__(self):
        return f"{self.nombre} - {self.apellido} - {self.email}"


class CodigoOTP(models.Model):
    """
    Código de un solo uso (OTP) para el recupero de contraseña.

    El código de 6 dígitos nunca se guarda en texto plano: se almacena
    hasheado con el mismo mecanismo que usa Django para las contraseñas.
    Cada código vence por tiempo, por cantidad de intentos fallidos
    o al ser utilizado.
    """

    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.CASCADE,
        related_name="codigos_otp"
    )
    codigo_hash = models.CharField(max_length=128)
    creado_en = models.DateTimeField(auto_now_add=True)
    expira_en = models.DateTimeField()
    intentos = models.PositiveSmallIntegerField(default=0)
    usado = models.BooleanField(default=False)

    class Meta:
        db_table = "codigos_otp"
        ordering = ["-creado_en"]
        verbose_name = "Código OTP"
        verbose_name_plural = "Códigos OTP"

    def __str__(self):
        return f"OTP {self.usuario.email} - usado: {self.usado}"

    def esta_vigente(self, max_intentos):
        """Indica si el código todavía puede utilizarse."""
        return (
            not self.usado
            and self.intentos < max_intentos
            and timezone.now() < self.expira_en
        )

    def coincide(self, codigo):
        """Compara el código ingresado contra el hash almacenado."""
        return check_password(codigo, self.codigo_hash)
