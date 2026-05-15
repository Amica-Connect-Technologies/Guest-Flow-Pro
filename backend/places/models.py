import uuid
from django.db import models


class Place(models.Model):
    TYPE_CHOICES = [
        ("restaurant", "Restaurant"),
        ("museum", "Museum"),
        ("cafe", "Cafe"),
        ("attraction", "Attraction"),
        ("shop", "Shop"),
        ("parking", "Parking"),
        ("nightlife", "Night Life"),
        ("other", "Other"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city = models.CharField(max_length=100)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="other")
    description = models.TextField(blank=True)
    address = models.CharField(max_length=300, blank=True)
    google_maps_link = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.city})"
