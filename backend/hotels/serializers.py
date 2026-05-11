from rest_framework import serializers
from .models import Hotel


class HotelSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = ["id", "name", "city", "whatsapp_number", "language_default", "logo", "logo_url", "created_at"]
        extra_kwargs = {"logo": {"write_only": True, "required": False}}

    def get_logo_url(self, obj):
        if not obj.logo:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
