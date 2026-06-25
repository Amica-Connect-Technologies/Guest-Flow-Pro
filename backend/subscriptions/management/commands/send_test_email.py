"""
Management command to send a test welcome + approved email with dummy data.
Usage:
    python manage.py send_test_email
    python manage.py send_test_email --to someone@example.com --type approved
"""
from django.core.management.base import BaseCommand
from subscriptions.emails import send_welcome_email, send_approved_email


class FakeRegistration:
    """Dummy registration object — no DB needed."""
    def __init__(self, to_email):
        self.owner_name      = "Kashaf Allah Ditta"
        self.business_name   = "Grand Milano Hotel"
        self.email           = to_email
        self.city            = "Milan"
        self.phone           = "+39 333 123 4567"
        self.whatsapp_number = "+39 333 123 4567"
        self.plan            = "pro"
        self.payment_method  = "bank_transfer"


class Command(BaseCommand):
    help = "Send a test email (welcome or approved) with dummy data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--to", default="kashafallahditta@gmail.com",
            help="Recipient email address",
        )
        parser.add_argument(
            "--type", default="both",
            choices=["welcome", "approved", "both"],
            help="Which email type to send (default: both)",
        )

    def handle(self, *args, **options):
        to_email  = options["to"]
        email_type = options["type"]
        reg = FakeRegistration(to_email)

        self.stdout.write(f"\nSending test email(s) to: {to_email}\n")

        if email_type in ("welcome", "both"):
            self.stdout.write("  [1/2] Sending WELCOME email ... ", ending="")
            try:
                send_welcome_email(reg)
                self.stdout.write(self.style.SUCCESS("SENT"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"FAILED: {e}"))

        if email_type in ("approved", "both"):
            self.stdout.write("  [2/2] Sending APPROVED email ... ", ending="")
            try:
                send_approved_email(reg)
                self.stdout.write(self.style.SUCCESS("SENT"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"FAILED: {e}"))

        self.stdout.write("\nDone. Check inbox (and spam folder).\n")
