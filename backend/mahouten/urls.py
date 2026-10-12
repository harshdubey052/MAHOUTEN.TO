from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

from django.http import JsonResponse
from django.views.static import serve
from django.urls import re_path

def health_check(request):
    db_ok = True
    db_msg = 'connected'
    try:
        import mongoengine
        conn = mongoengine.connection.get_connection()
        conn.admin.command('ping')
    except Exception as e:
        db_ok = False
        db_msg = str(e)

    return JsonResponse({
        'status': 'healthy' if db_ok else 'degraded',
        'database': db_msg,
        'cloudinary': getattr(settings, 'CLOUDINARY_ENABLED', False),
        'version': '1.0.0'
    }, status=200 if db_ok else 200)

urlpatterns = [
    # Health checks for Render & uptime monitors
    path('healthz/', health_check, name='healthz'),
    path('api/v1/health/', health_check, name='api-health'),

    # OpenAPI Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Public User API (versioned under /api/v1/)
    path('api/v1/', include('apps.accounts.urls')),
    path('api/v1/', include('apps.catalog.urls')),
    path('api/v1/', include('apps.streaming.urls')),
    path('api/v1/', include('apps.library.urls')),

    # Admin Panel API (/api/v1/admin/)
    path('api/v1/admin/', include('apps.adminpanel.urls')),

    # Media static serve fallback for local uploads
    re_path(r'^media/(?P<path>.*)$', serve, {'document_root': settings.MEDIA_ROOT}),
]

# Automated production schema, index, and admin initialization (0 demo data)
try:
    from mahouten.init_db import init_production_database
    init_production_database()
except Exception as e:
    print(f"[Init DB] Startup initialization skipped or deferred: {e}")

