from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

Usuario = get_user_model()

# 1. Serializer de lectura de usuario
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "apellido", "rol", "is_active", "is_staff", "fecha_creacion"]
        read_only_fields = ["id", "is_active", "is_staff", "fecha_creacion"]


# 2. Serializer de Registro tradicional
class RegistroSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )
    rol = serializers.ChoiceField(
        choices=Usuario.ROLES, 
        required=True, 
    )

    class Meta:
        model = Usuario
        fields = ["id", "email", "nombre", "apellido", "rol", "password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return Usuario.objects.create_user(**validated_data)


# 3. Serializer para Login JWT con usuario incluido
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UsuarioSerializer(self.user).data
        return data


# 4. Serializer para OAuth2 con Google
class GoogleOAuthSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True, required=True)
    rol = serializers.ChoiceField(
        choices=Usuario.ROLES, 
        required=False, 
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
                client_id
            )
            return google_info
        except ValueError:
            raise serializers.ValidationError("El token de Google es inválido o ha expirado.")


# 5. Serializers para Recupero de Contraseña
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.lower().strip()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        write_only=True, 
        required=True, 
        validators=[validate_password]
    )

    def validate(self, attrs):
        uid_b64 = attrs.get('uid')
        token = attrs.get('token')

        try:
            uid = force_str(urlsafe_base64_decode(uid_b64))
            user = Usuario.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, Usuario.DoesNotExist):
            raise serializers.ValidationError({"uid": "Identificador de usuario inválido."})

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({"token": "El token de recuperación es inválido o expiró."})

        attrs['user'] = user
        return attrs
 