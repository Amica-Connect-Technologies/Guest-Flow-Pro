from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("checkin", "0004_add_marketing_optin_to_guestregistration"),
        ("hotels", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="BookingRequest",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("hotel", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="booking_requests", to="hotels.hotel")),
                ("guest_name", models.CharField(max_length=200)),
                ("guest_email", models.EmailField(blank=True)),
                ("guest_phone", models.CharField(blank=True, max_length=30)),
                ("check_in_date", models.DateField()),
                ("check_out_date", models.DateField()),
                ("num_guests", models.PositiveIntegerField(default=1)),
                ("room_type", models.CharField(blank=True, max_length=100)),
                ("message", models.TextField(blank=True)),
                ("status", models.CharField(
                    choices=[("pending", "Pending"), ("confirmed", "Confirmed"), ("declined", "Declined")],
                    default="pending", max_length=20
                )),
                ("hotel_notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
