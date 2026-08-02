import csv
import io
import logging
from datetime import date, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db import DatabaseError
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from accounts.models import HotelUser
from hotels.plan_permissions import require_feature, require_guest_capacity
from .models import Booking, BookingRequest, GuestRegistration, MessageLog, ReviewRequest, WebhookConfig
from .webhooks import dispatch as webhook_dispatch
from .serializers import (
    BookingSerializer,
    BookingRequestSerializer,
    PublicBookingRequestSerializer,
    GuestRegistrationSerializer,
    PublicBookingSerializer,
    ReviewRequestSerializer,
    PublicReviewSerializer,
    WebhookConfigSerializer,
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
    qs = Booking.objects.prefetch_related("registrations", "messages").select_related("hotel").order_by("-created_at")
    if hotel:
        qs = qs.filter(hotel=hotel)
    return qs


def _send_checkin_invitation(booking):
    """Email the guest their secure online check-in link. Returns True on success."""
    if not booking.guest_email:
        return False

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
        return True
    except Exception as exc:
        MessageLog.objects.create(
            booking=booking, message_type="email",
            recipient=booking.guest_email, status="failed",
            error_message=str(exc),
        )
        return False


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
            booking = serializer.save(hotel=hotel)
            webhook_dispatch(hotel, "booking_created", {
                "booking_id": str(booking.id),
                "booking_reference": booking.booking_reference,
                "guest_name": booking.guest_name,
                "guest_email": booking.guest_email,
                "check_in_date": str(booking.check_in_date),
                "check_out_date": str(booking.check_out_date),
                "num_guests": booking.num_guests,
            })
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

        if _send_checkin_invitation(booking):
            return Response({"detail": "Email sent.", "sent_at": booking.link_sent_at})
        return Response({"detail": "Failed to send email."}, status=500)


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
        hotel = _hotel_for(request.user)
        err = require_feature(hotel, "guest_export")
        if err:
            return err
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


# ── CRM: Guest list ───────────────────────────────────────────────────────────

class GuestListView(APIView):
    """Return all registered guests for this hotel with search + filter support."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request.user)
        qs = GuestRegistration.objects.select_related("booking", "booking__hotel")
        if hotel:
            qs = qs.filter(booking__hotel=hotel)

        search = request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(nationality__icontains=search) |
                Q(booking__guest_email__icontains=search) |
                Q(booking__guest_phone__icontains=search)
            )

        if request.query_params.get("marketing_optin") == "true":
            err = require_feature(hotel, "marketing")
            if err:
                return err
            qs = qs.filter(marketing_optin=True)

        if request.query_params.get("gdpr_consent") == "true":
            qs = qs.filter(gdpr_consent=True)

        nationality = request.query_params.get("nationality", "").strip()
        if nationality:
            qs = qs.filter(nationality__iexact=nationality)

        qs = qs.order_by("-booking__check_in_date", "guest_number")

        guests = []
        for reg in qs:
            b = reg.booking
            document_image_url = None
            if reg.document_image:
                document_image_url = request.build_absolute_uri(reg.document_image.url)
            guests.append({
                "id": str(reg.id),
                "guest_number": reg.guest_number,
                "first_name": reg.first_name,
                "last_name": reg.last_name,
                "gender": reg.gender,
                "date_of_birth": str(reg.date_of_birth) if reg.date_of_birth else None,
                "nationality": reg.nationality,
                "residence_address": reg.residence_address,
                "document_type": reg.document_type,
                "document_number": reg.document_number,
                "document_image_url": document_image_url,
                "gdpr_consent": reg.gdpr_consent,
                "marketing_optin": reg.marketing_optin,
                "completed_at": reg.completed_at.isoformat(),
                "booking_id": str(b.id),
                "booking_reference": b.booking_reference,
                "hotel_name": b.hotel.name,
                "guest_email": b.guest_email,
                "guest_phone": b.guest_phone,
                "check_in_date": str(b.check_in_date),
                "check_out_date": str(b.check_out_date),
                "booking_status": b.status,
            })

        # Stats for CRM header
        total = qs.count()
        from django.db.models import Count
        top_countries = (
            qs.exclude(nationality="")
            .values("nationality")
            .annotate(count=Count("nationality"))
            .order_by("-count")[:5]
        )

        stats = {
            "total": total,
            "top_countries": list(top_countries),
        }
        # Marketing stats only available on Pro+ plans
        if hotel is None or hotel.can("marketing"):
            stats["marketing_optins"] = qs.filter(marketing_optin=True).count()

        return Response({
            "guests": guests,
            "stats": stats,
        })


# ── Booking Requests ──────────────────────────────────────────────────────────

class BookingRequestListView(APIView):
    """Hotel-authenticated: list all requests + stats; admin sees all."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request.user)
        qs = BookingRequest.objects.select_related("hotel", "booking").all()
        if hotel:
            qs = qs.filter(hotel=hotel)

        status_filter = request.query_params.get("status")
        if status_filter:
            qs = qs.filter(status=status_filter)

        return Response(BookingRequestSerializer(qs, many=True, context={"request": request}).data)


class BookingRequestDetailView(APIView):
    """Hotel-authenticated: update status + hotel_notes; delete."""
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, pk, user):
        hotel = _hotel_for(user)
        try:
            obj = BookingRequest.objects.select_related("hotel", "booking").get(pk=pk)
        except BookingRequest.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)
        if hotel and obj.hotel != hotel:
            return None, Response({"detail": "Forbidden."}, status=403)
        return obj, None

    def patch(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        allowed = {k: v for k, v in request.data.items() if k in ("status", "hotel_notes")}
        serializer = BookingRequestSerializer(obj, data=allowed, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()

            # Confirming an enquiry creates the real Booking (with its own check-in
            # token) and emails the guest their invitation — turning the public
            # "Smart Check-in" enquiry into an actual check-in link, once.
            if obj.status == BookingRequest.STATUS_CONFIRMED and obj.booking_id is None:
                booking = Booking.objects.create(
                    hotel=obj.hotel,
                    guest_name=obj.guest_name,
                    guest_email=obj.guest_email,
                    guest_phone=obj.guest_phone,
                    check_in_date=obj.check_in_date,
                    check_out_date=obj.check_out_date,
                    num_guests=obj.num_guests,
                    notes=obj.message,
                )
                obj.booking = booking
                if _send_checkin_invitation(booking):
                    obj.invitation_sent_at = timezone.now()
                obj.save(update_fields=["booking", "invitation_sent_at"])

            return Response(BookingRequestSerializer(obj, context={"request": request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PublicBookingRequestView(APIView):
    """Public: guest submits a booking request for a specific hotel."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request, hotel_id):
        from hotels.models import Hotel
        try:
            hotel = Hotel.objects.get(pk=hotel_id)
        except Hotel.DoesNotExist:
            return Response({"detail": "Hotel not found."}, status=404)
        serializer = PublicBookingRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        obj = serializer.save(hotel=hotel)
        webhook_dispatch(hotel, "booking_request", {
            "request_id": str(obj.id),
            "guest_name": obj.guest_name,
            "guest_email": obj.guest_email,
            "check_in_date": str(obj.check_in_date),
            "check_out_date": str(obj.check_out_date),
            "num_guests": obj.num_guests,
            "room_type": obj.room_type,
        })
        return Response({"detail": "Booking request submitted.", "id": str(obj.id)}, status=201)


# ── Review Requests ───────────────────────────────────────────────────────────

class ReviewRequestListView(APIView):
    """Hotel-authenticated: list reviews + send review link to guest."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request.user)
        qs = ReviewRequest.objects.select_related("booking", "booking__hotel").all()
        if hotel:
            qs = qs.filter(booking__hotel=hotel)
        return Response(ReviewRequestSerializer(qs, many=True, context={"request": request}).data)


class ReviewRequestDetailView(APIView):
    """Hotel-authenticated: send link, update google/tripadvisor URLs, delete."""
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, pk, user):
        hotel = _hotel_for(user)
        try:
            obj = ReviewRequest.objects.select_related("booking", "booking__hotel").get(pk=pk)
        except ReviewRequest.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)
        if hotel and obj.booking.hotel != hotel:
            return None, Response({"detail": "Forbidden."}, status=403)
        return obj, None

    def post(self, request, pk):
        """Send review-request email to guest."""
        obj, err = self._get(pk, request.user)
        if err:
            return err
        booking = obj.booking
        if not booking.guest_email:
            return Response({"detail": "Booking has no guest email."}, status=400)
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
        link = f"{frontend_url}/review/{obj.review_token}"
        message = (
            f"Dear {booking.guest_name},\n\n"
            f"Thank you for staying with us at {booking.hotel.name}.\n\n"
            f"We would love to hear your feedback. Please share your experience:\n{link}\n\n"
            f"It only takes 30 seconds!\n\nThank you."
        )
        try:
            send_mail(
                subject=f"How was your stay at {booking.hotel.name}?",
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.guest_email],
                fail_silently=False,
            )
            obj.sent_at = timezone.now()
            obj.save(update_fields=["sent_at"])
            return Response({"detail": "Review request sent.", "sent_at": obj.sent_at})
        except Exception as exc:
            return Response({"detail": f"Failed: {exc}"}, status=500)

    def patch(self, request, pk):
        """Update google_review_url / tripadvisor_url."""
        obj, err = self._get(pk, request.user)
        if err:
            return err
        allowed = {k: v for k, v in request.data.items() if k in ("google_review_url", "tripadvisor_url")}
        for k, v in allowed.items():
            setattr(obj, k, v)
        obj.save(update_fields=list(allowed.keys()))
        return Response(ReviewRequestSerializer(obj, context={"request": request}).data)

    def delete(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SendCheckinReviewView(APIView):
    """Hotel triggers a review request for a completed booking (creates ReviewRequest if not exists)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_pk):
        hotel = _hotel_for(request.user)
        try:
            booking = Booking.objects.select_related("hotel").get(pk=booking_pk)
        except Booking.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if hotel and booking.hotel != hotel:
            return Response({"detail": "Forbidden."}, status=403)
        review_req, _ = ReviewRequest.objects.get_or_create(booking=booking)
        # Proxy to ReviewRequestDetailView.post logic
        view = ReviewRequestDetailView()
        view.request = request
        return view.post(request, review_req.pk)


class PublicReviewView(APIView):
    """Guest submits their review via the tokenised URL."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, token):
        try:
            obj = ReviewRequest.objects.select_related("booking", "booking__hotel").get(review_token=token)
        except ReviewRequest.DoesNotExist:
            return Response({"detail": "Invalid review link."}, status=404)
        return Response({
            "hotel_name": obj.booking.hotel.name,
            "guest_name": obj.booking.guest_name,
            "check_in_date": str(obj.booking.check_in_date),
            "check_out_date": str(obj.booking.check_out_date),
            "is_submitted": obj.is_submitted,
            "google_review_url": obj.google_review_url,
            "tripadvisor_url": obj.tripadvisor_url,
        })

    def post(self, request, token):
        try:
            obj = ReviewRequest.objects.select_related("booking").get(review_token=token)
        except ReviewRequest.DoesNotExist:
            return Response({"detail": "Invalid review link."}, status=404)
        if obj.is_submitted:
            return Response({"detail": "Review already submitted."}, status=400)
        ser = PublicReviewSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        obj.rating = ser.validated_data["rating"]
        obj.comment = ser.validated_data.get("comment", "")
        obj.submitted_at = timezone.now()
        obj.save(update_fields=["rating", "comment", "submitted_at"])
        webhook_dispatch(obj.booking.hotel, "review_submitted", {
            "booking_id": str(obj.booking.id),
            "booking_reference": obj.booking.booking_reference,
            "guest_name": obj.booking.guest_name,
            "rating": obj.rating,
            "comment": obj.comment,
        })
        return Response({"detail": "Thank you for your review!", "rating": obj.rating})


# ── Webhook Management ────────────────────────────────────────────────────────

class WebhookListView(APIView):
    """Hotel: list and create webhook endpoints. Pro+ plan required."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request.user)
        err = require_feature(hotel, "webhooks")
        if err:
            return err
        qs = WebhookConfig.objects.filter(hotel=hotel) if hotel else WebhookConfig.objects.all()
        return Response(WebhookConfigSerializer(qs, many=True).data)

    def post(self, request):
        hotel = _hotel_for(request.user)
        if not hotel:
            return Response({"detail": "Use a hotel account."}, status=403)
        err = require_feature(hotel, "webhooks")
        if err:
            return err
        ser = WebhookConfigSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=400)
        ser.save(hotel=hotel)
        return Response(ser.data, status=status.HTTP_201_CREATED)


class WebhookDetailView(APIView):
    """Hotel: update or delete a webhook. Pro+ plan required."""
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, pk, user):
        hotel = _hotel_for(user)
        err = require_feature(hotel, "webhooks")
        if err:
            return None, err
        try:
            obj = WebhookConfig.objects.get(pk=pk)
        except WebhookConfig.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)
        if hotel and obj.hotel != hotel:
            return None, Response({"detail": "Forbidden."}, status=403)
        return obj, None

    def patch(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        ser = WebhookConfigSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def delete(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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

        # Check monthly guest capacity before accepting a new registration
        err = require_guest_capacity(booking.hotel)
        if err:
            return err

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

        try:
            instance = serializer.save(booking=booking, guest_number=guest_number)
        except DatabaseError as exc:
            logger.error("Guest registration DB error for booking %s: %s", booking.id, exc)
            return Response(
                {"detail": "Registration could not be saved — database error. Please run migrations on the server."},
                status=500,
            )
        except Exception as exc:
            logger.exception("Guest registration failed for booking %s", booking.id)
            return Response(
                {"detail": "Registration failed due to a server error. Please try again."},
                status=500,
            )

        # Fire webhook
        webhook_dispatch(booking.hotel, "guest_registered", {
            "booking_id": str(booking.id),
            "booking_reference": booking.booking_reference,
            "guest_number": guest_number,
            "first_name": instance.first_name,
            "last_name": instance.last_name,
            "nationality": instance.nationality,
            "document_type": instance.document_type,
            "marketing_optin": instance.marketing_optin,
        })

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
