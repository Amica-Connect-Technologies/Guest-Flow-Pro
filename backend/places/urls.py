from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlaceViewSet, ImportPlacesView

router = DefaultRouter()
router.register(r"", PlaceViewSet, basename="place")

urlpatterns = [
    path("import/", ImportPlacesView.as_view()),
    path("", include(router.urls)),
]
