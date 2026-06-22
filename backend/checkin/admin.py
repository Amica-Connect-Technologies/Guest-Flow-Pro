from django.contrib import admin
from .models import Booking, GuestRegistration, MessageLog


class GuestRegistrationInline(admin.StackedInline):
    model = GuestRegistration
    extra = 0
    readonly_fields = ["completed_at"]


class MessageLogInline(admin.TabularInline):
    model = MessageLog
    extra = 0
    readonly_fields = ["sent_at"]


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        "guest_name", "hotel", "check_in_date", "check_out_date",
        "num_guests", "status", "link_sent_at", "created_at",
    ]
    list_filter = ["status", "hotel", "check_in_date"]
    search_fields = ["guest_name", "guest_email", "booking_reference"]
    readonly_fields = ["id", "checkin_token", "created_at"]
    inlines = [GuestRegistrationInline, MessageLogInline]


@admin.register(GuestRegistration)
class GuestRegistrationAdmin(admin.ModelAdmin):
    list_display = ["first_name", "last_name", "nationality", "document_type", "completed_at"]
    search_fields = ["first_name", "last_name", "document_number"]
    readonly_fields = ["id", "completed_at"]


@admin.register(MessageLog)
class MessageLogAdmin(admin.ModelAdmin):
    list_display = ["booking", "message_type", "recipient", "status", "sent_at"]
    list_filter = ["status", "message_type"]
    readonly_fields = ["id", "sent_at"]
