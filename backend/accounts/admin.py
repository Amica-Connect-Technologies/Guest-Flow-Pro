from django.contrib import admin
from .models import HotelUser

@admin.register(HotelUser)
class HotelUserAdmin(admin.ModelAdmin):
    list_display = ("user", "hotel", "role")
    list_filter = ("role",)
