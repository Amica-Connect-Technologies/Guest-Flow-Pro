from urllib.parse import quote
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

# Card payment is handled by the client's GoHighLevel funnel (same Stripe
# account), not our own Stripe Checkout — so "Credit/Debit Card" hands off
# to the matching GHL payment page instead of creating a Checkout Session.
GHL_PAYMENT_URLS = {
    "concierge":         "https://payment.guestflowpro.com/digital-concierge",
    "checkin":           "https://payment.guestflowpro.com/smart-check-in",
    "concierge_checkin": "https://payment.guestflowpro.com/guest-experience-pro",
    "full":              "https://payment.guestflowpro.com/full-suite",
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


def _approve_registration(reg):
    """
    Create the Hotel, activate the owner's login, and mark the Registration
    approved. Shared by the admin's manual Approve button and the auto-approved
    card-trial path (a verified Stripe card is treated as trustworthy enough to
    skip the manual review queue).
    """
    if reg.status == "approved":
        return reg.hotel

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
    return hotel


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

        # ── Card payment — hand off to the GHL funnel ─────────────────────────
        # Card payments are processed on the client's GoHighLevel funnel, not our
        # own Stripe Checkout. The Registration row created above already carries
        # the full business details; the Stripe webhook (customer.subscription.
        # created) matches the payment back to it by email once GHL charges the
        # card, moving it into the normal admin review queue.
        ghl_url = GHL_PAYMENT_URLS.get(d["plan"])
        if not ghl_url:
            reg.delete()
            user.delete()
            return Response(
                {"detail": "Card payment is not available for this plan. Please select Bank Transfer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        send_welcome_email(reg)  # auto welcome email
        checkout_url = f"{ghl_url}?email={quote(email)}"
        return Response({"checkout_url": checkout_url, "registration_id": str(reg.id)})


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

        elif event["type"] == "customer.subscription.created":
            self._track_orphan_subscription(event["data"]["object"])

        return Response({"received": True})

    def _track_orphan_subscription(self, sub):
        """
        Subscriptions created outside our own /register checkout (e.g. a GHL funnel
        using the same Stripe account) never get a Registration row, so the payment
        is invisible in the admin panel and the hotel account never gets provisioned.
        If it matches a Registration the owner already filled in on our own /register
        form (so we have a real password on file), a verified card is trusted enough
        to skip manual review — the hotel goes live immediately, 14-day trial handled
        by Stripe on GHL's side before the first real charge. Otherwise (nobody on
        file at all) it's backed into a reviewable Registration instead, since there's
        no password to safely auto-activate a login with.
        """
        subscription_id = sub.get("id", "")
        customer_id = sub.get("customer", "")
        already_tracked = (
            Registration.objects.filter(stripe_subscription_id=subscription_id).exists()
            or Registration.objects.filter(stripe_customer_id=customer_id).exists()
        )
        if already_tracked or not customer_id:
            return

        try:
            customer = stripe.Customer.retrieve(customer_id).to_dict()
        except stripe.error.StripeError:
            customer = {}

        price_id = ""
        items = sub.get("items", {}).get("data", [])
        if items:
            price_id = items[0].get("price", {}).get("id", "")
        plan = next((k for k, v in STRIPE_PRICES.items() if v and v == price_id), "concierge")
        email = customer.get("email") or ""

        # If they went through our own /register form first (hotel_name, city,
        # whatsapp, etc. already on file) and were then sent to GHL to pay, just
        # attach this payment to that existing record instead of creating a
        # second, thinner one with only what Stripe knows about the customer.
        existing = Registration.objects.select_related("user").filter(
            email__iexact=email, status="pending_payment"
        ).order_by("-created_at").first() if email else None
        if existing:
            existing.stripe_customer_id = customer_id
            existing.stripe_subscription_id = subscription_id
            existing.save(update_fields=["stripe_customer_id", "stripe_subscription_id"])
            _approve_registration(existing)  # card verified by Stripe — go live immediately
            return

        address = customer.get("address") or {}
        country_names = {"IT": "Italy", "GB": "United Kingdom"}
        name = customer.get("name") or email or "Unknown"

        Registration.objects.create(
            owner_name=name,
            business_name=name,
            email=email,
            phone=customer.get("phone") or "",
            city=address.get("city") or "",
            country=country_names.get(address.get("country"), address.get("country") or "Italy"),
            plan=plan,
            payment_method="stripe",
            status="pending_review",
            stripe_customer_id=customer_id,
            stripe_subscription_id=subscription_id,
            payment_note=(
                "Auto-created from an external checkout (e.g. the GHL payment funnel), "
                "not our own registration form — please verify business details with "
                "the customer before approving."
            ),
        )


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

        hotel = _approve_registration(reg)
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
