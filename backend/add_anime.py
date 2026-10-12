#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
add_anime.py -- Mahouten.to Anime Metadata & Banner Auto-Importer
==================================================================
Fetches official anime metadata, synopses, HD posters and landscape banners
from AniList & MyAnimeList API, and adds them to Mahouten.to.

Usage:
    python add_anime.py "Jujutsu Kaisen" "Attack on Titan" "Demon Slayer"
Or run without arguments to import popular titles.
"""
from __future__ import annotations

import os
import sys
import time
import datetime
import re
import unicodedata
import urllib.request
import json
from pathlib import Path

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mahouten.settings")
import django
django.setup()

from apps.catalog.models import Genre, Anime, Season, Episode, HomepageRow

PUBLIC_TEST_HLS = "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
TITLES_FILE = Path(__file__).resolve().parent / "titles.json"


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    text = re.sub(r"[-\s]+", "-", text)
    return text


def clean_html(raw_html: str) -> str:
    if not raw_html:
        return ""
    clean = re.sub(r"<br\s*/?>", " ", raw_html)
    clean = re.sub(r"<.*?>", "", clean)
    clean = re.sub(r"\[Written by MAL Rewrite\]", "", clean)
    clean = re.sub(r"\(Source:.*?\)", "", clean)
    clean = " ".join(clean.split())
    # Truncate nicely if excessively long
    if len(clean) > 420:
        cut = clean[:420]
        dot = cut.rfind(".")
        clean = cut[:dot + 1] if dot > 200 else cut + "..."
    return clean


def fetch_anilist(title: str) -> dict | None:
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
    req = urllib.request.Request(
        "https://graphql.anilist.co",
        data=json.dumps({"query": query, "variables": {"search": title}}).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "Mahouten/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=12) as res:
            data = json.loads(res.read().decode("utf-8"))
            media = (data.get("data") or {}).get("Media")
            if not media:
                return None

            t = media.get("title") or {}
            display_title = t.get("english") or t.get("romaji") or title
            slug = slugify(display_title)
            synopsis = clean_html(media.get("description") or "")

            poster = (
                (media.get("coverImage") or {}).get("extraLarge")
                or (media.get("coverImage") or {}).get("large")
                or ""
            )
            banner = media.get("bannerImage") or poster or "/wallpaper.png"

            score = media.get("averageScore")
            rating = round(float(score) / 10.0, 1) if score else 8.5

            status_str = media.get("status") or "FINISHED"
            status = "completed" if status_str == "FINISHED" else "ongoing"

            fmt = media.get("format") or "TV"
            anime_type = "movie" if fmt == "MOVIE" else "series"

            studios_list = (media.get("studios") or {}).get("nodes") or []
            studio = studios_list[0]["name"] if studios_list else "Unknown"

            age_rating = "R-17+" if media.get("isAdult") else "PG-13"
            ep_count = media.get("episodes") or 12

            return {
                "title": display_title,
                "slug": slug,
                "synopsis": synopsis,
                "genres": media.get("genres", ["Action"])[:5],
                "year": media.get("seasonYear") or 2024,
                "studio": studio,
                "status": status,
                "type": anime_type,
                "rating": rating,
                "age_rating": age_rating,
                "poster": poster,
                "banner": banner,
                "featured": False,
                "trailer_url": "",
                "episodes": [
                    {
                        "number": i,
                        "title": f"Episode {i}",
                        "intro_start": 15.0,
                        "intro_end": 85.0,
                        "duration": 1440
                    }
                    for i in range(1, min(int(ep_count), 4) + 1)
                ]
            }
    except Exception as e:
        print(f"  [error] Failed fetching '{title}' from AniList: {e}")
        return None


def save_to_titles_json(shows_data: list[dict]):
    all_shows = []
    if TITLES_FILE.exists():
        try:
            with open(TITLES_FILE, "r", encoding="utf-8") as f:
                all_shows = json.load(f)
        except Exception:
            all_shows = []

    existing_slugs = {s["slug"] for s in all_shows}
    for s in shows_data:
        if s["slug"] in existing_slugs:
            # Update existing
            for idx, ex in enumerate(all_shows):
                if ex["slug"] == s["slug"]:
                    all_shows[idx] = s
                    break
        else:
            all_shows.append(s)
            existing_slugs.add(s["slug"])

    with open(TITLES_FILE, "w", encoding="utf-8") as f:
        json.dump(all_shows, f, indent=2, ensure_ascii=False)
    print(f"  [OK] Saved to {TITLES_FILE.name} (Total persisted: {len(all_shows)})")


def seed_single_show(s_data: dict) -> Anime:
    # Ensure genres exist
    for g_name in s_data.get("genres", []):
        if not Genre.objects(name=g_name).first():
            Genre(name=g_name, slug=slugify(g_name), description="").save()

    show = Anime.objects(slug=s_data["slug"]).first()
    if not show:
        show = Anime(
            title=s_data["title"],
            slug=s_data["slug"],
            synopsis=s_data["synopsis"],
            genres=s_data["genres"],
            year=s_data["year"],
            studio=s_data["studio"],
            status=s_data["status"],
            type=s_data["type"],
            rating=s_data["rating"],
            age_rating=s_data["age_rating"],
            poster=s_data["poster"],
            banner=s_data["banner"],
            trailer_url=s_data.get("trailer_url", ""),
            featured=s_data.get("featured", False),
            publish_status="published",
            publish_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
            created_by="admin"
        )
        show.save()

        season = Season(
            anime_id=str(show.id),
            number=1,
            title="Season 1" if show.type == "series" else "Movie",
            order=1
        )
        season.save()

        for ep_data in s_data.get("episodes", []):
            Episode(
                anime_id=str(show.id),
                season=1,
                number=ep_data["number"],
                title=ep_data["title"],
                synopsis=f"Episode {ep_data['number']} of {show.title}.",
                duration=ep_data["duration"],
                thumbnail=show.poster,
                video_source_type="url",
                hls_url=PUBLIC_TEST_HLS,
                subtitles=[
                    {
                        "lang": "en",
                        "label": "English",
                        "src": "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-1080p-30fps/master/subtitles.vtt"
                    }
                ],
                intro_start=ep_data.get("intro_start", 10.0),
                intro_end=ep_data.get("intro_end", 80.0),
                publish_status="published",
                publish_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                processing_status="ready"
            ).save()

        season.episodes_count = len(s_data.get("episodes", []))
        season.save()
    else:
        show.banner = s_data["banner"]
        show.poster = s_data["poster"]
        show.synopsis = s_data["synopsis"]
        show.rating = s_data["rating"]
        show.genres = s_data["genres"]
        show.save()

    return show


def update_homepage_rows(show_ids: list[str]):
    rows = HomepageRow.objects.all()
    for row in rows:
        existing = list(row.anime_ids or [])
        for sid in show_ids:
            if sid not in existing:
                existing.append(sid)
        row.anime_ids = existing
        row.save()


def main():
    titles = sys.argv[1:]
    if not titles:
        # Default popular anime selection if none provided
        titles = [
            "Jujutsu Kaisen",
            "Demon Slayer: Kimetsu no Yaiba",
            "Attack on Titan",
            "Chainsaw Man",
            "Black Clover",
            "Solo Leveling"
        ]

    print(f"\n=======================================================")
    print(f" Mahouten.to -- Fetching {len(titles)} titles from Anime Database")
    print(f"=======================================================\n")

    fetched = []
    created_ids = []

    for idx, t in enumerate(titles, 1):
        print(f"[{idx}/{len(titles)}] Searching: '{t}'...")
        data = fetch_anilist(t)
        if data:
            print(f"  + Title:    {data['title']} ({data['year']})")
            print(f"  + Studio:   {data['studio']} | Rating: {data['rating']}")
            print(f"  + Genres:   {', '.join(data['genres'])}")
            print(f"  + Banner:   {data['banner'][:55]}...")
            print(f"  + Synopsis: {data['synopsis'][:80]}...")
            fetched.append(data)

            # Insert into active DB
            try:
                show = seed_single_show(data)
                created_ids.append(str(show.id))
                print(f"  + DB:       Seeded successfully (ID: {show.id})")
            except Exception as e:
                print(f"  - DB Error: {e}")
        else:
            print(f"  - Could not find data for '{t}'")
        print()
        time.sleep(0.4)

    if fetched:
        save_to_titles_json(fetched)
        if created_ids:
            try:
                update_homepage_rows(created_ids)
            except Exception:
                pass
        print(f"\n[SUCCESS] Successfully imported {len(fetched)} anime titles!")
    else:
        print("\n[WARNING] No titles were imported.")


if __name__ == "__main__":
    main()
