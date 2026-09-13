from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import PagoViewSet

router = DefaultRouter()
router.register(r'pagos', PagoViewSet, basename='pago')

urlpatterns = [
    path('', include(router.urls)),
]