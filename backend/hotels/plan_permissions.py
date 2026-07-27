"""
Plan-gating helpers for GuestFlow Pro.

Usage in any view:
    from hotels.plan_permissions import require_feature, plan_response

    hotel = _hotel_for(request.user)
    err = require_feature(hotel, "api_keys")
    if err:
        return err
"""
from rest_framework.response import Response

UPGRADE_URLS = {
    # Current 4-tier plans
    "concierge":         "/dashboard/billing?upgrade=concierge_checkin",
    "checkin":           "/dashboard/billing?upgrade=concierge_checkin",
    "concierge_checkin": "/dashboard/billing?upgrade=full",
    "full":              None,
    # Legacy plans kept for backward compat
    "starter":    "/dashboard/billing?upgrade=pro",
    "pro":        "/dashboard/billing?upgrade=enterprise",
    "enterprise": None,
}

PLAN_LABELS = {
    # Current 4-tier plans
    "concierge":         "Digital Concierge",
    "checkin":           "Digital Check-In",
    "concierge_checkin": "Concierge + Check-In",
    "full":              "Full Suite",
    # Legacy plans kept for backward compat
    "starter":    "Starter",
    "pro":        "Professional",
    "enterprise": "Enterprise",
}

# Which plan first unlocks each feature
FEATURE_MINIMUM_PLAN = {
    "checkin":           "checkin",
    "crm":               "full",
    "booking_requests":  "checkin",
    "reviews":           "full",
    "concierge":         "concierge",
    "custom_services":   "concierge",
    "marketing":         "full",
    "guest_export":      "full",
    "webhooks":          "full",
    "api_keys":          "full",
    "white_label_color": "concierge_checkin",
    "white_label_msg":   "full",
}

FEATURE_NAMES = {
    "custom_services":   "Custom service upsells",
    "marketing":         "Marketing analytics",
    "guest_export":      "Guest list CSV export",
    "webhooks":          "Webhooks",
    "api_keys":          "API Keys",
    "white_label_color": "Custom brand color",
    "white_label_msg":   "Custom welcome message",
}


def require_feature(hotel, feature: str) -> Response | None:
    """
    Returns a 403 Response if the hotel's plan does not include the feature,
    or None if access is allowed.
    """
    if hotel is None:
        return None  # admin/staff — always allow

    if hotel.can(feature):
        return None

    required_plan = FEATURE_MINIMUM_PLAN.get(feature, "full")
    feature_name  = FEATURE_NAMES.get(feature, feature)
    current_plan  = PLAN_LABELS.get(hotel.plan, hotel.plan)
    upgrade_url   = f"/dashboard/billing?upgrade={required_plan}"

    return Response(
        {
            "detail": (
                f"'{feature_name}' is not available on your {current_plan} plan. "
                f"Upgrade to {PLAN_LABELS.get(required_plan, required_plan)} to unlock this feature."
            ),
            "code":         "plan_limit",
            "feature":      feature,
            "current_plan": hotel.plan,
            "required_plan": required_plan,
            "upgrade_url":  upgrade_url,
        },
        status=403,
    )


def require_guest_capacity(hotel, count: int = 1) -> Response | None:
    """
    Returns a 403 Response if the hotel has reached its monthly guest limit.
    count = how many new guests are being added in this request.
    """
    if hotel is None:
        return None

    limit = hotel.guest_limit()
    if limit is None:
        return None  # unlimited

    from django.utils import timezone
    from checkin.models import GuestRegistration

    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    used = GuestRegistration.objects.filter(
        booking__hotel=hotel,
        created_at__gte=month_start,
    ).count()

    if used + count > limit:
        return Response(
            {
                "detail": (
                    f"You have reached your monthly guest limit of {limit} on the "
                    f"{PLAN_LABELS.get(hotel.plan, hotel.plan)} plan. "
                    "Upgrade to register more guests this month."
                ),
                "code":         "guest_limit_reached",
                "current_plan": hotel.plan,
                "limit":        limit,
                "used":         used,
                "upgrade_url":  UPGRADE_URLS.get(hotel.plan),
            },
            status=403,
        )

    return None
