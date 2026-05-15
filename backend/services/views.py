from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from concierge.auth import SilentJWTAuthentication
from hotels.models import Hotel
from accounts.models import HotelUser
from .models import HotelService, ServiceBooking
from .serializers import HotelServiceSerializer, ServiceBookingSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    serializer_class = HotelServiceSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # Always attempt JWT but never block on failure – guests without a token
    # become AnonymousUser (handled in get_queryset), managers get authenticated.
    authentication_classes = [SilentJWTAuthentication]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        hotel_id = self.request.query_params.get("hotel_id")
        if hotel_id:
            return HotelService.objects.filter(hotel_id=hotel_id, is_available=True)

        if getattr(self.request, "user", None) and self.request.user.is_authenticated:
            if self.request.user.is_staff:
                return HotelService.objects.all()
            try:
                hu = HotelUser.objects.get(user=self.request.user)
                return HotelService.objects.filter(hotel=hu.hotel)
            except HotelUser.DoesNotExist:
                pass

        return HotelService.objects.none()

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    def perform_create(self, serializer):
        if self.request.user.is_staff:
            hotel_id = self.request.data.get("hotel_id")
            hotel = Hotel.objects.get(id=hotel_id)
        else:
            hu = HotelUser.objects.get(user=self.request.user)
            hotel = hu.hotel
        serializer.save(hotel=hotel)


class BookingCreateView(APIView):
    """Public endpoint – guests place service bookings."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        service_id = request.data.get("service_id")
        try:
            service = HotelService.objects.select_related("hotel").get(
                id=service_id, is_available=True
            )
        except HotelService.DoesNotExist:
            return Response({"detail": "Service not found."}, status=status.HTTP_404_NOT_FOUND)

        qty = max(1, int(request.data.get("quantity", 1)))
        total = service.price * qty

        booking = ServiceBooking.objects.create(
            hotel=service.hotel,
            service=service,
            guest_name=request.data.get("guest_name", "").strip(),
            guest_phone=request.data.get("guest_phone", "").strip(),
            guest_room=request.data.get("guest_room", "").strip(),
            quantity=qty,
            notes=request.data.get("notes", "").strip(),
            payment_method=request.data.get("payment_method", "cod"),
            total_price=total,
        )
        return Response(ServiceBookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingListView(APIView):
    """Hotel manager sees their hotel's bookings."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.is_staff:
            qs = ServiceBooking.objects.select_related("service", "hotel").all()
        else:
            try:
                hu = HotelUser.objects.get(user=request.user)
                qs = ServiceBooking.objects.filter(hotel=hu.hotel).select_related("service")
            except HotelUser.DoesNotExist:
                return Response([])

        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response(ServiceBookingSerializer(qs, many=True).data)


class BookingUpdateView(APIView):
    """Hotel manager updates booking status / payment status."""
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        try:
            booking = ServiceBooking.objects.select_related("hotel").get(id=pk)
        except ServiceBooking.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_staff:
            try:
                hu = HotelUser.objects.get(user=request.user)
                if booking.hotel != hu.hotel:
                    return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            except HotelUser.DoesNotExist:
                return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        for field in ("status", "payment_status"):
            if field in request.data:
                setattr(booking, field, request.data[field])
        booking.save()
        return Response(ServiceBookingSerializer(booking).data)
