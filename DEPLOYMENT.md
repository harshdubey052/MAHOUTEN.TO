# 🚀 Mahouten.to Production Deployment Guide

This guide covers deploying **Mahouten.to** to production on the **100% Free Cloud Tier**:
- **Database:** MongoDB Atlas (Free 512MB M0 Cluster)
- **Media CDN & Storage:** Cloudinary (Free 25GB Storage + Transformations)
- **Backend API:** Render.com (Free Python Web Service / Blueprint)
- **Frontend App:** Vercel (Free Global Edge CDN)

---

## Part 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Click **Create a Deployment** and select the **M0 Free** shared cluster (AWS / Google Cloud region closest to you).
3. **Create Database User**:
   - Go to **Security > Database Access**
   - Click **Add New Database User**
   - Username: `admin` (or your choice)
   - Password: Choose a strong password (save this password!)
   - Role: **Read and write to any database**
4. **Allow Network Access**:
   - Go to **Security > Network Access**
   - Click **Add IP Address**
   - Choose **Allow Access from Anywhere (`0.0.0.0/0`)** (Required for Render dynamic IPs)
5. **Get Your Connection String**:
   - Go to **Database > Clusters > Connect > Drivers** (Python)
   - Copy the connection string. It looks like:
     ```
     mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your real password, and add `/mahouten_db` before the `?`:
     ```
     mongodb+srv://admin:MY_PASSWORD@cluster0.abcde.mongodb.net/mahouten_db?retryWrites=true&w=majority
     ```

---

## Part 2: Set Up Free Cloudinary Media Storage (Persistent Media CDN)

Render uses ephemeral storage (files saved to disk are wiped on container restart or sleep). Cloudinary provides persistent cloud media storage and CDN delivery for posters, banners, video uploads, and subtitles.

1. Go to [https://cloudinary.com](https://cloudinary.com) and create a free account (or log in).
2. On your **Dashboard / Console**, locate your **Product Environment Credentials**:
   - **Cloud Name**: (e.g. `dxyza123`)
   - **API Key**: (e.g. `123456789012345`)
   - **API Secret**: (e.g. `abcdefghijklmnopqrstuv_1234`)
3. Keep these 3 values ready to paste into Render environment variables.

---

## Part 3: Deploy Backend on Render.com

You can deploy either using **Render Blueprints (1-Click)** or manually via **Web Service**.

### Option A: Render Blueprint (Recommended)
1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** > **Blueprint**.
3. Select your repository. Render will automatically read the root `render.yaml`.
4. Enter the required environment variables when prompted (`MONGO_URI`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).
5. Click **Apply**.

### Option B: Manual Web Service
1. In the Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name:** `mahouten-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:**
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --no-input
     ```
   - **Start Command:**
     ```bash
     gunicorn mahouten.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 4
     ```
   - **Instance Type:** `Free`
   - **Health Check Path:** `/api/v1/health/`
4. **Add Environment Variables** (under *Environment Variables* section):

   | Key | Value | Description |
   |---|---|---|
   | `PYTHON_VERSION` | `3.11.9` | Stable Python runtime |
   | `DEBUG` | `False` | Production mode |
   | `ALLOWED_HOSTS` | `*` | Or `.onrender.com` |
   | `DJANGO_SECRET_KEY` | *(Click 'Generate' or enter 50+ char random key)* | Django encryption key |
   | `MONGO_URI` | `mongodb+srv://admin:PASSWORD@cluster0.abcde.mongodb.net/mahouten_db?retryWrites=true&w=majority` | Atlas connection string |
   | `MONGO_DB_NAME` | `mahouten_db` | Database name |
   | `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | Cloudinary Cloud Name |
   | `CLOUDINARY_API_KEY` | `your_api_key` | Cloudinary API Key |
   | `CLOUDINARY_API_SECRET` | `your_api_secret` | Cloudinary API Secret |
   | `CORS_ALLOWED_ORIGINS` | `https://*.vercel.app,http://localhost:5173` | Allowed frontend origins |

5. Click **Create Web Service**.
6. Once deployed, test the health check endpoint:
   `https://mahouten-backend.onrender.com/api/v1/health/`
   It should return:
   ```json
   { "status": "healthy", "database": "connected", "cloudinary": true, "version": "1.0.0" }
   ```

---

## Part 4: Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** > **Project**.
3. Import your repository.
4. Configure project settings:
   - **Root Directory:** Click *Edit* and select **`frontend`**
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Add Environment Variable**:
   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `https://mahouten-backend.onrender.com` *(Your Render backend URL)* |
6. Click **Deploy**.
7. Vercel will build the frontend and provide your production domain (e.g., `https://mahouten.vercel.app`)!

---

## Part 5: Verification & First Login

1. Visit your live Vercel URL: `https://mahouten.vercel.app`
2. Since MongoDB Atlas is connected:
   - All collection models and schemas are automatically created with proper indexes.
   - Standard genres and homepage layouts are initialized with **0 demo shows or dummy entries**.
   - If you provided `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your Render environment variables, your administrator account is automatically active.
   - Alternatively, create your admin account anytime using the Render Shell:
     ```bash
     python manage.py createadmin --email your@email.com --password yourpassword
     ```
3. Sign in to your admin account, visit the Admin Panel at `/admin/shows` or Studio Upload at `/upload` (with Cloudinary uploads for posters, banners, and video clips), and stream your own anime catalog!
