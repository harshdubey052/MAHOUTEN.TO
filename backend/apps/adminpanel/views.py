import os
import uuid
import datetime
from pathlib import Path
from django.conf import settings
from django.utils.text import slugify
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from apps.accounts.models import User
from apps.accounts.permissions import IsAdminRole
from apps.catalog.models import Anime, Season, Episode, Genre, HomepageRow
from apps.streaming.models import WatchProgress
from apps.adminpanel.models import AuditLog
from apps.adminpanel.serializers import (
    AdminShowSerializer, AdminSeasonSerializer, AdminEpisodeSerializer,
    BulkEpisodesSerializer, AdminUserSerializer, AuditLogSerializer
)
from apps.streaming.tasks import process_video_to_hls
from mahouten.media_service import upload_image, upload_video, upload_raw

def record_audit(admin_user, action, entity_type, entity_id, details=''):
    try:
        AuditLog(
            admin_id=str(admin_user.id),
            admin_username=admin_user.username,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details
        ).save()
    except Exception as e:
        print(f"Audit log error: {e}")


class AdminStatsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_shows = Anime.objects.count()
        total_episodes = Episode.objects.count()
        total_users = User.objects.count()

        # Watch statistics
        now = datetime.datetime.utcnow()
        today_start = datetime.datetime(now.year, now.month, now.day)
        week_start = today_start - datetime.timedelta(days=7)

        views_today = WatchProgress.objects(updated_at__gte=today_start).count()
        views_this_week = WatchProgress.objects(updated_at__gte=week_start).count()

        # Top watched titles
        top_progress = WatchProgress.objects.order_by('-updated_at')[:100]
        anime_counts = {}
        for p in top_progress:
            anime_counts[p.anime_id] = anime_counts.get(p.anime_id, 0) + 1

        top_titles = []
        for aid, count in sorted(anime_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
            anime = Anime.objects(id=aid).first()
            if anime:
                top_titles.append({
                    'id': str(anime.id),
                    'title': anime.title,
                    'poster': anime.poster,
                    'views': count,
                    'rating': anime.rating,
                })

        # Recent episodes
        recent_episodes = Episode.objects.order_by('-created_at')[:5]
        recent_eps_data = []
        for ep in recent_episodes:
            anime = Anime.objects(id=ep.anime_id).first()
            recent_eps_data.append({
                'id': str(ep.id),
                'anime_title': anime.title if anime else 'Unknown',
                'episode_title': ep.title,
                'number': ep.number,
                'publish_status': ep.publish_status,
                'created_at': ep.created_at,
            })

        # Chart activity data (last 7 days)
        chart_data = []
        for i in range(6, -1, -1):
            day_dt = today_start - datetime.timedelta(days=i)
            next_day = day_dt + datetime.timedelta(days=1)
            day_views = WatchProgress.objects(updated_at__gte=day_dt, updated_at__lt=next_day).count()
            chart_data.append({
                'date': day_dt.strftime('%b %d'),
                'views': day_views,
            })

        return Response({
            'total_shows': total_shows,
            'total_episodes': total_episodes,
            'total_users': total_users,
            'views_today': views_today,
            'views_this_week': views_this_week,
            'top_titles': top_titles,
            'recent_episodes': recent_eps_data,
            'chart_data': chart_data,
        })


class AdminShowListCreateView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Anime.objects.all()

        query = request.query_params.get('q', '').strip()
        if query:
            qs = qs.filter(title__icontains=query)

        publish_status = request.query_params.get('status')
        if publish_status:
            qs = qs.filter(publish_status=publish_status)

        sort_by = request.query_params.get('sort', '-created_at')
        qs = qs.order_by(sort_by)

        total = qs.count()
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        items = qs[start:start + page_size]

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': AdminShowSerializer(items, many=True).data
        })

    def post(self, request):
        payload = request.data.dict() if hasattr(request.data, 'dict') else dict(request.data)

        # Upload poster image file if provided
        poster_file = request.FILES.get('poster') or request.FILES.get('poster_file')
        if poster_file:
            uploaded = upload_image(poster_file, folder='mahouten/posters')
            payload['poster'] = uploaded.get('url', '')

        # Upload banner image file if provided
        banner_file = request.FILES.get('banner') or request.FILES.get('banner_file')
        if banner_file:
            uploaded = upload_image(banner_file, folder='mahouten/banners')
            payload['banner'] = uploaded.get('url', '')

        # Handle raw genres parsing (JSON or comma separated)
        raw_genres = payload.get('genres')
        if isinstance(raw_genres, str):
            try:
                import json
                payload['genres'] = json.loads(raw_genres)
            except Exception:
                payload['genres'] = [g.strip() for g in raw_genres.split(',') if g.strip()]

        serializer = AdminShowSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        slug = data.get('slug') or slugify(data['title'])

        # Ensure slug uniqueness
        base_slug = slug
        counter = 1
        while Anime.objects(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        show = Anime(
            title=data['title'],
            slug=slug,
            synopsis=data.get('synopsis', ''),
            genres=data.get('genres', []),
            year=data.get('year') or datetime.datetime.utcnow().year,
            studio=data.get('studio', ''),
            status=data.get('status', 'ongoing'),
            type=data.get('type', 'series'),
            rating=data.get('rating', 0.0),
            age_rating=data.get('age_rating', ''),
            poster=data.get('poster', ''),
            banner=data.get('banner', ''),
            trailer_url=data.get('trailer_url', ''),
            featured=data.get('featured', False),
            publish_status=data.get('publish_status', 'published'),
            publish_at=data.get('publish_at', datetime.datetime.utcnow()),
            created_by=request.user.username,
        )
        show.save()

        # Create default season 1 for series
        if show.type == 'series' and not Season.objects(anime_id=str(show.id)).first():
            Season(
                anime_id=str(show.id),
                number=1,
                title='Season 1',
                order=1
            ).save()

        record_audit(request.user, 'create', 'show', show.id, f"Created show: {show.title}")
        return Response(AdminShowSerializer(show).data, status=status.HTTP_201_CREATED)


class AdminShowDetailView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk):
        return Anime.objects(id=pk).first()

    def get(self, request, pk):
        show = self.get_object(pk)
        if not show:
            return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminShowSerializer(show).data)

    def patch(self, request, pk):
        show = self.get_object(pk)
        if not show:
            return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)

        # Upload poster image file if provided
        poster_file = request.FILES.get('poster') or request.FILES.get('poster_file')
        if poster_file:
            uploaded = upload_image(poster_file, folder='mahouten/posters')
            show.poster = uploaded.get('url', '')

        # Upload banner image file if provided
        banner_file = request.FILES.get('banner') or request.FILES.get('banner_file')
        if banner_file:
            uploaded = upload_image(banner_file, folder='mahouten/banners')
            show.banner = uploaded.get('url', '')

        for key, value in request.data.items():
            if key in ['poster', 'banner'] and (request.FILES.get(key) or request.FILES.get(f"{key}_file")):
                continue
            if hasattr(show, key) and key not in ['id', 'created_at']:
                if key == 'genres' and isinstance(value, str):
                    try:
                        import json
                        setattr(show, key, json.loads(value))
                    except Exception:
                        setattr(show, key, [g.strip() for g in value.split(',') if g.strip()])
                else:
                    setattr(show, key, value)

        show.updated_at = datetime.datetime.utcnow()
        show.save()

        record_audit(request.user, 'update', 'show', show.id, f"Updated show: {show.title}")
        return Response(AdminShowSerializer(show).data)

    def delete(self, request, pk):
        show = self.get_object(pk)
        if not show:
            return Response({'error': 'Show not found'}, status=status.HTTP_404_NOT_FOUND)

        title = show.title
        # Delete associated seasons and episodes
        Season.objects(anime_id=str(show.id)).delete()
        Episode.objects(anime_id=str(show.id)).delete()
        show.delete()

        record_audit(request.user, 'delete', 'show', pk, f"Deleted show: {title}")
        return Response({'message': 'Show deleted'}, status=status.HTTP_204_NO_CONTENT)


class AdminSeasonListCreateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        anime_id = request.query_params.get('anime_id')
        if not anime_id:
            return Response({'error': 'anime_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        seasons = Season.objects(anime_id=str(anime_id)).order_by('order', 'number')
        return Response(AdminSeasonSerializer(seasons, many=True).data)

    def post(self, request):
        serializer = AdminSeasonSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        season = Season(
            anime_id=data['anime_id'],
            number=data['number'],
            title=data['title'],
            order=data.get('order', data['number'])
        )
        season.save()
        record_audit(request.user, 'create', 'season', season.id, f"Created season {season.number}")
        return Response(AdminSeasonSerializer(season).data, status=status.HTTP_201_CREATED)


class AdminSeasonDetailView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        season = Season.objects(id=pk).first()
        if not season:
            return Response({'error': 'Season not found'}, status=status.HTTP_404_NOT_FOUND)

        for key, value in request.data.items():
            if hasattr(season, key) and key != 'id':
                setattr(season, key, value)
        season.save()
        return Response(AdminSeasonSerializer(season).data)

    def delete(self, request, pk):
        season = Season.objects(id=pk).first()
        if not season:
            return Response({'error': 'Season not found'}, status=status.HTTP_404_NOT_FOUND)
        season.delete()
        record_audit(request.user, 'delete', 'season', pk, f"Deleted season {pk}")
        return Response({'message': 'Season deleted'}, status=status.HTTP_204_NO_CONTENT)


class AdminEpisodeListCreateView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        anime_id = request.query_params.get('anime_id')
        qs = Episode.objects.all()
        if anime_id:
            qs = qs.filter(anime_id=str(anime_id))

        season = request.query_params.get('season')
        if season:
            try:
                qs = qs.filter(season=int(season))
            except ValueError:
                pass

        qs = qs.order_by('season', 'number')
        return Response(AdminEpisodeSerializer(qs, many=True).data)

    def post(self, request):
        serializer = AdminEpisodeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        episode = Episode(
            anime_id=data['anime_id'],
            season=data['season'],
            number=data['number'],
            title=data['title'],
            synopsis=data.get('synopsis', ''),
            duration=data.get('duration', 1440),
            thumbnail=data.get('thumbnail', ''),
            video_source_type=data.get('video_source_type', 'url'),
            hls_url=data.get('hls_url', ''),
            subtitles=data.get('subtitles', []),
            intro_start=data.get('intro_start', 0.0),
            intro_end=data.get('intro_end', 0.0),
            publish_status=data.get('publish_status', 'published'),
            publish_at=data.get('publish_at', datetime.datetime.utcnow()),
            processing_status=data.get('processing_status', 'ready'),
        )
        episode.save()

        # Update season episode count
        season = Season.objects(anime_id=episode.anime_id, number=episode.season).first()
        if season:
            season.episodes_count = Episode.objects(anime_id=episode.anime_id, season=episode.season).count()
            season.save()

        record_audit(request.user, 'create', 'episode', episode.id, f"Added episode {episode.number}: {episode.title}")
        return Response(AdminEpisodeSerializer(episode).data, status=status.HTTP_201_CREATED)


class AdminEpisodeDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        episode = Episode.objects(id=pk).first()
        if not episode:
            return Response({'error': 'Episode not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AdminEpisodeSerializer(episode).data)

    def patch(self, request, pk):
        episode = Episode.objects(id=pk).first()
        if not episode:
            return Response({'error': 'Episode not found'}, status=status.HTTP_404_NOT_FOUND)

        for key, value in request.data.items():
            if hasattr(episode, key) and key not in ['id', 'created_at']:
                setattr(episode, key, value)

        episode.updated_at = datetime.datetime.utcnow()
        episode.save()

        record_audit(request.user, 'update', 'episode', episode.id, f"Updated episode {episode.number}: {episode.title}")
        return Response(AdminEpisodeSerializer(episode).data)

    def delete(self, request, pk):
        episode = Episode.objects(id=pk).first()
        if not episode:
            return Response({'error': 'Episode not found'}, status=status.HTTP_404_NOT_FOUND)

        title = episode.title
        anime_id = episode.anime_id
        season_num = episode.season
        episode.delete()

        # Recalculate season episode count
        season = Season.objects(anime_id=anime_id, number=season_num).first()
        if season:
            season.episodes_count = Episode.objects(anime_id=anime_id, season=season_num).count()
            season.save()

        record_audit(request.user, 'delete', 'episode', pk, f"Deleted episode: {title}")
        return Response({'message': 'Episode deleted'}, status=status.HTTP_204_NO_CONTENT)


class AdminBulkEpisodesView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        serializer = BulkEpisodesSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        anime_id = data['anime_id']
        season = data['season']
        created_episodes = []

        for item in data['episodes']:
            ep = Episode(
                anime_id=anime_id,
                season=season,
                number=item['number'],
                title=item['title'],
                hls_url=item['hls_url'],
                duration=item.get('duration', 1440),
                thumbnail=item.get('thumbnail', ''),
                video_source_type='url',
                publish_status='published',
                processing_status='ready',
            )
            ep.save()
            created_episodes.append(ep)

        # Update season count
        s = Season.objects(anime_id=anime_id, number=season).first()
        if s:
            s.episodes_count = Episode.objects(anime_id=anime_id, season=season).count()
            s.save()

        record_audit(request.user, 'create', 'episode', anime_id, f"Bulk added {len(created_episodes)} episodes")
        return Response(AdminEpisodeSerializer(created_episodes, many=True).data, status=status.HTTP_201_CREATED)


class AdminEpisodeUploadVideoView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        episode = Episode.objects(id=pk).first()
        if not episode:
            return Response({'error': 'Episode not found'}, status=status.HTTP_404_NOT_FOUND)

        video_file = request.FILES.get('video')
        if not video_file:
            return Response({'error': 'No video file provided'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded = upload_video(video_file, folder='mahouten/videos')

        if uploaded.get('storage') == 'cloudinary':
            episode.video_source_type = 'upload'
            episode.processing_status = 'ready'
            episode.hls_url = uploaded['url']
            episode.save()

            record_audit(request.user, 'update', 'episode', episode.id, "Uploaded video file to Cloudinary CDN")
            return Response({
                'message': 'Video uploaded successfully to Cloudinary.',
                'processing_status': 'ready',
                'hls_url': uploaded['url'],
                'episode_id': str(episode.id)
            }, status=status.HTTP_200_OK)

        # Fallback local transcoding via FFmpeg
        file_path = uploaded.get('local_path')
        episode.video_source_type = 'upload'
        episode.processing_status = 'processing'
        episode.save()

        # Trigger Celery background task
        try:
            process_video_to_hls.delay(str(episode.id), str(file_path))
        except Exception:
            # Fallback if Redis/Celery worker isn't currently up: execute in background thread
            import threading
            threading.Thread(target=process_video_to_hls, args=(str(episode.id), str(file_path))).start()

        record_audit(request.user, 'update', 'episode', episode.id, "Uploaded video file for local HLS transcoding")
        return Response({
            'message': 'Video uploaded successfully. Transcoding started.',
            'processing_status': 'processing',
            'episode_id': str(episode.id)
        }, status=status.HTTP_202_ACCEPTED)


class AdminEpisodeProcessingStatusView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        episode = Episode.objects(id=pk).first()
        if not episode:
            return Response({'error': 'Episode not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'episode_id': str(episode.id),
            'processing_status': episode.processing_status,
            'hls_url': episode.hls_url
        })


class AdminUploadImageView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded = upload_image(image_file, folder='mahouten/images')
        return Response({
            'url': uploaded.get('url'),
            'filename': uploaded.get('public_id'),
            'storage': uploaded.get('storage')
        }, status=status.HTTP_201_CREATED)


class AdminUploadSubtitleView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        subtitle_file = request.FILES.get('subtitle')
        if not subtitle_file:
            return Response({'error': 'No subtitle file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        uploaded = upload_raw(subtitle_file, folder='mahouten/subtitles')
        return Response({
            'url': uploaded.get('url'),
            'filename': uploaded.get('public_id'),
            'storage': uploaded.get('storage')
        }, status=status.HTTP_201_CREATED)


class AdminUserListView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        qs = User.objects.all()
        query = request.query_params.get('q', '').strip()
        if query:
            qs = qs.filter(username__icontains=query)

        return Response(AdminUserSerializer(qs.order_by('-created_at'), many=True).data)


class AdminUserManageView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        user = User.objects(id=pk).first()
        if not user:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if 'is_banned' in request.data:
            user.is_banned = bool(request.data['is_banned'])
            action = 'ban' if user.is_banned else 'unban'
            record_audit(request.user, action, 'user', user.id, f"{action} user {user.username}")

        if 'role' in request.data:
            new_role = request.data['role']
            if new_role in ('user', 'admin'):
                user.role = new_role
                record_audit(request.user, 'role_change', 'user', user.id, f"Changed role to {new_role}")

        user.updated_at = datetime.datetime.utcnow()
        user.save()
        return Response(AdminUserSerializer(user).data)


class AdminAuditLogView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        logs = AuditLog.objects.order_by('-created_at')[:100]
        return Response(AuditLogSerializer(logs, many=True).data)


class AdminHomepageRowsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        rows = HomepageRow.objects.order_by('order')
        results = []
        for r in rows:
            results.append({
                'id': str(r.id),
                'title': r.title,
                'row_type': r.row_type,
                'genre_slug': r.genre_slug,
                'anime_ids': r.anime_ids,
                'order': r.order,
                'is_active': r.is_active,
            })
        return Response(results)

    def post(self, request):
        data = request.data
        row = HomepageRow(
            title=data['title'],
            row_type=data.get('row_type', 'curated'),
            genre_slug=data.get('genre_slug', ''),
            anime_ids=data.get('anime_ids', []),
            order=data.get('order', 1),
            is_active=data.get('is_active', True)
        )
        row.save()
        record_audit(request.user, 'create', 'homepage_row', row.id, f"Created homepage row: {row.title}")
        return Response({
            'id': str(row.id),
            'title': row.title,
            'row_type': row.row_type,
            'anime_ids': row.anime_ids,
            'order': row.order,
            'is_active': row.is_active,
        }, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        HomepageRow.objects(id=pk).delete()
        record_audit(request.user, 'delete', 'homepage_row', pk, "Deleted homepage row")
        return Response({'message': 'Row deleted'}, status=status.HTTP_204_NO_CONTENT)

