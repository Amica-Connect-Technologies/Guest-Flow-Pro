from django.conf import settings
from rest_framework import serializers
from .models import Booking, GuestRegistration, MessageLog


class MessageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageLog
        fields = ["id", "message_type", "recipient", "status", "sent_at"]


class GuestRegistrationSerializer(serializers.ModelSerializer):
    document_image_url = serializers.SerializerMethodField()

    class Meta:
        model = GuestRegistration
        fields = [
            "id", "first_name", "last_name", "date_of_birth", "place_of_birth",
            "nationality", "residence_address", "document_type", "document_number",
            "document_issue_date", "document_expiry_date",
            "document_image", "document_image_url",
            "signature", "gdpr_consent", "completed_at",
        ]
        extra_kwargs = {"document_image": {"write_only": True, "required": False}}

    def get_document_image_url(self, obj):
        if obj.document_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.document_image.url)
        return None


class BookingSerializer(serializers.ModelSerializer):
    registration = GuestRegistrationSerializer(read_only=True)
    messages = MessageLogSerializer(many=True, read_only=True)
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    checkin_link = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "hotel", "hotel_name", "booking_reference",
            "guest_name", "guest_email", "guest_phone",
            "check_in_date", "check_out_date", "num_guests",
            "status", "checkin_token", "checkin_link",
            "link_sent_at", "notes", "created_at",
            "registration", "messages",
        ]
        read_only_fields = [
            "id", "hotel", "hotel_name", "status",
            "checkin_token", "link_sent_at", "created_at",
        ]

    def get_checkin_link(self, obj):
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{frontend_url}/checkin/{obj.checkin_token}"


class PublicBookingSerializer(serializers.ModelSerializer):
    """Minimal booking info exposed to the guest — no internal IDs or tokens."""
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "guest_name", "check_in_date", "check_out_date",
            "num_guests", "hotel_name", "is_completed",
        ]

    def get_is_completed(self, obj):
        return obj.status == Booking.STATUS_COMPLETED
