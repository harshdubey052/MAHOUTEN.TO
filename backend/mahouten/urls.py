from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
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
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Auto-seed in-memory MongoDB on startup if empty
try:
    from apps.accounts.models import User
    if User.objects.count() == 0:
        import seed_data
        seed_data.seed()
except Exception as e:
    print(f"[Auto-seed] Skipped or failed: {e}")

