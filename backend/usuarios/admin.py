from django.contrib import admin

from .models import CodigoOTP


@admin.register(CodigoOTP)
class CodigoOTPAdmin(admin.ModelAdmin):
    list_display = ("usuario", "creado_en", "expira_en", "intentos", "usado")
    list_filter = ("usado",)
    search_fields = ("usuario__email",)
    readonly_fields = ("codigo_hash", "creado_en")
