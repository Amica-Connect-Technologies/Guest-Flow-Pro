from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='hotelservice',
            name='category',
            field=models.CharField(
                choices=[
                    ('food',         'Food & Drinks'),
                    ('room',         'Room Service'),
                    ('breakfast',    'Breakfast'),
                    ('bar',          'Bar & Drinks'),
                    ('nightlife',    'Night Life'),
                    ('massage',      'Massage & Wellness'),
                    ('spa',          'Spa & Beauty'),
                    ('gym',          'Gym & Fitness'),
                    ('transport',    'Transport'),
                    ('laundry',      'Laundry'),
                    ('housekeeping', 'Housekeeping'),
                    ('concierge',    'Concierge'),
                    ('business',     'Business Services'),
                    ('other',        'Other'),
                ],
                default='other',
                max_length=20,
            ),
        ),
    ]
