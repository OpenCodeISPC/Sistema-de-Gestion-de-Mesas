from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CierreCajaViewSet, PagoViewSet

router = DefaultRouter()
router.register(r'pagos', PagoViewSet, basename='pago')
router.register(r'cierres', CierreCajaViewSet, basename='cierre')

urlpatterns = [
    path('', include(router.urls)),
]