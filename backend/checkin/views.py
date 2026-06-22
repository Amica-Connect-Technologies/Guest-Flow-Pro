import csv
import io
from datetime import date, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import HotelUser
from .models import Booking, GuestRegistration, MessageLog
from .serializers import (
    BookingSerializer,
    GuestRegistrationSerializer,
    PublicBookingSerializer,
)


def _hotel_for(user):
    """Return hotel linked to this user, or None for admin/staff users."""
    if user.is_staff:
        return None
    try:
        return HotelUser.objects.get(user=user).hotel
    except HotelUser.DoesNotExist:
        return None


def _booking_qs(user):
    hotel = _hotel_for(user)
    qs = Booking.objects.select_related("hotel", "registration").all()
    if hotel:
        qs = qs.filter(hotel=hotel)
    return qs


# ── Authenticated (hotel / admin) views ───────────────────────────────────────

class BookingListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        qs = _booking_qs(request.user)

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        date_filter = request.query_params.get("filter")
        today = date.today()
        if date_filter == "today":
            qs = qs.filter(check_in_date=today)
        elif date_filter == "tomorrow":
            qs = qs.filter(check_in_date=today + timedelta(days=1))

        return Response(
            BookingSerializer(qs, many=True, context={"request": request}).data
        )

    def post(self, request):
        hotel = _hotel_for(request.user)
        if not hotel:
            return Response(
                {"detail": "Use a hotel account to create bookings."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = BookingSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(hotel=hotel)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, pk, user):
        hotel = _hotel_for(user)
        try:
            booking = Booking.objects.select_related("hotel", "registration").get(pk=pk)
        except Booking.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)
        if hotel and booking.hotel != hotel:
            return None, Response({"detail": "Forbidden."}, status=403)
        return booking, None

    def get(self, request, pk):
        booking, err = self._get(pk, request.user)
        if err:
            return err
        return Response(BookingSerializer(booking, context={"request": request}).data)

    def patch(self, request, pk):
        booking, err = self._get(pk, request.user)
        if err:
            return err
        serializer = BookingSerializer(
            booking, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        booking, err = self._get(pk, request.user)
        if err:
            return err
        booking.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SendCheckinLinkView(APIView):
    """Hotel manually triggers an email to the guest containing the check-in link."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        hotel = _hotel_for(request.user)
        try:
            booking = Booking.objects.select_related("hotel").get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if hotel and booking.hotel != hotel:
            return Response({"detail": "Forbidden."}, status=403)
        if not booking.guest_email:
            return Response({"detail": "No email on this booking."}, status=400)

        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        link = f"{frontend_url}/checkin/{booking.checkin_token}"

        message = (
            f"Hello {booking.guest_name},\n\n"
            f"Thank you for booking with {booking.hotel.name}.\n\n"
            f"Please complete your secure online check-in before arrival:\n{link}\n\n"
            f"Check-in:  {booking.check_in_date}\n"
            f"Check-out: {booking.check_out_date}\n\n"
            f"Thank you."
        )

        try:
            send_mail(
                subject=f"Online Check-in – {booking.hotel.name}",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.guest_email],
                fail_silently=False,
            )
            booking.link_sent_at = timezone.now()
            booking.save(update_fields=["link_sent_at"])
            MessageLog.objects.create(
                booking=booking, message_type="email",
                recipient=booking.guest_email, status="sent",
            )
            return Response({"detail": "Email sent.", "sent_at": booking.link_sent_at})
        except Exception as exc:
            MessageLog.objects.create(
                booking=booking, message_type="email",
                recipient=booking.guest_email, status="failed",
                error_message=str(exc),
            )
            return Response({"detail": f"Failed: {exc}"}, status=500)


class CheckinStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = _booking_qs(request.user)
        today = date.today()
        return Response({
            "today":     qs.filter(check_in_date=today).count(),
            "tomorrow":  qs.filter(check_in_date=today + timedelta(days=1)).count(),
            "pending":   qs.filter(status="pending").count(),
            "completed": qs.filter(status="completed").count(),
            "missing":   qs.filter(status="missing_info").count(),
            "total":     qs.count(),
        })


class ExportCSVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = _booking_qs(request.user)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Booking Ref", "Guest Name", "Email", "Phone",
            "Check-in", "Check-out", "Guests", "Status",
            "First Name", "Last Name", "DOB", "Nationality",
            "Document Type", "Document Number", "Issue Date", "Expiry Date",
            "GDPR Consent", "Completed At",
        ])
        for b in qs:
            reg = getattr(b, "registration", None)
            writer.writerow([
                b.booking_reference, b.guest_name, b.guest_email, b.guest_phone,
                b.check_in_date, b.check_out_date, b.num_guests, b.status,
                reg.first_name if reg else "", reg.last_name if reg else "",
                reg.date_of_birth if reg else "", reg.nationality if reg else "",
                reg.document_type if reg else "", reg.document_number if reg else "",
                reg.document_issue_date if reg else "", reg.document_expiry_date if reg else "",
                reg.gdpr_consent if reg else "", reg.completed_at if reg else "",
            ])
        response = HttpResponse(output.getvalue(), content_type="text/csv")
        response["Content-Disposition"] = "attachment; filename=guest-registrations.csv"
        return response


# ── Public (no auth) views ────────────────────────────────────────────────────

class PublicCheckinVerifyView(APIView):
    """Returns stripped booking info so the guest form can show property / dates."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, token):
        try:
            booking = Booking.objects.select_related("hotel").get(checkin_token=token)
        except Booking.DoesNotExist:
            return Response({"detail": "Invalid or expired check-in link."}, status=404)
        return Response(PublicBookingSerializer(booking, context={"request": request}).data)


class PublicGuestSubmitView(APIView):
    """Guest submits their registration form via the tokenised URL."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, token):
        try:
            booking = Booking.objects.select_related("hotel").get(checkin_token=token)
        except Booking.DoesNotExist:
            return Response({"detail": "Invalid check-in link."}, status=404)

        if hasattr(booking, "registration"):
            return Response({"detail": "Registration already completed."}, status=400)

        data = request.data.dict() if hasattr(request.data, "dict") else dict(request.data)
        if request.FILES.get("document_image"):
            data["document_image"] = request.FILES["document_image"]

        serializer = GuestRegistrationSerializer(data=data, context={"request": request})
        if serializer.is_valid():
            serializer.save(booking=booking)
            booking.status = Booking.STATUS_COMPLETED
            booking.save(update_fields=["status"])
            return Response({"detail": "Registration completed."}, status=201)
        return Response(serializer.errors, status=400)
