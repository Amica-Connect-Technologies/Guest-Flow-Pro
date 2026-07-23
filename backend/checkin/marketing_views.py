"""
Marketing API — hotel-scoped endpoints for email marketing integrations.
Supports both JWT auth (hotel manager) and API Key auth (external tools).
"""
from datetime import date, timedelta

from django.db.models import Avg, Count, Q
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from hotels.authentication import APIKeyAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from accounts.models import HotelUser
from .models import GuestRegistration, ReviewRequest

DUAL_AUTH = [APIKeyAuthentication, JWTAuthentication]


def _hotel_for(request):
    """Return hotel regardless of auth method (JWT user or API key)."""
    user = request.user
    # API key auth — user is _APIKeyUser which has .hotel attribute
    if hasattr(user, "hotel"):
        return user.hotel
    # JWT auth — Django user
    if user.is_staff:
        return None  # admin: sees all hotels
    try:
        return HotelUser.objects.get(user=user).hotel
    except HotelUser.DoesNotExist:
        return None


class MarketingGuestListView(APIView):
    """
    GET /api/marketing/guests/
    Returns opted-in guests — suitable for email campaigns.
    Supports JWT + API Key auth.
    """
    authentication_classes = DUAL_AUTH
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request)
        qs = GuestRegistration.objects.select_related("booking", "booking__hotel").filter(
            marketing_optin=True
        )
        if hotel:
            qs = qs.filter(booking__hotel=hotel)

        # Filters
        nationality = request.query_params.get("nationality", "").strip()
        if nationality:
            qs = qs.filter(nationality__iexact=nationality)

        since = request.query_params.get("since")
        if since:
            try:
                qs = qs.filter(booking__check_in_date__gte=since)
            except ValueError:
                pass

        guests = [
            {
                "id": str(r.id),
                "first_name": r.first_name,
                "last_name": r.last_name,
                "email": r.booking.guest_email,
                "phone": r.booking.guest_phone,
                "nationality": r.nationality,
                "hotel": r.booking.hotel.name,
                "check_in_date": str(r.booking.check_in_date),
                "check_out_date": str(r.booking.check_out_date),
                "registered_at": r.completed_at.isoformat(),
            }
            for r in qs.order_by("-completed_at")
        ]
        return Response({"count": len(guests), "guests": guests})


class MarketingAnalyticsView(APIView):
    """
    GET /api/marketing/analytics/
    Opt-in rate, nationality breakdown, monthly trend, review metrics.
    Supports JWT + API Key auth.
    """
    authentication_classes = DUAL_AUTH
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        hotel = _hotel_for(request)
        qs = GuestRegistration.objects.select_related("booking", "booking__hotel")
        if hotel:
            qs = qs.filter(booking__hotel=hotel)

        total = qs.count()
        opted_in = qs.filter(marketing_optin=True).count()
        opt_in_rate = round((opted_in / total * 100), 1) if total else 0

        # Nationality breakdown (top 10)
        nationality_breakdown = list(
            qs.filter(marketing_optin=True)
            .exclude(nationality="")
            .values("nationality")
            .annotate(count=Count("id"))
            .order_by("-count")[:10]
        )

        # Monthly opt-in trend — last 6 months
        today = date.today()
        monthly = []
        for i in range(5, -1, -1):
            first = (today.replace(day=1) - timedelta(days=i * 28)).replace(day=1)
            if first.month == 12:
                last = first.replace(year=first.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last = first.replace(month=first.month + 1, day=1) - timedelta(days=1)
            count = qs.filter(marketing_optin=True, completed_at__date__range=(first, last)).count()
            monthly.append({"month": first.strftime("%b %Y"), "count": count})

        # Review metrics
        review_qs = ReviewRequest.objects.filter(submitted_at__isnull=False)
        if hotel:
            review_qs = review_qs.filter(booking__hotel=hotel)
        avg_rating = review_qs.aggregate(avg=Avg("rating"))["avg"]

        return Response({
            "total_guests": total,
            "marketing_optins": opted_in,
            "opt_in_rate": opt_in_rate,
            "nationality_breakdown": nationality_breakdown,
            "monthly_trend": monthly,
            "reviews": {
                "total": review_qs.count(),
                "avg_rating": round(avg_rating, 1) if avg_rating else None,
            },
        })
