# 🚀 Mahouten.to Deployment Guide

This guide covers deploying **Mahouten.to** to production on the **100% Free Cloud Tier**:
- **Database:** MongoDB Atlas (Free 512MB M0 Cluster)
- **Backend API:** Render.com (Free Python Web Service)
- **Frontend App:** Vercel (Free Global Edge CDN)

---

## Part 1: Set Up Free Cloud MongoDB (MongoDB Atlas)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account (or log in).
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
   - Choose **Allow Access from Anywhere (`0.0.0.0/0`)** (Required for Render/Railway dynamic IPs)
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

## Part 2: Push Your Code to GitHub

1. Open PowerShell in `d:\python\mahouten.to`:
   ```powershell
   cd d:\python\mahouten.to
   git init
   git add .
   git commit -m "Initial commit for Mahouten production deployment"
   ```
2. Go to [https://github.com/new](https://github.com/new) and create a new repository called `mahouten.to` (Public or Private).
3. Push your repository:
   ```powershell
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/mahouten.to.git
   git branch -M main
   git push -u origin main
   ```

---

## Part 3: Deploy Backend on Render.com

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Connect your `mahouten.to` repository.
4. Configure the service:
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
5. **Add Environment Variables** (under *Environment Variables* section):
   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.9` |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `*` |
   | `DJANGO_SECRET_KEY` | *(Click 'Generate' or enter a long random string)* |
   | `MONGO_URI` | `mongodb+srv://admin:PASSWORD@cluster0.abcde.mongodb.net/mahouten_db?retryWrites=true&w=majority` |
   | `MONGO_DB_NAME` | `mahouten_db` |
6. Click **Create Web Service**.
7. Render will build and deploy the backend. Once finished, copy your service URL:
   `https://mahouten-backend.onrender.com`

---

## Part 4: Deploy Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** > **Project**.
3. Import your `mahouten.to` repository.
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
7. Vercel will build and assign you a free production domain (e.g., `https://mahouten.vercel.app`)!

---

## Part 5: Verification & First Login

1. Visit your live Vercel URL: `https://mahouten.vercel.app`
2. Since MongoDB Atlas is connected, the database will auto-seed with:
   - **14 Anime Titles** with episodes, HD banners, genres, and metadata.
   - **Admin Account:** `admin@mahouten.to` / `admin12345`
   - **Standard Account:** `user@mahouten.to` / `user12345`
3. Log in as admin, browse the catalog, try Creator Upload, and stream in full HD!

