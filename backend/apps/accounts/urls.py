from django.urls import path
from apps.accounts.views import (
    RegisterView, LoginView, RefreshTokenView, LogoutView,
    CurrentUserView, ProfileListCreateView, ProfileDetailView
)

urlpatterns = [
    # Auth
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', RefreshTokenView.as_view(), name='refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', CurrentUserView.as_view(), name='current-user'),

    # Profiles (up to 5)
    path('profiles/', ProfileListCreateView.as_view(), name='profiles-list-create'),
    path('profiles/<str:pk>/', ProfileDetailView.as_view(), name='profile-detail'),
]

