from django.test import SimpleTestCase, override_settings

from .mongo import _obtener_cliente, listar_eventos, ping_db, registrar_evento

DB_TEST = 'sgmb_mongo_db_test'


@override_settings(MONGO_DB_NAME=DB_TEST)
class AuditoriaMongoTests(SimpleTestCase):
    def setUp(self):
        if not ping_db():
            self.skipTest('MongoDB no está disponible')

    def tearDown(self):
        try:
            _obtener_cliente().drop_database(DB_TEST)
        except Exception:
            pass

    def test_ping_db(self):
        self.assertTrue(ping_db())

    def test_registrar_y_listar_evento(self):
        fecha = registrar_evento(
            tipo='PAGO_REGISTRADO',
            actor='cajero@test.com',
            detalle='Cobro de la mesa 1',
            datos={'monto': 116600, 'metodo_pago': 'EFECTIVO'},
        )
        self.assertIsNotNone(fecha)

        eventos = listar_eventos(tipo='PAGO_REGISTRADO')
        self.assertEqual(len(eventos), 1)
        evento = eventos[0]
        self.assertEqual(evento['actor'], 'cajero@test.com')
        self.assertEqual(evento['datos']['monto'], 116600)
        self.assertIsInstance(evento['_id'], str)

    def test_listar_eventos_sin_registros(self):
        self.assertEqual(listar_eventos(), [])