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
    "parking":    ["parking", "parking_entrance"],
    "museum":     ["museum"],
}

# These types often have no OSM name — don't filter by ["name"], auto-generate instead
NAME_OPTIONAL_TYPES = {"parking"}


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


def _geocode_city(city: str) -> tuple[float, float, float, float]:
    """Return (south, west, north, east) bounding box via Nominatim."""
    url = (
        "https://nominatim.openstreetmap.org/search?"
        + urllib.parse.urlencode({"q": city, "format": "json", "limit": 1})
    )
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "GuestFlowPro/1.0 (contact@guestflowpro.com)")
    with urllib.request.urlopen(req, timeout=15) as resp:
        results = _json.loads(resp.read())
    if not results:
        raise ValueError(f"City '{city}' not found via Nominatim geocoding.")
    bb = results[0]["boundingbox"]  # [south, north, west, east]
    return float(bb[0]), float(bb[2]), float(bb[1]), float(bb[3])


def _fetch_overpass(south: float, west: float, north: float, east: float,
                    amenity_filter: str, limit: int, require_name: bool = True) -> list[dict]:
    """Fetch OSM nodes/ways within a bounding box."""
    bbox       = f"{south},{west},{north},{east}"
    name_filter = '["name"]' if require_name else ""
    query = (
        f"[out:json][timeout:60];"
        f"("
        f'node["amenity"~"{amenity_filter}"]{name_filter}({bbox});'
        f'way["amenity"~"{amenity_filter}"]{name_filter}({bbox});'
        f");"
        f"out center {limit};"
    )
    data = urllib.parse.urlencode({"data": query}).encode()
    req  = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("User-Agent", "GuestFlowPro/1.0 (contact@guestflowpro.com)")
    with urllib.request.urlopen(req, timeout=90) as resp:
        return _json.loads(resp.read())["elements"]


def _save_elements(elements: list[dict], city: str, ptype: str) -> tuple[int, int]:
    created = skipped = counter = 0
    for el in elements:
        tags   = el.get("tags", {})
        lat    = el.get("lat") or (el.get("center") or {}).get("lat")
        lon    = el.get("lon") or (el.get("center") or {}).get("lon")

        addr_parts = [tags.get(k, "") for k in
                      ("addr:housenumber", "addr:street", "addr:suburb", "addr:city")]
        address = ", ".join(p for p in addr_parts if p)

        name = tags.get("name") or tags.get("name:en")
        if not name:
            # Auto-generate a name for unnamed places (common for parking)
            counter += 1
            if address:
                name = f"{ptype.capitalize()} Area — {address.split(',')[0]}"
            elif lat and lon:
                name = f"{ptype.capitalize()} Area #{counter}"
            else:
                skipped += 1
                continue

        if Place.objects.filter(city__iexact=city, name__iexact=name).exists():
            skipped += 1
            continue

        Place.objects.create(
            city=city,
            name=name,
            type=AMENITY_TO_TYPE.get(tags.get("amenity", ""), ptype),
            description=tags.get("description") or tags.get("parking") or "",
            address=address,
            google_maps_link=f"https://www.google.com/maps?q={lat},{lon}" if lat and lon else "",
        )
        created += 1
    return created, skipped


class ImportPlacesView(APIView):
    """Admin-only: geocode city → fetch from Overpass → save to DB."""
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

        # Step 1: geocode city → bounding box
        try:
            south, west, north, east = _geocode_city(city)
        except Exception as exc:
            return Response({"detail": f"Geocoding error: {exc}"},
                            status=status.HTTP_502_BAD_GATEWAY)

        # Step 2: query Overpass with bounding box
        amenity_filter = "|".join(TYPE_AMENITIES[ptype])
        require_name   = ptype not in NAME_OPTIONAL_TYPES
        try:
            elements = _fetch_overpass(south, west, north, east, amenity_filter, limit, require_name)
        except Exception as exc:
            return Response({"detail": f"Overpass API error: {exc}"},
                            status=status.HTTP_502_BAD_GATEWAY)

        # Step 3: save to DB
        created, skipped = _save_elements(elements, city, ptype)
        return Response({"created": created, "skipped": skipped, "city": city, "type": ptype})
