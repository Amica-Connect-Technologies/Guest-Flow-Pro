from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/hotels/", include("hotels.urls")),
    path("api/tours/", include("tours.urls")),
    path("api/places/", include("places.urls")),
    path("api/subscriptions/", include("subscriptions.urls")),
    path("api/", include("services.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
