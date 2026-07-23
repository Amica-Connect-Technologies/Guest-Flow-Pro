from django.urls import path
from . import views

urlpatterns = [
    # Hotel-authenticated endpoints
    path("bookings/", views.BookingListCreateView.as_view(), name="checkin-bookings"),
    path("bookings/export/", views.ExportCSVView.as_view(), name="checkin-export"),
    path("bookings/stats/", views.CheckinStatsView.as_view(), name="checkin-stats"),
    path("bookings/<uuid:pk>/", views.BookingDetailView.as_view(), name="checkin-booking-detail"),
    path("bookings/<uuid:pk>/send-link/", views.SendCheckinLinkView.as_view(), name="checkin-send-link"),
    path("guests/", views.GuestListView.as_view(), name="checkin-guests"),
    # Booking requests (hotel-authenticated management)
    path("requests/", views.BookingRequestListView.as_view(), name="booking-requests"),
    path("requests/<uuid:pk>/", views.BookingRequestDetailView.as_view(), name="booking-request-detail"),
    # Public: guest submits a booking request
    path("request/<uuid:hotel_id>/", views.PublicBookingRequestView.as_view(), name="public-booking-request"),
    # Reviews (hotel-authenticated management)
    path("reviews/", views.ReviewRequestListView.as_view(), name="review-requests"),
    path("reviews/<uuid:pk>/", views.ReviewRequestDetailView.as_view(), name="review-request-detail"),
    path("reviews/<uuid:pk>/send/", views.ReviewRequestDetailView.as_view(), name="review-request-send"),
    path("bookings/<uuid:booking_pk>/request-review/", views.SendCheckinReviewView.as_view(), name="send-review-for-booking"),
    # Public: guest submits review
    path("review/<uuid:token>/", views.PublicReviewView.as_view(), name="public-review"),
    # Webhook management
    path("webhooks/", views.WebhookListView.as_view(), name="webhooks"),
    path("webhooks/<uuid:pk>/", views.WebhookDetailView.as_view(), name="webhook-detail"),
    # Public guest-facing endpoints (no auth)
    path("verify/<uuid:token>/", views.PublicCheckinVerifyView.as_view(), name="checkin-verify"),
    path("register/<uuid:token>/", views.PublicGuestSubmitView.as_view(), name="checkin-register"),
]
