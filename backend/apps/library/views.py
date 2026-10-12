from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.library.models import MyList, WatchHistory
from apps.catalog.models import Anime, Episode
from apps.catalog.serializers import AnimeListSerializer

class MyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile_id = request.query_params.get('profile_id')
        if not profile_id:
            return Response({'error': 'profile_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        items = MyList.objects(profile_id=str(profile_id)).order_by('-added_at')
        anime_ids = [item.anime_id for item in items]

        # Fetch matching visible anime
        animes = Anime.objects(id__in=anime_ids, publish_status='published')
        anime_map = {str(a.id): a for a in animes}

        # Keep original sort order
        ordered_animes = [anime_map[aid] for aid in anime_ids if aid in anime_map]
        return Response(AnimeListSerializer(ordered_animes, many=True).data)

    def post(self, request):
        profile_id = request.data.get('profile_id')
        anime_id = request.data.get('anime_id')

        if not profile_id or not anime_id:
            return Response({'error': 'profile_id and anime_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = MyList.objects(profile_id=str(profile_id), anime_id=str(anime_id)).first()
        if existing:
            # Already in list; return confirmation
            return Response({'message': 'Already in My List', 'in_list': True})

        MyList(profile_id=str(profile_id), anime_id=str(anime_id)).save()
        return Response({'message': 'Added to My List', 'in_list': True}, status=status.HTTP_201_CREATED)

    def delete(self, request):
        profile_id = request.query_params.get('profile_id') or request.data.get('profile_id')
        anime_id = request.query_params.get('anime_id') or request.data.get('anime_id')

        if not profile_id or not anime_id:
            return Response({'error': 'profile_id and anime_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        MyList.objects(profile_id=str(profile_id), anime_id=str(anime_id)).delete()
        return Response({'message': 'Removed from My List', 'in_list': False})


class CheckMyListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, anime_id):
        profile_id = request.query_params.get('profile_id')
        if not profile_id:
            return Response({'in_list': False})

        exists = MyList.objects(profile_id=str(profile_id), anime_id=str(anime_id)).first() is not None
        return Response({'in_list': exists})


class HistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile_id = request.query_params.get('profile_id')
        if not profile_id:
            return Response({'error': 'profile_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        history_items = WatchHistory.objects(profile_id=str(profile_id)).order_by('-last_watched_at')[:50]
        results = []

        for h in history_items:
            anime = Anime.objects(id=h.anime_id).first()
            episode = Episode.objects(id=h.last_episode_id).first()
            if anime and episode and anime.is_publicly_visible():
                results.append({
                    'anime': AnimeListSerializer(anime).data,
                    'last_episode': {
                        'id': str(episode.id),
                        'number': episode.number,
                        'season': episode.season,
                        'title': episode.title,
                        'thumbnail': episode.thumbnail,
                    },
                    'last_watched_at': h.last_watched_at,
                })

        return Response(results)

