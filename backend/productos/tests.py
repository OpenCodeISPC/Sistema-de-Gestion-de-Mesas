'''
Instalar coverage dentro de docker
docker exec -it sgmb_backend pip install coverage
Ejecutar y generar reporte
docker exec -it sgmb_backend coverage run manage.py test
docker exec -it sgmb_backend coverage html
'''

from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from productos.models import Producto

User = get_user_model()

class ProductoAPITests(APITestCase):
    
    def setUp(self):
        # --- Arrange (Global para todos los tests) ---
        # 1. Crear usuarios de prueba con tu modelo personalizado
        self.admin_user = User.objects.create_superuser(email='admin@sgmb.com', password='password123')
        self.cajero_user = User.objects.create_user(email='cajero@sgmb.com', password='password123')
        
        # 2. Crear un registro de prueba ajustado a tu modelo Producto
        self.producto_existente = Producto.objects.create(
            nombre='Cerveza IPA',
            descripcion='Cerveza artesanal 500ml',
            precio=2500.00,
            stock=50,
            categoria='barra',
            disponibilidad=True
        )
        
        # 3. Definir URLs
        self.list_url = reverse('producto-list-create') 
        self.detail_url = reverse('producto-detail', kwargs={'pk': self.producto_existente.pk})

    # --- TESTS DE PERMISOS Y AUTENTICACIÓN (401 / 403) ---

    def test_01_listar_productos_anonimo_401(self):
        # Arrange: Usuario anónimo
        # Act
        response = self.client.get(self.list_url)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_02_crear_producto_sin_permisos_403(self):
        # Arrange: Cajero intenta crear producto
        self.client.force_authenticate(user=self.cajero_user)
        payload = {'nombre': 'Papas Fritas', 'precio': 1500.0, 'stock': 10, 'categoria': 'cocina'}
        # Act
        response = self.client.post(self.list_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # --- TESTS CASOS FELICES (200 / 201 / 204) ---

    def test_03_listar_productos_autenticado_200(self):
        # Arrange
        self.client.force_authenticate(user=self.cajero_user)
        # Act
        response = self.client.get(self.list_url)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_04_crear_producto_admin_201(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)
        payload = {'nombre': 'Hamburguesa Completa', 'precio': 4500.0, 'stock': 20, 'categoria': 'Plato Principal', 'disponibilidad': True}
        # Act
        response = self.client.post(self.list_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['nombre'], 'Hamburguesa Completa')

    def test_05_obtener_producto_detalle_200(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)
        # Act
        response = self.client.get(self.detail_url)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['nombre'], 'Cerveza IPA')

    def test_06_actualizar_producto_completo_200(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)
        payload = {'nombre': 'Cerveza IPA (Promo)', 'precio': 2000.0, 'stock': 50, 'categoria': 'barra', 'disponibilidad': True}
        # Act
        response = self.client.put(self.detail_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_07_actualizar_producto_parcial_200(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)
        payload = {'stock': 40}  # PATCH
        # Act
        response = self.client.patch(self.detail_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['stock'], 40)

    def test_08_eliminar_producto_admin_204(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)
        # Act
        response = self.client.delete(self.detail_url)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Producto.objects.count(), 0)

    # --- TESTS DE VALIDACIÓN DE SERIALIZERS (400) ---

    def test_09_crear_producto_precio_negativo_400(self):
        # Arrange: BUG-002
        self.client.force_authenticate(user=self.admin_user)
        payload = {'nombre': 'Gaseosa Cola', 'precio': -500.0, 'stock': 100, 'categoria': 'barra'}
        # Act
        response = self.client.post(self.list_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('precio', response.data)

    def test_10_crear_producto_stock_negativo_400(self):
        # Arrange: BUG-003
        self.client.force_authenticate(user=self.admin_user)
        payload = {'nombre': 'Gaseosa Naranja', 'precio': 1000.0, 'stock': -5, 'categoria': 'barra'}
        # Act
        response = self.client.post(self.list_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('stock', response.data)

    def test_11_crear_producto_faltan_datos_obligatorios_400(self):
        # Arrange: Falta nombre y categoria
        self.client.force_authenticate(user=self.admin_user)
        payload = {'precio': 1000.0} 
        # Act
        response = self.client.post(self.list_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # --- TESTS DE VERBOS HTTP NO PERMITIDOS (405) ---

    def test_12_metodo_no_permitido_put_en_lista_405(self):
        # Arrange
        self.client.force_authenticate(user=self.admin_user)
        payload = {'nombre': 'Intento Hack', 'precio': 1.0, 'stock': 1, 'categoria': 'barra'}
        # Act
        response = self.client.put(self.list_url, payload)
        # Assert
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)