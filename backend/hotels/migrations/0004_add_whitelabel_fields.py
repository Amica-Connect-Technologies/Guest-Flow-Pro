from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0003_add_opening_hours"),
    ]

    operations = [
        migrations.AddField(
            model_name="hotel",
            name="brand_color",
            field=models.CharField(blank=True, default="#0E7490", max_length=7),
        ),
        migrations.AddField(
            model_name="hotel",
            name="welcome_message",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="hotel",
            name="google_review_url",
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name="hotel",
            name="tripadvisor_url",
            field=models.URLField(blank=True),
        ),
    ]
