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


def _geocode_google(location: str) -> tuple[float, float]:
    from django.conf import settings as _s
    url = (
        "https://maps.googleapis.com/maps/api/geocode/json?"
        + urllib.parse.urlencode({"address": location, "key": _s.GOOGLE_GEOCODING_API_KEY})
    )
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "GuestFlowPro/1.0")
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = _json.loads(resp.read())
    if data.get("status") != "OK":
        raise ValueError(f"Geocoding failed: {data.get('status')} – {data.get('error_message', '')}")
    loc = data["results"][0]["geometry"]["location"]
    return float(loc["lat"]), float(loc["lng"])


def _nearby_google(lat: float, lng: float, google_type: str, radius: int = 2000) -> list:
    from django.conf import settings as _s
    key = _s.GOOGLE_PLACES_API_KEY
    url = (
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
        + urllib.parse.urlencode({"location": f"{lat},{lng}", "radius": radius, "type": google_type, "key": key})
    )
    req = urllib.request.Request(url)
    req.add_header("User-Agent", "GuestFlowPro/1.0")
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = _json.loads(resp.read())
    if data.get("status") not in ("OK", "ZERO_RESULTS"):
        raise ValueError(f"Places API: {data.get('status')} – {data.get('error_message', '')}")
    results = []
    for place in data.get("results", [])[:12]:
        photo_url = None
        if place.get("photos"):
            ref = place["photos"][0]["photo_reference"]
            photo_url = (
                f"https://maps.googleapis.com/maps/api/place/photo"
                f"?maxwidth=400&photo_reference={ref}&key={key}"
            )
        results.append({
            "place_id": place["place_id"],
            "name": place["name"],
            "address": place.get("vicinity", ""),
            "rating": place.get("rating"),
            "user_ratings_total": place.get("user_ratings_total", 0),
            "lat": place["geometry"]["location"]["lat"],
            "lng": place["geometry"]["location"]["lng"],
            "maps_link": f"https://www.google.com/maps/place/?q=place_id:{place['place_id']}",
            "open_now": place.get("opening_hours", {}).get("open_now"),
            "price_level": place.get("price_level"),
            "photo_url": photo_url,
            "ai_description": None,
            "types": place.get("types", []),
        })
    return results


def _ai_describe(places: list, ptype: str, city: str) -> list:
    from django.conf import settings as _s
    key = getattr(_s, "OPENAI_API_KEY", "")
    if not places or not key:
        return places
    names = [p["name"] for p in places[:6]]
    prompt = (
        f"You are a friendly hotel concierge in {city}. For each of these nearby {ptype}s, "
        f"write ONE engaging sentence (max 18 words) that tells a hotel guest why they should visit. "
        f"Return ONLY a JSON array of strings in the same order.\n\nPlaces: {_json.dumps(names)}"
    )
    payload = _json.dumps({
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 400,
        "temperature": 0.7,
    }).encode()
    api_req = urllib.request.Request("https://api.openai.com/v1/chat/completions", data=payload)
    api_req.add_header("Content-Type", "application/json")
    api_req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(api_req, timeout=25) as resp:
            result = _json.loads(resp.read())
        descriptions = _json.loads(result["choices"][0]["message"]["content"])
        for i, desc in enumerate(descriptions[: len(places)]):
            places[i]["ai_description"] = str(desc)
    except Exception:
        pass
    return places


class NearbyPlacesView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from hotels.models import Hotel as HotelModel
        hotel_id = request.query_params.get("hotel_id", "").strip()
        ptype = request.query_params.get("type", "restaurant")
        if not hotel_id:
            return Response({"detail": "hotel_id required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            hotel = HotelModel.objects.get(id=hotel_id)
        except HotelModel.DoesNotExist:
            return Response({"detail": "Hotel not found."}, status=status.HTTP_404_NOT_FOUND)

        location = f"{hotel.address}, {hotel.city}" if getattr(hotel, "address", "") else hotel.city
        try:
            lat, lng = _geocode_google(location)
        except Exception as exc:
            return Response({"detail": f"Geocoding error: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        google_type_map = {
            "restaurant": "restaurant",
            "parking": "parking",
            "nightlife": "night_club",
            "places": "tourist_attraction",
            "cafe": "cafe",
        }
        google_type = google_type_map.get(ptype, "tourist_attraction")
        try:
            places = _nearby_google(lat, lng, google_type)
        except Exception as exc:
            return Response({"detail": f"Places API error: {exc}"}, status=status.HTTP_502_BAD_GATEWAY)

        if ptype in ("restaurant", "places"):
            places = _ai_describe(places, ptype, hotel.city)

        return Response({"places": places, "lat": lat, "lng": lng})


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
