from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from .models import HotelUser


class LoginSerializer(TokenObtainPairSerializer):
    """Accept email + password instead of username + password."""

    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop("username", None)

    def validate(self, attrs):
        email = attrs.get("email", "").strip().lower()
        password = attrs.get("password", "")

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("No account found with this email.")

        # Check password before checking is_active so the error is specific
        if not user.check_password(password):
            raise AuthenticationFailed("Incorrect password.")

        # Account exists but not yet approved by admin
        if not user.is_active:
            raise AuthenticationFailed(
                "pending_approval:Your account is awaiting admin approval. "
                "You'll receive an email once your registration is reviewed."
            )

        # Inject username so the parent validate() can authenticate
        attrs["username"] = user.username
        data = super().validate(attrs)

        hotel_user = HotelUser.objects.filter(user=self.user).select_related("hotel").first()
        if hotel_user:
            role = hotel_user.role
            hotel_id = str(hotel_user.hotel.id) if hotel_user.hotel else None
        else:
            role = "admin" if self.user.is_staff else "manager"
            hotel_id = None

        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "role": role,
            "hotel_id": hotel_id,
        }
        return data
