from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from mesas.models import Mesa
from pedidos.models import Pedido
from usuarios.models import Usuario

from .models import Pago


class PagoApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.mesa = Mesa.objects.create(numero=1, capacidad=4, estado='OCUPADA')
        self.usuario = Usuario.objects.create(
            email='cajero@test.com',
            nombre='Mariano',
            apellido='Casarino',
            rol='CAJERO',
        )
        self.pedido = Pedido.objects.create(
            estado='LISTO',
            total=108000,
            mesa=self.mesa,
            usuario=self.usuario,
        )
        self.pago_data = {
            'pedido': self.pedido.id_pedido,
            'metodo_pago': 'EFECTIVO',
            'monto': 118800,
            'propina': 10800,
            'importe_recibido': 120000,
        }

    def test_crear_pago_cierra_pedido_y_libera_mesa(self):
        response = self.client.post('/api/pagos/', self.pago_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.pedido.refresh_from_db()
        self.assertEqual(self.pedido.estado, 'CERRADO')

        self.mesa.refresh_from_db()
        self.assertEqual(self.mesa.estado, 'LIBRE')

    def test_crear_pago_no_libera_mesa_con_otro_pedido_abierto(self):
        Pedido.objects.create(
            estado='PREPARACION',
            total=50000,
            mesa=self.mesa,
            usuario=self.usuario,
        )

        response = self.client.post('/api/pagos/', self.pago_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.mesa.refresh_from_db()
        self.assertEqual(self.mesa.estado, 'OCUPADA')

    def test_monto_invalido(self):
        response = self.client.post(
            '/api/pagos/',
            {**self.pago_data, 'monto': 0},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_listar_pagos(self):
        Pago.objects.create(
            pedido=self.pedido,
            metodo_pago='EFECTIVO',
            monto=118800,
        )
        response = self.client.get('/api/pagos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_filtrar_pagos_por_metodo(self):
        Pago.objects.create(
            pedido=self.pedido,
            metodo_pago='EFECTIVO',
            monto=100,
        )
        response = self.client.get('/api/pagos/?metodo_pago=TARJETA')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)