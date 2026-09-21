from django.contrib import admin
from django.urls import include, path


urlpatterns = [
    # ADMIN
    path("admin/", admin.site.urls),
    
    # APP Django
    path("api/", include('pedidos.urls')),
    path('api/', include('mesas.urls')),
    path('api/productos/', include('productos.urls')),
    path('api/', include('comandas.urls')),
    path('api/', include('caja.urls')),
    path('api/', include('auditoria.urls')),

    # AUTENTICACIÓN Y USUARIOS (JWT, Google OAuth, Registro y Recupero)
    path("api/auth/", include("usuarios.urls")),
]
