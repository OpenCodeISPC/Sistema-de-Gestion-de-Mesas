"""
Correos transaccionales de la app usuarios.

El envío usa el EMAIL_BACKEND configurado (consola en desarrollo o Brevo vía API HTTP).
Un error al enviar nunca debe interrumpir la operación principal (por ejemplo, el registro).
"""

import logging

from django.conf import settings
from django.core.mail import send_mail
from django.utils.html import escape

logger = logging.getLogger(__name__)


def enviar_bienvenida(usuario):
    """
    Envía el correo de bienvenida a un usuario recién registrado.

    Devuelve True si se envió y False si falló. Los errores se registran
    en el log pero no se propagan, para no afectar el registro del usuario.
    """
    try:
        send_mail(
            subject="Bienvenido/a a SGMB",
            message=(
                f"Hola {usuario.nombre},\n\n"
                "Tu cuenta en el Sistema de Gestión de Mesas para Bares (SGMB) "
                "fue creada correctamente.\n"
                f"Rol asignado: {usuario.get_rol_display()}\n\n"
                "Ya podés iniciar sesión y comenzar a trabajar.\n\n"
                "Si no creaste esta cuenta, ignorá este correo."
            ),
            html_message=_armar_html_bienvenida(usuario),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[usuario.email],
            fail_silently=False,
        )
        return True
    except Exception:
        logger.exception("No se pudo enviar el correo de bienvenida a %s", usuario.email)
        return False


def _armar_html_bienvenida(usuario):
    """Arma la versión HTML del correo de bienvenida con los colores de la aplicación."""
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;
                padding: 24px; background-color: #f7f1eb; color: #161616;">
        <h2 style="color: #8b6f47; margin-top: 0;">Bienvenido/a a SGMB</h2>
        <p>Hola {escape(usuario.nombre)},</p>
        <p>Tu cuenta en el Sistema de Gestión de Mesas para Bares fue creada correctamente.</p>
        <p style="background-color: #FFFFFF; padding: 16px; border-radius: 8px;
                  border: 1px solid #dfd2c4;">
            <strong>Correo:</strong> {escape(usuario.email)}<br>
            <strong>Rol asignado:</strong> {escape(usuario.get_rol_display())}
        </p>
        <p>Ya podés iniciar sesión y comenzar a trabajar.</p>
        <p style="color: #765a38; font-size: 13px;">
            Si no creaste esta cuenta, ignorá este correo.
        </p>
    </div>
    """
