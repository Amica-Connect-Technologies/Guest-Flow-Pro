from rest_framework_simplejwt.authentication import JWTAuthentication


class SilentJWTAuthentication(JWTAuthentication):
    """JWT auth that never raises — missing or invalid tokens yield AnonymousUser."""
    def authenticate(self, request):
        try:
            return super().authenticate(request)
        except Exception:
            return None
