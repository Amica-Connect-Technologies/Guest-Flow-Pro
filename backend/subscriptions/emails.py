import os
from datetime import date
from email.mime.image import MIMEImage

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

# Logo bundled with the backend — works on localhost AND production without any URL
LOGO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static", "logo.jpeg")
LOGO_CID  = "guestflowpro_logo"


def _frontend_url():
    return getattr(settings, "FRONTEND_URL", "https://guestflowpro.com").rstrip("/")


def _build_msg(subject, text_body, html_body, to_email):
    """Build EmailMultiAlternatives with logo as inline CID attachment."""
    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    # Switch to multipart/related so CID images render inline
    msg.mixed_subtype = "related"
    msg.attach_alternative(html_body, "text/html")

    # Attach logo inline
    if os.path.exists(LOGO_PATH):
        with open(LOGO_PATH, "rb") as f:
            logo = MIMEImage(f.read(), _subtype="jpeg")
            logo.add_header("Content-ID", f"<{LOGO_CID}>")
            logo.add_header("Content-Disposition", "inline", filename="logo.jpeg")
            msg.attach(logo)

    return msg


def send_welcome_email(registration):
    """Sent immediately when a partner submits the registration form."""
    first_name   = registration.owner_name.split()[0] if registration.owner_name else "Partner"
    frontend_url = _frontend_url()

    plan_display = {"basic": "Basic - 29 GBP/month", "pro": "Pro - 79 GBP/month"}.get(
        registration.plan, registration.plan.title()
    )
    method_display = {
        "bank_transfer": "Bank Transfer",
        "invoice":       "Invoice",
        "stripe":        "Credit/Debit Card",
    }.get(registration.payment_method, registration.payment_method.replace("_", " ").title())

    context = {
        "first_name":    first_name,
        "business_name": registration.business_name,
        "email":         registration.email,
        "logo_cid":      LOGO_CID,
        "frontend_url":  frontend_url,
        "year":          date.today().year,
        "summary_rows": [
            {"label": "Full Name",       "value": registration.owner_name},
            {"label": "Business",        "value": registration.business_name},
            {"label": "City",            "value": registration.city},
            {"label": "Plan",            "value": plan_display},
            {"label": "Payment Method",  "value": method_display},
            {"label": "Email",           "value": registration.email},
        ],
    }

    subject = (
        f"Welcome to Guest Flow Pro - Registration received, {first_name}!"
    )
    text_body = (
        f"Hi {first_name},\n\n"
        f"Thank you for registering {registration.business_name} with Guest Flow Pro.\n\n"
        f"Our team will review your application within 1-2 business days.\n\n"
        f"Plan: {plan_display}\nPayment: {method_display}\n\n"
        f"Questions? Email: info@amicaconnect.com\n\n"
        f"The Guest Flow Pro Team\n{frontend_url}"
    )
    html_body = render_to_string("emails/welcome.html", context)

    msg = _build_msg(subject, text_body, html_body, registration.email)
    try:
        msg.send(fail_silently=False)
    except Exception:
        pass


def send_approved_email(registration):
    """Sent when admin approves a registration."""
    first_name   = registration.owner_name.split()[0] if registration.owner_name else "Partner"
    frontend_url = _frontend_url()
    plan_display = {"basic": "Basic", "pro": "Pro"}.get(registration.plan, registration.plan.title())

    context = {
        "first_name":    first_name,
        "business_name": registration.business_name,
        "email":         registration.email,
        "plan":          plan_display,
        "logo_cid":      LOGO_CID,
        "frontend_url":  frontend_url,
        "login_url":     f"{frontend_url}/login",
        "year":          date.today().year,
    }

    subject = f"Your Guest Flow Pro account is approved - Welcome, {first_name}!"
    text_body = (
        f"Hi {first_name},\n\n"
        f"Your registration for {registration.business_name} has been approved!\n\n"
        f"Login at: {frontend_url}/login\n"
        f"Email: {registration.email}\n"
        f"Plan: {plan_display}\n\n"
        f"Questions? Email: info@amicaconnect.com\n\nThe Guest Flow Pro Team"
    )
    html_body = render_to_string("emails/approved.html", context)

    msg = _build_msg(subject, text_body, html_body, registration.email)
    try:
        msg.send(fail_silently=False)
    except Exception:
        pass
