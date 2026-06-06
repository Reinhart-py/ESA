# EAC Solutions - Enterprise Deployment & Hosting Guide

This guide outlines step-by-step instructions for deploying both the Frontend and Backend applications to production environments.

---

## 1. Database Setup (Supabase)
1. Sign in to your [Supabase Console](https://supabase.com).
2. Click **New Project** and name it `eac-solutions`.
3. Under the **SQL Editor** in the left menu, select **New Query**.
4. Copy the entire contents of [backend/schema.sql](file:///c:/Users/RGLACC15/Downloads/gravity/ESA/ESA/backend/schema.sql) and paste them into the SQL editor.
5. Click **Run** to generate all relational tables, indexes, and schemas.
6. Retrieve your **Project API Key** and **Project URL** from *Settings > API*.

---

## 2. Storage Setup (Google Drive Workspace)
1. Go to the [Google Cloud Console](https://console.cloud.google.com).
2. Enable the **Google Drive API** for your project.
3. Configure the **OAuth Consent Screen** and create a credential for **OAuth Client ID (Web Application)**.
4. Obtain the `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET`.
5. Generate a `GOOGLE_DRIVE_REFRESH_TOKEN` using the OAuth Playground.
6. Create a shared folder on your 5TB secondary Gmail account and get its ID to set as `GOOGLE_DRIVE_SHARED_FOLDER_ID`.

---

## 3. Backend Deployment (Railway)
1. Sign in to [Railway](https://railway.app).
2. Click **New Project** and select **Deploy from GitHub repo**.
3. Choose the `Reinhart-py/ESA` repository.
4. Under the project settings, set the **Root Directory** of the service to `backend`.
5. Add the following **Environment Variables** in the Railway Dashboard:
   - `PORT` = `8080` (or leave default)
   - `STORAGE_PROVIDER` = `google_drive`
   - `GOOGLE_DRIVE_CLIENT_ID` = `(Your Google Client ID)`
   - `GOOGLE_DRIVE_CLIENT_SECRET` = `(Your Google Client Secret)`
   - `GOOGLE_DRIVE_REFRESH_TOKEN` = `(Your Google Refresh Token)`
   - `GOOGLE_DRIVE_SHARED_FOLDER_ID` = `(Your 5TB Shared Folder ID)`
   - `RESEND_API_KEY` = `(Your Resend API Key)`
   - `SUPABASE_URL` = `(Your Supabase API URL)`
   - `SUPABASE_ANON_KEY` = `(Your Supabase Anon Key)`
6. Click **Deploy**. Railway will build the backend, expose a public URL (e.g., `https://backend-production.up.railway.app`), and start the Express server.

---

## 4. Frontend Deployment (Vercel)
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New** > **Project** and select `Reinhart-py/ESA` from GitHub.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
4. Deploy the application. Vercel will build the frontend assets and host them globally on a production-ready CDN.
