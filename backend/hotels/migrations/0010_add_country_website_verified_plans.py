from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0009_add_hotel_gallery"),
    ]

    operations = [
        migrations.AddField(
            model_name="hotel",
            name="country",
            field=models.CharField(blank=True, default="Italy", max_length=100),
        ),
        migrations.AddField(
            model_name="hotel",
            name="website",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="hotel",
            name="is_verified",
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name="hotel",
            name="plan",
            field=models.CharField(
                choices=[
                    ("concierge", "Digital Concierge — €25/mo"),
                    ("checkin", "Digital Check-In — €50/mo"),
                    ("concierge_checkin", "Concierge + Check-In — €75/mo"),
                    ("full", "Full Suite — €100/mo"),
                ],
                default="concierge",
                max_length=20,
            ),
        ),
    ]
