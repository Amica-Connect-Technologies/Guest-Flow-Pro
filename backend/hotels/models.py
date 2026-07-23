import hashlib
import secrets
import uuid
from django.db import models


class Hotel(models.Model):
    LANGUAGE_CHOICES = [("en", "English"), ("it", "Italian"), ("es", "Spanish"), ("fr", "French"), ("de", "German")]

    # New 4-tier pricing (€)
    PLAN_CONCIERGE         = "concierge"
    PLAN_CHECKIN           = "checkin"
    PLAN_CONCIERGE_CHECKIN = "concierge_checkin"
    PLAN_FULL              = "full"

    PLAN_CHOICES = [
        (PLAN_CONCIERGE,         "Digital Concierge — €25/mo"),
        (PLAN_CHECKIN,           "Digital Check-In — €50/mo"),
        (PLAN_CONCIERGE_CHECKIN, "Concierge + Check-In — €75/mo"),
        (PLAN_FULL,              "Full Suite — €100/mo"),
    ]

    PLAN_FEATURES = {
        PLAN_CONCIERGE: {
            "checkin": False, "crm": False, "booking_requests": False,
            "reviews": False, "concierge": True, "custom_services": True,
            "marketing": False, "guest_export": False, "webhooks": False,
            "api_keys": False, "white_label_color": False, "white_label_msg": False,
            "guest_limit": 200,
        },
        PLAN_CHECKIN: {
            "checkin": True, "crm": False, "booking_requests": True,
            "reviews": False, "concierge": False, "custom_services": False,
            "marketing": False, "guest_export": False, "webhooks": False,
            "api_keys": False, "white_label_color": False, "white_label_msg": False,
            "guest_limit": 500,
        },
        PLAN_CONCIERGE_CHECKIN: {
            "checkin": True, "crm": False, "booking_requests": True,
            "reviews": False, "concierge": True, "custom_services": True,
            "marketing": False, "guest_export": False, "webhooks": False,
            "api_keys": False, "white_label_color": True, "white_label_msg": False,
            "guest_limit": 1000,
        },
        PLAN_FULL: {
            "checkin": True, "crm": True, "booking_requests": True,
            "reviews": True, "concierge": True, "custom_services": True,
            "marketing": True, "guest_export": True, "webhooks": True,
            "api_keys": True, "white_label_color": True, "white_label_msg": True,
            "guest_limit": None,
        },
        # Legacy plans kept for backward compat
        "starter":    {"checkin": True, "crm": True, "booking_requests": True, "reviews": True, "concierge": True, "custom_services": False, "marketing": False, "guest_export": False, "webhooks": False, "api_keys": False, "white_label_color": False, "white_label_msg": False, "guest_limit": 100},
        "pro":        {"checkin": True, "crm": True, "booking_requests": True, "reviews": True, "concierge": True, "custom_services": True, "marketing": True, "guest_export": True, "webhooks": True, "api_keys": False, "white_label_color": True, "white_label_msg": True, "guest_limit": 500},
        "enterprise": {"checkin": True, "crm": True, "booking_requests": True, "reviews": True, "concierge": True, "custom_services": True, "marketing": True, "guest_export": True, "webhooks": True, "api_keys": True, "white_label_color": True, "white_label_msg": True, "guest_limit": None},
    }

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, blank=True, default="Italy")
    whatsapp_number = models.CharField(max_length=30, blank=True)
    language_default = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="en")
    logo = models.ImageField(upload_to="hotel-logos/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    # Extended profile fields
    description   = models.TextField(blank=True)
    address       = models.CharField(max_length=300, blank=True)
    phone         = models.CharField(max_length=30, blank=True)
    email         = models.EmailField(blank=True)
    website       = models.URLField(blank=True)
    check_in_time  = models.CharField(max_length=10, blank=True, default="14:00")
    check_out_time = models.CharField(max_length=10, blank=True, default="11:00")
    wifi_info     = models.CharField(max_length=100, blank=True)
    amenities     = models.JSONField(default=list, blank=True)
    is_24_7       = models.BooleanField(default=False)
    open_time     = models.CharField(max_length=10, blank=True, default="09:00")
    close_time    = models.CharField(max_length=10, blank=True, default="22:00")

    # White-label / branding
    brand_color       = models.CharField(max_length=7, blank=True, default="#0E7490")  # hex
    welcome_message   = models.TextField(blank=True)
    google_review_url = models.URLField(blank=True)
    tripadvisor_url   = models.URLField(blank=True)

    # Subscription plan
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default=PLAN_CONCIERGE)
    plan_expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.city})"

    def can(self, feature: str) -> bool:
        """Check if this hotel's plan includes the given feature."""
        return bool(self.PLAN_FEATURES.get(self.plan, {}).get(feature, False))

    def guest_limit(self) -> int | None:
        """Monthly guest limit — None means unlimited."""
        return self.PLAN_FEATURES.get(self.plan, {}).get("guest_limit", 100)


class HotelGalleryImage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="gallery_images")
    image = models.ImageField(upload_to="hotel-gallery/")
    order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self):
        return f"{self.hotel.name} gallery #{self.order}"


class HotelOutreach(models.Model):
    """Track potential hotel partners contacted by the Amica sales team."""
    STATUS_CHOICES = [
        ("new",         "New Lead"),
        ("contacted",   "Contacted"),
        ("interested",  "Interested"),
        ("negotiating", "Negotiating"),
        ("converted",   "Converted"),
        ("lost",        "Lost"),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel_name   = models.CharField(max_length=200)
    contact_name = models.CharField(max_length=100, blank=True)
    email        = models.EmailField(blank=True)
    phone        = models.CharField(max_length=30, blank=True)
    city         = models.CharField(max_length=100, blank=True)
    website      = models.URLField(blank=True)
    status       = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    notes        = models.TextField(blank=True)
    invite_sent_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.hotel_name} ({self.get_status_display()})"


class APIKey(models.Model):
    """Per-hotel API key for external integrations (n8n, Zapier, custom apps)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="api_keys")
    name = models.CharField(max_length=100)          # e.g. "n8n integration"
    key_prefix = models.CharField(max_length=12)     # first 12 chars — shown in UI
    key_hash = models.CharField(max_length=64)       # SHA-256 of full key — never stored plaintext
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.hotel.name} / {self.name} ({self.key_prefix}…)"

    @classmethod
    def generate(cls, hotel, name: str) -> tuple["APIKey", str]:
        """Create a new key. Returns (APIKey instance, plaintext_key). Store plaintext once — then discard."""
        raw = "gfp_" + secrets.token_urlsafe(32)
        prefix = raw[:12]
        hashed = hashlib.sha256(raw.encode()).hexdigest()
        obj = cls.objects.create(hotel=hotel, name=name, key_prefix=prefix, key_hash=hashed)
        return obj, raw

    @classmethod
    def authenticate(cls, raw_key: str):
        """Return matching active APIKey or None."""
        hashed = hashlib.sha256(raw_key.encode()).hexdigest()
        try:
            key = cls.objects.select_related("hotel").get(key_hash=hashed, is_active=True)
            from django.utils import timezone
            key.last_used_at = timezone.now()
            key.save(update_fields=["last_used_at"])
            return key
        except cls.DoesNotExist:
            return None
