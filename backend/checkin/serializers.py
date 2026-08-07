from django.conf import settings
from rest_framework import serializers
from .models import Booking, BookingRequest, GuestRegistration, MessageLog, ReviewRequest, WebhookConfig


class MessageLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageLog
        fields = ["id", "message_type", "recipient", "status", "sent_at"]


class GuestRegistrationSerializer(serializers.ModelSerializer):
    document_image_url = serializers.SerializerMethodField()

    class Meta:
        model = GuestRegistration
        fields = [
            "id", "guest_number",
            "first_name", "last_name", "gender",
            "date_of_birth", "place_of_birth",
            "nationality", "residence_address",
            "document_type", "document_number",
            "document_issue_date", "document_expiry_date",
            "document_image", "document_image_url",
            "signature", "gdpr_consent", "marketing_optin", "completed_at",
        ]
        extra_kwargs = {
            "document_image":    {"write_only": True, "required": False},
            "date_of_birth":     {"required": False, "allow_null": True},
            "nationality":       {"required": False, "allow_blank": True},
            "residence_address": {"required": False, "allow_blank": True},
            "document_number":   {"required": False, "allow_blank": True},
            "place_of_birth":    {"required": False, "allow_blank": True},
            "gender":            {"required": False, "allow_blank": True},
            "signature":         {"required": False, "allow_blank": True},
            "marketing_optin":   {"required": False},
        }

    def get_document_image_url(self, obj):
        if obj.document_image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.document_image.url)
        return None


class BookingSerializer(serializers.ModelSerializer):
    # Returns all guest registrations sorted by guest_number
    registrations = GuestRegistrationSerializer(many=True, read_only=True)
    messages = MessageLogSerializer(many=True, read_only=True)
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    checkin_link = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id", "hotel", "hotel_name", "booking_reference",
            "guest_name", "guest_email", "guest_phone",
            "check_in_date", "check_out_date", "num_guests",
            "status", "checkin_token", "checkin_link",
            "link_sent_at", "notes", "created_at",
            "registrations", "messages",
        ]
        read_only_fields = [
            "id", "hotel", "hotel_name",
            "checkin_token", "link_sent_at", "created_at",
        ]

    def get_checkin_link(self, obj):
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{frontend_url}/checkin/{obj.checkin_token}"

    def get_status(self, obj):
        # Use prefetched registrations when available (no extra query)
        try:
            reg_count = len(obj.registrations.all())
        except Exception:
            reg_count = obj.registrations.count()

        # Auto-correct stale "pending" when all guests have registered
        if obj.status == Booking.STATUS_PENDING and reg_count >= obj.num_guests:
            Booking.objects.filter(pk=obj.pk).update(status=Booking.STATUS_COMPLETED)
            return Booking.STATUS_COMPLETED

        # Auto-correct stale "completed" when registrations were deleted
        if obj.status == Booking.STATUS_COMPLETED and reg_count < obj.num_guests:
            Booking.objects.filter(pk=obj.pk).update(status=Booking.STATUS_PENDING)
            return Booking.STATUS_PENDING

        return obj.status


class BookingRequestSerializer(serializers.ModelSerializer):
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    checkin_link = serializers.SerializerMethodField()

    class Meta:
        model = BookingRequest
        fields = [
            "id", "hotel", "hotel_name",
            "guest_name", "guest_email", "guest_phone",
            "check_in_date", "check_out_date", "num_guests",
            "room_type", "message", "status", "hotel_notes",
            "booking", "invitation_sent_at", "checkin_link",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "hotel", "hotel_name", "booking", "invitation_sent_at", "created_at", "updated_at"]

    def get_checkin_link(self, obj):
        if not obj.booking_id:
            return None
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{frontend_url}/checkin/{obj.booking.checkin_token}"


class PublicBookingRequestSerializer(serializers.ModelSerializer):
    """Minimal fields accepted from an unauthenticated guest."""
    class Meta:
        model = BookingRequest
        fields = [
            "guest_name", "guest_email", "guest_phone",
            "check_in_date", "check_out_date", "num_guests",
            "room_type", "message",
        ]


class ReviewRequestSerializer(serializers.ModelSerializer):
    booking_reference = serializers.CharField(source="booking.booking_reference", read_only=True)
    guest_name = serializers.CharField(source="booking.guest_name", read_only=True)
    hotel_name = serializers.CharField(source="booking.hotel.name", read_only=True)
    check_in_date = serializers.DateField(source="booking.check_in_date", read_only=True)
    check_out_date = serializers.DateField(source="booking.check_out_date", read_only=True)
    review_link = serializers.SerializerMethodField()
    is_submitted = serializers.BooleanField(read_only=True)

    class Meta:
        model = ReviewRequest
        fields = [
            "id", "booking_reference", "guest_name", "hotel_name",
            "check_in_date", "check_out_date",
            "review_link", "sent_at",
            "rating", "comment", "submitted_at", "is_submitted",
            "google_review_url", "tripadvisor_url",
            "created_at",
        ]
        read_only_fields = ["id", "sent_at", "submitted_at", "created_at"]

    def get_review_link(self, obj):
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        return f"{frontend_url}/review/{obj.review_token}"


class PublicReviewSerializer(serializers.Serializer):
    """What the guest submits on the public review page."""
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(allow_blank=True, required=False)


class WebhookConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = WebhookConfig
        fields = ["id", "url", "event", "secret", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"secret": {"write_only": True, "required": False, "allow_blank": True}}


class PublicBookingSerializer(serializers.ModelSerializer):
    """Minimal booking info exposed to the guest — no internal IDs or tokens."""
    hotel_name = serializers.CharField(source="hotel.name", read_only=True)
    hotel_logo_url = serializers.SerializerMethodField()
    hotel_brand_color = serializers.CharField(source="hotel.brand_color", read_only=True)
    hotel_welcome_message = serializers.CharField(source="hotel.welcome_message", read_only=True)
    hotel_language = serializers.CharField(source="hotel.language_default", read_only=True)
    is_completed = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "guest_name", "check_in_date", "check_out_date",
            "num_guests", "hotel_name", "hotel_logo_url",
            "hotel_brand_color", "hotel_welcome_message", "hotel_language", "is_completed",
        ]

    def get_is_completed(self, obj):
        return obj.status == Booking.STATUS_COMPLETED

    def get_hotel_logo_url(self, obj):
        if not obj.hotel.logo:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.hotel.logo.url) if request else ""
