from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, HotelProfileView

router = DefaultRouter()
router.register(r"", HotelViewSet, basename="hotel")

urlpatterns = [
    path("profile/", HotelProfileView.as_view()),
    path("", include(router.urls)),
]
