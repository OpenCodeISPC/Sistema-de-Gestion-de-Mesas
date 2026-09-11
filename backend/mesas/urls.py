from django.urls import path
from .views import MesaListCreateAPIView, MesaDetailAPIView

urlpatterns = [
    path("mesas/", MesaListCreateAPIView.as_view(), name="mesa-list-create"),
    path("mesas/<int:pk>/", MesaDetailAPIView.as_view(), name="mesa-detail"),
]
