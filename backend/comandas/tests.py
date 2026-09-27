from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from usuarios.models import Usuario
from pedidos.models import Pedido


class ComandaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = Usuario.objects.create(
            email='mozo@test.com',
            nombre='Juan',
            apellido='Test',
            rol='MOZO',
        )
        self.client.force_authenticate(user=self.usuario)

    def test_obtener_comandas(self):
        response = self.client.get('/api/comandas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)