from django.urls import path
from apps.adminpanel.views import (
    AdminStatsView, AdminShowListCreateView, AdminShowDetailView,
    AdminSeasonListCreateView, AdminSeasonDetailView,
    AdminEpisodeListCreateView, AdminEpisodeDetailView,
    AdminBulkEpisodesView, AdminEpisodeUploadVideoView,
    AdminEpisodeProcessingStatusView, AdminUploadImageView,
    AdminUploadSubtitleView, AdminUserListView, AdminUserManageView,
    AdminAuditLogView, AdminHomepageRowsView
)

urlpatterns = [
    # Dashboard stats & audit
    path('stats/', AdminStatsView.as_view(), name='admin-stats'),
    path('audit-logs/', AdminAuditLogView.as_view(), name='admin-audit-logs'),

    # Shows CRUD
    path('shows/', AdminShowListCreateView.as_view(), name='admin-shows-list-create'),
    path('shows/<str:pk>/', AdminShowDetailView.as_view(), name='admin-shows-detail'),

    # Seasons CRUD
    path('seasons/', AdminSeasonListCreateView.as_view(), name='admin-seasons-list-create'),
    path('seasons/<str:pk>/', AdminSeasonDetailView.as_view(), name='admin-seasons-detail'),

    # Episodes CRUD
    path('episodes/', AdminEpisodeListCreateView.as_view(), name='admin-episodes-list-create'),
    path('episodes/bulk/', AdminBulkEpisodesView.as_view(), name='admin-episodes-bulk'),
    path('episodes/<str:pk>/', AdminEpisodeDetailView.as_view(), name='admin-episodes-detail'),
    path('episodes/<str:pk>/upload-video/', AdminEpisodeUploadVideoView.as_view(), name='admin-episode-upload-video'),
    path('episodes/<str:pk>/processing-status/', AdminEpisodeProcessingStatusView.as_view(), name='admin-episode-processing-status'),

    # Media uploads
    path('upload/image/', AdminUploadImageView.as_view(), name='admin-upload-image'),
    path('upload/subtitle/', AdminUploadSubtitleView.as_view(), name='admin-upload-subtitle'),

    # Users
    path('users/', AdminUserListView.as_view(), name='admin-users-list'),
    path('users/<str:pk>/', AdminUserManageView.as_view(), name='admin-users-manage'),

    # Homepage Control
    path('homepage-rows/', AdminHomepageRowsView.as_view(), name='admin-homepage-rows'),
    path('homepage-rows/<str:pk>/', AdminHomepageRowsView.as_view(), name='admin-homepage-rows-detail'),
]

