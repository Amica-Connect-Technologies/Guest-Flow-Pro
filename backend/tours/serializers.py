from rest_framework import serializers
from .models import Tour


class TourSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Tour
        fields = ["id", "city", "title", "description", "image", "image_url", "price", "provider", "affiliate_link", "created_at"]
        extra_kwargs = {"image": {"write_only": True, "required": False}}

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        request = self.context.get("request")
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url
