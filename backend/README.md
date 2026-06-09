# EAC Solutions - Backend API Service

This is the Express.js and TypeScript-based backend service supporting the EAC Solutions Platform. It handles identity validation, billing/payment webhooks, document processing, Google Drive storage management, and database query operations.

---

## 🛠️ Technology Stack
- **Core Platform:** Node.js, Express.js, TypeScript (run via `tsx`)
- **Database:** Supabase Client (PostgreSQL)
- **File Storage:** AWS SDK (S3) & Google Drive APIs
- **Payment Processing:** Stripe Node SDK
- **Email Dispatcher:** Resend Mailer SDK
- **Document Analysis:** Tesseract.js (OCR) & PDF-Parse
- **Security:** Helmet, CORS, Express Rate Limit, JWT Web Tokens

---

## 📁 Project Directory Structure
```
backend/
├── src/
│   ├── config/         # Database, storage, and key configuration initializers
│   ├── middleware/     # Auth checks, RBAC controls, error handlers, rate-limiters
│   ├── repositories/   # Supabase database query & mutation wrappers
│   ├── schemas/        # Zod request validators
│   ├── services/       # Integrations (Stripe, Resend, S3, Google Drive, OCR)
│   ├── types/          # Global TS typings and request extensions
│   ├── utils/          # Logging, helpers, formatting
│   └── server.ts       # Application routing engine & server setup
├── services/           # Additional integration controllers
├── schema.sql          # Relational tables, indexes, and policy definitions
└── package.json        # Dependencies and build runners
```

---

## 🚀 Terminal Commands & Execution

Navigate to the backend directory:
```bash
cd backend
```

### Install Dependencies
```bash
npm install
```

### Start Development Server (Watch Mode)
Launches the server on port `5000` (or `PORT` from `.env`) with hot-reload support using `tsx`.
```bash
npm run dev
```

### Build to Production JS
Compiles TypeScript files into production-ready JavaScript under the `dist/` directory.
```bash
npm run build
```

### Start Production Build
Runs the compiled server file.
```bash
npm start
```

---

## 🗄️ Database Setup & Migrations
1. Access your Supabase/PostgreSQL console.
2. Run the SQL statements inside [schema.sql](file:///c:/Users/RGLACC15/Downloads/gravity/ESA/ESA/backend/schema.sql) to set up:
   - Tenants, Users, Ledgers, Documents, Audit Logs, and Support Ticket tables.
   - Row Level Security (RLS) policies.
   - Auto-indexing structures.
