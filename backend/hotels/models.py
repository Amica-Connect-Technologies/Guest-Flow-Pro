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

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.city})"
