---
name: Noir
colors:
  surface: '#10131a'
  surface-dim: '#10131a'
  surface-bright: '#363940'
  surface-container-lowest: '#0b0e14'
  surface-container-low: '#191c22'
  surface-container: '#1d2026'
  surface-container-high: '#272a31'
  surface-container-highest: '#32353c'
  on-surface: '#e1e2eb'
  on-surface-variant: '#bbc9c7'
  inverse-surface: '#e1e2eb'
  inverse-on-surface: '#2e3037'
  outline: '#869491'
  outline-variant: '#3c4947'
  surface-tint: '#5adace'
  primary: '#6feee1'
  on-primary: '#003733'
  primary-container: '#4fd1c5'
  on-primary-container: '#005750'
  inverse-primary: '#006a63'
  secondary: '#e9c349'
  on-secondary: '#3c2f00'
  secondary-container: '#af8d11'
  on-secondary-container: '#342800'
  tertiary: '#d7d9e4'
  on-tertiary: '#2d3038'
  tertiary-container: '#bbbec8'
  on-tertiary-container: '#494d55'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#79f7ea'
  primary-fixed-dim: '#5adace'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#dfe2ec'
  tertiary-fixed-dim: '#c3c6d0'
  on-tertiary-fixed: '#181c23'
  on-tertiary-fixed-variant: '#43474f'
  background: '#10131a'
  on-background: '#e1e2eb'
  surface-variant: '#32353c'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max-width: 1440px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
---

## Brand & Style

The brand personality is prestigious, secure, and modern, blending the precision of a high-end financial terminal with the exclusivity of a luxury concierge service. The design system leverages a **Glassmorphic** aesthetic to create a sense of depth and transparency, signaling an open yet secure environment. 

The target audience consists of high-net-worth individuals and professionals who value sophisticated, low-noise interfaces. The UI should evoke a sense of calm authority through deep obsidian surfaces and meticulous attention to micro-interactions. Every element feels like it is crafted from polished glass and dark precious metals.

## Colors

The palette is anchored in a "Midnight Obsidian" foundation. 
- **Primary (Soft Teal):** Used for primary actions, focus states, and data visualizations. It provides a modern, high-tech glow against the dark base.
- **Secondary (Muted Gold):** Reserved for prestige moments, premium features, and subtle highlights, evoking a sense of luxury.
- **Neutral/Background:** The background uses `#0B0E14`, while elevated surfaces use `#14181F`.
- **Glass Effects:** Semi-transparent layers utilize a 70% opacity version of the charcoal surface to allow background blurs to bleed through gracefully.

## Typography

This design system utilizes **Manrope** for headlines to provide a modern, geometric, and technical feel. Generous letter spacing is applied to headings to increase the sense of "luxury" and "breathability." 

**Inter** is the workhorse for body text and labels, ensuring maximum legibility in high-density data environments. All labels use an uppercase treatment with increased tracking to mimic the aesthetic of high-end watchmaking or automotive dashboards. Text contrast is kept high (Pure White or high-opacity Silver) against the dark backgrounds to ensure WCAG compliance.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain a controlled, editorial feel, transitioning to a fluid model for mobile devices. 

- **Desktop:** 12-column grid with a 1440px max-width. Margins are generous (64px) to emphasize the premium nature of the content.
- **Tablet:** 8-column grid with 32px margins.
- **Mobile:** 4-column grid with 20px margins.

Spacing follows an 8px linear scale. Large components like cards should use the "L" (32px) or "XL" (48px) spacing units for internal padding to prevent the UI from feeling cramped.

## Elevation & Depth

Depth is conveyed through **Glassmorphism** rather than traditional drop shadows. 

1.  **Backdrop Blur:** Every floating container or card must apply `backdrop-filter: blur(12px)`.
2.  **Translucency:** Backgrounds use a 70-80% opacity hex value.
3.  **Reflective Borders:** A 1px solid border (`rgba(255,255,255,0.1)`) is mandatory for all glass elements to simulate the edge of a glass pane catching the light.
4.  **Soft Glows:** Active elements (like primary buttons or selected states) should feature a subtle outer glow using the Primary Teal color with a 20px spread and 15% opacity, suggesting a light source behind the glass.

## Shapes

The design system uses a **Rounded** shape language to soften the "technical" feel of the dark mode. 

- Standard components (buttons, inputs) use a **0.5rem (8px)** radius.
- Structural containers and cards use **1rem (16px)** to create a distinct, nested appearance.
- Icons should be contained within squircle-shaped backgrounds for a proprietary, high-end feel.

## Components

### Buttons
Primary buttons use a subtle gradient from Teal to a slightly darker shade. Secondary buttons are "Ghost" style with the glass border and a gold text treatment for prestige actions.

### Cards
Cards are the hero of this design system. They must feature the 1px glass border, 16px corner radius, and 12px backdrop blur. Backgrounds should have a subtle radial gradient (top-left to bottom-right) to add a hint of metallic sheen.

### Input Fields
Inputs are dark and recessed. The focus state replaces the 0.1 opacity border with a 1px solid Primary Teal border and a faint inner glow.

### Chips & Tags
Small, pill-shaped elements with high-opacity backgrounds (20%) of the Primary or Secondary colors. These should be used for status indicators like "Verified" or "Premium."

### Data Visualization
Charts should use "Glow Lines." Instead of flat strokes, use a 2px stroke width with a slight Gaussian blur of the same color beneath it to simulate a neon-filament look consistent with a financial terminal.