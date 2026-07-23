from rest_framework import serializers
from .models import Registration


class RegistrationSerializer(serializers.ModelSerializer):
    payment_proof_url = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = [
            "id", "owner_name", "business_name", "email", "phone",
            "city", "whatsapp_number", "plan", "payment_method", "status",
            "rejection_reason", "transaction_id", "payment_note",
            "payment_proof_url", "created_at", "reviewed_at",
        ]
        read_only_fields = ["id", "status", "rejection_reason", "created_at", "reviewed_at"]

    def get_payment_proof_url(self, obj):
        if obj.payment_proof:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.payment_proof.url)
        return None


class RegisterRequestSerializer(serializers.Serializer):
    owner_name = serializers.CharField(max_length=200)
    business_name = serializers.CharField(max_length=200)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    phone = serializers.CharField(max_length=30, allow_blank=True, required=False)
    city = serializers.CharField(max_length=100)
    country = serializers.CharField(max_length=100, allow_blank=True, required=False)
    whatsapp_number = serializers.CharField(max_length=30, allow_blank=True, required=False)
    website = serializers.URLField(allow_blank=True, required=False)
    plan = serializers.ChoiceField(choices=["concierge", "checkin", "concierge_checkin", "full"])
    payment_method = serializers.ChoiceField(choices=["bank_transfer", "invoice", "stripe"], default="bank_transfer")
