from rest_framework import viewsets, permissions
from .models import Tour
from .serializers import TourSerializer


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)


class TourViewSet(viewsets.ModelViewSet):
    serializer_class = TourSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Tour.objects.all()
        city = self.request.query_params.get("city")
        if city:
            qs = qs.filter(city__iexact=city)
        return qs

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx
