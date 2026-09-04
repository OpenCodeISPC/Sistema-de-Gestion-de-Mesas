# Vinculamos las vistas con las consultas de angular(productoService)
from django.urls import path
from .views import ProductoListCreateAPIView, ProductoDetailAPIView

urlpatterns = [
    path("", ProductoListCreateAPIView.as_view(), name="producto-list-create"),
    path("<int:pk>/", ProductoDetailAPIView.as_view(), name="producto-detail"),
]
