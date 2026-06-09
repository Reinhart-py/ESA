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
