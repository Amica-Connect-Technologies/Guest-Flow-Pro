import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0010_add_country_website_verified_plans"),
    ]

    operations = [
        migrations.AddField(
            model_name="hoteloutreach",
            name="trial_token",
            field=models.UUIDField(default=uuid.uuid4, unique=True),
        ),
        migrations.AddField(
            model_name="hoteloutreach",
            name="email_opened_at",
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name="hoteloutreach",
            name="email_open_count",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
