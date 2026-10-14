import re
from datetime import timedelta
from unittest.mock import patch

from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import CodigoOTP, Usuario

URL_SOLICITAR = "/api/auth/password-reset/"
URL_VERIFICAR = "/api/auth/password-reset/verificar/"
URL_CONFIRMAR = "/api/auth/password-reset-confirm/"
URL_LOGIN = "/api/auth/login/"


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class RecuperoPasswordOTPTests(APITestCase):
    """Pruebas del flujo de recupero de contraseña con código OTP."""

    def setUp(self):
        self.usuario = Usuario.objects.create_user(
            email="Mozo.Prueba@gmail.com",
            password="claveVieja123",
            nombre="Mozo",
            apellido="Prueba",
        )

    def _solicitar_codigo(self, email="mozo.prueba@gmail.com"):
        """Solicita un OTP y devuelve el código extraído del último correo enviado."""
        respuesta = self.client.post(URL_SOLICITAR, {"email": email}, format="json")
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        return re.search(r"\b(\d{6})\b", mail.outbox[-1].body).group(1)

    def test_solicitud_envia_correo_y_guarda_codigo_hasheado(self):
        codigo = self._solicitar_codigo()

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["Mozo.Prueba@gmail.com"])
        otp = CodigoOTP.objects.get(usuario=self.usuario)
        self.assertNotEqual(otp.codigo_hash, codigo)
        self.assertTrue(otp.coincide(codigo))

    def test_email_inexistente_responde_igual_y_no_envia_correo(self):
        respuesta = self.client.post(URL_SOLICITAR, {"email": "nadie@gmail.com"}, format="json")

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    @patch("usuarios.otp.send_mail", side_effect=Exception("Brevo no disponible"))
    def test_si_falla_el_envio_no_queda_codigo_guardado(self, _send_mail):
        respuesta = self.client.post(URL_SOLICITAR, {"email": "mozo.prueba@gmail.com"}, format="json")

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertFalse(CodigoOTP.objects.filter(usuario=self.usuario).exists())

    def test_no_reenvia_antes_del_tiempo_minimo(self):
        self._solicitar_codigo()
        self.client.post(URL_SOLICITAR, {"email": "mozo.prueba@gmail.com"}, format="json")

        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(CodigoOTP.objects.filter(usuario=self.usuario).count(), 1)

    def test_nuevo_codigo_invalida_el_anterior(self):
        self._solicitar_codigo()
        CodigoOTP.objects.update(creado_en=timezone.now() - timedelta(minutes=2))
        self._solicitar_codigo()

        self.assertEqual(CodigoOTP.objects.filter(usuario=self.usuario, usado=False).count(), 1)

    def test_verificar_codigo_correcto(self):
        codigo = self._solicitar_codigo()

        respuesta = self.client.post(
            URL_VERIFICAR, {"email": "mozo.prueba@gmail.com", "codigo": codigo}, format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)

    def test_verificar_codigo_incorrecto_suma_intento(self):
        codigo = self._solicitar_codigo()
        incorrecto = "000000" if codigo != "000000" else "111111"

        respuesta = self.client.post(
            URL_VERIFICAR, {"email": "mozo.prueba@gmail.com", "codigo": incorrecto}, format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("codigo", respuesta.data)
        self.assertEqual(CodigoOTP.objects.get(usuario=self.usuario).intentos, 1)

    def test_codigo_se_bloquea_tras_maximo_de_intentos(self):
        codigo = self._solicitar_codigo()
        CodigoOTP.objects.update(intentos=5)

        respuesta = self.client.post(
            URL_VERIFICAR, {"email": "mozo.prueba@gmail.com", "codigo": codigo}, format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_codigo_vencido_es_rechazado(self):
        codigo = self._solicitar_codigo()
        CodigoOTP.objects.update(expira_en=timezone.now() - timedelta(seconds=1))

        respuesta = self.client.post(
            URL_VERIFICAR, {"email": "mozo.prueba@gmail.com", "codigo": codigo}, format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirmar_cambia_password_y_consume_codigo(self):
        codigo = self._solicitar_codigo()

        respuesta = self.client.post(
            URL_CONFIRMAR,
            {"email": "mozo.prueba@gmail.com", "codigo": codigo, "new_password": "claveNueva456"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.usuario.refresh_from_db()
        self.assertTrue(self.usuario.check_password("claveNueva456"))
        self.assertTrue(CodigoOTP.objects.get(usuario=self.usuario).usado)

        login = self.client.post(
            URL_LOGIN, {"email": "Mozo.Prueba@gmail.com", "password": "claveNueva456"}, format="json"
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)

    def test_codigo_no_se_puede_reutilizar(self):
        codigo = self._solicitar_codigo()
        datos = {"email": "mozo.prueba@gmail.com", "codigo": codigo, "new_password": "claveNueva456"}
        self.client.post(URL_CONFIRMAR, datos, format="json")

        datos["new_password"] = "otraClave789"
        respuesta = self.client.post(URL_CONFIRMAR, datos, format="json")

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_confirmar_rechaza_password_debil(self):
        codigo = self._solicitar_codigo()

        respuesta = self.client.post(
            URL_CONFIRMAR,
            {"email": "mozo.prueba@gmail.com", "codigo": codigo, "new_password": "123"},
            format="json",
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("new_password", respuesta.data)
        self.assertFalse(CodigoOTP.objects.get(usuario=self.usuario).usado)

    def test_formato_de_codigo_invalido(self):
        respuesta = self.client.post(
            URL_VERIFICAR, {"email": "mozo.prueba@gmail.com", "codigo": "12ab"}, format="json"
        )

        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("codigo", respuesta.data)

