from django.urls import path
from . import views

urlpatterns = [
    # Hotel-authenticated endpoints
    path("bookings/", views.BookingListCreateView.as_view(), name="checkin-bookings"),
    path("bookings/export/", views.ExportCSVView.as_view(), name="checkin-export"),
    path("bookings/stats/", views.CheckinStatsView.as_view(), name="checkin-stats"),
    path("bookings/<uuid:pk>/", views.BookingDetailView.as_view(), name="checkin-booking-detail"),
    path("bookings/<uuid:pk>/send-link/", views.SendCheckinLinkView.as_view(), name="checkin-send-link"),
    # Public guest-facing endpoints (no auth)
    path("verify/<uuid:token>/", views.PublicCheckinVerifyView.as_view(), name="checkin-verify"),
    path("register/<uuid:token>/", views.PublicGuestSubmitView.as_view(), name="checkin-register"),
]
