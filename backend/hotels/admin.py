from django.contrib import admin
from .models import APIKey, Hotel, HotelOutreach


@admin.register(Hotel)
class HotelAdmin(admin.ModelAdmin):
    list_display = ("name", "city", "plan", "plan_expires_at", "language_default", "created_at")
    search_fields = ("name", "city")
    list_filter = ("language_default", "plan")
    readonly_fields = ("id", "created_at")
    fieldsets = (
        ("Hotel Info", {
            "fields": ("id", "name", "city", "language_default", "logo", "created_at"),
        }),
        ("Subscription Plan", {
            "fields": ("plan", "plan_expires_at"),
            "description": "Change plan here to grant/restrict feature access immediately.",
        }),
        ("Profile", {
            "fields": (
                "description", "address", "phone", "email",
                "check_in_time", "check_out_time", "wifi_info",
                "amenities", "is_24_7", "open_time", "close_time",
            ),
        }),
        ("Branding", {
            "fields": ("brand_color", "welcome_message", "google_review_url", "tripadvisor_url", "whatsapp_number"),
        }),
    )


@admin.register(HotelOutreach)
class HotelOutreachAdmin(admin.ModelAdmin):
    list_display = ("hotel_name", "contact_name", "email", "city", "status", "invite_sent_at", "updated_at")
    list_filter = ("status",)
    search_fields = ("hotel_name", "email", "city")


@admin.register(APIKey)
class APIKeyAdmin(admin.ModelAdmin):
    list_display = ("hotel", "name", "key_prefix", "is_active", "last_used_at", "created_at")
    list_filter = ("is_active",)
    search_fields = ("hotel__name", "name", "key_prefix")
    readonly_fields = ("id", "key_prefix", "key_hash", "created_at")
