from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HotelViewSet, HotelProfileView,
    HotelGalleryView, HotelGalleryDetailView,
    APIKeyListView, APIKeyDetailView,
    OutreachListView, OutreachDetailView, OutreachSendInviteView,
    OutreachImportView, OutreachTrackOpenView,
    OutreachTrialActivateView, OutreachBulkInviteView,
)

router = DefaultRouter()
router.register(r"", HotelViewSet, basename="hotel")

urlpatterns = [
    path("profile/", HotelProfileView.as_view()),
    path("gallery/", HotelGalleryView.as_view(), name="hotel-gallery"),
    path("gallery/<uuid:pk>/", HotelGalleryDetailView.as_view(), name="hotel-gallery-detail"),
    path("api-keys/", APIKeyListView.as_view(), name="api-keys"),
    path("api-keys/<uuid:pk>/", APIKeyDetailView.as_view(), name="api-key-detail"),
    path("outreach/", OutreachListView.as_view(), name="outreach-list"),
    path("outreach/import/", OutreachImportView.as_view(), name="outreach-import"),
    path("outreach/bulk-invite/", OutreachBulkInviteView.as_view(), name="outreach-bulk-invite"),
    path("outreach/track/<uuid:token>/", OutreachTrackOpenView.as_view(), name="outreach-track"),
    path("outreach/trial/<uuid:token>/", OutreachTrialActivateView.as_view(), name="outreach-trial"),
    path("outreach/<uuid:pk>/", OutreachDetailView.as_view(), name="outreach-detail"),
    path("outreach/<uuid:pk>/invite/", OutreachSendInviteView.as_view(), name="outreach-invite"),
    path("", include(router.urls)),
]
