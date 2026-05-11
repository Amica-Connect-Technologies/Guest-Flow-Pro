from django.contrib import admin
from .models import Registration


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ["business_name", "email", "plan", "status", "created_at"]
    list_filter = ["status", "plan"]
    search_fields = ["business_name", "email", "owner_name"]
    readonly_fields = ["id", "stripe_session_id", "stripe_customer_id", "stripe_subscription_id", "created_at"]
