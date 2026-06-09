# EAC Solutions Platform 🚀

An Enterprise Accounting, Audit, and Compliance Multi-Tenant SaaS platform designed for **EAC Solutions**. This platform empowers Admins, Accountants, and Clients to manage financial records, audits, compliance checks, files, support tickets, and billing lifecycles seamlessly and securely.

---

## 🏗️ System Architecture & Structure

The repository is organized as a monorepo containing distinct frontend and backend projects, with utilities at the root level for easy orchestration.

```
ESA/
├── backend/            # Express.js & TypeScript Backend Service
│   ├── src/            # Application source code (Controllers, Services, Repositories)
│   ├── services/       # Cloud integration adapters (Stripe, Google Drive, Resend)
│   ├── schema.sql      # Supabase/PostgreSQL schema definition
│   └── package.json    # Backend dependencies & run scripts
├── frontend/           # React + Vite + TypeScript Frontend SPA
│   ├── src/            # Components, routes, portals, hooks, and views
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies & configurations
├── run-dev.bat         # Windows launcher script for parallel start
├── package.json        # Root package orchestration (install & run scripts)
└── README.md           # This primary user guide
```

---

## 🛠️ Prerequisites

Before running the application, make sure you have the following installed:

- **Node.js** (v18.x or later recommended)
- **NPM** (v9.x or later)
- **Git**

---

## ⚙️ Environment Configuration

Both the frontend and backend require environmental configurations to function in a fully integrated environment. However, the system includes rich mock implementations for immediate local development.

### 1. Database & Auth Setup (Supabase)
Create a PostgreSQL database on Supabase:
1. Import and run [backend/schema.sql](file:///c:/Users/RGLACC15/Downloads/gravity/ESA/ESA/backend/schema.sql) in your Supabase SQL editor to create all relational schemas, indexes, and RLS policies.
2. Grab the API credentials (`SUPABASE_URL` and `SUPABASE_ANON_KEY`) from the Supabase dashboard.

### 2. Backend Environment Variables
Create a `.env` file under the `/backend` folder with the following configuration:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret

# Storage Providers: 'google_drive' | 's3' | 'local'
STORAGE_PROVIDER=local

# Google Drive (If using google_drive storage)
GOOGLE_DRIVE_CLIENT_ID=your_client_id
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
GOOGLE_DRIVE_SHARED_FOLDER_ID=your_folder_id

# Stripe Payments
STRIPE_API_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Resend Mailer
RESEND_API_KEY=your_resend_api_key
```

---

## 🚀 How to Run the Platform

You can run the application using either the root command orchestration, individual terminals, or the built-in Windows launcher script.

### Option A: The Quick Launcher (Windows)
Double-click the **`run-dev.bat`** file in the root directory. 
This will automatically launch the backend server and frontend dev server in separate terminal windows.

### Option B: Terminal Orchestration (All OS)
1. **Install all dependencies:**
   ```bash
   npm run install:all
   ```
2. **Launch both servers:**
   Open two separate terminal shells:
   
   - **Terminal 1 (Backend Server):**
     ```bash
     npm run dev:backend
     ```
   - **Terminal 2 (Frontend Dev Server):**
     ```bash
     npm run dev:frontend
     ```

### Option C: Manual Launch
1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🔑 Demo Access Credentials
For rapid local testing and walkthroughs, the mock authentication system allows the following accounts:

* **Super Admin Portal:** `admin@eac.local`
* **Accountant Portal:** `accountant@eac.local`
* **Client Portal:** `client@eac.local`
* **Password:** *(any password string)*

Open your browser to [http://localhost:5173](http://localhost:5173) to interact with the platform.
