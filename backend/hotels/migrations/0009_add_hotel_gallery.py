import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0008_alter_hotel_language_default"),
    ]

    operations = [
        migrations.CreateModel(
            name="HotelGalleryImage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("image", models.ImageField(upload_to="hotel-gallery/")),
                ("order", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "hotel",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="gallery_images",
                        to="hotels.hotel",
                    ),
                ),
            ],
            options={
                "ordering": ["order", "created_at"],
            },
        ),
    ]
