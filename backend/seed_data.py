#!/usr/bin/env python
import os
import sys
import datetime
from pathlib import Path

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mahouten.settings')
import django
django.setup()

from apps.accounts.models import User, Profile
from apps.catalog.models import Genre, Anime, Season, Episode, HomepageRow
from apps.streaming.models import WatchProgress
from apps.library.models import MyList

PUBLIC_TEST_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"

SAMPLE_GENRES = [
    {"name": "Action", "slug": "action", "description": "High-octane fights and intense battles"},
    {"name": "Fantasy", "slug": "fantasy", "description": "Magical worlds, enchanted lore, and sorcery"},
    {"name": "Adventure", "slug": "adventure", "description": "Epic quests and exploratory journeys"},
    {"name": "Sci-Fi", "slug": "sci-fi", "description": "Futuristic technology, cybernetics, and space"},
    {"name": "Supernatural", "slug": "supernatural", "description": "Demons, spirits, curses, and deities"},
    {"name": "Romance", "slug": "romance", "description": "Emotional drama and romantic relationships"},
    {"name": "Psychological", "slug": "psychological", "description": "Mind games, suspense, and thriller"},
]

SAMPLE_SHOWS = [
    {
        "title": "Chrono Resonance: Arcane Echoes",
        "slug": "chrono-resonance",
        "synopsis": "In the floating academy of Aethelgard, a prodigy with forbidden chronomancy uncovers a reality-shattering conspiracy threatening both magical realms and mortal time.",
        "genres": ["Action", "Fantasy", "Supernatural"],
        "year": 2024,
        "studio": "Ufotable",
        "status": "ongoing",
        "type": "series",
        "rating": 9.2,
        "age_rating": "PG-13",
        "featured": True,
        "poster": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        "banner": "/wallpaper.png",
        "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "episodes": [
            {"number": 1, "title": "The Hourglass Unsealed", "intro_start": 10.0, "intro_end": 75.0, "duration": 1440},
            {"number": 2, "title": "Fractured Timelines", "intro_start": 15.0, "intro_end": 80.0, "duration": 1420},
            {"number": 3, "title": "The Starlight Sanctuary", "intro_start": 12.0, "intro_end": 78.0, "duration": 1500},
        ]
    },
    {
        "title": "Demon Vanguard: Bloodline Awakening",
        "slug": "demon-vanguard",
        "synopsis": "A cursed swordsman wields an ancient crimson blade to protect humanity from shadowy demons invading from the nethergate.",
        "genres": ["Action", "Supernatural", "Adventure"],
        "year": 2023,
        "studio": "Mappa",
        "status": "ongoing",
        "type": "series",
        "rating": 8.9,
        "age_rating": "R-17+",
        "featured": True,
        "poster": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
        "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
        "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "episodes": [
            {"number": 1, "title": "Cursed Blossom", "intro_start": 20.0, "intro_end": 85.0, "duration": 1410},
            {"number": 2, "title": "Crimson Edge", "intro_start": 15.0, "intro_end": 80.0, "duration": 1460},
        ]
    },
    {
        "title": "Cyber Alchemist 2099",
        "slug": "cyber-alchemist-2099",
        "synopsis": "In Neo-Shinjuku, cybernetic enhancements merge with ancient transmutation circles, creating unstoppable techno-mages.",
        "genres": ["Sci-Fi", "Action", "Psychological"],
        "year": 2024,
        "studio": "Trigger",
        "status": "ongoing",
        "type": "series",
        "rating": 8.7,
        "age_rating": "PG-13",
        "featured": True,
        "poster": "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
        "banner": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1600&auto=format&fit=crop&q=80",
        "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "episodes": [
            {"number": 1, "title": "Silicon & Sulfur", "intro_start": 15.0, "intro_end": 82.0, "duration": 1400},
            {"number": 2, "title": "Quantum Equivalent", "intro_start": 12.0, "intro_end": 75.0, "duration": 1480},
        ]
    },
    {
        "title": "Whispers of the Astral Garden",
        "slug": "whispers-of-astral-garden",
        "synopsis": "A botanical spirit encounters an outcast scholar in a mystical greenhouse perched between the stars and dreams.",
        "genres": ["Romance", "Fantasy", "Adventure"],
        "year": 2022,
        "studio": "Kyoto Animation",
        "status": "completed",
        "type": "movie",
        "rating": 9.0,
        "age_rating": "PG",
        "featured": False,
        "poster": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
        "banner": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
        "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "episodes": [
            {"number": 1, "title": "Full Feature Film", "intro_start": 0.0, "intro_end": 0.0, "duration": 6480},
        ]
    },
    {
        "title": "Spellbound Ronin",
        "slug": "spellbound-ronin",
        "synopsis": "A wandering swordsman imbued with wind sorcery travels across feudal lands solving supernatural incidents.",
        "genres": ["Action", "Adventure", "Fantasy"],
        "year": 2023,
        "studio": "Bones",
        "status": "completed",
        "type": "series",
        "rating": 8.5,
        "age_rating": "PG-13",
        "featured": False,
        "poster": "/wallpaper.png",
        "banner": "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80",
        "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "episodes": [
            {"number": 1, "title": "Breeze of Destiny", "intro_start": 10.0, "intro_end": 70.0, "duration": 1400},
        ]
    },
    {
        "title": "Neo Tokyo: Eclipse Protocol",
        "slug": "neo-tokyo-eclipse",
        "synopsis": "An underground hacker group battles artificial intelligence deities ruling over a neon-drenched metropolis.",
        "genres": ["Sci-Fi", "Psychological", "Action"],
        "year": 2024,
        "studio": "Wit Studio",
        "status": "ongoing",
        "type": "series",
        "rating": 8.8,
        "age_rating": "R-17+",
        "featured": True,
        "poster": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80",
        "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?w=1600&auto=format&fit=crop&q=80",
        "trailer_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "episodes": [
            {"number": 1, "title": "Zero Day Protocol", "intro_start": 14.0, "intro_end": 80.0, "duration": 1430},
        ]
    }
]

