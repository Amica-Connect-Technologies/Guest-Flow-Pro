from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("checkin", "0003_alter_guestregistration_date_of_birth_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="guestregistration",
            name="marketing_optin",
            field=models.BooleanField(default=False),
        ),
    ]
