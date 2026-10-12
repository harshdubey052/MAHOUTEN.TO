# Mahouten (mahouten.to) 🔮
### Production-Grade Netflix-Style Anime Streaming Web Application

> **Mahouten** is a modern, high-performance anime streaming platform featuring an immersive Netflix-style viewer interface and an administrative panel. Built with Python 3.12/3.13, Django 5, MongoEngine, React 18, Vite, Tailwind CSS, Framer Motion, and HLS.js.

---

## 🌟 Architecture & Features

### 🎬 Viewer App (`/`)
- **Cinematic Dark Theme**: Custom branding (`#0b0b0f`), violet/magenta magical gradient accents, responsive Netflix UX.
- **Hero Billboard**: Auto-rotating hero carousel featuring top anime with synopsis, Play button, More Info, and audio toggle.
- **Horizontal Carousels**:
  - Continue Watching (with resume progress bars)
  - Trending Now & New Releases
  - Top Rated & Genre-specific rows
  - Admin-curated custom sections
- **Card Hover Preview**: Fluid scale-up animations, tags, rating badges, quick Add-to-List, and trailer preview.
- **Title Detail Page**: Full-width backdrop banner, season tabs, episode grid with durations, and "More Like This" recommendations.
- **Custom HLS Video Player**:
  - Built on `hls.js` with multi-bitrate quality selector (360p / 720p / 1080p).
  - Auto-detected intro timestamps with **"Skip Intro"** button.
  - Keyboard shortcuts (`Space` to toggle play, `←`/`→` 10s seek, `F` for fullscreen, `M` for mute).
  - Real-time progress saving every 10 seconds to backend.
  - Auto-play next episode countdown.
- **Profiles System**: Up to 5 viewer profiles per account with custom avatar selection.
- **Search & Discovery**: 300ms debounced search, filtering by genre, year, status, and type with skeleton loaders.
- **Library**: Personal My List and detailed watch history.

### 🛡️ Admin Panel (`/admin`)
- **Dashboard**: KPI stat cards (Total Shows, Episodes, Users, Views Today) and 7-day streaming traffic bar chart via Recharts.
- **Shows Management**: Full CRUD, slug auto-generation, multi-genre taxonomy, poster & backdrop uploads, and publish status toggling (Draft / Published).
- **Episodes Management**:
  - Single episode creator with HLS URL or raw MP4/MKV video upload.
  - **Bulk Ingest**: Fast multi-row episode addition table.
  - Intro timestamps configuration (`intro_start`, `intro_end`).
- **FFmpeg Video Transcoding Pipeline**: Asynchronous Celery + FFmpeg task that encodes uploaded master videos into multi-quality HLS streams (`360p`, `720p`, `1080p`).
- **User Governance**: Account listing, email search, ban/unban controls, and role elevation (`user` ↔ `admin`).
- **Homepage Curator**: Re-order and curate custom carousel sections on the home screen.
- **Audit Logs**: Immutable log of administrative actions, resource modifications, and timestamps.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | Python 3.12+, Django 5.1, Django REST Framework, MongoEngine |
| **Database** | MongoDB (with automatic in-memory fallback for immediate zero-config testing) |
| **Authentication** | JWT (`djangorestframework-simplejwt`), embedded role claims, httpOnly refresh cookies |
| **Asynchronous Jobs** | Celery + Redis + FFmpeg |
| **Frontend** | React 18, Vite 5, Tailwind CSS, Framer Motion, TanStack Query, Recharts, Lucide Icons |
| **Streaming** | `hls.js` with custom HTML5 video player UI |

---

## 🚀 Quickstart Guide (Windows & PowerShell)

### Prerequisites
1. **Python 3.12 or 3.13** installed.
2. **Node.js 18+** installed.
3. **FFmpeg** installed (optional for raw video transcoding):
   ```powershell
   winget install Gyan.FFmpeg
   ```
4. **MongoDB** (optional, uses built-in in-memory engine if not running):
   ```powershell
   winget install MongoDB.Server
   ```

---

### Step 1: Clone & Setup Backend

```powershell
cd c:\Users\lenovo\.gemini\antigravity\scratch\mahouten\backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run initial migrations
python manage.py migrate

# Seed sample data (admin account, anime, episodes, rows)
$env:PYTHONIOENCODING="utf-8"
python seed_data.py
```

### Step 2: Create Administrator Account
You can create an administrator account either by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `.env`, or via the CLI:
```powershell
python manage.py createadmin --email your@email.com --password yourpassword
```

### Step 3: Run Backend Server
```powershell
python manage.py runserver 8000
```
Backend will be live at `http://127.0.0.1:8000`. OpenAPI docs available at `http://127.0.0.1:8000/api/docs/`.

---

### Step 4: Setup & Run Frontend

Open a new PowerShell terminal:
```powershell
cd c:\Users\lenovo\.gemini\antigravity\scratch\mahouten\frontend

# Install dependencies
npm.cmd install

# Start Vite development server
npm.cmd run dev
```
Frontend will be live at `http://localhost:5173`.

---

### Step 5: (Optional) Running Celery Worker for Video Transcoding

If uploading raw video files for FFmpeg HLS conversion:
1. Ensure Redis is running (or via Docker: `docker run -d -p 6379:6379 redis:alpine`).
2. Start the Celery worker:
```powershell
cd c:\Users\lenovo\.gemini\antigravity\scratch\mahouten\backend
.\.venv\Scripts\celery -A mahouten worker -l info -P solo
```

---

## 🧪 Testing

Run the automated backend test suite:
```powershell
cd c:\Users\lenovo\.gemini\antigravity\scratch\mahouten\backend
.\.venv\Scripts\python.exe manage.py test apps
```

Test coverage includes:
- User registration and JWT authentication
- Public catalog endpoints (Anime listing, details, episodes)
- Role-based access control (Admin 200 vs Regular User 403)
- Watch progress tracking and history
- Admin CRUD operations and bulk episode ingestion

---

## 📂 Project Directory Structure

```
mahouten/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User & Profile models, JWT auth, permission classes
│   │   ├── catalog/        # Genre, Anime, Season, Episode, HomepageRow models & public API
│   │   ├── streaming/      # WatchProgress model, Celery FFmpeg transcoding task
│   │   ├── library/        # MyList, WatchHistory models & endpoints
│   │   └── adminpanel/     # Stats, Shows/Episodes CRUD, Bulk Ingest, Audit logs
│   ├── mahouten/           # Django settings, WSGI, Celery config, URL router
│   ├── media/              # Uploaded posters, banners, and transcoded HLS streams
│   ├── seed_data.py        # Database seeder with sample shows and test HLS streams
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/            # Centralized Axios API services
    │   ├── components/
    │   │   ├── common/     # Sticky transparent Navbar, Footer
    │   │   └── user/       # HeroBillboard, AnimeCarousel, VideoPlayer (HLS.js)
    │   ├── context/        # AuthContext, ProfileContext
    │   ├── guards/         # UserRoute, AdminRoute, GuestRoute guards
    │   ├── layouts/        # UserLayout, AdminLayout (sidebar)
    │   └── pages/
    │       ├── user/       # Landing, Login/Register, Profiles, Home, Detail, Watch, Search, Browse, MyList, History
    │       └── admin/      # Dashboard, Shows, Episodes, Users, Genres, Homepage, Audit
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🔒 Security & Rights
- All content comes from admin-specified streams or uploaded media.
- Public APIs strictly filter out `draft` or `scheduled` content.
- Admin endpoints require JWT with `role="admin"`, protected with `IsAdminRole` DRF permission.

