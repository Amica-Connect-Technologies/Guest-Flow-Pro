import uuid
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0005_add_apikey"),
    ]

    operations = [
        migrations.CreateModel(
            name="HotelOutreach",
            fields=[
                ("id",           models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("hotel_name",   models.CharField(max_length=200)),
                ("contact_name", models.CharField(max_length=100, blank=True)),
                ("email",        models.EmailField(blank=True)),
                ("phone",        models.CharField(max_length=30, blank=True)),
                ("city",         models.CharField(max_length=100, blank=True)),
                ("website",      models.URLField(blank=True)),
                ("status",       models.CharField(
                    choices=[
                        ("new",         "New Lead"),
                        ("contacted",   "Contacted"),
                        ("interested",  "Interested"),
                        ("negotiating", "Negotiating"),
                        ("converted",   "Converted"),
                        ("lost",        "Lost"),
                    ],
                    default="new",
                    max_length=20,
                )),
                ("notes",          models.TextField(blank=True)),
                ("invite_sent_at", models.DateTimeField(blank=True, null=True)),
                ("created_at",     models.DateTimeField(auto_now_add=True)),
                ("updated_at",     models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["-updated_at"]},
        ),
    ]
