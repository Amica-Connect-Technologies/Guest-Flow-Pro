from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("checkin", "0006_add_reviewrequest"),
        ("hotels", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WebhookConfig",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("hotel", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="webhooks", to="hotels.hotel")),
                ("url", models.URLField(max_length=500)),
                ("event", models.CharField(
                    choices=[
                        ("guest_registered", "Guest Registered"),
                        ("booking_created", "Booking Created"),
                        ("review_submitted", "Review Submitted"),
                        ("booking_request", "Booking Request Submitted"),
                        ("all", "All Events"),
                    ],
                    default="all", max_length=40,
                )),
                ("secret", models.CharField(blank=True, max_length=100)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
