from django.contrib import admin
from .models import Comanda


@admin.register(Comanda)
class ComandaAdmin(admin.ModelAdmin):
    list_display = ('id', 'numero_mesa', 'cliente', 'estado', 'creado_en')
    list_filter = ('estado', 'creado_en')
    search_fields = ('numero_mesa', 'cliente')