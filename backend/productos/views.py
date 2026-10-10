from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.shortcuts import get_object_or_404
from .models import Producto
from .serializers import ProductoSerializer

from rest_framework.permissions import IsAuthenticated, IsAdminUser


class ProductoListCreateAPIView(APIView):
    
    """
    GET /api/productos/ ==> Lista todos los productos
    POST /api/productos/ ==> Crea un nvo producto (usa ICrearProductoDTO)
    """
    
    def get_permissions(self):
        #si es post exigimos q sea admin
        if self.request.method == 'POST':
            return [IsAdminUser()]
        #si es get q este autenticado
        return [IsAuthenticated()]

    def get(self, request):
        productos = Producto.objects.all()
        serializer = ProductoSerializer(productos, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProductoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProductoDetailAPIView(APIView):
    
    """
    GET /api/productos/<id>/    -> Obtiene un producto
    PUT /api/productos/<id>/    -> Actualizacion completa
    PATCH /api/productos/<id>/  -> Actualizacion parcial (usa IActualizarProductoDTO)
    DELETE /api/productos/<id>/ -> Elimina el producto
    """
    
    def get_permissions(self):
        #si modifica, elimina, exigimos q sea admin
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAdminUser()]
        #para consulta(get), usuario autenticado
        return [IsAuthenticated()]

    # Busca un producto por su ID y devuelve un error 404 si no existe.
    def get_object(self, pk):
        return get_object_or_404(Producto, pk=pk)

    def get(self, request, pk):
        producto = self.get_object(pk)
        serializer = ProductoSerializer(producto)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        producto = self.get_object(pk)
        serializer = ProductoSerializer(producto, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        producto = self.get_object(pk)
        serializer = ProductoSerializer(producto, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        producto = self.get_object(pk)
        producto.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
