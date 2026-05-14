from django.urls import path
from .views import (
    RegisterView,
    SubmitPaymentProofView,
    VerifyPaymentView,
    StripeWebhookView,
    RegistrationListView,
    RegistrationDetailView,
    ApproveRegistrationView,
    RejectRegistrationView,
    PendingCountView,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("verify-payment/", VerifyPaymentView.as_view()),
    path("webhook/", StripeWebhookView.as_view()),
    path("registrations/", RegistrationListView.as_view()),
    path("registrations/<uuid:pk>/", RegistrationDetailView.as_view()),
    path("registrations/<uuid:pk>/payment-proof/", SubmitPaymentProofView.as_view()),
    path("registrations/<uuid:pk>/approve/", ApproveRegistrationView.as_view()),
    path("registrations/<uuid:pk>/reject/", RejectRegistrationView.as_view()),
    path("pending-count/", PendingCountView.as_view()),
]
