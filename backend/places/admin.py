from django.contrib import admin
from .models import Place

@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "type", "created_at")
    search_fields = ("name", "city")
    list_filter = ("type", "city")
