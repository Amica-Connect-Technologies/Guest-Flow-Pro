from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("hotels", "0006_add_hotel_outreach"),
    ]

    operations = [
        migrations.AddField(
            model_name="hotel",
            name="plan",
            field=models.CharField(
                choices=[
                    ("starter",    "Starter — £49/mo"),
                    ("pro",        "Professional — £99/mo"),
                    ("enterprise", "Enterprise — £199/mo"),
                ],
                default="starter",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="hotel",
            name="plan_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
