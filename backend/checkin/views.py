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
    qs = Booking.objects.prefetch_related("registrations", "messages").select_related("hotel").all()
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
            booking = Booking.objects.prefetch_related("registrations", "messages").select_related("hotel").get(pk=pk)
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
            "Check-in", "Check-out", "Total Guests", "Status",
            "Guest #", "First Name", "Last Name", "Gender", "DOB",
            "Place of Birth", "Nationality", "Address",
            "Document Type", "Document Number", "Issue Date", "Expiry Date",
            "GDPR Consent", "Completed At",
        ])
        for b in qs:
            regs = list(b.registrations.all())
            if regs:
                for reg in regs:
                    writer.writerow([
                        b.booking_reference, b.guest_name, b.guest_email, b.guest_phone,
                        b.check_in_date, b.check_out_date, b.num_guests, b.status,
                        reg.guest_number, reg.first_name, reg.last_name, reg.gender,
                        reg.date_of_birth, reg.place_of_birth, reg.nationality,
                        reg.residence_address,
                        reg.document_type, reg.document_number,
                        reg.document_issue_date, reg.document_expiry_date,
                        reg.gdpr_consent, reg.completed_at,
                    ])
            else:
                # Booking with no registrations yet
                writer.writerow([
                    b.booking_reference, b.guest_name, b.guest_email, b.guest_phone,
                    b.check_in_date, b.check_out_date, b.num_guests, b.status,
                    "", "", "", "", "", "", "", "", "", "", "", "", "", "",
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
    """
    Guest submits their registration form via the tokenised URL.
    Supports multiple guests — each submission includes guest_number (1-based).
    Booking is marked completed once all num_guests have registered.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, token):
        try:
            booking = Booking.objects.prefetch_related("registrations").select_related("hotel").get(checkin_token=token)
        except Booking.DoesNotExist:
            return Response({"detail": "Invalid check-in link."}, status=404)

        data = request.data.dict() if hasattr(request.data, "dict") else dict(request.data)
        if request.FILES.get("document_image"):
            data["document_image"] = request.FILES["document_image"]

        # Determine which guest number this submission is for (default to 1)
        try:
            guest_number = max(1, int(data.get("guest_number", 1)))
        except (ValueError, TypeError):
            guest_number = 1

        # Clamp to valid range
        guest_number = min(guest_number, booking.num_guests)

        # Upsert: update existing registration for this guest_number or create new
        existing = booking.registrations.filter(guest_number=guest_number).first()
        if existing:
            serializer = GuestRegistrationSerializer(
                existing, data=data, partial=True, context={"request": request}
            )
        else:
            serializer = GuestRegistrationSerializer(data=data, context={"request": request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        instance = serializer.save(booking=booking, guest_number=guest_number)

        # Mark booking completed when all guests have registered
        registered_count = booking.registrations.count()
        if registered_count >= booking.num_guests:
            booking.status = Booking.STATUS_COMPLETED
            booking.save(update_fields=["status"])
            all_done = True
        else:
            # Keep status pending while waiting for remaining guests
            if booking.status == Booking.STATUS_PENDING:
                pass  # leave as pending
            all_done = False

        return Response({
            "detail": "Registration saved.",
            "guest_number": guest_number,
            "registered": registered_count,
            "total_guests": booking.num_guests,
            "all_done": all_done,
        }, status=201)
