from django.contrib import admin
from .models import Hotel

@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "language_default", "created_at")
    search_fields = ("name", "city")
    list_filter = ("language_default",)
