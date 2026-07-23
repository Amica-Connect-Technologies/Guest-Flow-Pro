import json as _json
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from accounts.models import HotelUser
from .models import APIKey, Hotel, HotelGalleryImage, HotelOutreach
from .serializers import HotelGalleryImageSerializer, HotelSerializer
from .plan_permissions import require_feature


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
        "id":             str(o.id),
        "hotel_name":     o.hotel_name,
        "contact_name":   o.contact_name,
        "email":          o.email,
        "phone":          o.phone,
        "city":           o.city,
        "website":        o.website,
        "status":         o.status,
        "notes":          o.notes,
        "invite_sent_at": o.invite_sent_at.isoformat() if o.invite_sent_at else None,
        "created_at":     o.created_at.isoformat(),
        "updated_at":     o.updated_at.isoformat(),
    }


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
        o = HotelOutreach.objects.create(
            hotel_name=hotel_name,
            contact_name=(data.get("contact_name") or "").strip(),
            email=(data.get("email") or "").strip(),
            phone=(data.get("phone") or "").strip(),
            city=(data.get("city") or "").strip(),
            website=(data.get("website") or "").strip(),
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
        fields = ["hotel_name", "contact_name", "email", "phone", "city", "website", "status", "notes"]
        for f in fields:
            if f in request.data:
                setattr(o, f, request.data[f])
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

        signup_url = getattr(settings, "FRONTEND_URL", "https://guestflowpro.com") + "/register"
        subject = f"You're invited to join GuestFlow Pro — {o.hotel_name}"
        body = (
            f"Hi{' ' + o.contact_name if o.contact_name else ''},\n\n"
            "We'd love to have your hotel on GuestFlow Pro — the digital guest experience platform "
            "that handles check-in, reviews, booking requests, and marketing, all in one place.\n\n"
            f"Get started here: {signup_url}\n\n"
            "If you have any questions, just reply to this email.\n\n"
            "Best regards,\nThe GuestFlow Pro Team"
        )
        try:
            send_mail(
                subject,
                body,
                getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@guestflowpro.com"),
                [o.email],
                fail_silently=False,
            )
        except Exception as exc:
            return Response({"detail": f"Email failed: {exc}"}, status=500)

        o.invite_sent_at = timezone.now()
        if o.status == "new":
            o.status = "contacted"
        o.save(update_fields=["invite_sent_at", "status", "updated_at"])
        return Response({"detail": "Invite sent.", "invite_sent_at": o.invite_sent_at.isoformat()})


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
