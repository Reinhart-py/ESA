# Author Guide & Architecture Notes - Backend

This document highlights the technical choices and design patterns used across the backend of the **EAC Solutions Platform**.

---

## 🏛️ Design Patterns & Architecture

### 1. Repository Pattern
To isolate the database layer from controllers/business logic, all DB operations reside in repository files (e.g., `src/repositories/`).
- Handled via Supabase JS client.
- Always include tenant filtering constraints to maintain isolation security.
- RLS (Row Level Security) is verified on database level, but repositories serve as the first line of application defense.

### 2. Service-Adapter Separation
Core integrations (Google Drive, Stripe, Resend) are encapsulated inside services. When introducing a new backend engine (e.g., swapping Resend with SendGrid, or Google Drive with AWS S3), modify only the specific Adapter or Service file.

### 3. Middleware Pipeline
We use a robust middleware sequence for API endpoints:
- **`rate-limit`**: Mitigates resource exhaustion.
- **`helmet`**: Sanitizes response headers.
- **`auth`**: Parses and validates authorization headers (JWT verification).
- **`validator`**: Validates request parameters and payload structure using Zod schemas.

---

## 🔒 Security Hardening Guidelines
- **Always validate user inputs** using Zod definitions. Never trust raw payloads.
- **Enforce JWT controls** and verify tenant-id context matches the resource target tenant.
- **Keep Mock configurations active only under non-production environments** (verify `process.env.NODE_ENV !== 'production'`).
