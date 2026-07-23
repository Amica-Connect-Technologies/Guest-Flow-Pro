from django.urls import path
from . import marketing_views

urlpatterns = [
    path("guests/",    marketing_views.MarketingGuestListView.as_view(), name="marketing-guests"),
    path("analytics/", marketing_views.MarketingAnalyticsView.as_view(), name="marketing-analytics"),
]
