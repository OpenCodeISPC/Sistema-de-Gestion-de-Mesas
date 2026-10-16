from datetime import date

from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from mesas.models import Mesa
from pedidos.models import Pedido
from usuarios.models import Usuario

from auditoria.mongo import _obtener_cliente, listar_eventos, ping_db

from .models import CierreCaja, Pago

DB_TEST = 'sgmb_mongo_db_test'


@override_settings(MONGO_DB_NAME=DB_TEST)
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
        self.client.force_authenticate(user=self.usuario)
        if ping_db():
            _obtener_cliente().drop_database(DB_TEST)

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

    def test_crear_pago_registra_evento_de_auditoria(self):
        self.client.post('/api/pagos/', self.pago_data, format='json')

        eventos = listar_eventos(tipo='PAGO_REGISTRADO')
        self.assertEqual(len(eventos), 1)
        self.assertEqual(eventos[0]['actor'], 'cajero@test.com')
        self.assertEqual(eventos[0]['detalle'], 'Cobro de la mesa 1')
        self.assertEqual(eventos[0]['datos']['monto'], self.pago_data['monto'])


@override_settings(MONGO_DB_NAME=DB_TEST)
class CierreCajaApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.usuario = Usuario.objects.create(
            email='cajero@test.com',
            nombre='Mariano',
            apellido='Casarino',
            rol='CAJERO',
        )
        self.client.force_authenticate(user=self.usuario)
        if ping_db():
            _obtener_cliente().drop_database(DB_TEST)

        self.mesa = Mesa.objects.create(numero=1, capacidad=4, estado='OCUPADA')
        self.pedido = Pedido.objects.create(
            estado='CERRADO',
            total=1000,
            mesa=self.mesa,
            usuario=self.usuario,
        )

    def crear_pago(self, metodo_pago, monto):
        return Pago.objects.create(
            pedido=self.pedido,
            metodo_pago=metodo_pago,
            monto=monto,
        )

    def test_resumen_sin_pagos(self):
        response = self.client.get('/api/cierres/resumen/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['cerrado'])
        self.assertEqual(response.data['total_pagos'], 0)
        self.assertEqual(float(response.data['total_cobrado']), 0)

    def test_resumen_acumula_totales_por_metodo(self):
        self.crear_pago('EFECTIVO', 100)
        self.crear_pago('TARJETA', 200)
        self.crear_pago('TARJETA', 50)

        response = self.client.get('/api/cierres/resumen/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(float(response.data['monto_efectivo']), 100)
        self.assertEqual(float(response.data['monto_tarjeta']), 250)
        self.assertEqual(float(response.data['total_cobrado']), 350)
        self.assertEqual(response.data['total_pagos'], 3)

    def test_crear_cierre_calcula_totales_y_diferencia(self):
        self.crear_pago('EFECTIVO', 400)
        self.crear_pago('TRANSFERENCIA', 600)

        response = self.client.post(
            '/api/cierres/',
            {'total_rendido': 390},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(float(response.data['monto_efectivo']), 400)
        self.assertEqual(float(response.data['monto_transferencia']), 600)
        self.assertEqual(float(response.data['total_cobrado']), 1000)
        self.assertEqual(float(response.data['total_rendido']), 390)
        self.assertEqual(float(response.data['diferencia']), -10)

    def test_cierre_duplicado_mismo_dia_rechazado(self):
        self.crear_pago('EFECTIVO', 100)
        self.client.post('/api/cierres/', {'total_rendido': 100}, format='json')

        response = self.client.post(
            '/api/cierres/',
            {'total_rendido': 100},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(CierreCaja.objects.count(), 1)

    def test_resumen_muestra_cierre_cuando_ya_cerro(self):
        self.crear_pago('EFECTIVO', 100)
        self.client.post('/api/cierres/', {'total_rendido': 100}, format='json')

        response = self.client.get('/api/cierres/resumen/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['cerrado'])
        self.assertEqual(
            response.data['cierre']['fecha_cierre'],
            str(date.today()),
        )
        self.assertEqual(float(response.data['cierre']['total_cobrado']), 100)

    def test_no_se_puede_cobrar_con_caja_cerrada(self):
        self.crear_pago('EFECTIVO', 100)
        self.client.post('/api/cierres/', {'total_rendido': 100}, format='json')

        pedido_abierto = Pedido.objects.create(
            estado='LISTO',
            total=50000,
            mesa=self.mesa,
            usuario=self.usuario,
        )
        response = self.client.post(
            '/api/pagos/',
            {
                'pedido': pedido_abierto.id_pedido,
                'metodo_pago': 'EFECTIVO',
                'monto': 50000,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reabrir_elimina_cierre_y_vuelve_a_permitir_cobros(self):
        self.crear_pago('EFECTIVO', 100)
        self.client.post('/api/cierres/', {'total_rendido': 100}, format='json')

        response = self.client.post('/api/cierres/reabrir/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['reabierta'])
        self.assertEqual(CierreCaja.objects.count(), 0)

        resumen = self.client.get('/api/cierres/resumen/')
        self.assertFalse(resumen.data['cerrado'])

        pedido_abierto = Pedido.objects.create(
            estado='LISTO',
            total=60000,
            mesa=self.mesa,
            usuario=self.usuario,
        )
        response = self.client.post(
            '/api/pagos/',
            {
                'pedido': pedido_abierto.id_pedido,
                'metodo_pago': 'TARJETA',
                'monto': 60000,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_reabrir_sin_cierre_rechazado(self):
        response = self.client.post('/api/cierres/reabrir/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reabrir_registra_evento_de_auditoria(self):
        self.crear_pago('EFECTIVO', 100)
        self.client.post('/api/cierres/', {'total_rendido': 100}, format='json')

        self.client.post('/api/cierres/reabrir/')

        eventos = listar_eventos(tipo='CAJA_REABIERTA')
        self.assertEqual(len(eventos), 1)
        self.assertEqual(eventos[0]['actor'], 'cajero@test.com')

    def test_monto_rendido_negativo_rechazado(self):
        response = self.client.post(
            '/api/cierres/',
            {'total_rendido': -5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_crear_cierre_registra_evento_de_auditoria(self):
        self.crear_pago('EFECTIVO', 100)
        self.client.post('/api/cierres/', {'total_rendido': 100}, format='json')

        eventos = listar_eventos(tipo='CIERRE_CAJA')
        self.assertEqual(len(eventos), 1)
        self.assertEqual(eventos[0]['actor'], 'cajero@test.com')
        self.assertEqual(eventos[0]['datos']['total_cobrado'], 100)