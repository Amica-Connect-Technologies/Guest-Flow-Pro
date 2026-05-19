import uuid
from django.db import models
from hotels.models import Hotel


class HotelService(models.Model):
    CATEGORY_CHOICES = [
        ("food",         "Food & Drinks"),
        ("room",         "Room Service"),
        ("breakfast",    "Breakfast"),
        ("bar",          "Bar & Drinks"),
        ("nightlife",    "Night Life"),
        ("massage",      "Massage & Wellness"),
        ("spa",          "Spa & Beauty"),
        ("gym",          "Gym & Fitness"),
        ("transport",    "Transport"),
        ("laundry",      "Laundry"),
        ("housekeeping", "Housekeeping"),
        ("concierge",    "Concierge"),
        ("business",     "Business Services"),
        ("other",        "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="services")
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to="services/", blank=True, null=True)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category", "name"]

    def __str__(self):
        return f"{self.hotel.name} – {self.name}"


class ServiceBooking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]
    PAYMENT_METHOD_CHOICES = [
        ("cod", "Cash on Delivery"),
        ("bank_transfer", "Bank Transfer"),
        ("stripe", "Stripe"),
    ]
    PAYMENT_STATUS_CHOICES = [
        ("pending", "Pending"),
        ("paid", "Paid"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="service_bookings")
    service = models.ForeignKey(HotelService, on_delete=models.CASCADE, related_name="bookings")
    guest_name = models.CharField(max_length=200)
    guest_phone = models.CharField(max_length=30, blank=True)
    guest_room = models.CharField(max_length=50, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="cod")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.guest_name} – {self.service.name} ({self.status})"
