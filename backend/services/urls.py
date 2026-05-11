from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceViewSet, BookingCreateView, BookingListView, BookingUpdateView

router = DefaultRouter()
router.register("services", ServiceViewSet, basename="service")

urlpatterns = router.urls + [
    path("bookings/", BookingListView.as_view()),
    path("bookings/create/", BookingCreateView.as_view()),
    path("bookings/<uuid:pk>/", BookingUpdateView.as_view()),
]
