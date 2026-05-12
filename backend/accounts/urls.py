from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, LogoutView, MeView, AdminStatsView, AdminUsersView, AdminUserDetailView

urlpatterns = [
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("me/", MeView.as_view(), name="me"),
    path("stats/", AdminStatsView.as_view(), name="admin_stats"),
    path("users/", AdminUsersView.as_view(), name="admin_users"),
    path("users/<int:user_id>/", AdminUserDetailView.as_view(), name="admin_user_detail"),
]
