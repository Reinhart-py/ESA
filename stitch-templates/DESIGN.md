---
name: Concierge Professional
colors:
  surface: '#faf9fc'
  surface-dim: '#dad9dd'
  surface-bright: '#faf9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f7'
  surface-container: '#eeedf1'
  surface-container-high: '#e9e8eb'
  surface-container-highest: '#e3e2e6'
  on-surface: '#1a1c1e'
  on-surface-variant: '#43474f'
  inverse-surface: '#2f3033'
  inverse-on-surface: '#f1f0f4'
  outline: '#747780'
  outline-variant: '#c4c6d1'
  surface-tint: '#415e94'
  primary: '#00193c'
  on-primary: '#ffffff'
  primary-container: '#062d60'
  on-primary-container: '#7996cf'
  inverse-primary: '#acc7ff'
  secondary: '#006a62'
  on-secondary: '#ffffff'
  secondary-container: '#7bf3e5'
  on-secondary-container: '#006f66'
  tertiary: '#1b1916'
  on-tertiary: '#ffffff'
  tertiary-container: '#302e2a'
  on-tertiary-container: '#999590'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e2ff'
  primary-fixed-dim: '#acc7ff'
  on-primary-fixed: '#001a40'
  on-primary-fixed-variant: '#27467a'
  secondary-fixed: '#7ef6e8'
  secondary-fixed-dim: '#5fdacc'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#e6e2dc'
  tertiary-fixed-dim: '#cac6c0'
  on-tertiary-fixed: '#1d1b18'
  on-tertiary-fixed-variant: '#494642'
  background: '#faf9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e3e2e6'
  deep-navy: '#062D60'
  soft-teal: '#2BB1A4'
  warm-sand: '#F4EFE9'
  alert-gold: '#FCD269'
  canvas-gray: '#F7F8FA'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
---

## Brand & Style
The design system for EAC Solutions is built on the philosophy of **Humanized Precision**. It aims to dismantle the cold, mechanical reputation of accounting by blending the efficiency of a high-end tech platform with the warmth of a dedicated personal advisor. The target audience is business owners who value expert stewardship and desire a "peace of mind" experience.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes high-quality editorial layouts, generous whitespace, and a focus on "real-world" photography. Every interface element should feel intentional and stable, avoiding the frenetic energy of typical SaaS templates in favor of a calm, curated portal experience.

## Colors
The palette is rooted in **Deep Navy** to establish authority and trust, balanced by a **Soft Teal** that introduces a modern, calming breath to the interface. Unlike typical financial apps that use cold grays, this design system utilizes **Warm Sand** and **Warm Grays** for backgrounds and surfaces to evoke the "Bench-style" warmth and humanize the data.

- **Primary (Deep Navy):** Use for high-level branding, primary buttons, and headings.
- **Secondary (Soft Teal):** Use for accents, success states, and interactive elements that require a softer touch.
- **Tertiary (Warm Sand):** Use for large surface areas to reduce eye strain and differentiate the product from clinical white-label software.
- **Canvas Gray:** A neutral base for the application background to provide a subtle contrast for white card elements.

## Typography
The typography strategy pairs the modern, refined geometry of **Manrope** for headlines with the utilitarian clarity of **Inter** for functional data. This combination ensures that marketing pages feel premium and editorial, while the accounting dashboard remains highly legible and efficient.

- **Headlines:** Use Manrope with tight letter-spacing for a "precision" look. Weights should vary between Semi-Bold (600) and Bold (700).
- **Body:** Inter is the workhorse. Use it for all compliance text, financial reports, and communication logs.
- **Micro-copy:** Use `label-sm` with a slight uppercase transform for table headers and metadata to maintain a clean, organized hierarchy.

## Layout & Spacing
This design system employs a **Fixed Grid** philosophy for dashboard views and a **Fluid Content** model for marketing pages. The layout is based on a 12-column grid with a 1280px maximum width to ensure professional density without feeling cluttered.

- **Desktop:** 64px outer margins with 24px gutters. Use "portal clarity"—grouping related financial data into defined white cards with consistent 32px internal padding.
- **Mobile:** 20px outer margins. Content should reflow into a single column, prioritizing the most urgent compliance notifications at the top.
- **Rhythm:** An 8px base unit governs all spacing. Vertical "stacks" of information should use 24px or 48px gaps to maintain a sense of calm and prevent information overload.

## Elevation & Depth
Depth is communicated through **Tonal Layers** and **Ambient Shadows** rather than stark borders. The goal is to make the platform feel like a physical desk with neatly organized documents.

- **Level 0 (Canvas):** `canvas-gray` (#F7F8FA). The base of the application.
- **Level 1 (Surfaces):** White (#FFFFFF). Used for cards, tables, and the main navigation sidebar. These surfaces use a very soft, diffused shadow (15% opacity, 20px blur, 4px Y-offset) to appear slightly lifted.
- **Level 2 (Interaction):** Hover states for cards and buttons should slightly increase the shadow's spread and lift, mimicking a tactile response.
- **Backdrop Blurs:** Use subtle blurs (12px) for modal overlays to keep the context of the financial data visible while focusing the user's attention.

## Shapes
The shape language is **Rounded**, striking a balance between the friendliness of Bench and the professional rigor of Pilot. 

- **Standard Elements:** Buttons, input fields, and small cards use a 0.5rem (8px) radius.
- **Large Containers:** Dashboard widgets and main content areas use a 1rem (16px) radius to soften the visual impact of dense data.
- **Interactive Pills:** Use full-pill rounding (rounded-full) for status chips (e.g., "In Progress," "Compliant") and the "Uber-style" action buttons to denote high interactivity.

## Components
- **Buttons:** Primary buttons use `deep-navy` with white text for maximum authority. Secondary buttons use a `soft-teal` outline. All buttons should have a minimum height of 48px to ensure ease of use.
- **Cards:** The central component of the "portal." Cards must have a white background, 8px corner radius, and subtle ambient shadows. Headers within cards should use `label-sm` in a muted gray to label sections (e.g., "QUARTERLY TAX ESTIMATE").
- **Input Fields:** Use a light gray border (#E0E0E0) that transitions to `soft-teal` on focus. Labels should always be persistent and positioned above the field for clarity.
- **Compliance Chips:** Small, pill-shaped indicators. Use `soft-teal` for "Compliant," `alert-gold` for "Attention Needed," and a muted red for "Overdue."
- **Data Lists:** Use clean, zebra-striped rows or thin 1px horizontal dividers in `canvas-gray`. Avoid vertical borders in tables to maintain a modern, airy feel.
- **Photography:** Use "human-first" imagery. Instead of generic charts, show a real person looking at a tablet in a well-lit, professional environment. Photography should feel candid, not staged.