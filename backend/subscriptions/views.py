import stripe
from django.conf import settings
from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import HotelUser
from hotels.models import Hotel
from .emails import send_approved_email, send_welcome_email
from .models import Registration
from .serializers import RegisterRequestSerializer, RegistrationSerializer

stripe.api_key = settings.STRIPE_SECRET_KEY

STRIPE_PRICES = {
    "concierge":         getattr(settings, "STRIPE_PRICE_CONCIERGE",         ""),
    "checkin":           getattr(settings, "STRIPE_PRICE_CHECKIN",           ""),
    "concierge_checkin": getattr(settings, "STRIPE_PRICE_CONCIERGE_CHECKIN", ""),
    "full":              getattr(settings, "STRIPE_PRICE_FULL",              ""),
    # legacy — keep so old sessions don't break
    "basic": getattr(settings, "STRIPE_PRICE_BASIC", ""),
    "pro":   getattr(settings, "STRIPE_PRICE_PRO",   ""),
}

# Hardcoded bank account details — update these for production
BANK_DETAILS = {
    "account_name": "Amica International Services",
    "bank_name": "Barclays Bank",
    "sort_code": "20-00-00",
    "account_number": "12345678",
    "iban": "GB00BARC00000012345678",
    "swift": "BARCGB22",
    "reference_prefix": "DC-",
}


