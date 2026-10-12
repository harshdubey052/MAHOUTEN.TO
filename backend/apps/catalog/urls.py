from django.urls import path
from apps.catalog.views import (
    GenreListView, AnimeListView, AnimeDetailView, AnimeEpisodesView,
    HomeRowsView, SearchView, ReviewListCreateView,
    StudioUploadView, AniListAutofillView
)

urlpatterns = [
    path('genres/', GenreListView.as_view(), name='genre-list'),
    path('anime/', AnimeListView.as_view(), name='anime-list'),
    path('anime/<str:slug>/', AnimeDetailView.as_view(), name='anime-detail'),
    path('anime/<str:slug>/episodes/', AnimeEpisodesView.as_view(), name='anime-episodes'),
    path('home/rows/', HomeRowsView.as_view(), name='home-rows'),
    path('search/', SearchView.as_view(), name='search'),
    path('anime/<str:anime_id>/reviews/', ReviewListCreateView.as_view(), name='anime-reviews'),
    # YouTube-style Studio Upload & Metadata Autofill
    path('studio/upload/', StudioUploadView.as_view(), name='studio-upload'),
    path('studio/autofill/', AniListAutofillView.as_view(), name='studio-autofill'),
]

