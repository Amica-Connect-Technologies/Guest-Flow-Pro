import csv
import io
import json as _json
import re
import urllib.request
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.conf import settings
from django.http import HttpResponse
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from accounts.models import HotelUser
from .models import APIKey, Hotel, HotelGalleryImage, HotelOutreach
from .serializers import HotelGalleryImageSerializer, HotelSerializer
from .plan_permissions import require_feature

# 1×1 transparent GIF — used as email tracking pixel
_TRACKING_GIF = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
    b"\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00\x00"
    b"\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
)


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        # Public list requests only return verified hotels; admins see everything.
        if self.action == "list" and not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_verified=True)
        return qs

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

        # Build a plain dict so Python objects (list, bool, file) survive unmodified.
        # request.data (QueryDict) holds form fields; request.FILES holds uploads.
        data = {k: request.data[k] for k in request.data}
        for k, v in request.FILES.items():
            data[k] = v

        # FormData sends JSON fields as plain strings — coerce before validation.
        if isinstance(data.get("amenities"), str):
            try:
                data["amenities"] = _json.loads(data["amenities"])
            except (ValueError, TypeError):
                data["amenities"] = []
        if "is_24_7" in data and isinstance(data["is_24_7"], str):
            data["is_24_7"] = data["is_24_7"].lower() in ("true", "1", "yes")

        # Gate white-label fields by plan
        if "brand_color" in data and not hotel.can("white_label_color"):
            data.pop("brand_color")
        if "welcome_message" in data and not hotel.can("white_label_msg"):
            data.pop("welcome_message")

        serializer = HotelSerializer(hotel, data=data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def _hotel_for(user):
    if user.is_staff:
        return None
    try:
        return HotelUser.objects.get(user=user).hotel
    except HotelUser.DoesNotExist:
        return None


class HotelGalleryView(APIView):
    """List gallery images (public by hotel_id) and upload new ones (authenticated)."""
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        hotel_id = request.query_params.get("hotel_id")
        if not hotel_id:
            return Response([])
        images = HotelGalleryImage.objects.filter(hotel_id=hotel_id)
        return Response(
            HotelGalleryImageSerializer(images, many=True, context={"request": request}).data
        )

    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        if request.user.is_staff:
            hotel_id = request.data.get("hotel_id")
            if not hotel_id:
                return Response({"detail": "hotel_id is required."}, status=status.HTTP_400_BAD_REQUEST)
            try:
                hotel = Hotel.objects.get(id=hotel_id)
            except Hotel.DoesNotExist:
                return Response({"detail": "Hotel not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            hotel = _hotel_for(request.user)
            if not hotel:
                return Response({"detail": "No hotel linked."}, status=status.HTTP_404_NOT_FOUND)

        existing = HotelGalleryImage.objects.filter(hotel=hotel).count()
        if existing >= 5:
            return Response({"detail": "Maximum 5 gallery images allowed."}, status=status.HTTP_400_BAD_REQUEST)

        image = request.FILES.get("image")
        if not image:
            return Response({"detail": "No image provided."}, status=status.HTTP_400_BAD_REQUEST)

        gallery_image = HotelGalleryImage.objects.create(hotel=hotel, image=image, order=existing)
        return Response(
            HotelGalleryImageSerializer(gallery_image, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class HotelGalleryDetailView(APIView):
    """Delete a single gallery image (authenticated, own hotel only)."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, pk):
        if request.user.is_staff:
            try:
                img = HotelGalleryImage.objects.get(id=pk)
            except HotelGalleryImage.DoesNotExist:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            hotel = _hotel_for(request.user)
            if not hotel:
                return Response({"detail": "No hotel linked."}, status=status.HTTP_404_NOT_FOUND)
            try:
                img = HotelGalleryImage.objects.get(id=pk, hotel=hotel)
            except HotelGalleryImage.DoesNotExist:
                return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        img.image.delete(save=False)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class APIKeyListView(APIView):
    """Hotel: list keys (prefix only, never full key) + create a new key. Enterprise plan only."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request.user)
        if not hotel:
            return Response({"detail": "No hotel linked."}, status=403)
        err = require_feature(hotel, "api_keys")
        if err:
            return err
        keys = APIKey.objects.filter(hotel=hotel).values(
            "id", "name", "key_prefix", "is_active", "last_used_at", "created_at"
        )
        return Response(list(keys))

    def post(self, request):
        hotel = _hotel_for(request.user)
        if not hotel:
            return Response({"detail": "No hotel linked."}, status=403)
        err = require_feature(hotel, "api_keys")
        if err:
            return err
        name = (request.data.get("name") or "").strip()
        if not name:
            return Response({"detail": "Name is required."}, status=400)
        obj, raw_key = APIKey.generate(hotel, name)
        return Response({
            "id": str(obj.id),
            "name": obj.name,
            "key_prefix": obj.key_prefix,
            "key": raw_key,          # shown ONCE — client must copy it now
            "is_active": obj.is_active,
            "created_at": obj.created_at,
        }, status=status.HTTP_201_CREATED)


class APIKeyDetailView(APIView):
    """Hotel: revoke (deactivate) or delete an API key. Enterprise plan only."""
    permission_classes = [permissions.IsAuthenticated]

    def _get(self, pk, user):
        hotel = _hotel_for(user)
        if not hotel:
            return None, Response({"detail": "No hotel linked."}, status=403)
        err = require_feature(hotel, "api_keys")
        if err:
            return None, err
        try:
            return APIKey.objects.get(pk=pk, hotel=hotel), None
        except APIKey.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def patch(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        obj.is_active = bool(request.data.get("is_active", obj.is_active))
        obj.save(update_fields=["is_active"])
        return Response({"id": str(obj.id), "is_active": obj.is_active})

    def delete(self, request, pk):
        obj, err = self._get(pk, request.user)
        if err:
            return err
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Hotel Outreach (admin only) ───────────────────────────────────────────────

def _outreach_data(o: HotelOutreach) -> dict:
    return {
        "id":               str(o.id),
        "trial_token":      str(o.trial_token),
        "hotel_name":       o.hotel_name,
        "contact_name":   o.contact_name,
        "email":          o.email,
        "phone":          o.phone,
        "city":           o.city,
        "website":        o.website,
        "language":       o.language,
        "status":         o.status,
        "notes":          o.notes,
        "invite_sent_at":   o.invite_sent_at.isoformat() if o.invite_sent_at else None,
        "email_opened_at":  o.email_opened_at.isoformat() if o.email_opened_at else None,
        "email_open_count": o.email_open_count,
        "created_at":       o.created_at.isoformat(),
        "updated_at":       o.updated_at.isoformat(),
    }


# Trial invite email copy, per language. Keep this — not the Django i18n
# system — since these are one-off outbound sales emails, not app UI.
_TRIAL_EMAIL_COPY = {
    "en": {
        "subject":  "Your 14-Day Free Trial — GuestFlow Pro 🏨",
        "eyebrow":  "GuestFlow Pro",
        "title":    "Your Free 14-Day Trial",
        "no_card":  "No credit card required",
        "greeting_fallback": "there",
        "intro": lambda hotel_name: (
            f'We\'d love to give <strong style="color:#0F172A;">{hotel_name}</strong> a full 14-day free trial of GuestFlow Pro — '
            "the digital guest experience platform built for modern hotels."
        ),
        "features": [
            "Smart digital check-in — guests register online",
            "Digital concierge — room service, tours & more",
            "Branded QR code for your hotel",
            "Guest database & communication tools",
            "Review management & analytics",
        ],
        "cta":        "✓ &nbsp; Activate Free Trial →",
        "copy_link":  "Or copy this link:",
        "fine_print": "Your trial is free for 14 days — no payment needed to get started.<br>Questions? Reply to this email and we'll help you get set up.",
        "footer":     "Powered by",
        "plain": lambda greeting, hotel_name, trial_url: (
            f"Hi {greeting},\n\n"
            f"We'd like to offer {hotel_name} a free 14-day trial of GuestFlow Pro.\n\n"
            f"Activate your trial here: {trial_url}\n\n"
            "GuestFlow Pro helps hotels deliver a modern digital guest experience — "
            "smart check-in, digital concierge, guest communication and more.\n\n"
            "Best regards,\nThe GuestFlow Pro Team"
        ),
    },
    "it": {
        "subject":  "La Tua Prova Gratuita di 14 Giorni — GuestFlow Pro 🏨",
        "eyebrow":  "GuestFlow Pro",
        "title":    "La Tua Prova Gratuita di 14 Giorni",
        "no_card":  "Nessuna carta di credito richiesta",
        "greeting_fallback": "il team",
        "intro": lambda hotel_name: (
            f'Vorremmo offrire a <strong style="color:#0F172A;">{hotel_name}</strong> una prova gratuita completa di 14 giorni di GuestFlow Pro — '
            "la piattaforma di esperienza digitale per gli ospiti pensata per gli hotel moderni."
        ),
        "features": [
            "Check-in digitale smart — gli ospiti si registrano online",
            "Concierge digitale — servizio in camera, tour e altro",
            "QR code personalizzato per il tuo hotel",
            "Database ospiti e strumenti di comunicazione",
            "Gestione recensioni e analisi",
        ],
        "cta":        "✓ &nbsp; Attiva Prova Gratuita →",
        "copy_link":  "Oppure copia questo link:",
        "fine_print": "La tua prova è gratuita per 14 giorni — nessun pagamento richiesto per iniziare.<br>Domande? Rispondi a questa email e ti aiuteremo a configurarla.",
        "footer":     "Offerto da",
        "plain": lambda greeting, hotel_name, trial_url: (
            f"Ciao {greeting},\n\n"
            f"Vorremmo offrire a {hotel_name} una prova gratuita di 14 giorni di GuestFlow Pro.\n\n"
            f"Attiva la tua prova qui: {trial_url}\n\n"
            "GuestFlow Pro aiuta gli hotel a offrire un'esperienza digitale moderna per gli ospiti — "
            "check-in smart, concierge digitale, comunicazione con gli ospiti e molto altro.\n\n"
            "Cordiali saluti,\nIl Team di GuestFlow Pro"
        ),
    },
}


def _build_trial_email(o: HotelOutreach) -> tuple[str, str, str]:
    """Returns (subject, plain, html) for o's 14-day trial invite, in o.language."""
    copy = _TRIAL_EMAIL_COPY.get(o.language, _TRIAL_EMAIL_COPY["en"])
    frontend_url = getattr(settings, "FRONTEND_URL", "https://guestflowpro.com").rstrip("/")
    trial_url    = f"{frontend_url}/trial/{o.trial_token}"
    pixel_url    = f"{getattr(settings, 'BACKEND_URL', frontend_url).rstrip('/')}/api/hotels/outreach/track/{o.trial_token}/"
    greeting     = o.contact_name if o.contact_name else copy["greeting_fallback"]

    subject = copy["subject"]
    plain   = copy["plain"](greeting, o.hotel_name, trial_url)
    html = f"""<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4F8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <!-- Header -->
  <tr><td style="background:linear-gradient(135deg,#020B12 0%,#083344 55%,#0E7490 100%);padding:36px 40px 32px;text-align:center;">
    <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:rgba(103,232,249,0.8);">{copy["eyebrow"]}</p>
    <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;line-height:1.2;">{copy["title"]}</h1>
    <p style="margin:10px 0 0;font-size:14px;color:rgba(186,230,253,0.75);">{copy["no_card"]}</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:36px 40px;">
    <p style="margin:0 0 16px;font-size:16px;color:#0F172A;">Hi <strong>{greeting}</strong>,</p>
    <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">
      {copy["intro"](o.hotel_name)}
    </p>
    <!-- Features -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      {''.join(f'<tr><td style="padding:6px 0;"><span style="color:#0E7490;font-weight:700;">✓</span> <span style="font-size:14px;color:#334155;">{feat}</span></td></tr>' for feat in copy["features"])}
    </table>
    <!-- CTA -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr><td align="center">
        <a href="{trial_url}" style="display:inline-block;background:linear-gradient(135deg,#0891B2,#0E7490);color:#ffffff;font-size:16px;font-weight:800;text-decoration:none;padding:16px 40px;border-radius:14px;box-shadow:0 8px 24px rgba(8,145,178,0.35);">
          {copy["cta"]}
        </a>
      </td></tr>
    </table>
    <p style="margin:0 0 8px;font-size:13px;color:#94A3B8;text-align:center;">{copy["copy_link"]}</p>
    <p style="margin:0 0 24px;font-size:12px;color:#64748B;text-align:center;word-break:break-all;">{trial_url}</p>
    <hr style="border:none;border-top:1px solid #E2E8F0;margin:0 0 20px;">
    <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
      {copy["fine_print"]}
    </p>
  </td></tr>
  <!-- Footer -->
  <tr><td style="background:#F8FAFC;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
    <p style="margin:0;font-size:11px;color:#CBD5E1;">{copy["footer"]} <strong style="color:#0E7490;">GuestFlow Pro</strong> · guestflowpro.com</p>
  </td></tr>
</table>
</td></tr></table>
<!-- Tracking pixel -->
<img src="{pixel_url}" width="1" height="1" style="display:none;" alt="">
</body></html>"""
    return subject, plain, html


def _infer_language(row: dict, phone: str) -> str:
    """Best-effort language guess for an imported lead: explicit CSV column first, else phone country code."""
    explicit = (row.get("Language") or row.get("language") or row.get("Country") or row.get("country") or "").strip().lower()
    if explicit:
        if explicit.startswith("it") or "italy" in explicit or "italia" in explicit:
            return "it"
        if explicit.startswith("en") or "kingdom" in explicit or "uk" in explicit or "england" in explicit:
            return "en"
    digits = re.sub(r"[^\d+]", "", phone or "")
    if digits.startswith("+39") or (digits.startswith("39") and len(digits) >= 10):
        return "it"
    return "en"


class OutreachListView(APIView):
    """Admin: list all outreach leads or create one."""
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = HotelOutreach.objects.all()
        status_filter = request.query_params.get("status", "").strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        search = request.query_params.get("search", "").strip()
        if search:
            qs = qs.filter(hotel_name__icontains=search) | qs.filter(city__icontains=search)
        return Response([_outreach_data(o) for o in qs])

    def post(self, request):
        data = request.data
        hotel_name = (data.get("hotel_name") or "").strip()
        if not hotel_name:
            return Response({"detail": "hotel_name is required."}, status=400)
        language = data.get("language") or "en"
        if language not in dict(HotelOutreach.LANGUAGE_CHOICES):
            language = "en"
        o = HotelOutreach.objects.create(
            hotel_name=hotel_name,
            contact_name=(data.get("contact_name") or "").strip(),
            email=(data.get("email") or "").strip(),
            phone=(data.get("phone") or "").strip(),
            city=(data.get("city") or "").strip(),
            website=(data.get("website") or "").strip(),
            language=language,
            status=data.get("status", "new"),
            notes=(data.get("notes") or "").strip(),
        )
        return Response(_outreach_data(o), status=status.HTTP_201_CREATED)


class OutreachDetailView(APIView):
    """Admin: read, update, delete a single outreach record."""
    permission_classes = [permissions.IsAdminUser]

    def _get(self, pk):
        try:
            return HotelOutreach.objects.get(pk=pk), None
        except HotelOutreach.DoesNotExist:
            return None, Response({"detail": "Not found."}, status=404)

    def get(self, request, pk):
        o, err = self._get(pk)
        return err or Response(_outreach_data(o))

    def patch(self, request, pk):
        o, err = self._get(pk)
        if err:
            return err
        fields = ["hotel_name", "contact_name", "email", "phone", "city", "website", "language", "status", "notes"]
        for f in fields:
            if f in request.data:
                value = request.data[f]
                if f == "language" and value not in dict(HotelOutreach.LANGUAGE_CHOICES):
                    continue
                setattr(o, f, value)
        o.save()
        return Response(_outreach_data(o))

    def delete(self, request, pk):
        o, err = self._get(pk)
        if err:
            return err
        o.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OutreachSendInviteView(APIView):
    """Admin: send invitation email to a lead and mark invite_sent_at."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            o = HotelOutreach.objects.get(pk=pk)
        except HotelOutreach.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)
        if not o.email:
            return Response({"detail": "No email address on this lead."}, status=400)

        subject, plain, html = _build_trial_email(o)

        try:
            send_mail(subject, plain, getattr(settings, "DEFAULT_FROM_EMAIL", "info@guestflowpro.com"), [o.email], html_message=html, fail_silently=False)
        except Exception as exc:
            return Response({"detail": f"Email failed: {exc}"}, status=500)

        o.invite_sent_at = timezone.now()
        if o.status == "new":
            o.status = "contacted"
        o.save(update_fields=["invite_sent_at", "status", "updated_at"])
        return Response({"detail": "Invite sent.", "invite_sent_at": o.invite_sent_at.isoformat()})


# ── CSV Import ────────────────────────────────────────────────────────────────

class OutreachImportView(APIView):
    """Admin: bulk-import leads from a CSV file."""
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file uploaded."}, status=400)
        try:
            decoded = file.read().decode("utf-8-sig")  # handle Excel BOM
            reader  = csv.DictReader(io.StringIO(decoded))
        except Exception:
            return Response({"detail": "Could not parse file. Upload a UTF-8 CSV."}, status=400)

        created = skipped = 0
        for row in reader:
            name  = (row.get("hotel_name") or row.get("Hotel Name") or row.get("name") or row.get("Name") or row.get("Business Title") or "").strip()
            email = (row.get("email") or row.get("Email") or "").strip().lower()
            if not name:
                skipped += 1
                continue
            if email and HotelOutreach.objects.filter(email__iexact=email).exists():
                skipped += 1
                continue
            phone = (row.get("phone") or row.get("Phone") or row.get("Phone Unformatted") or "").strip()
            HotelOutreach.objects.create(
                hotel_name=name,
                contact_name=(row.get("contact_name") or row.get("Contact Name") or row.get("contact") or "").strip(),
                email=email,
                phone=phone,
                city=(row.get("city") or row.get("City") or "").strip(),
                website=(row.get("website") or row.get("Website") or "").strip(),
                language=_infer_language(row, phone),
            )
            created += 1
        return Response({"created": created, "skipped": skipped})


# ── Email open tracking pixel ─────────────────────────────────────────────────

class OutreachTrackOpenView(APIView):
    """Public: records email open and returns a 1×1 transparent GIF."""
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, token):
        try:
            o = HotelOutreach.objects.get(trial_token=token)
            if not o.email_opened_at:
                o.email_opened_at = timezone.now()
            o.email_open_count += 1
            o.save(update_fields=["email_opened_at", "email_open_count"])
        except HotelOutreach.DoesNotExist:
            pass
        return HttpResponse(_TRACKING_GIF, content_type="image/gif")


# ── Trial activation ──────────────────────────────────────────────────────────

class OutreachTrialActivateView(APIView):
    """
    GET  → return hotel info for the trial page (hotel_name, contact_name, email)
    POST → create User + Hotel with 14-day trial, activate account immediately
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request, token):
        try:
            o = HotelOutreach.objects.get(trial_token=token)
        except HotelOutreach.DoesNotExist:
            return Response({"detail": "Invalid trial link."}, status=404)
        return Response({
            "hotel_name":   o.hotel_name,
            "contact_name": o.contact_name,
            "email":        o.email,
            "city":         o.city,
        })

    def post(self, request, token):
        try:
            o = HotelOutreach.objects.get(trial_token=token)
        except HotelOutreach.DoesNotExist:
            return Response({"detail": "Invalid trial link."}, status=404)

        password = (request.data.get("password") or "").strip()
        if len(password) < 8:
            return Response({"detail": "Password must be at least 8 characters."}, status=400)

        email = o.email
        if not email:
            return Response({"detail": "No email on this invitation."}, status=400)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"detail": "An account with this email already exists. Please log in."}, status=400)

        base = email.split("@")[0]
        username, n = base, 1
        while User.objects.filter(username=username).exists():
            username = f"{base}{n}"; n += 1

        user = User.objects.create_user(username=username, email=email, password=password, is_active=True)

        hotel = Hotel.objects.create(
            name=o.hotel_name,
            city=o.city or "—",
            plan=Hotel.PLAN_CONCIERGE_CHECKIN,
            plan_expires_at=timezone.now() + timedelta(days=14),
            language_default="en",
        )
        HotelUser.objects.create(user=user, hotel=hotel, role="manager")

        # Mark lead as converted
        o.status = "converted"
        o.save(update_fields=["status", "updated_at"])

        return Response({"detail": "Trial activated!", "hotel_id": str(hotel.id)})


# ── Bulk invite ───────────────────────────────────────────────────────────────

class OutreachBulkInviteView(APIView):
    """Admin: send invite to all leads that have an email but haven't been invited yet."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        ids = request.data.get("ids")  # optional list of UUIDs; if absent → all uninvited
        if ids:
            qs = HotelOutreach.objects.filter(id__in=ids, email__gt="")
        else:
            qs = HotelOutreach.objects.filter(email__gt="", invite_sent_at__isnull=True)

        sent = failed = 0
        for o in qs:
            subject, plain, html = _build_trial_email(o)
            try:
                send_mail(subject, plain, getattr(settings, "DEFAULT_FROM_EMAIL", "info@guestflowpro.com"), [o.email], html_message=html, fail_silently=False)
                o.invite_sent_at = timezone.now()
                if o.status == "new":
                    o.status = "contacted"
                o.save(update_fields=["invite_sent_at", "status", "updated_at"])
                sent += 1
            except Exception:
                failed += 1

        return Response({"sent": sent, "failed": failed})


# ── Public: Inbound demo request (from /for-hotels page) ─────────────────────

class DemoRequestView(APIView):
    """
    Public endpoint — no auth required.
    Creates a HotelOutreach record with source noted in `notes`,
    so it appears in the admin outreach dashboard automatically.
    Also sends a notification email to the admin.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        data = request.data
        hotel_name   = (data.get("hotel") or "").strip()
        contact_name = (data.get("name") or "").strip()
        email        = (data.get("email") or "").strip()
        whatsapp     = (data.get("whatsapp") or "").strip()

        if not hotel_name or not email:
            return Response({"detail": "hotel and email are required."}, status=400)

        o = HotelOutreach.objects.create(
            hotel_name=hotel_name,
            contact_name=contact_name,
            email=email,
            phone=whatsapp,
            status="new",
            notes="[Inbound demo request from /for-hotels page]",
        )

        # Notify admin
        admin_email = getattr(settings, "ADMIN_EMAIL", getattr(settings, "DEFAULT_FROM_EMAIL", None))
        if admin_email:
            try:
                send_mail(
                    subject=f"New Demo Request — {hotel_name}",
                    message=(
                        f"A new demo request was submitted:\n\n"
                        f"Hotel:    {hotel_name}\n"
                        f"Contact:  {contact_name}\n"
                        f"Email:    {email}\n"
                        f"WhatsApp: {whatsapp}\n\n"
                        f"View in admin outreach dashboard."
                    ),
                    from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@guestflowpro.com"),
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return Response({"detail": "Demo request received.", "id": str(o.id)}, status=201)


# ── Geo-IP default language ───────────────────────────────────────────────────

_PRIVATE_IP_PREFIXES = ("127.", "10.", "192.168.", "::1")


class GeoLangView(APIView):
    """
    Public: best-effort visitor country -> default UI language.
    Italy -> it, Spain -> es, everything else (including lookup failures
    or local/dev IPs) -> en. Never blocks the page — short timeout, and
    any error just falls back to English.
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        ip = (request.META.get("HTTP_X_FORWARDED_FOR", "").split(",")[0].strip()
              or request.META.get("REMOTE_ADDR", ""))
        country = ""
        if ip and not ip.startswith(_PRIVATE_IP_PREFIXES):
            try:
                req = urllib.request.Request(f"http://ip-api.com/json/{ip}?fields=countryCode")
                with urllib.request.urlopen(req, timeout=3) as resp:
                    country = _json.loads(resp.read()).get("countryCode", "")
            except Exception:
                pass

        lang = {"IT": "it", "ES": "es"}.get(country, "en")
        return Response({"country": country, "lang": lang})
