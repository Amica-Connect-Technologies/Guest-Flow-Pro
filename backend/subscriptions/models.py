import uuid
from django.db import models
from django.contrib.auth.models import User


class Registration(models.Model):
    STATUS_CHOICES = [
        ("pending_payment", "Pending Payment"),
        ("pending_review", "Pending Admin Review"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]
    PLAN_CHOICES = [
        ("concierge",         "Digital Concierge — £25/mo"),
        ("checkin",           "Digital Check-In — £50/mo"),
        ("concierge_checkin", "Concierge + Check-In — £75/mo"),
        ("full",              "Full Suite — £100/mo"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner_name = models.CharField(max_length=200)
    business_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=30, blank=True)
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=100, blank=True, default="Italy")
    whatsapp_number = models.CharField(max_length=30, blank=True)
    website = models.URLField(blank=True)
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default="concierge")

    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="registration")
    hotel = models.ForeignKey("hotels.Hotel", on_delete=models.SET_NULL, null=True, blank=True)

    PAYMENT_METHOD_CHOICES = [
        ("bank_transfer", "Bank Transfer"),
        ("invoice", "Invoice / Pay Later"),
        ("stripe", "Stripe Card"),
    ]

    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="bank_transfer")

    stripe_session_id = models.CharField(max_length=300, blank=True)
    stripe_customer_id = models.CharField(max_length=300, blank=True)
    stripe_subscription_id = models.CharField(max_length=300, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending_payment")
    rejection_reason = models.TextField(blank=True)

    # Bank transfer proof
    transaction_id = models.CharField(max_length=200, blank=True)
    payment_proof = models.ImageField(upload_to="payment_proofs/", blank=True, null=True)
    payment_note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.business_name} ({self.email}) – {self.status}"
