from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0004_add_whitelabel_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="APIKey",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("hotel", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="api_keys", to="hotels.hotel")),
                ("name", models.CharField(max_length=100)),
                ("key_prefix", models.CharField(max_length=12)),
                ("key_hash", models.CharField(max_length=64)),
                ("is_active", models.BooleanField(default=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
