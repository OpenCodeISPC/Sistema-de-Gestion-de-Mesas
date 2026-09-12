from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from .models import Comanda


class ComandaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.comanda = Comanda.objects.create(
            numero_mesa=1,
            estado='PENDIENTE'
        )

    def test_obtener_comandas(self):
        response = self.client.get('/api/comandas/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_actualizar_estado(self):
        response = self.client.patch(
            f'/api/comandas/{self.comanda.id}/',
            {'estado': 'EN_PREPARACION'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.comanda.refresh_from_db()
        self.assertEqual(self.comanda.estado, 'EN_PREPARACION')