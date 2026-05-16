"""
Management command: import restaurant/cafe data from OpenStreetMap (free, no API key).

Usage:
    python manage.py import_places --city Lahore
    python manage.py import_places --city Rome --type cafe --limit 30
    python manage.py import_places --city "New York" --type restaurant --limit 100
"""
import urllib.request
import urllib.parse
import json
from django.core.management.base import BaseCommand
from places.models import Place

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
UA = "GuestFlowPro/1.0 (contact@guestflowpro.com)"

AMENITY_TO_TYPE = {
    "restaurant": "restaurant",
    "fast_food":  "restaurant",
    "cafe":       "cafe",
    "bar":        "nightlife",
    "pub":        "nightlife",
    "nightclub":  "nightlife",
    "parking":    "parking",
    "museum":     "museum",
    "attraction": "attraction",
}


def geocode_city(city: str) -> tuple:
    """Return (south, west, north, east) bounding box via Nominatim."""
    url = NOMINATIM_URL + "?" + urllib.parse.urlencode({"q": city, "format": "json", "limit": 1})
    req = urllib.request.Request(url)
    req.add_header("User-Agent", UA)
    with urllib.request.urlopen(req, timeout=15) as resp:
        results = json.loads(resp.read())
    if not results:
        raise ValueError(f"City '{city}' not found.")
    bb = results[0]["boundingbox"]  # [south, north, west, east]
    return float(bb[0]), float(bb[2]), float(bb[1]), float(bb[3])


def fetch_overpass(south: float, west: float, north: float, east: float,
                   amenities: list, limit: int) -> list:
    bbox   = f"{south},{west},{north},{east}"
    amenity_filter = "|".join(amenities)
    query = (
        f"[out:json][timeout:60];"
        f"(node[\"amenity\"~\"{amenity_filter}\"][\"name\"]({bbox});"
        f"way[\"amenity\"~\"{amenity_filter}\"][\"name\"]({bbox}););"
        f"out center {limit};"
    )
    data = urllib.parse.urlencode({"data": query}).encode()
    req  = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("User-Agent", UA)
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.loads(resp.read())["elements"]


def build_address(tags: dict) -> str:
    parts = []
    for key in ("addr:housenumber", "addr:street", "addr:suburb", "addr:city"):
        if tags.get(key):
            parts.append(tags[key])
    return ", ".join(parts)


def build_maps_link(lat: float, lon: float) -> str:
    return f"https://www.google.com/maps?q={lat},{lon}"


class Command(BaseCommand):
    help = "Import places from OpenStreetMap Overpass API into the Places database"

    def add_arguments(self, parser):
        parser.add_argument("--city",  required=True, help="City name (e.g. Lahore, Rome)")
        parser.add_argument("--type",  default="restaurant",
                            choices=["restaurant", "cafe", "nightlife", "parking", "all"],
                            help="Type of places to import (default: restaurant)")
        parser.add_argument("--limit", type=int, default=50,
                            help="Max results to fetch from Overpass (default: 50)")
        parser.add_argument("--clear", action="store_true",
                            help="Delete existing places of this type in this city before importing")

    def handle(self, *args, **options):
        city  = options["city"]
        ptype = options["type"]
        limit = options["limit"]

        if ptype == "all":
            amenities = list(AMENITY_TO_TYPE.keys())
        elif ptype == "restaurant":
            amenities = ["restaurant", "fast_food"]
        elif ptype == "cafe":
            amenities = ["cafe"]
        elif ptype == "nightlife":
            amenities = ["bar", "pub", "nightclub"]
        elif ptype == "parking":
            amenities = ["parking"]
        else:
            amenities = [ptype]

        if options["clear"]:
            deleted, _ = Place.objects.filter(city__iexact=city, type=ptype).delete()
            self.stdout.write(f"Deleted {deleted} existing {ptype} places in {city}")

        self.stdout.write(f"Geocoding '{city}'…")
        try:
            south, west, north, east = geocode_city(city)
            self.stdout.write(f"  Bounding box: {south:.4f},{west:.4f} → {north:.4f},{east:.4f}")
        except Exception as exc:
            self.stderr.write(f"Geocoding error: {exc}")
            return

        self.stdout.write(f"Fetching up to {limit} {ptype} places in {city} from OpenStreetMap…")
        try:
            elements = fetch_overpass(south, west, north, east, amenities, limit)
        except Exception as exc:
            self.stderr.write(f"Overpass API error: {exc}")
            return

        created = skipped = 0
        for el in elements:
            tags = el.get("tags", {})
            name = tags.get("name") or tags.get("name:en")
            if not name:
                skipped += 1
                continue

            # Get coordinates (nodes have lat/lon; ways have center)
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lon = el.get("lon") or (el.get("center") or {}).get("lon")

            amenity    = tags.get("amenity", "")
            place_type = AMENITY_TO_TYPE.get(amenity, "other")

            # Skip if already in DB (same city + name)
            if Place.objects.filter(city__iexact=city, name__iexact=name).exists():
                skipped += 1
                continue

            Place.objects.create(
                city=city,
                name=name,
                type=place_type,
                description=tags.get("description") or tags.get("cuisine") or "",
                address=build_address(tags),
                google_maps_link=build_maps_link(lat, lon) if lat and lon else "",
            )
            created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done — created {created} places, skipped {skipped} (no name or duplicate)"
        ))
