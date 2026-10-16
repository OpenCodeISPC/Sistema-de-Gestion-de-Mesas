import logging

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .otp import validar_otp

Usuario = get_user_model()
logger = logging.getLogger(__name__)

# Tolerancia (en segundos) ante pequeñas diferencias de reloj entre Google y el servidor.
# Sin esta tolerancia, si el reloj local está apenas atrasado, Google emite tokens
# "del futuro" y la verificación falla con "Token used too early".
GOOGLE_CLOCK_SKEW_SEGUNDOS = 10


# 1. Serializer de lectura de usuario
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "apellido", "rol", "is_active", "is_staff", "fecha_creacion"]
        read_only_fields = ["id", "is_active", "is_staff", "fecha_creacion"]


# 2. Serializer de Registro tradicional (rol obligatorio elegido por el usuario)
class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    rol = serializers.ChoiceField(
        choices=Usuario.ROLES, 
        required=True
    )

    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "apellido", "rol", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Usuario(**validated_data)
        user.set_password(password)
        user.save()
        return user

    #def validate_rol(self,value):
       # roles_validos = {k for k, _ in Usuario.ROLES}
        #if value not in roles_validos:
            #raise serializers.ValidationError("El rol seleccionado no es válido.")
        #return value


# 3. Serializer para Login JWT con usuario incluido
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        user = self.user
        roles_validos = {k for k, _ in Usuario.ROLES}
        if user.rol not in roles_validos:
            raise serializers.ValidationError("El rol del usuario no es válido.")

        data["user"] = UsuarioSerializer(user).data
        return data


# 4. Serializer para OAuth2 con Google
class GoogleOAuthSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, required=True)
    rol = serializers.ChoiceField(
        choices=Usuario.ROLES, 
        required=False, 
        default="MOZO"
    )

    def validate_token(self, value):
        """Valida criptográficamente el token contra Google y extrae el payload."""
        try:
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
            if not client_id:
                raise serializers.ValidationError("GOOGLE_CLIENT_ID no configurado en settings.")

            google_info = id_token.verify_oauth2_token(
                value,
                google_requests.Request(),
                client_id,
                clock_skew_in_seconds=GOOGLE_CLOCK_SKEW_SEGUNDOS,
            )
            return google_info
        except serializers.ValidationError:
            raise
        except Exception as e:
            logger.warning("Token de Google rechazado: %s", e)
            raise serializers.ValidationError("El token de Google es inválido o ha expirado.")
        

# 5. Serializers para Recupero de Contraseña
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class VerificarOTPSerializer(serializers.Serializer):
    """Valida que el código OTP ingresado corresponda al email y esté vigente."""
    email = serializers.EmailField(required=True)
    codigo = serializers.RegexField(
        r"^\d{6}$",
        required=True,
        error_messages={"invalid": "El código debe tener 6 dígitos."},
    )

    def validate(self, attrs):
        email = attrs["email"].strip()
        usuario = Usuario.objects.filter(email__iexact=email, is_active=True).first()
        otp = validar_otp(usuario, attrs["codigo"]) if usuario else None

        if otp is None:
            raise serializers.ValidationError({"codigo": "El código es inválido o expiró."})

        attrs["usuario"] = usuario
        attrs["otp"] = otp
        return attrs


class PasswordResetConfirmSerializer(VerificarOTPSerializer):
    """Además del OTP, valida la nueva contraseña con los validadores de Django."""
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
