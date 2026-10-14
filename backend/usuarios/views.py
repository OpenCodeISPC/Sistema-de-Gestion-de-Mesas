import logging

from django.db import transaction
from django.contrib.auth import get_user_model

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
    VerificarOTPSerializer,
)
from .otp import generar_y_enviar_otp

Usuario = get_user_model()
logger = logging.getLogger(__name__)


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
    authentication_classes = []

    def post(self, request):
        serializer = RegistroSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        datos = serializer.validated_data
        rol_elegido = datos["rol"]
        
        # Validar si el usuario seleccionó ADMIN
        es_admin = (rol_elegido == "ADMIN")

        with transaction.atomic():
            usuario = Usuario.objects.create_user(
                email=datos["email"],
                password=datos["password"],
                nombre=datos.get("nombre", ""),
                apellido=datos.get("apellido", ""),
                rol=rol_elegido,
                is_staff=es_admin,       # Si es ADMIN, será True. Si no, False.
                is_superuser=es_admin,   # Si es ADMIN, será True. Si no, False.
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
    # Endpoint público: no se lee el header Authorization, así un token viejo
    # guardado en el navegador no provoca un 401 antes de iniciar sesión.
    authentication_classes = []

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


# 4. Solicitud de código OTP para recuperar la contraseña
class PasswordResetRequestView(APIView):
    """
    Solicitud de recuperación de contraseña.
    Genera un código OTP de 6 dígitos y lo envía al correo del usuario.
    La respuesta es siempre la misma para no revelar qué correos están registrados.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        usuario = Usuario.objects.filter(email__iexact=email, is_active=True).first()
        if usuario:
            try:
                generar_y_enviar_otp(usuario)
            except Exception:
                logger.exception("No se pudo enviar el código OTP a %s", email)

        return Response(
            {"message": "Si la cuenta existe, recibirás un código de verificación en tu correo."},
            status=status.HTTP_200_OK,
        )


# 5. Verificación del código OTP
class VerificarOTPView(APIView):
    """
    Verifica que el código OTP sea válido sin consumirlo.
    Permite al frontend habilitar el paso de nueva contraseña.
    Cada código incorrecto suma un intento fallido.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = VerificarOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        return Response(
            {"message": "Código verificado correctamente."},
            status=status.HTTP_200_OK,
        )


# 6. Confirmación de nueva contraseña
class PasswordResetConfirmView(APIView):
    """
    Confirmación de reseteo de contraseña.
    Vuelve a validar el OTP, persiste la nueva contraseña hasheada
    y marca el código como usado para que no pueda reutilizarse.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        usuario = serializer.validated_data["usuario"]
        otp = serializer.validated_data["otp"]
        nueva_password = serializer.validated_data["new_password"]

        with transaction.atomic():
            usuario.set_password(nueva_password)
            usuario.save()
            otp.usado = True
            otp.save(update_fields=["usado"])

        return Response(
            {"message": "Contraseña restablecida exitosamente."},
            status=status.HTTP_200_OK,
        )
