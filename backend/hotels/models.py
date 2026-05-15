import uuid
from django.db import models


class Hotel(models.Model):
    LANGUAGE_CHOICES = [("en", "English"), ("it", "Italian"), ("fr", "French"), ("de", "German"), ("es", "Spanish")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    whatsapp_number = models.CharField(max_length=30, blank=True)
    language_default = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    logo = models.ImageField(upload_to="hotel-logos/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Extended profile fields
    description   = models.TextField(blank=True)
    address       = models.CharField(max_length=300, blank=True)
    phone         = models.CharField(max_length=30, blank=True)
    email         = models.EmailField(blank=True)
    check_in_time  = models.CharField(max_length=10, blank=True, default="14:00")
    check_out_time = models.CharField(max_length=10, blank=True, default="11:00")
    wifi_info     = models.CharField(max_length=100, blank=True)
    amenities     = models.JSONField(default=list, blank=True)
    is_24_7       = models.BooleanField(default=False)
    open_time     = models.CharField(max_length=10, blank=True, default="09:00")
    close_time    = models.CharField(max_length=10, blank=True, default="22:00")

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.city})"
