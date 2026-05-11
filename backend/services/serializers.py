from rest_framework import serializers
from .models import HotelService, ServiceBooking


class HotelServiceSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField(read_only=True)
    image = serializers.ImageField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = HotelService
        fields = [
            "id", "name", "description", "category", "price",
            "image", "image_url", "is_available", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
        return None


class ServiceBookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name", read_only=True)
    service_category = serializers.CharField(source="service.category", read_only=True)
    service_price = serializers.DecimalField(
        source="service.price", max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = ServiceBooking
        fields = [
            "id", "service", "service_name", "service_category", "service_price",
            "guest_name", "guest_phone", "guest_room",
            "quantity", "notes",
            "payment_method", "payment_status", "status",
            "total_price", "created_at",
        ]
        read_only_fields = ["id", "total_price", "created_at", "payment_status"]
