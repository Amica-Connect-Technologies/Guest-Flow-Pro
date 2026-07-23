from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("checkin", "0005_add_bookingrequest"),
    ]

    operations = [
        migrations.CreateModel(
            name="ReviewRequest",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("booking", models.OneToOneField(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="review_request",
                    to="checkin.booking",
                )),
                ("review_token", models.UUIDField(default=uuid.uuid4, unique=True)),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("rating", models.PositiveSmallIntegerField(blank=True, null=True)),
                ("comment", models.TextField(blank=True)),
                ("submitted_at", models.DateTimeField(blank=True, null=True)),
                ("google_review_url", models.URLField(blank=True)),
                ("tripadvisor_url", models.URLField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
