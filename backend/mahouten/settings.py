import os
from pathlib import Path
from datetime import timedelta
import mongoengine
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-mahouten-magic-anime-streaming-secret-key-2026')

DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 'yes')

raw_allowed_hosts = os.getenv('ALLOWED_HOSTS', '*')
if raw_allowed_hosts == '*':
    ALLOWED_HOSTS = ['*']
else:
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]

# Application definition
INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'drf_spectacular',
    
    # Internal apps
    'apps.accounts',
    'apps.catalog',
    'apps.streaming',
    'apps.library',
    'apps.adminpanel',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mahouten.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'mahouten.wsgi.application'

# Django internal database for admin/sessions (SQLite)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# MongoDB Connection via MongoEngine
# Official django-mongodb-backend requires Django >= 6.1, so as specified in requirements
# we fall back to mongoengine which provides robust Document validation and queries for Django 5.
MONGO_DB_NAME = os.getenv('MONGO_DB_NAME', 'mahouten_db')
MONGO_HOST = os.getenv('MONGO_HOST', 'localhost')
MONGO_PORT = int(os.getenv('MONGO_PORT', 27017))
MONGO_URI = os.getenv('MONGO_URI', f'mongodb://{MONGO_HOST}:{MONGO_PORT}/{MONGO_DB_NAME}')

# Skip MongoDB connection during Render build (collectstatic phase)
_SKIP_MONGO = os.getenv('RENDER_BUILD', '') == '1'

if not _SKIP_MONGO:
    try:
        import pymongo
        mongo_kwargs = {}
        if 'mongodb+srv://' in MONGO_URI or 'ssl=true' in MONGO_URI.lower():
            try:
                import certifi
                mongo_kwargs['tlsCAFile'] = certifi.where()
            except ImportError:
                pass
        timeout_ms = 7000 if ('mongodb+srv://' in MONGO_URI or '@' in MONGO_URI) else 1000
        test_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=timeout_ms, **mongo_kwargs)
        test_client.server_info()
        mongoengine.connect(
            db=MONGO_DB_NAME,
            host=MONGO_URI,
            connect=True,
            **mongo_kwargs
        )
        print("[MongoDB] Connected successfully to live MongoDB instance.")
    except Exception as live_err:
        try:
            import mongomock
            mongoengine.connect(
                db=MONGO_DB_NAME,
                host=MONGO_URI,
                mongo_client_class=mongomock.MongoClient
            )
            print(f"[MongoDB] Live MongoDB offline ({live_err}); using resilient in-memory MongoDB engine.")
        except Exception as e:
            print(f"[MongoDB Warning] Connection error: {e}")
else:
    print("[MongoDB] Skipping connection during build phase.")

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Cloudinary Media Configuration
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', '')
CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', '')
CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', '')
CLOUDINARY_URL = os.getenv('CLOUDINARY_URL', '')

if (CLOUDINARY_CLOUD_NAME and CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET) or CLOUDINARY_URL:
    try:
        import cloudinary
        cloudinary.config(
            cloud_name=CLOUDINARY_CLOUD_NAME or None,
            api_key=CLOUDINARY_API_KEY or None,
            api_secret=CLOUDINARY_API_SECRET or None,
            cloudinary_url=CLOUDINARY_URL or None,
            secure=True
        )
        CLOUDINARY_ENABLED = True
        print("[Cloudinary] Configured successfully for production media storage.")
    except Exception as e:
        CLOUDINARY_ENABLED = False
        print(f"[Cloudinary Warning] Failed to initialize Cloudinary ({e}). Using local fallback.")
else:
    CLOUDINARY_ENABLED = False
    print("[Cloudinary] Credentials not provided. Media uploads will use local fallback.")

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

from corsheaders.defaults import default_headers

# CORS & CSRF Configuration for Vercel + Render
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
    r"^https://.*\.onrender\.com$",
    r"^http://localhost:\d+$",
    r"^http://127\.0\.0\.1:\d+$",
]
CSRF_TRUSTED_ORIGINS = [
    'https://*.vercel.app',
    'https://*.onrender.com',
    'https://*.ngrok-free.app',
    'https://*.ngrok.io',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
]

CORS_ALLOWED_ORIGINS = [
    'https://mahouten-to.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]

_EXTRA_CORS = os.getenv('CORS_ALLOWED_ORIGINS', '')
if _EXTRA_CORS:
    for origin in _EXTRA_CORS.split(','):
        origin = origin.strip()
        if origin:
            if origin not in CORS_ALLOWED_ORIGINS:
                CORS_ALLOWED_ORIGINS.append(origin)
            if origin not in CSRF_TRUSTED_ORIGINS:
                CSRF_TRUSTED_ORIGINS.append(origin)

CORS_ALLOW_HEADERS = list(default_headers) + [
    'ngrok-skip-browser-warning',
    'x-requested-with',
]

_EXTRA_CORS_HEADERS = os.getenv('CORS_ALLOW_HEADERS', '')
if _EXTRA_CORS_HEADERS:
    for header in _EXTRA_CORS_HEADERS.split(','):
        h = header.strip()
        if h and h not in CORS_ALLOW_HEADERS:
            CORS_ALLOW_HEADERS.append(h)

# Cross-Site Cookie Defaults for Decoupled Frontend (Vercel) & Backend (Render)
SESSION_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SAMESITE = 'None' if not DEBUG else 'Lax'
CSRF_COOKIE_SECURE = not DEBUG

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.MongoJWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 24,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# DRF Spectacular (OpenAPI 3.0 docs)
SPECTACULAR_SETTINGS = {
    'TITLE': 'Mahouten Anime Streaming API',
    'DESCRIPTION': 'REST API for Netflix-style anime streaming platform mahouten.to',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# Celery
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

