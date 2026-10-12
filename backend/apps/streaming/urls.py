from django.urls import path
from apps.streaming.views import ProgressView, ContinueWatchingView

urlpatterns = [
    path('progress/', ProgressView.as_view(), name='watch-progress'),
    path('continue-watching/', ContinueWatchingView.as_view(), name='continue-watching'),
]

