"""
API Key authentication for GuestFlow Pro external integrations.
Usage: Authorization: Bearer gfp_xxxxx
       or X-API-Key: gfp_xxxxx
"""
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class APIKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        raw = None

        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer gfp_"):
            raw = auth_header[len("Bearer "):]
        elif "X-API-Key" in request.headers:
            raw = request.headers["X-API-Key"]

        if not raw:
            return None  # let the next authenticator try

        from .models import APIKey
        key_obj = APIKey.authenticate(raw)
        if not key_obj:
            raise AuthenticationFailed("Invalid or inactive API key.")

        # Return a minimal user-like object so views can check permissions
        return (_APIKeyUser(key_obj), key_obj)

    def authenticate_header(self, request):
        return 'Bearer realm="GuestFlow Pro API"'


class _APIKeyUser:
    """Minimal principal used when auth comes from an API key (not a Django User)."""
    def __init__(self, api_key):
        self.api_key = api_key
        self.hotel = api_key.hotel
        self.is_authenticated = True
        self.is_staff = False
        self.is_superuser = False

    def __str__(self):
        return f"APIKey:{self.api_key.name}@{self.hotel.name}"
