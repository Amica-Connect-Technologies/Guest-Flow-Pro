from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from hotels.models import Hotel
from hotels.serializers import HotelSerializer
from .models import HotelUser
from .serializers import LoginSerializer


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
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        from tours.models import Tour
        from places.models import Place
        return Response({
            "hotels": Hotel.objects.count(),
            "tours": Tour.objects.count(),
            "places": Place.objects.count(),
        })
