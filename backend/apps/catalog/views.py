import datetime
import json
import uuid
import re
from pathlib import Path
from django.conf import settings
from django.utils.text import slugify
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.catalog.models import Genre, Anime, Season, Episode, HomepageRow, Review
from apps.catalog.serializers import (
    GenreSerializer, AnimeListSerializer, AnimeDetailSerializer,
    EpisodeListSerializer, SeasonSerializer, ReviewSerializer
)

def get_public_anime_queryset():
    """Returns queryset containing only published, non-scheduled anime."""
    now = datetime.datetime.utcnow()
    return Anime.objects(
        publish_status='published',
        publish_at__lte=now
    )

def get_public_episodes_queryset(anime_id=None):
    """Returns queryset containing only published, non-scheduled episodes."""
    now = datetime.datetime.utcnow()
    qs = Episode.objects(
        publish_status='published',
        publish_at__lte=now
    )
    if anime_id:
        qs = qs.filter(anime_id=str(anime_id))
    return qs


class GenreListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        genres = Genre.objects.all().order_by('name')
        return Response(GenreSerializer(genres, many=True).data)


class AnimeListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        qs = get_public_anime_queryset()

        genre = request.query_params.get('genre')
        if genre:
            qs = qs.filter(genres__icontains=genre)

        anime_type = request.query_params.get('type')
        if anime_type:
            qs = qs.filter(type=anime_type)

        anime_status = request.query_params.get('status')
        if anime_status:
            qs = qs.filter(status=anime_status)

        year = request.query_params.get('year')
        if year:
            try:
                qs = qs.filter(year=int(year))
            except ValueError:
                pass

        sort_by = request.query_params.get('sort', 'trending')
        if sort_by == 'top_rated':
            qs = qs.order_by('-rating')
        elif sort_by == 'newest':
            qs = qs.order_by('-created_at')
        elif sort_by == 'title':
            qs = qs.order_by('title')
        elif sort_by == 'year':
            qs = qs.order_by('-year')
        else: # trending default
            qs = qs.order_by('-featured', '-rating')

        # Simple pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 24))
        start = (page - 1) * page_size
        end = start + page_size

        total = qs.count()
        items = qs[start:end]

        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'results': AnimeListSerializer(items, many=True).data
        })


class AnimeDetailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        anime = get_public_anime_queryset().filter(slug=slug).first()
        if not anime:
            return Response({'error': 'Anime not found'}, status=status.HTTP_404_NOT_FOUND)

        seasons = Season.objects(anime_id=str(anime.id)).order_by('number')
        episodes = get_public_episodes_queryset(anime.id).order_by('season', 'number')

        # Find similar titles (sharing at least one genre)
        similar_items = []
        if anime.genres:
            similar_qs = get_public_anime_queryset().filter(
                id__ne=anime.id,
                genres__in=anime.genres
            ).limit(6)
            similar_items = AnimeListSerializer(similar_qs, many=True).data

        data = AnimeDetailSerializer(anime).data
        data['seasons'] = SeasonSerializer(seasons, many=True).data
        data['episodes'] = EpisodeListSerializer(episodes, many=True).data
        data['similar'] = similar_items

        return Response(data)


class AnimeEpisodesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, slug):
        anime = get_public_anime_queryset().filter(slug=slug).first()
        if not anime:
            return Response({'error': 'Anime not found'}, status=status.HTTP_404_NOT_FOUND)

        qs = get_public_episodes_queryset(anime.id)
        season_num = request.query_params.get('season')
        if season_num:
            try:
                qs = qs.filter(season=int(season_num))
            except ValueError:
                pass

        episodes = qs.order_by('number')
        return Response(EpisodeListSerializer(episodes, many=True).data)


class HomeRowsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        now = datetime.datetime.utcnow()
        base_qs = get_public_anime_queryset()

        # Hero billboard items (featured items)
        hero_items = base_qs.filter(featured=True).order_by('-rating')[:5]
        if not hero_items:
            hero_items = base_qs.order_by('-rating')[:5]

        # Trending row
        trending = base_qs.order_by('-rating', '-created_at')[:15]

        # New Releases (episodes recently published or anime created recently)
        new_releases = base_qs.order_by('-created_at')[:15]

        # Top Rated
        top_rated = base_qs.order_by('-rating')[:15]

        # Action / Fantasy genres
        action_row = base_qs.filter(genres__icontains='Action')[:15]
        fantasy_row = base_qs.filter(genres__icontains='Fantasy')[:15]
        romance_row = base_qs.filter(genres__icontains='Romance')[:15]

        # Curated admin rows
        custom_rows = []
        for row in HomepageRow.objects(is_active=True).order_by('order'):
            if row.anime_ids:
                animes = base_qs.filter(id__in=row.anime_ids)
                custom_rows.append({
                    'id': str(row.id),
                    'title': row.title,
                    'row_type': row.row_type,
                    'items': AnimeListSerializer(animes, many=True).data
                })

        rows = []
        if trending:
            t_data = AnimeListSerializer(trending, many=True).data
            rows.append({
                'id': 'trending',
                'title': 'Trending Now',
                'row_type': 'trending',
                'items': t_data,
                'anime': t_data,
            })
        if new_releases:
            n_data = AnimeListSerializer(new_releases, many=True).data
            rows.append({
                'id': 'new_releases',
                'title': 'New Releases',
                'row_type': 'new_releases',
                'items': n_data,
                'anime': n_data,
            })
        if top_rated:
            r_data = AnimeListSerializer(top_rated, many=True).data
            rows.append({
                'id': 'top_rated',
                'title': 'Top Rated Masterpieces',
                'row_type': 'top_rated',
                'items': r_data,
                'anime': r_data,
            })
        if action_row:
            act_data = AnimeListSerializer(action_row, many=True).data
            rows.append({
                'id': 'genre_action',
                'title': 'High-Octane Action',
                'row_type': 'genre',
                'items': act_data,
                'anime': act_data,
            })
        if fantasy_row:
            fan_data = AnimeListSerializer(fantasy_row, many=True).data
            rows.append({
                'id': 'genre_fantasy',
                'title': 'Magic & Supernatural Fantasy',
                'row_type': 'genre',
                'items': fan_data,
                'anime': fan_data,
            })
        if romance_row:
            rom_data = AnimeListSerializer(romance_row, many=True).data
            rows.append({
                'id': 'genre_romance',
                'title': 'Romance & Slice of Life',
                'row_type': 'genre',
                'items': rom_data,
                'anime': rom_data,
            })

        for cr in custom_rows:
            cr['anime'] = cr.get('items', [])
            rows.append(cr)

        return Response({
            'hero': AnimeListSerializer(hero_items, many=True).data,
            'rows': rows,
        })


class SearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        qs = get_public_anime_queryset()

        if query:
            qs = qs.filter(title__icontains=query)

        genre = request.query_params.get('genre')
        if genre:
            qs = qs.filter(genres__icontains=genre)

        anime_type = request.query_params.get('type')
        if anime_type:
            qs = qs.filter(type=anime_type)

        anime_status = request.query_params.get('status')
        if anime_status:
            qs = qs.filter(status=anime_status)

        year = request.query_params.get('year')
        if year:
            try:
                qs = qs.filter(year=int(year))
            except ValueError:
                pass

        results = qs.order_by('-rating')[:30]
        return Response({
            'query': query,
            'count': len(results),
            'results': AnimeListSerializer(results, many=True).data
        })


class ReviewListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def _get_target_anime(self, anime_id):
        anime = Anime.objects(slug=str(anime_id)).first()
        if not anime and re.match(r'^[0-9a-fA-F]{24}$', str(anime_id)):
            anime = Anime.objects(id=str(anime_id)).first()
        return anime

    def get(self, request, anime_id):
        reviews = Review.objects(anime_id=str(anime_id)).order_by('-created_at')[:50]
        anime = self._get_target_anime(anime_id)
        target_id = str(anime.id) if anime else str(anime_id)
        reviews = Review.objects(anime_id=target_id).order_by('-created_at')[:50]
        return Response(ReviewSerializer(reviews, many=True).data)

    def post(self, request, anime_id):
        serializer = ReviewSerializer(data=request.data)
        anime = self._get_target_anime(anime_id)
        target_id = str(anime.id) if anime else str(anime_id)
        
        payload = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        payload['anime_id'] = target_id

        serializer = ReviewSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check existing review
        existing = Review.objects(anime_id=target_id, user_id=str(request.user.id)).first()
        data = serializer.validated_data
        if existing:
            existing.rating = data['rating']
            existing.comment = data.get('comment', '')
            existing.save()
            return Response(ReviewSerializer(existing).data)

        review = Review(
            user_id=str(request.user.id),
            username=request.user.username,
            anime_id=target_id,
            rating=data['rating'],
            comment=data.get('comment', '')
        )
        review.save()

        # Recalculate average anime rating
        all_reviews = Review.objects(anime_id=target_id)
        if all_reviews and anime:
            avg_rating = sum(r.rating for r in all_reviews) / len(all_reviews)
            anime.rating = round(avg_rating, 1)
            anime.save()

        return Response(ReviewSerializer(review).data, status=status.HTTP_201_CREATED)



