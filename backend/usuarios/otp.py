"""
Lógica de negocio del OTP (One Time Password) para el recupero de contraseña.

Se separa de las vistas para respetar el principio de responsabilidad única:
las vistas solo reciben la petición y responden, y este módulo se encarga de
generar, enviar y validar los códigos.
"""

import logging
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.html import escape

from .models import CodigoOTP

logger = logging.getLogger(__name__)


def generar_y_enviar_otp(usuario):
    """
    Genera un OTP de 6 dígitos, invalida los anteriores y lo envía por email.

    Si ya se envió un código hace menos de OTP_REENVIO_SEGUNDOS no se genera
    uno nuevo, para evitar el envío masivo de correos.
    Devuelve True si se envió un código nuevo y False si se omitió.
    """
    ultimo = CodigoOTP.objects.filter(usuario=usuario).first()
    if ultimo:
        segundos = (timezone.now() - ultimo.creado_en).total_seconds()
        if segundos < settings.OTP_REENVIO_SEGUNDOS:
            logger.info("OTP omitido para %s: reenvío antes de tiempo.", usuario.email)
            return False

    CodigoOTP.objects.filter(usuario=usuario, usado=False).update(usado=True)

    codigo = f"{secrets.randbelow(10**6):06d}"
    minutos = settings.OTP_EXPIRACION_MINUTOS

    otp = CodigoOTP.objects.create(
        usuario=usuario,
        codigo_hash=make_password(codigo),
        expira_en=timezone.now() + timedelta(minutes=minutos),
    )

    try:
        _enviar_correo(usuario, codigo, minutos)
    except Exception:
        # Si el correo no salió, se elimina el código para que el usuario
        # pueda reintentar sin esperar el tiempo mínimo de reenvío.
        otp.delete()
        raise

    return True


def _enviar_correo(usuario, codigo, minutos):
    """Envía el código por email usando el EMAIL_BACKEND configurado (consola o Brevo)."""
    send_mail(
        subject="Código de recuperación de contraseña - SGMB",
        message=(
            f"Hola {usuario.nombre},\n\n"
            f"Tu código para restablecer la contraseña es: {codigo}\n"
            f"El código vence en {minutos} minutos.\n\n"
            "Si no solicitaste este cambio, ignorá este correo."
        ),
        html_message=_armar_html(usuario.nombre, codigo, minutos),
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[usuario.email],
        fail_silently=False,
    )


def validar_otp(usuario, codigo):
    """
    Devuelve el OTP vigente del usuario si el código coincide.

    Si el código no coincide se suma un intento fallido y devuelve None.
    También devuelve None si no hay código vigente (vencido, usado o bloqueado).
    """
    otp = CodigoOTP.objects.filter(usuario=usuario, usado=False).first()

    if otp is None or not otp.esta_vigente(settings.OTP_MAX_INTENTOS):
        return None

    if not otp.coincide(codigo):
        otp.intentos += 1
        otp.save(update_fields=["intentos"])
        return None

    return otp


def _armar_html(nombre, codigo, minutos):
    """Arma la versión HTML del correo con los colores de la aplicación."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                padding: 24px; background-color: #f7f1eb; color: #161616;">
        <h2 style="color: #8b6f47; margin-top: 0;">Recuperación de contraseña</h2>
        <p>Hola {escape(nombre)},</p>
        <p>Usá el siguiente código para restablecer tu contraseña en SGMB:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;
                  text-align: center; background-color: #FFFFFF; padding: 16px;
                  border-radius: 8px; color: #8b6f47; border: 1px solid #dfd2c4;">{codigo}</p>
        <p>El código vence en {minutos} minutos.</p>
        <p style="color: #765a38; font-size: 13px;">
            Si no solicitaste este cambio, ignorá este correo.
        </p>
    </div>
    """
