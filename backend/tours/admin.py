from django.contrib import admin
from .models import Tour

@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = ("title", "city", "provider", "price", "created_at")
    search_fields = ("title", "city")
    list_filter = ("provider", "city")
