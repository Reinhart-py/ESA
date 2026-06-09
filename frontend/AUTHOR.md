# Author Guide & Architecture Notes - Frontend

Welcome to the frontend engineering guidelines for the **EAC Solutions Platform**. This document provides design decisions, best practices, and guidelines for developer contributions.

---

## 🎨 Design Philosophy & Aesthetics
We follow a premium enterprise aesthetic with:
1. **Glassmorphism & Harmonious Palettes:** Leveraging dark modes, custom color systems (curated HSL palettes), and transparent blur effects instead of standard flat colors.
2. **Typography:** Consistent modern typography using Google Fonts (Inter / Outfit) for readability.
3. **Micro-interactions:** Interactive components must utilize hover states, active transitions, and smooth animations (using standard CSS transitions) to look premium.

---

## 🏗️ State & Portal Architecture
The portal routes are divided by authorization roles:
- **`Admin Portal`:** Focused on multi-tenant observability, global audit logs, billing plans, and system integrations.
- **`Accountant Portal`:** Specialized for high-throughput ledger entries, document extraction status, compliance audits, and client reviews.
- **`Client Portal`:** Customer dashboard for billing details, statement downloads, secure document uploads, and ticketing support.

State management is handled via React Context at the top level for authentication, while caching, network states, and refetching are handled by React Query for optimized, performant data invalidation.

---

## 🛠️ Adding New Components or Pages
1. Place global, reusable components (like buttons, modals, badges) in `src/components/`.
2. Role-specific pages must reside inside the corresponding portal subfolder (`src/portals/admin/`, etc.).
3. Maintain TypeScript type safety at all times. Define custom interface contracts under `src/types/` or directly inside the component if local.
4. Avoid Tailwind CSS utility inflation. Write structured Vanilla CSS in layout files to maintain clean modular components.
