from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="dev-secret-change-in-production")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1").split(",")

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "accounts",
    "hotels",
    "tours",
    "places",
    "subscriptions",
    "services",
    "checkin",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "concierge.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "concierge.wsgi.application"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Reverse-proxy headers — lets Django build correct absolute URLs (for logo_url etc.)
# when running behind nginx which forwards X-Forwarded-Host and X-Forwarded-Proto.
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CORS — allow all origins so guests can access the hotel page from any device.
# Security is enforced by JWT auth on protected endpoints, not CORS.
CORS_ALLOW_ALL_ORIGINS = True

# DRF
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "concierge.auth.SilentJWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
}

# Google & OpenAI API keys — set via environment variable or .env file on server
GOOGLE_PLACES_API_KEY    = config("GOOGLE_PLACES_API_KEY",    default="")
GOOGLE_GEOCODING_API_KEY = config("GOOGLE_GEOCODING_API_KEY", default="")
OPENAI_API_KEY           = config("OPENAI_API_KEY",           default="")

# Stripe
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="whsec_placeholder")

# Current 4-tier plan prices (recurring subscription Price IDs from the Stripe Dashboard)
STRIPE_PRICE_CONCIERGE = config("STRIPE_PRICE_CONCIERGE", default="")
STRIPE_PRICE_CHECKIN = config("STRIPE_PRICE_CHECKIN", default="")
STRIPE_PRICE_CONCIERGE_CHECKIN = config("STRIPE_PRICE_CONCIERGE_CHECKIN", default="")
STRIPE_PRICE_FULL = config("STRIPE_PRICE_FULL", default="")

# Legacy plan prices — kept so old Stripe sessions/subscriptions don't break
STRIPE_PRICE_BASIC = config("STRIPE_PRICE_BASIC", default="price_basic_placeholder")
STRIPE_PRICE_PRO = config("STRIPE_PRICE_PRO", default="price_pro_placeholder")

# Frontend URL (for Stripe success/cancel redirect and check-in links)
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3000")

# Email (SMTP) — set in .env on the server; falls back to console in dev
EMAIL_BACKEND = config(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="noreply@guestflowpro.com")

# JWT
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
