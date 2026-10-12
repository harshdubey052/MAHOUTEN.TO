from django.urls import path
from apps.library.views import MyListView, CheckMyListView, HistoryView

urlpatterns = [
    path('my-list/', MyListView.as_view(), name='my-list'),
    path('my-list/<str:anime_id>/check/', CheckMyListView.as_view(), name='check-my-list'),
    path('history/', HistoryView.as_view(), name='watch-history'),
]

