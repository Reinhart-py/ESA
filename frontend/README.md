# EAC Solutions - Frontend Client

This is the React + TypeScript frontend application for the EAC Solutions Platform, structured around modern SPA principles and bundled using Vite.

---

## 🛠️ Technology Stack
- **Core:** React 19, TypeScript, Vite
- **Styling:** Vanilla CSS & utility layout systems
- **Routing & State:** React Context, custom React Hooks
- **Data Fetching:** Axios, React Query / TanStack Query
- **Icons:** Lucide React
- **Forms & Validation:** React Hook Form, Zod

---

## 📁 Project Directory Structure
```
frontend/
├── src/
│   ├── assets/       # Static media files and stylesheets
│   ├── components/   # Shared reusable UI elements (Cards, Modals, Loaders)
│   ├── context/      # Authentication and global state context providers
│   ├── hooks/        # Reusable react hooks (useAuth, useFetch, etc.)
│   ├── portals/      # Portal dashboards tailored by Role:
│   │   ├── admin/       # Super-admin metrics, configuration, and logs
│   │   ├── accountant/  # Ledger audits, document processing, review workflows
│   │   └── client/      # Invoices, report views, secure uploads, support tickets
│   ├── main.tsx      # Application entrypoint
│   └── App.tsx       # Main router and shell layout
├── public/           # Static assets directory
├── package.json      # Dependencies and scripts
└── tsconfig.json     # TypeScript configurations
```

---

## 🚀 Terminal Commands & Execution

Navigate to the frontend directory:
```bash
cd frontend
```

### Install Dependencies
```bash
npm install
```

### Start Local Development Server
Starts Vite dev server at [http://localhost:5173](http://localhost:5173) with Hot Module Replacement (HMR).
```bash
npm run dev
```

### Build for Production
Compiles TypeScript, packages resources, and outputs minimized production-ready code to `/dist`.
```bash
npm run build
```

### Lint Source Files
```bash
npm run lint
```

### Preview Production Build locally
Runs a local web server displaying the contents of `/dist`.
```bash
npm run preview
```

---

## 🌐 Deployment & Hosting Guide

The frontend application is a client-side Single Page Application (SPA) compiled via Vite. It can be hosted on any static site hosting provider.

### 1. Vercel
1. Install Vercel CLI globally or use the [Vercel Dashboard](https://vercel.com).
2. Connect your GitHub repository.
3. Configure the Project Settings:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase Project API URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Public Key.
5. Deploy.

### 2. Netlify
1. Log in to [Netlify](https://netlify.com) and link your Git repository.
2. Select the repository and configure:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`
3. Set your environment variables in Netlify site configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
4. To support React client-side routing on reload, create a `_redirects` file in `public/` directory containing:
   ```text
   /*   /index.html   200
   ```
5. Deploy.

### 3. Cloudflare Pages
1. Sign in to the [Cloudflare Dashboard](https://dash.cloudflare.com) and go to **Pages**.
2. Connect your Git repository.
3. Select your repository and set:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Path (Root directory):** `frontend`
4. Define environment variables in Settings.
5. Save and deploy.

