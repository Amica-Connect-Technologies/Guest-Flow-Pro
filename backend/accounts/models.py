from django.db import models
from django.contrib.auth.models import User


class HotelUser(models.Model):
    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("manager", "Hotel Manager"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="hotel_user")
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="manager")

    def __str__(self):
        return f"{self.user.email} ({self.role})"
