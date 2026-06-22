"""
Daily cron command — sends check-in reminder emails to guests arriving tomorrow.

VPS cron (runs every day at 09:00 local time):
    0 9 * * * cd ~/Guest-Flow-Pro/backend && python manage.py send_checkin_reminders >> /var/log/checkin_reminders.log 2>&1
"""
from datetime import date, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.core.management.base import BaseCommand
from django.utils import timezone

from checkin.models import Booking, MessageLog


class Command(BaseCommand):
    help = "Send check-in reminder emails to guests arriving tomorrow."

    def handle(self, *args, **options):
        tomorrow = date.today() + timedelta(days=1)
        bookings = (
            Booking.objects
            .select_related("hotel")
            .filter(check_in_date=tomorrow, status=Booking.STATUS_PENDING)
            .exclude(guest_email="")
        )

        sent = failed = skipped = 0
        frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")

        for booking in bookings:
            # Skip if a link was already sent today.
            if booking.link_sent_at and booking.link_sent_at.date() >= date.today():
                skipped += 1
                continue

            link = f"{frontend_url}/checkin/{booking.checkin_token}"
            message = (
                f"Hello {booking.guest_name},\n\n"
                f"Thank you for booking with {booking.hotel.name}.\n\n"
                f"Please complete your secure online check-in before arrival:\n{link}\n\n"
                f"Check-in:  {booking.check_in_date}\n"
                f"Check-out: {booking.check_out_date}\n\n"
                f"Thank you."
            )

            try:
                send_mail(
                    subject=f"Online Check-in – {booking.hotel.name}",
                    message=message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[booking.guest_email],
                    fail_silently=False,
                )
                booking.link_sent_at = timezone.now()
                booking.save(update_fields=["link_sent_at"])
                MessageLog.objects.create(
                    booking=booking, message_type="email",
                    recipient=booking.guest_email, status="sent",
                )
                sent += 1
                self.stdout.write(f"  ✓ {booking.guest_name} <{booking.guest_email}>")
            except Exception as exc:
                MessageLog.objects.create(
                    booking=booking, message_type="email",
                    recipient=booking.guest_email, status="failed",
                    error_message=str(exc),
                )
                failed += 1
                self.stderr.write(f"  ✗ {booking.guest_name}: {exc}")

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone — sent: {sent}, failed: {failed}, skipped (already sent): {skipped}"
            )
        )