class RegisterView(APIView):
    """Public: collect details → create Registration + inactive User."""
    permission_classes = [AllowAny]
    authentication_classes = []  # skip JWT auth entirely — avoids 401 on stale tokens

    def post(self, request):
        ser = RegisterRequestSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        d = ser.validated_data
        email = d["email"].lower()

        if User.objects.filter(email__iexact=email).exists():
            return Response({"email": "An account with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create unique username from email prefix
        base = email.split("@")[0]
        username = base
        n = 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{n}"
            n += 1

        user = User.objects.create_user(
            username=username, email=email, password=d["password"], is_active=False,
        )

        payment_method = d.get("payment_method", "bank_transfer")
        initial_status = "pending_payment" if payment_method == "stripe" else "pending_review"

        reg = Registration.objects.create(
            owner_name=d["owner_name"],
            business_name=d["business_name"],
            email=email,
            phone=d.get("phone", ""),
            city=d["city"],
            country=d.get("country", "Italy"),
            whatsapp_number=d.get("whatsapp_number", ""),
            website=d.get("website", ""),
            plan=d["plan"],
            payment_method=payment_method,
            user=user,
            status=initial_status,
        )

        # ── Manual payment (bank transfer / invoice) ──────────────────────────
        if payment_method != "stripe":
            reference = f"{BANK_DETAILS['reference_prefix']}{str(reg.id)[:8].upper()}"
            send_welcome_email(reg)  # auto welcome email
            return Response({
                "registration_id": str(reg.id),
                "method": payment_method,
                "business_name": reg.business_name,
                "status": initial_status,
                "bank_details": {**BANK_DETAILS, "reference": reference},
            })

        # ── Stripe checkout ───────────────────────────────────────────────────
        price_id = STRIPE_PRICES.get(d["plan"])
        frontend_url = settings.FRONTEND_URL.rstrip("/")

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="subscription",
                line_items=[{"price": price_id, "quantity": 1}],
                customer_email=email,
                client_reference_id=str(reg.id),
                success_url=f"{frontend_url}/register/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{frontend_url}/register/cancel",
                metadata={"registration_id": str(reg.id)},
            )
        except stripe.error.StripeError as e:
            reg.delete()
            user.delete()
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        reg.stripe_session_id = session.id
        reg.save(update_fields=["stripe_session_id"])
        send_welcome_email(reg)  # auto welcome email
        return Response({"checkout_url": session.url, "registration_id": str(reg.id)})


class SubmitPaymentProofView(APIView):
    """Public: hotel owner submits bank transfer screenshot + transaction ID."""
    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        try:
            reg = Registration.objects.get(id=pk)
        except Registration.DoesNotExist:
            return Response({"detail": "Registration not found."}, status=status.HTTP_404_NOT_FOUND)

        if reg.payment_method == "stripe":
            return Response({"detail": "Not applicable for Stripe payments."}, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = request.data.get("transaction_id", "").strip()
        payment_note = request.data.get("payment_note", "").strip()
        proof_file = request.FILES.get("payment_proof")

        if not transaction_id and not proof_file:
            return Response(
                {"detail": "Please provide a transaction ID or upload a screenshot."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if transaction_id:
            reg.transaction_id = transaction_id
        if payment_note:
            reg.payment_note = payment_note
        if proof_file:
            reg.payment_proof = proof_file

        reg.save()
        return Response({"status": "proof_submitted", "registration_id": str(reg.id)})


class VerifyPaymentView(APIView):
    """Public: confirm Stripe payment session → move to pending_review."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        session_id = request.data.get("session_id")
        if not session_id:
            return Response({"detail": "session_id required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = stripe.checkout.Session.retrieve(session_id)
        except stripe.error.StripeError as e:
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        if session.payment_status not in ("paid", "no_payment_required"):
            return Response({"detail": "Payment not completed."}, status=status.HTTP_400_BAD_REQUEST)

        reg_id = getattr(session.metadata, "registration_id", None) or session.client_reference_id
        try:
            reg = Registration.objects.get(id=reg_id)
        except Registration.DoesNotExist:
            return Response({"detail": "Registration not found."}, status=status.HTTP_404_NOT_FOUND)

        if reg.status == "pending_payment":
            reg.status = "pending_review"
            reg.stripe_customer_id = session.customer or ""
            reg.stripe_subscription_id = session.subscription or ""
            reg.save(update_fields=["status", "stripe_customer_id", "stripe_subscription_id"])

        return Response({"status": reg.status, "business_name": reg.business_name})


class StripeWebhookView(APIView):
    """Stripe webhook — marks registration as pending_review on successful payment."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        except (ValueError, stripe.error.SignatureVerificationError):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            if getattr(session, "payment_status", None) == "paid":
                metadata = getattr(session, "metadata", None)
                reg_id = getattr(metadata, "registration_id", None) or getattr(session, "client_reference_id", None)
                if reg_id:
                    Registration.objects.filter(id=reg_id, status="pending_payment").update(
                        status="pending_review",
                        stripe_customer_id=getattr(session, "customer", "") or "",
                        stripe_subscription_id=getattr(session, "subscription", "") or "",
                    )

        return Response({"received": True})


class RegistrationListView(APIView):
    """Admin: list all registrations, optionally filter by status."""
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Registration.objects.all()
        s = request.query_params.get("status")
        if s:
            qs = qs.filter(status=s)
        return Response(RegistrationSerializer(qs, many=True, context={"request": request}).data)


class RegistrationDetailView(APIView):
    """Admin: delete a registration."""
    permission_classes = [IsAdminUser]

    def delete(self, request, pk):
        try:
            reg = Registration.objects.get(id=pk)
        except Registration.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        reg.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ApproveRegistrationView(APIView):
    """Admin: approve → create Hotel, activate User."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            reg = Registration.objects.select_related("user").get(id=pk)
        except Registration.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        if reg.status == "approved":
            return Response({"status": "approved", "hotel_id": str(reg.hotel_id) if reg.hotel_id else ""})

        hotel = Hotel.objects.create(
            name=reg.business_name,
            city=reg.city,
            country=getattr(reg, "country", "Italy") or "Italy",
            whatsapp_number=reg.whatsapp_number,
            website=getattr(reg, "website", "") or "",
            plan=reg.plan,
            language_default="en",
        )

        if reg.user:
            reg.user.is_active = True
            reg.user.save(update_fields=["is_active"])
            HotelUser.objects.update_or_create(
                user=reg.user, defaults={"hotel": hotel, "role": "manager"},
            )

        reg.status = "approved"
        reg.hotel = hotel
        reg.reviewed_at = timezone.now()
        reg.save(update_fields=["status", "hotel", "reviewed_at"])

        send_approved_email(reg)  # notify partner their account is live

        return Response({"status": "approved", "hotel_id": str(hotel.id)})


class RejectRegistrationView(APIView):
    """Admin: reject with optional reason."""
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            reg = Registration.objects.get(id=pk)
        except Registration.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        reg.status = "rejected"
        reg.rejection_reason = request.data.get("reason", "")
        reg.reviewed_at = timezone.now()
        reg.save(update_fields=["status", "rejection_reason", "reviewed_at"])
        return Response({"status": "rejected"})


class PendingCountView(APIView):
    """Returns count of pending_review registrations for admin nav badge."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({"count": 0})
        count = Registration.objects.filter(status="pending_review").count()
        return Response({"count": count})