class StudioUploadView(APIView):
    """
    YouTube-style Studio upload endpoint for anime, movies, and short clips.
    Accepts video files or URLs, posters, banners, titles, descriptions, and metadata.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        data = request.data
        title = data.get('title', '').strip()
        if not title:
            return Response({'error': 'Title is required'}, status=status.HTTP_400_BAD_REQUEST)

        poster_url = data.get('poster', '').strip()
        banner_url = data.get('banner', '').strip()
        video_url = data.get('video_url', '').strip()

        # Upload poster image file if provided
        from mahouten.media_service import upload_image, upload_video

        poster_file = request.FILES.get('poster_file')
        if poster_file:
            uploaded = upload_image(poster_file, folder='mahouten/posters')
            poster_url = uploaded.get('url', '')

        # Upload banner image file if provided
        banner_file = request.FILES.get('banner_file')
        if banner_file:
            uploaded = upload_image(banner_file, folder='mahouten/banners')
            banner_url = uploaded.get('url', '')

        # Upload video file if provided
        video_file = request.FILES.get('video_file')
        if video_file:
            uploaded = upload_video(video_file, folder='mahouten/videos')
            video_url = uploaded.get('url', '')

        if not video_url:
            video_url = ""

        if not poster_url:
            poster_url = ""
        if not banner_url:
            banner_url = poster_url

        # Unique slug
        base_slug = slugify(title) or f"upload-{uuid.uuid4().hex[:6]}"
        slug = base_slug
        counter = 1
        while Anime.objects(slug=slug).first():
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Genres parsing
        raw_genres = data.get('genres')
        if isinstance(raw_genres, str):
            try:
                genres = json.loads(raw_genres)
            except Exception:
                genres = [g.strip() for g in raw_genres.split(',') if g.strip()]
        elif isinstance(raw_genres, list):
            genres = raw_genres
        else:
            genres = []

        content_type = data.get('type', 'series')
        if content_type not in ('series', 'movie', 'clip'):
            content_type = 'series'

        # Ensure genres exist
        for g_name in genres:
            if not Genre.objects(name=g_name).first():
                Genre(name=g_name, slug=slugify(g_name), description="").save()

        user_name = getattr(request.user, 'username', None) or data.get('creator', 'Otaku Creator')

        show = Anime(
            title=title,
            slug=slug,
            synopsis=data.get('synopsis', data.get('description', '')),
            genres=genres,
            year=int(data.get('year', datetime.datetime.utcnow().year)),
            studio=data.get('studio', user_name),
            status=data.get('status', 'completed' if content_type in ('movie', 'clip') else 'ongoing'),
            type=content_type,
            rating=float(data.get('rating', 8.5)),
            age_rating=data.get('age_rating', 'PG-13'),
            poster=poster_url,
            banner=banner_url,
            featured=bool(data.get('featured', False)),
            publish_status='published',
            publish_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
            created_by=user_name,
        )
        show.save()

        # Season
        season_title = "Clips" if content_type == 'clip' else ("Movie" if content_type == 'movie' else "Season 1")
        season = Season(
            anime_id=str(show.id),
            number=1,
            title=season_title,
            order=1,
            episodes_count=1
        )
        season.save()

        # Episode
        duration = int(data.get('duration', 180 if content_type == 'clip' else (5400 if content_type == 'movie' else 1440)))
        ep_title = data.get('episode_title', title)
        episode = Episode(
            anime_id=str(show.id),
            season=1,
            number=1,
            title=ep_title,
            synopsis=show.synopsis,
            duration=duration,
            thumbnail=poster_url,
            video_source_type='url',
            hls_url=video_url,
            subtitles=[],
            intro_start=0.0,
            intro_end=0.0,
            publish_status='published',
            publish_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=1),
            processing_status='ready'
        )
        episode.save()

        # Persist to titles.json so it survives restart
        try:
            titles_file = Path(settings.BASE_DIR) / 'titles.json'
            all_shows = []
            if titles_file.exists():
                with open(titles_file, 'r', encoding='utf-8') as f:
                    all_shows = json.load(f)
            all_shows.append({
                'title': show.title,
                'slug': show.slug,
                'synopsis': show.synopsis,
                'genres': show.genres,
                'year': show.year,
                'studio': show.studio,
                'status': show.status,
                'type': show.type,
                'rating': show.rating,
                'age_rating': show.age_rating,
                'poster': show.poster,
                'banner': show.banner,
                'featured': show.featured,
                'trailer_url': getattr(show, 'trailer_url', '') or '',
                'episodes': [{
                    'number': 1,
                    'title': episode.title,
                    'intro_start': 0.0,
                    'intro_end': 0.0,
                    'duration': episode.duration,
                    'hls_url': episode.hls_url or video_url,
                }]
            })
            with open(titles_file, 'w', encoding='utf-8') as f:
                json.dump(all_shows, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error persisting to titles.json: {e}")

        # Add to homepage row
        try:
            row = HomepageRow.objects.first()
            if row:
                row.anime_ids = list(row.anime_ids or []) + [str(show.id)]
                row.save()
        except Exception:
            pass

        return Response({
            'success': True,
            'anime': AnimeDetailSerializer(show).data,
            'first_episode_id': str(episode.id),
            'watch_url': f"/watch/{show.slug}/{episode.id}",
            'detail_url': f"/anime/{show.slug}"
        }, status=status.HTTP_201_CREATED)


class AniListAutofillView(APIView):
    """
    Queries AniList GraphQL API to auto-fill metadata, description,
    HD posters, and 16:9 banners directly from the backend.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query_text = request.query_params.get('query', '').strip()
        if not query_text:
            return Response({'error': 'query parameter is required'}, status=status.HTTP_400_BAD_REQUEST)

        query = """
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            id
            idMal
            title {
              english
              romaji
            }
            description
            bannerImage
            coverImage {
              extraLarge
              large
            }
            genres
            seasonYear
            episodes
            averageScore
            status
            format
            isAdult
            studios(isMain: true) {
              nodes {
                name
              }
            }
          }
        }
        """
        import urllib.request
        req = urllib.request.Request(
            "https://graphql.anilist.co",
            data=json.dumps({"query": query, "variables": {"search": query_text}}).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "Mahouten/1.0"}
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                data = json.loads(res.read().decode('utf-8'))
                media = (data.get("data") or {}).get("Media")
                if not media:
                    return Response({'error': 'No matching anime found'}, status=status.HTTP_404_NOT_FOUND)

                desc = media.get("description") or ""
                desc = re.sub(r"<br\s*/?>", " ", desc)
                desc = re.sub(r"<.*?>", "", desc)
                desc = re.sub(r"\[Written by MAL Rewrite\]", "", desc)
                desc = re.sub(r"\(Source:.*?\)", "", desc)
                desc = " ".join(desc.split())

                t = media.get("title") or {}
                display_title = t.get("english") or t.get("romaji") or query_text

                score = media.get("averageScore")
                rating = round(float(score) / 10.0, 1) if score else 8.5

                status_str = media.get("status") or "FINISHED"
                anime_status = "completed" if status_str == "FINISHED" else "ongoing"

                fmt = media.get("format") or "TV"
                anime_type = "movie" if fmt == "MOVIE" else "series"

                studios_list = (media.get("studios") or {}).get("nodes") or []
                studio = studios_list[0]["name"] if studios_list else "Unknown"

                return Response({
                    'title': display_title,
                    'synopsis': desc,
                    'poster': (media.get("coverImage") or {}).get("extraLarge") or (media.get("coverImage") or {}).get("large") or "",
                    'banner': media.get("bannerImage") or "",
                    'genres': media.get("genres", ["Action"]),
                    'year': media.get("seasonYear") or 2024,
                    'studio': studio,
                    'rating': rating,
                    'age_rating': "R-17+" if media.get("isAdult") else "PG-13",
                    'type': anime_type,
                    'status': anime_status,
                    'episodes_count': media.get("episodes") or 12,
                })
        except Exception as e:
            return Response({'error': f'Failed to query database: {str(e)}'}, status=status.HTTP_502_BAD_GATEWAY)


