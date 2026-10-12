from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.accounts.models import User, Profile
from apps.accounts.tokens import generate_tokens_for_user
from apps.catalog.models import Genre, Anime, Season, Episode, HomepageRow
from apps.streaming.models import WatchProgress

class MahoutenTestSuite(TestCase):
    def setUp(self):
        # Drop collections to ensure complete test isolation
        User.drop_collection()
        Profile.drop_collection()
        Genre.drop_collection()
        Anime.drop_collection()
        Season.drop_collection()
        Episode.drop_collection()
        WatchProgress.drop_collection()

        self.client = APIClient()
        
        # 1. Create Normal User
        self.user = User(
            email='viewer@mahouten.to',
            username='viewer',
            role='user'
        )
        self.user.set_password('Password123!')
        self.user.save()
        self.user_tokens = generate_tokens_for_user(self.user)
        self.user_auth_header = f"Bearer {self.user_tokens['access']}"
        
        # 2. Create Admin User
        self.admin = User(
            email='admin@mahouten.to',
            username='admin',
            role='admin'
        )
        self.admin.set_password('AdminPassword123!')
        self.admin.save()
        self.admin_tokens = generate_tokens_for_user(self.admin)
        self.admin_auth_header = f"Bearer {self.admin_tokens['access']}"
        
        # 3. Create Sample Genre & Anime
        self.genre = Genre.objects.create(name='Fantasy', slug='fantasy')
        self.anime = Anime.objects.create(
            title='Frieren: Beyond Journey\'s End',
            slug='frieren-beyond-journeys-end',
            synopsis='An elf mage journeys to heaven to speak with her late comrade.',
            genres=['Fantasy'],
            type='series',
            status='ongoing',
            rating=9.1,
            year=2023,
            studio='Madhouse',
            publish_status='published'
        )

        self.season = Season.objects.create(
            anime_id=str(self.anime.id),
            number=1,
            title='Season 1'
        )

        self.episode = Episode.objects.create(
            anime_id=str(self.anime.id),
            season=1,
            number=1,
            title='The Journey\'s End',
            duration=24,
            hls_url='https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            publish_status='published'
        )

    def tearDown(self):
        User.drop_collection()
        Profile.drop_collection()
        Genre.drop_collection()
        Anime.drop_collection()
        Season.drop_collection()
        Episode.drop_collection()
        WatchProgress.drop_collection()

    def test_01_user_registration_and_login(self):
        # Register new user
        reg_response = self.client.post('/api/v1/auth/register/', {
            'email': 'newfan@mahouten.to',
            'username': 'newfan',
            'password': 'StrongPassword123!'
        })
        self.assertEqual(reg_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', reg_response.data)

        # Login user
        login_response = self.client.post('/api/v1/auth/login/', {
            'email': 'newfan@mahouten.to',
            'password': 'StrongPassword123!'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', login_response.data)

    def test_02_public_catalog_access(self):
        # Public Anime list
        res = self.client.get('/api/v1/anime/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data['results']), 1)

        # Public Anime detail
        res = self.client.get(f'/api/v1/anime/{self.anime.slug}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['title'], self.anime.title)

        # Public Anime episodes
        res = self.client.get(f'/api/v1/anime/{self.anime.slug}/episodes/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_03_role_permission_enforcement(self):
        # Normal user cannot access Admin Stats (must return 403 Forbidden)
        self.client.credentials(HTTP_AUTHORIZATION=self.user_auth_header)
        res = self.client.get('/api/v1/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # Admin user CAN access Admin Stats (must return 200 OK)
        self.client.credentials(HTTP_AUTHORIZATION=self.admin_auth_header)
        res = self.client.get('/api/v1/admin/stats/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_shows', res.data)

    def test_04_watch_progress_tracking(self):
        # Create user profile
        profile = Profile.objects.create(
            user_id=str(self.user.id),
            name='Otaku1'
        )
        self.client.credentials(HTTP_AUTHORIZATION=self.user_auth_header)
        
        # Save progress
        res = self.client.post('/api/v1/progress/', {
            'profile_id': str(profile.id),
            'episode_id': str(self.episode.id),
            'seconds': 350
        })
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED])

        # Retrieve progress
        res = self.client.get(f'/api/v1/progress/?profile_id={profile.id}')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_05_admin_crud_shows_and_bulk_episodes(self):
        self.client.credentials(HTTP_AUTHORIZATION=self.admin_auth_header)
        
        # Create Show via Admin API
        show_res = self.client.post('/api/v1/admin/shows/', {
            'title': 'Jujutsu Kaisen',
            'synopsis': 'Sorcerers battling curses.',
            'type': 'series',
            'status': 'ongoing',
            'year': 2020,
            'publish_status': 'published'
        })
        self.assertEqual(show_res.status_code, status.HTTP_201_CREATED)
        new_show_id = show_res.data['id']

        # Bulk add episodes to the show
        bulk_res = self.client.post('/api/v1/admin/episodes/bulk/', {
            'show': new_show_id,
            'episodes': [
                {'number': 1, 'title': 'Ryomen Sukuna', 'hls_url': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'},
                {'number': 2, 'title': 'For Myself', 'hls_url': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'}
            ]
        }, format='json')
        self.assertEqual(bulk_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(bulk_res.data), 2)
