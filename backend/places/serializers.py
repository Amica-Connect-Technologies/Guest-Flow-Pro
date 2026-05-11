from rest_framework import serializers
from .models import Place


class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Place
        fields = ["id", "city", "name", "type", "description", "address", "google_maps_link", "created_at"]
