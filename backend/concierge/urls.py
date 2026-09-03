from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.views.static import serve
from hotels.views import DemoRequestView, GeoLangView

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/hotels/", include("hotels.urls")),
    path("api/tours/", include("tours.urls")),
    path("api/places/", include("places.urls")),
    path("api/subscriptions/", include("subscriptions.urls")),
    path("api/", include("services.urls")),
    path("api/checkin/", include("checkin.urls")),
    path("api/marketing/", include("checkin.marketing_urls")),
    # Public: inbound demo request from /for-hotels page
    path("api/demo-requests/", DemoRequestView.as_view(), name="demo-request"),
    # Public: visitor's country -> default UI language (geo-IP)
    path("api/geo-lang/", GeoLangView.as_view(), name="geo-lang"),
    # Serve media files in all environments (nginx can override this for performance)
    re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT}),
]
