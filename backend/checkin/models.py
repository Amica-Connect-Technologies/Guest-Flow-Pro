import uuid
from datetime import timedelta
from django.db import models
from django.utils import timezone


class Booking(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_MISSING = "missing_info"
    STATUS_EXPIRED = "expired"

    # How long the public check-in link stays valid after checkout, so a
    # link can't be used indefinitely once a guest has left the hotel.
    LINK_GRACE_DAYS = 2

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_MISSING, "Missing Info"),
        (STATUS_EXPIRED, "Expired"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(
        "hotels.Hotel", on_delete=models.CASCADE, related_name="checkin_bookings"
    )
    booking_reference = models.CharField(max_length=100, blank=True)
    guest_name = models.CharField(max_length=200)
    guest_email = models.EmailField(blank=True)
    guest_phone = models.CharField(max_length=30, blank=True)
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    num_guests = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    checkin_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    link_sent_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["check_in_date", "created_at"]

    def __str__(self):
        return f"{self.guest_name} – {self.check_in_date} ({self.hotel.name})"

    @property
    def is_expired(self) -> bool:
        """True once the check-in link has passed its checkout + grace window."""
        cutoff = self.check_out_date + timedelta(days=self.LINK_GRACE_DAYS)
        return timezone.localdate() > cutoff


class GuestRegistration(models.Model):
    DOCUMENT_CHOICES = [
        ("passport", "Passport"),
        ("id_card", "ID Card"),
        ("driving_license", "Driving License"),
        ("residence_permit", "Residence Permit"),
    ]

    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
        ("prefer_not_to_say", "Prefer not to say"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # ForeignKey (not OneToOneField) so multiple guests can register per booking
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="registrations"
    )
    guest_number = models.PositiveIntegerField(default=1)  # 1 = primary, 2, 3, …
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=30, choices=GENDER_CHOICES, blank=True)
    # Required for primary guest (guest_number=1), optional for additional guests
    date_of_birth = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=200, blank=True)
    nationality = models.CharField(max_length=100, blank=True)
    residence_address = models.TextField(blank=True)
    document_type = models.CharField(max_length=30, choices=DOCUMENT_CHOICES)
    document_number = models.CharField(max_length=100, blank=True)
    document_issue_date = models.DateField()
    document_expiry_date = models.DateField()
    document_image = models.FileField(
        upload_to="checkin-documents/%Y/%m/", null=True, blank=True
    )
    signature = models.TextField(blank=True)
    gdpr_consent = models.BooleanField(default=False)
    marketing_optin = models.BooleanField(default=False)
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One registration slot per guest number per booking
        unique_together = [("booking", "guest_number")]
        ordering = ["guest_number"]

    def __str__(self):
        return f"Guest {self.guest_number}: {self.first_name} {self.last_name} (Booking: {self.booking_id})"


class BookingRequest(models.Model):
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_DECLINED = "declined"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_DECLINED, "Declined"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(
        "hotels.Hotel", on_delete=models.CASCADE, related_name="booking_requests"
    )
    guest_name = models.CharField(max_length=200)
    guest_email = models.EmailField(blank=True)
    guest_phone = models.CharField(max_length=30, blank=True)
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    num_guests = models.PositiveIntegerField(default=1)
    room_type = models.CharField(max_length=100, blank=True)
    message = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    hotel_notes = models.TextField(blank=True)
    booking = models.OneToOneField(
        "Booking", on_delete=models.SET_NULL, null=True, blank=True, related_name="source_request"
    )
    invitation_sent_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.guest_name} – {self.check_in_date} ({self.hotel.name}) [{self.status}]"


class ReviewRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name="review_request"
    )
    review_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    # Guest response
    rating = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-5
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    # Platform links (hotel fills in after review is submitted)
    google_review_url = models.URLField(blank=True)
    tripadvisor_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def is_submitted(self):
        return self.submitted_at is not None

    def __str__(self):
        return f"Review for {self.booking} – rating: {self.rating}"


class WebhookConfig(models.Model):
    """Per-hotel webhook endpoint for n8n / Zapier / custom integrations."""
    EVENT_CHOICES = [
        ("guest_registered",   "Guest Registered"),
        ("booking_created",    "Booking Created"),
        ("review_submitted",   "Review Submitted"),
        ("booking_request",    "Booking Request Submitted"),
        ("all",                "All Events"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(
        "hotels.Hotel", on_delete=models.CASCADE, related_name="webhooks"
    )
    url = models.URLField(max_length=500)
    event = models.CharField(max_length=40, choices=EVENT_CHOICES, default="all")
    secret = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.hotel.name} → {self.url} [{self.event}]"


class MessageLog(models.Model):
    TYPE_CHOICES = [("email", "Email"), ("whatsapp", "WhatsApp")]
    STATUS_CHOICES = [("sent", "Sent"), ("failed", "Failed")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name="messages"
    )
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="email")
    recipient = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-sent_at"]
