from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from hotels.models import Hotel
from hotels.serializers import HotelSerializer
from .models import HotelUser
from .serializers import LoginSerializer


def _user_to_dict(u):
    hotel_user = HotelUser.objects.filter(user=u).select_related("hotel").first()
    if u.is_superuser:
        role = "superuser"
    elif u.is_staff:
        role = "admin"
    elif hotel_user:
        role = hotel_user.role
    else:
        role = "manager"
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "role": role,
        "hotel_name": hotel_user.hotel.name if hotel_user and hotel_user.hotel else None,
        "hotel_id": str(hotel_user.hotel.id) if hotel_user and hotel_user.hotel else None,
        "is_active": u.is_active,
        "date_joined": u.date_joined.isoformat(),
        "last_login": u.last_login.isoformat() if u.last_login else None,
    }


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh = request.data.get("refresh")
            if refresh:
                token = RefreshToken(refresh)
                token.blacklist()
        except Exception:
            pass
        return Response({"detail": "Logged out."})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        hotel_user = HotelUser.objects.filter(user=user).select_related("hotel").first()

        if hotel_user:
            role = hotel_user.role
            hotel_id = str(hotel_user.hotel.id) if hotel_user.hotel else None
        else:
            role = "admin" if user.is_staff else "manager"
            hotel_id = None

        return Response({
            "id": user.id,
            "email": user.email,
            "role": role,
            "hotel_id": hotel_id,
        })


class AdminStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            raise PermissionDenied()
        from tours.models import Tour
        from places.models import Place
        return Response({
            "hotels": Hotel.objects.count(),
            "tours": Tour.objects.count(),
            "places": Place.objects.count(),
        })


class AdminUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            raise PermissionDenied()
        users = User.objects.all().order_by("-date_joined")
        return Response([_user_to_dict(u) for u in users])

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied()
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "").strip()
        role = request.data.get("role", "manager")
        if not email or not password:
            return Response({"error": "Email and password are required."}, status=400)
        if User.objects.filter(email=email).exists():
            return Response({"error": "A user with this email already exists."}, status=400)

        base = email.split("@")[0]
        username, n = base, 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{n}"; n += 1

        if role == "superuser":
            u = User.objects.create_superuser(username=username, email=email, password=password)
        elif role == "admin":
            u = User.objects.create_user(username=username, email=email, password=password, is_staff=True)
        else:
            u = User.objects.create_user(username=username, email=email, password=password)
            HotelUser.objects.create(user=u, role=role)
        return Response(_user_to_dict(u), status=201)


class AdminUserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        if not request.user.is_staff:
            raise PermissionDenied()
        try:
            u = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        if u == request.user:
            return Response({"error": "Cannot edit your own account."}, status=400)
        role = request.data.get("role")
        if role == "superuser":
            u.is_superuser = True; u.is_staff = True
        elif role == "admin":
            u.is_superuser = False; u.is_staff = True
            HotelUser.objects.filter(user=u).delete()
        elif role in ("manager", "hotel_admin"):
            u.is_superuser = False; u.is_staff = False
            hu, _ = HotelUser.objects.get_or_create(user=u, defaults={"role": role})
            if _ is False:
                hu.role = role; hu.save()
        u.save()
        return Response(_user_to_dict(u))

    def delete(self, request, user_id):
        if not request.user.is_staff:
            raise PermissionDenied()
        try:
            u = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)
        if u == request.user:
            return Response({"error": "Cannot delete your own account."}, status=400)
        u.delete()
        return Response(status=204)
