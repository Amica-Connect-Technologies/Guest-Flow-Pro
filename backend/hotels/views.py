from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from accounts.models import HotelUser
from .models import Hotel
from .serializers import HotelSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx


class HotelProfileView(APIView):
    """Hotel manager reads/updates their own hotel profile."""
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_hotel(self, user):
        if user.is_staff:
            return None  # admins use the admin panel
        try:
            hu = HotelUser.objects.get(user=user)
            return hu.hotel
        except HotelUser.DoesNotExist:
            return None

    def get(self, request):
        hotel = self._get_hotel(request.user)
        if not hotel:
            return Response({"detail": "No hotel linked."}, status=status.HTTP_404_NOT_FOUND)
        return Response(HotelSerializer(hotel, context={"request": request}).data)

    def patch(self, request):
        hotel = self._get_hotel(request.user)
        if not hotel:
            return Response({"detail": "No hotel linked."}, status=status.HTTP_404_NOT_FOUND)
        serializer = HotelSerializer(hotel, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
