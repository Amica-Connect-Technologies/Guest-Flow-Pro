import uuid
from django.db import models


class Tour(models.Model):
    PROVIDER_CHOICES = [("GYG", "GetYourGuide"), ("Viator", "Viator")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    city = models.CharField(max_length=100)
    title = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="tour-images/", blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default="GYG")
    affiliate_link = models.URLField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.city})"
