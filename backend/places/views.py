import urllib.request
import urllib.parse
import json as _json
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Place
from .serializers import PlaceSerializer

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

AMENITY_TO_TYPE = {
    "restaurant": "restaurant", "fast_food": "restaurant",
    "cafe":       "cafe",
    "bar":        "nightlife", "pub": "nightlife", "nightclub": "nightlife",
    "parking":    "parking",
    "museum":     "museum",
}

TYPE_AMENITIES = {
    "restaurant": ["restaurant", "fast_food"],
    "cafe":       ["cafe"],
    "nightlife":  ["bar", "pub", "nightclub"],
    "parking":    ["parking"],
    "museum":     ["museum"],
}


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class PlaceViewSet(viewsets.ModelViewSet):
    serializer_class = PlaceSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Place.objects.all()
        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(city__iexact=city)
        return qs


class ImportPlacesView(APIView):
    """Admin-only: fetch places from OpenStreetMap and save to DB."""
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        city  = (request.data.get("city") or "").strip()
        ptype = request.data.get("type", "restaurant")
        limit = min(int(request.data.get("limit", 50)), 200)

        if not city:
            return Response({"detail": "city is required."}, status=status.HTTP_400_BAD_REQUEST)
        if ptype not in TYPE_AMENITIES:
            return Response({"detail": f"type must be one of {list(TYPE_AMENITIES)}."},
                            status=status.HTTP_400_BAD_REQUEST)

        amenity_filter = "|".join(TYPE_AMENITIES[ptype])
        query = (
            f'[out:json][timeout:60];'
            f'area["name"~"^{city}$","i"]->.a;'
            f'(node["amenity"~"{amenity_filter}"](area.a);'
            f' way["amenity"~"{amenity_filter}"](area.a););'
            f'out center {limit};'
        )
        try:
            data = urllib.parse.urlencode({"data": query}).encode()
            req  = urllib.request.Request(OVERPASS_URL, data=data)
            req.add_header("User-Agent", "GuestFlowPro/1.0")
            with urllib.request.urlopen(req, timeout=90) as resp:
                elements = _json.loads(resp.read())["elements"]
        except Exception as exc:
            return Response({"detail": f"Overpass API error: {exc}"},
                            status=status.HTTP_502_BAD_GATEWAY)

        created = skipped = 0
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:en")
            if not name:
                skipped += 1
                continue
            if Place.objects.filter(city__iexact=city, name__iexact=name).exists():
                skipped += 1
                continue

            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lon = el.get("lon") or (el.get("center") or {}).get("lon")
            amenity    = tags.get("amenity", "")
            place_type = AMENITY_TO_TYPE.get(amenity, ptype)

            addr_parts = [tags.get(k, "") for k in
                          ("addr:housenumber", "addr:street", "addr:suburb", "addr:city")]
            address = ", ".join(p for p in addr_parts if p)

            Place.objects.create(
                city=city, name=name, type=place_type,
                description=tags.get("description") or tags.get("cuisine") or "",
                address=address,
                google_maps_link=f"https://www.google.com/maps?q={lat},{lon}" if lat and lon else "",
            )
            created += 1

        return Response({"created": created, "skipped": skipped, "city": city, "type": ptype})
