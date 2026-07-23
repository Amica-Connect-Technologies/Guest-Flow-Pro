"""
Webhook dispatcher — fires asynchronously (thread) so it never delays a response.
Hooks into: guest_registered, booking_created, review_submitted, booking_request.
"""
import hashlib
import hmac
import json
import logging
import threading
from datetime import datetime

import requests

logger = logging.getLogger(__name__)


def _send(url: str, payload: dict, secret: str):
    body = json.dumps(payload, default=str)
    headers = {"Content-Type": "application/json"}
    if secret:
        sig = hmac.new(secret.encode(), body.encode(), hashlib.sha256).hexdigest()
        headers["X-GuestFlow-Signature"] = f"sha256={sig}"
    try:
        resp = requests.post(url, data=body, headers=headers, timeout=8)
        resp.raise_for_status()
    except Exception as exc:
        logger.warning("Webhook to %s failed: %s", url, exc)


def dispatch(hotel, event: str, data: dict):
    """Fire all matching webhooks for this hotel in background threads."""
    from .models import WebhookConfig
    configs = WebhookConfig.objects.filter(
        hotel=hotel, is_active=True
    ).filter(
        event__in=[event, "all"]
    )
    payload = {
        "event": event,
        "hotel_id": str(hotel.id),
        "hotel_name": hotel.name,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "data": data,
    }
    for cfg in configs:
        t = threading.Thread(target=_send, args=(cfg.url, payload, cfg.secret), daemon=True)
        t.start()
