from rest_framework import serializers
from .models import Hotel, HotelGalleryImage


class HotelGalleryImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = HotelGalleryImage
        fields = ["id", "image_url", "order", "created_at"]

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class HotelSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()
    gallery_images = HotelGalleryImageSerializer(many=True, read_only=True)

    class Meta:
        model = Hotel
        fields = [
            "id", "name", "city", "country", "whatsapp_number", "language_default",
            "logo", "logo_url", "created_at",
            "description", "address", "phone", "email", "website",
            "check_in_time", "check_out_time", "wifi_info", "amenities",
            "is_24_7", "open_time", "close_time",
            "brand_color", "welcome_message", "google_review_url", "tripadvisor_url",
            "gallery_images",
            "plan", "plan_expires_at", "is_trial", "is_verified",
        ]
        extra_kwargs = {"logo": {"write_only": True, "required": False}}

    def get_logo_url(self, obj):
        if not obj.logo:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
