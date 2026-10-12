import os
from django.conf import settings

STANDARD_GENRES = [
    {"name": "Action", "slug": "action", "description": "High-octane battles and martial arts"},
    {"name": "Adventure", "slug": "adventure", "description": "Epic journeys and quests"},
    {"name": "Comedy", "slug": "comedy", "description": "Humorous and lighthearted storytelling"},
    {"name": "Drama", "slug": "drama", "description": "Emotional depth and interpersonal conflicts"},
    {"name": "Fantasy", "slug": "fantasy", "description": "Magic, mythical realms, and sorcery"},
    {"name": "Horror", "slug": "horror", "description": "Suspense, supernatural dread, and thrills"},
    {"name": "Mystery", "slug": "mystery", "description": "Puzzles, detective investigations, and enigmas"},
    {"name": "Psychological", "slug": "psychological", "description": "Mind games, psychological intrigue, and philosophy"},
    {"name": "Romance", "slug": "romance", "description": "Romantic bonds and heartfelt relationships"},
    {"name": "Sci-Fi", "slug": "sci-fi", "description": "Futuristic technology, mecha, and space"},
    {"name": "Slice of Life", "slug": "slice-of-life", "description": "Relatable everyday life experiences"},
    {"name": "Supernatural", "slug": "supernatural", "description": "Spirits, deities, and cursed phenomena"},
    {"name": "Thriller", "slug": "thriller", "description": "Tense and edge-of-your-seat narratives"},
]

DEFAULT_HOMEPAGE_ROWS = [
    {"title": "Trending Now", "row_type": "trending", "order": 1},
    {"title": "New Releases", "row_type": "new_releases", "order": 2},
    {"title": "Top Rated Masterpieces", "row_type": "top_rated", "order": 3},
]


def init_production_database():
    """
    Automates MongoDB initialization with zero demo or hardcoded values:
    1. Ensures indexes on all MongoDB collections.
    2. Initializes base genre taxonomy if empty.
    3. Initializes default homepage row structures if empty.
    4. Automatically provisions admin user from ADMIN_EMAIL & ADMIN_PASSWORD env vars.
    """
    if os.getenv('RENDER_BUILD', '') == '1':
        return

    try:
        from apps.accounts.models import User, Profile
        from apps.catalog.models import Genre, Anime, Season, Episode, HomepageRow, Review
        from apps.streaming.models import WatchProgress
        from apps.library.models import MyList
        from apps.adminpanel.models import AuditLog

        # 1. Ensure indexes across all MongoEngine document models
        models = [
            User, Profile, Genre, Anime, Season, Episode,
            HomepageRow, Review, WatchProgress, MyList, AuditLog
        ]
        for model in models:
            try:
                model.ensure_indexes()
            except Exception as e:
                print(f"[Init DB] Index warning on {model.__name__}: {e}")

        # 2. Base genre taxonomy
        if Genre.objects.count() == 0:
            for g in STANDARD_GENRES:
                Genre(name=g['name'], slug=g['slug'], description=g['description']).save()
            print(f"[Init DB] Initialized {len(STANDARD_GENRES)} base genre categories.")

        # 3. Base homepage row definitions
        if HomepageRow.objects.count() == 0:
            for r in DEFAULT_HOMEPAGE_ROWS:
                HomepageRow(title=r['title'], row_type=r['row_type'], order=r['order'], is_active=True).save()
            print("[Init DB] Initialized default homepage row layout.")

        # 4. Automated Admin Account Creation from Environment Variables (0 hardcoded credentials)
        admin_email = os.getenv('ADMIN_EMAIL', '').strip()
        admin_password = os.getenv('ADMIN_PASSWORD', '').strip()
        admin_username = os.getenv('ADMIN_USERNAME', '').strip() or 'admin'

        if admin_email and admin_password:
            admin_user = User.objects(email=admin_email).first()
            if admin_user:
                admin_user.role = 'admin'
                admin_user.username = admin_username
                admin_user.set_password(admin_password)
                admin_user.is_banned = False
                admin_user.save()
                print(f"[Init DB] Verified administrator account: {admin_email}")
            else:
                admin_user = User(
                    username=admin_username,
                    email=admin_email,
                    role='admin',
                    is_banned=False
                )
                admin_user.set_password(admin_password)
                admin_user.save()

                Profile(
                    user_id=str(admin_user.id),
                    name=admin_username,
                    avatar='avatar_1'
                ).save()
                print(f"[Init DB] Automatically created administrator account: {admin_email}")
        else:
            admin_count = User.objects(role='admin').count()
            if admin_count == 0:
                print("[Init DB Notice] No admin account detected. Provide ADMIN_EMAIL and ADMIN_PASSWORD in environment or run 'python manage.py createadmin'.")

    except Exception as exc:
        print(f"[Init DB Warning] Automated initialization encountered an error: {exc}")
