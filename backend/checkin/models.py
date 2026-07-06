import uuid
from django.db import models


class Booking(models.Model):
    STATUS_PENDING = "pending"
    STATUS_COMPLETED = "completed"
    STATUS_MISSING = "missing_info"
    STATUS_EXPIRED = "expired"

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
    completed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # One registration slot per guest number per booking
        unique_together = [("booking", "guest_number")]
        ordering = ["guest_number"]

    def __str__(self):
        return f"Guest {self.guest_number}: {self.first_name} {self.last_name} (Booking: {self.booking_id})"


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
