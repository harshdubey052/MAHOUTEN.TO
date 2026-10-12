import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from apps.streaming.models import WatchProgress
from apps.streaming.serializers import WatchProgressSerializer
from apps.catalog.models import Anime, Episode
from apps.library.models import WatchHistory

class ProgressView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile_id = request.query_params.get('profile_id')
        episode_id = request.query_params.get('episode_id')

        if not profile_id:
            return Response({'error': 'profile_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        if episode_id:
            progress = WatchProgress.objects(profile_id=str(profile_id), episode_id=str(episode_id)).first()
            if not progress:
                return Response({'seconds': 0, 'completed': False})
            return Response(WatchProgressSerializer(progress).data)

        # Return all for profile
        all_progress = WatchProgress.objects(profile_id=str(profile_id)).order_by('-updated_at')[:50]
        return Response(WatchProgressSerializer(all_progress, many=True).data)

    def post(self, request):
        data = request.data
        profile_id = data.get('profile_id')
        episode_id = data.get('episode_id')
        seconds = int(data.get('seconds', 0))
        duration = int(data.get('duration', 1440))

        if not profile_id or not episode_id:
            return Response({'error': 'profile_id and episode_id are required'}, status=status.HTTP_400_BAD_REQUEST)

        episode = Episode.objects(id=episode_id).first()
        if not episode:
            return Response({'error': 'Episode not found'}, status=status.HTTP_404_NOT_FOUND)

        completed = (seconds / duration) >= 0.9 if duration > 0 else False

        progress = WatchProgress.objects(profile_id=str(profile_id), episode_id=str(episode_id)).first()
        if progress:
            progress.seconds = seconds
            progress.duration = duration
            progress.completed = completed
            progress.updated_at = datetime.datetime.utcnow()
            progress.save()
        else:
            progress = WatchProgress(
                profile_id=str(profile_id),
                episode_id=str(episode_id),
                anime_id=str(episode.anime_id),
                seconds=seconds,
                duration=duration,
                completed=completed,
                updated_at=datetime.datetime.utcnow()
            )
            progress.save()

        # Update or record WatchHistory entry
        history_entry = WatchHistory.objects(profile_id=str(profile_id), anime_id=str(episode.anime_id)).first()
        if history_entry:
            history_entry.last_episode_id = str(episode_id)
            history_entry.last_watched_at = datetime.datetime.utcnow()
            history_entry.save()
        else:
            WatchHistory(
                profile_id=str(profile_id),
                anime_id=str(episode.anime_id),
                last_episode_id=str(episode_id),
                last_watched_at=datetime.datetime.utcnow()
            ).save()

        return Response(WatchProgressSerializer(progress).data, status=status.HTTP_200_OK)


class ContinueWatchingView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile_id = request.query_params.get('profile_id')
        if not profile_id:
            return Response({'error': 'profile_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get incomplete watch progress
        progress_items = WatchProgress.objects(
            profile_id=str(profile_id),
            completed=False
        ).order_by('-updated_at')[:15]

        results = []
        for p in progress_items:
            anime = Anime.objects(id=p.anime_id).first()
            episode = Episode.objects(id=p.episode_id).first()
            if anime and episode and anime.is_publicly_visible() and episode.is_publicly_visible():
                results.append({
                    'progress_id': str(p.id),
                    'seconds': p.seconds,
                    'duration': p.duration,
                    'percentage': round((p.seconds / p.duration * 100), 1) if p.duration > 0 else 0,
                    'anime': {
                        'id': str(anime.id),
                        'title': anime.title,
                        'slug': anime.slug,
                        'poster': anime.poster,
                        'banner': anime.banner,
                    },
                    'episode': {
                        'id': str(episode.id),
                        'number': episode.number,
                        'season': episode.season,
                        'title': episode.title,
                        'thumbnail': episode.thumbnail,
                        'hls_url': episode.hls_url,
                        'intro_start': episode.intro_start,
                        'intro_end': episode.intro_end,
                    }
                })

        return Response(results)

