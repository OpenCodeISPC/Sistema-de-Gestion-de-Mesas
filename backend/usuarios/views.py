from django.db import transaction
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    CustomTokenObtainPairSerializer,
    RegistroSerializer,
    GoogleOAuthSerializer,
    UsuarioSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
)

Usuario = get_user_model()


# 1. Login clásico (SimpleJWT + Usuario)
class LoginView(TokenObtainPairView):
    """
    Endpoint para inicio de sesión clásico con correo y contraseña.
    Emite el par de tokens JWT (access y refresh) e incluye los datos del usuario.
    """
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


# 2. Registro manual (Rol obligatorio provisto por el usuario)
class RegistroView(APIView):
    """
    Endpoint para registro manual de usuarios.
    Crea el registro de forma atómica y emite tokens JWT para auto-login inmediato.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        datos = serializer.validated_data
        with transaction.atomic():
            usuario = Usuario.objects.create_user(
                email=datos["email"],
                password=datos["password"],
                nombre=datos.get("nombre", ""),
                apellido=datos.get("apellido", ""),
                rol=datos["rol"],
            )

        refresh = RefreshToken.for_user(usuario)
        return Response(
            {
                "user": UsuarioSerializer(usuario).data,
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "message": "Usuario registrado exitosamente.",
            },
            status=status.HTTP_201_CREATED,
        )


# 3. Google OAuth 2.0 (Asignación controlada y set_unusable_password)
class GoogleOauthView(APIView):
    """
    Endpoint para autenticación y registro federado mediante Google OAuth 2.0.
    Verifica el ID Token y genera credenciales JWT propias de la aplicación.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleOAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        google_info = serializer.validated_data["token"]
        rol_elegido = serializer.validated_data.get("rol", "MOZO")
        email = google_info.get("email")

        with transaction.atomic():
            usuario, created = Usuario.objects.get_or_create(
                email=email,
                defaults={
                    "nombre": google_info.get("given_name", ""),
                    "apellido": google_info.get("family_name", ""),
                    "rol": rol_elegido,
                    "is_active": True,
                },
            )
            if created:
                usuario.set_unusable_password()
                usuario.save()

        refresh = RefreshToken.for_user(usuario)
        return Response(
            {
                "user": UsuarioSerializer(usuario).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK,
        )


# 4. Solicitud de reseteo de clave
class PasswordResetRequestView(APIView):
    """
    Solicitud de recuperación de contraseña.
    Genera un token seguro y envía un correo con el enlace de restablecimiento.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            usuario = Usuario.objects.get(email=email)
            token = default_token_generator.make_token(usuario)
            uid = urlsafe_base64_encode(force_bytes(usuario.pk))

            reset_url = f"http://localhost:4200/recupero-password?uid={uid}&token={token}"

            send_mail(
                subject="Recuperación de Contraseña - SGMB",
                message=f"Hola {usuario.nombre}, para restablecer tu clave ingresa a:\n{reset_url}",
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@bar.com"),
                recipient_list=[email],
                fail_silently=True,
            )
            print(f"DEBUG LINK: {reset_url}")
        except Usuario.DoesNotExist:
            pass

        return Response(
            {"message": "Si la cuenta existe, recibirás un enlace de recuperación en tu correo."},
            status=status.HTTP_200_OK,
        )


# 5. Confirmación de nueva contraseña
class PasswordResetConfirmView(APIView):
    """
    Confirmación de reseteo de contraseña.
    Valida el token recibido y persiste la nueva contraseña hasheada.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = serializer.validated_data["user"]
        nueva_password = serializer.validated_data["new_password"]

        with transaction.atomic():
            usuario.set_password(nueva_password)
            usuario.save()

        return Response(
            {"message": "Contraseña restablecida exitosamente."},
            status=status.HTTP_200_OK,
        )