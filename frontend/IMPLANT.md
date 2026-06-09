# EAC SOLUTIONS - MASTER IMPLEMENTATION DIRECTIVE (IMPLANT.MD)

## CORE RULE

You are not building a prototype, proof of concept, MVP, UI mockup, demo dashboard, fake SaaS, landing page, placeholder architecture, or simulated business platform.

You are building the actual production software that will run EAC Solutions.

Assume every feature will be used by paying customers.

No fake data.
No sample arrays.
No mock users.
No placeholder APIs.
No TODO implementations.
No "implement later" comments.
No empty service functions.
No fake dashboards.
No hardcoded statistics.
No simulated integrations.

If a feature exists, it must be fully implemented.

---

## DEVELOPMENT PHILOSOPHY

Every feature must be delivered vertically.

Never create frontend without backend.

Never create backend without database.

Never create database without security.

Every feature must include:

Database schema
Migrations
RLS policies
Types
Validation
API routes
Business logic
Permissions
Audit logs
Frontend integration
Error handling
Loading states
Tests

A feature is incomplete until all layers exist.

---

## ARCHITECTURE

Frontend:

* React
* TypeScript
* Vite
* React Router
* TanStack Query
* React Hook Form
* Zod
* Tailwind
* ShadCN

Backend:

* Node.js
* TypeScript
* Express
* Repository Pattern
* Service Layer
* Domain Layer

Database:

* Supabase PostgreSQL

Authentication:

* Supabase Auth

Storage:

* Google Drive initially
* Storage Adapter abstraction
* Cloudflare R2 support
* AWS S3 support

Deployment:

* Vercel frontend
* Railway backend

---

## MULTI TENANT REQUIREMENTS

Every business is a tenant.

Every record belongs to a tenant.

Every query must enforce tenant isolation.

No cross-tenant access.

All database tables must support tenant ownership.

All APIs must validate tenant permissions.

All storage paths must include tenant ownership.

Example:

tenant_id/
compliance/
payroll/
taxation/
audits/
reports/
documents/

---

## ROLE SYSTEM

Implement complete RBAC.

Roles:

super_admin
admin
senior_accountant
accountant
tax_specialist
compliance_officer
payroll_specialist
client_owner
client_manager
client_staff
support_agent
auditor

Permissions must be database-driven.

Never hardcode permissions.

---

## DOCUMENT MANAGEMENT

Build a complete document platform.

Support:

Folder trees
Nested folders
File uploads
Version history
Document revisions
Audit trail
Tags
Search
Preview
Sharing
Restore
Soft delete
Retention rules

Google Drive integration must be real.

No mocked upload responses.

Store metadata in PostgreSQL.

Store files in Drive.

Create storage abstraction so future migration to R2 or S3 requires changing only the storage adapter.

---

## COMPLIANCE ENGINE

Build a real compliance engine.

Support:

GST
VAT
TDS
Corporate Tax
Payroll Tax
Annual Returns
License Renewals
Custom Compliance Programs

Features:

Deadline calculation
Compliance calendar
Risk scoring
Escalations
Reminders
Recurring obligations
Compliance analytics
Filing history

No hardcoded due dates.

Rules must be configurable.

---

## REPORTING ENGINE

Generate real reports.

Formats:

PDF
Excel
CSV

Reports:

Profit & Loss
Balance Sheet
Cash Flow
Payroll
Compliance
Executive Dashboard

All reports generated server-side.

All reports stored in report history.

All reports downloadable.

---

## TASKS

Build enterprise task management.

Support:

Dependencies
Recurring tasks
Comments
Mentions
Attachments
Escalations
Approvals
Workload tracking

Prevent circular dependencies.

Track all activity.

---

## MESSAGING

Build internal messaging.

Support:

Threads
Attachments
Search
Notifications
Read receipts
Audit logging

Messages must be persisted.

No temporary memory storage.

---

## BILLING

Prepare enterprise billing.

Support:

Plans
Subscriptions
Invoices
Payments
Credits
Discounts
Taxes

Use Stripe architecture.

No fake payment success responses.

---

## AUDIT LOGGING

Every significant action must generate an audit record.

Examples:

Login
Logout
Document upload
Document delete
Report generation
Permission changes
Compliance updates
Invoice actions

Audit logs must never be deleted.

---

## SECURITY

Mandatory:

RLS
Rate limiting
Input validation
JWT validation
CSRF protection
XSS protection
Secure headers
Permission checks
File validation

Security is not optional.

---

## TESTING

Every module must include:

Unit tests
Integration tests
Permission tests
Tenant isolation tests

No feature is complete without tests.

---

## CODE GENERATION RULES

When generating code:

Do not summarize.

Do not explain.

Do not create pseudo-code.

Do not leave placeholders.

Generate complete implementation.

Generate all required files.

Generate all dependencies.

Generate all imports.

Generate all schemas.

Generate all routes.

Generate all services.

Generate all migrations.

Generate all tests.

Continue until the feature is complete.

Never return partially implemented functionality.

---

## PRODUCTION-HARDENING PASSED MODULES

- [x] **Authentication & Identity**: Multi-Factor Authentication (TOTP schema, native validator engine, setup / enable / disable / check / verify-login endpoints, profile toggles, and login wrapper verification screen).
- [x] **Tenant Isolation**: Double-checked RLS policies, enforced database query parameters, and hardened `x-impersonate-tenant-id` header validation with database existence checks.
- [x] **Google Drive Folder Provisioning**: Implemented dynamic tenant folder checks and proactive subfolder setup (`compliance`, `payroll`, `taxation`, `audits`, `reports`, `documents`) on onboarding client creation.