def seed():
    print("--- Starting Mahouten Database Seeding ---")

    # 1. Admin Account
    admin = User.objects(email="admin@mahouten.to").first()
    if not admin:
        admin = User(username="admin", email="admin@mahouten.to", role="admin")
        admin.set_password("admin12345")
        admin.save()
        Profile(user_id=str(admin.id), name="Admin Master", avatar="avatar_admin").save()
        print("[OK] Created Admin user: admin@mahouten.to (password: admin12345)")
    else:
        print("[OK] Admin user already exists.")

    # 2. Regular User Account
    user = User.objects(email="user@mahouten.to").first()
    if not user:
        user = User(username="otaku_ren", email="user@mahouten.to", role="user")
        user.set_password("user12345")
        user.save()
        p1 = Profile(user_id=str(user.id), name="Ren", avatar="avatar_1")
        p1.save()
        p2 = Profile(user_id=str(user.id), name="Aoi", avatar="avatar_2")
        p2.save()
        print("[OK] Created Normal user: user@mahouten.to (password: user12345) with 2 profiles: Ren, Aoi")
    else:
        p1 = Profile.objects(user_id=str(user.id)).first()
        print("[OK] Normal user already exists.")

    # 3. Genres
    for g in SAMPLE_GENRES:
        if not Genre.objects(slug=g["slug"]).first():
            Genre(name=g["name"], slug=g["slug"], description=g["description"]).save()
    print("[OK] Seeded Anime Genres")

    # 4. Shows, Seasons & Episodes
    created_show_ids = []
    first_episode = None

    import json
    titles_file = Path(__file__).resolve().parent / "titles.json"
    all_shows = list(SAMPLE_SHOWS)
    if titles_file.exists():
        try:
            with open(titles_file, "r", encoding="utf-8") as f:
                custom_shows = json.load(f)
                existing_slugs = {s["slug"] for s in all_shows}
                for cs in custom_shows:
                    if cs["slug"] not in existing_slugs:
                        all_shows.append(cs)
                        existing_slugs.add(cs["slug"])
        except Exception as e:
            print(f"[Warning] Error reading titles.json: {e}")

    for s_data in all_shows:
        show = Anime.objects(slug=s_data["slug"]).first()
        if not show:
            show = Anime(
                title=s_data.get("title", "Untitled"),
                slug=s_data.get("slug", "anime"),
                synopsis=s_data.get("synopsis", ""),
                genres=s_data.get("genres", []),
                year=s_data.get("year", 2024),
                studio=s_data.get("studio", "Unknown"),
                status=s_data.get("status", "ongoing"),
                type=s_data.get("type", "series"),
                rating=s_data.get("rating", 8.0),
                age_rating=s_data.get("age_rating", "PG-13"),
                poster=s_data.get("poster", ""),
                banner=s_data.get("banner", ""),
                trailer_url=s_data.get("trailer_url", ""),
                featured=s_data.get("featured", False),
                publish_status="published",
                publish_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                created_by="admin"
            )
            show.save()

            # Season 1
            season = Season(
                anime_id=str(show.id),
                number=1,
                title="Season 1" if show.type == 'series' else "Movie",
                order=1
            )
            season.save()

            # Episodes
            episodes_list = s_data.get("episodes", [])
            for ep_data in episodes_list:
                ep = Episode(
                    anime_id=str(show.id),
                    season=1,
                    number=ep_data.get("number", 1),
                    title=ep_data.get("title", "Episode 1"),
                    synopsis=f"Episode {ep_data.get('number', 1)} of {show.title}.",
                    duration=ep_data.get("duration", 1440),
                    thumbnail=show.poster,
                    video_source_type="url",
                    hls_url=ep_data.get("hls_url") or ep_data.get("video_url") or PUBLIC_TEST_HLS,
                    subtitles=[
                        {"lang": "en", "label": "English", "src": "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30fps/master/subtitles.vtt"}
                    ],
                    intro_start=ep_data.get("intro_start", 0.0),
                    intro_end=ep_data.get("intro_end", 0.0),
                    publish_status="published",
                    publish_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                    processing_status="ready"
                )
                ep.save()
                if not first_episode:
                    first_episode = ep

            season.episodes_count = len(episodes_list)
            season.save()
        else:
            show.banner = s_data.get("banner", show.banner)
            show.poster = s_data.get("poster", show.poster)
            show.save()
            for ep_data in s_data.get("episodes", []):
                if ep_data.get("hls_url"):
                    existing_ep = Episode.objects(anime_id=str(show.id), number=ep_data.get("number", 1)).first()
                    if existing_ep:
                        existing_ep.hls_url = ep_data["hls_url"]
                        existing_ep.save()

        created_show_ids.append(str(show.id))

    print(f"[OK] Seeded {len(SAMPLE_SHOWS)} Anime titles with full Seasons and playable HLS Episodes")

    # 5. Homepage Curated Rows
    if not HomepageRow.objects.first():
        HomepageRow(
            title="Editor's Magic Picks",
            row_type="curated",
            anime_ids=created_show_ids[:4],
            order=1,
            is_active=True
        ).save()
        HomepageRow(
            title="Studio Spotlight: Mappa & Ufotable",
            row_type="curated",
            anime_ids=created_show_ids[1:5],
            order=2,
            is_active=True
        ).save()
        print("[OK] Created custom Homepage Curated Rows")

    # 6. Sample My List and Watch Progress for normal user profile
    if p1 and created_show_ids:
        if not MyList.objects(profile_id=str(p1.id)).first():
            MyList(profile_id=str(p1.id), anime_id=created_show_ids[0]).save()
            MyList(profile_id=str(p1.id), anime_id=created_show_ids[1]).save()
            print("[OK] Seeded sample My List items for Ren")

        if first_episode and not WatchProgress.objects(profile_id=str(p1.id)).first():
            WatchProgress(
                profile_id=str(p1.id),
                episode_id=str(first_episode.id),
                anime_id=first_episode.anime_id,
                seconds=340,
                duration=first_episode.duration,
                completed=False
            ).save()
            print("[OK] Seeded sample Watch Progress (Continue Watching) for Ren")

    print("\n[OK] Seeding Completed Successfully!")
    print("--------------------------------------------------")
    print("Admin:  admin@mahouten.to / admin12345 (Role: admin)")
    print("User:   user@mahouten.to  / user12345  (Role: user)")
    print("Public HLS stream: https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8")
    print("--------------------------------------------------")

if __name__ == '__main__':
    seed()

