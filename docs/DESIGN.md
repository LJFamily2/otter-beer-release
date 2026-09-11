---
name: Coastal Premium
colors:
  surface: '#f4fafd'
  surface-dim: '#d4dbdd'
  surface-bright: '#f4fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef5f7'
  surface-container: '#e8eff1'
  surface-container-high: '#e2e9ec'
  surface-container-highest: '#dde4e6'
  on-surface: '#161d1f'
  on-surface-variant: '#444650'
  inverse-surface: '#2b3234'
  inverse-on-surface: '#ebf2f4'
  outline: '#747782'
  outline-variant: '#c4c6d2'
  surface-tint: '#3e5ca1'
  primary: '#002867'
  on-primary: '#ffffff'
  primary-container: '#1d3f82'
  on-primary-container: '#90adf7'
  inverse-primary: '#b0c6ff'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#2d2c29'
  on-tertiary: '#ffffff'
  tertiary-container: '#43423f'
  on-tertiary-container: '#b1aeaa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e2ff'
  primary-fixed-dim: '#b0c6ff'
  on-primary-fixed: '#001946'
  on-primary-fixed-variant: '#234487'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#e6e2dd'
  tertiary-fixed-dim: '#c9c6c1'
  on-tertiary-fixed: '#1c1c19'
  on-tertiary-fixed-variant: '#484743'
  background: '#f4fafd'
  on-background: '#161d1f'
  surface-variant: '#dde4e6'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 72px
    fontWeight: '400'
    lineHeight: 80px
    letterSpacing: 0.1em
  headline-lg:
    fontFamily: Anton
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: 0.08em
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Anton
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
    letterSpacing: 0.05em
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  section-gap: 120px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system shifts away from the aggressive "punk" aesthetics of typical craft breweries toward a **Coastal Premium** identity. The personality is sophisticated, breezy, and authoritative. It evokes the feeling of a sun-drenched wharf, combining the ruggedness of the sea with the refinement of high-end hospitality.

The visual style is a blend of **Minimalism** and **Modern Corporate** aesthetics. It relies on a "High-Contrast Light Mode" foundation that prioritizes clarity and breathability. By utilizing vast amounts of white space, crisp nautical blues, and metallic gold accents, the UI feels expensive yet accessible. The interface should feel open and airy, avoiding cluttered grids or heavy industrial textures in favor of clean lines and subtle depth.

## Colors

The palette is rooted in the maritime tradition but executed with a modern, clean finish. 

- **Primary Action (Nautical Blue):** Use `#1D3F82` for primary buttons, active states, and dominant headings. It provides the "weight" of the brand.
- **Accent (Gold Leaf):** Use `#D4AF37` sparingly for highlights, special callouts, or icon accents. This represents the premium quality of the product.
- **Background Tiers:** The primary canvas is Pure White (`#FFFFFF`). Use the Soft Cream (`#FDF9F4`) for section backgrounds to create subtle visual separation without breaking the airy flow.
- **Typography:** Deep Blue is used for titles, while a slightly softened dark charcoal (`#2D3436`) is used for long-form body text to ensure maximum readability against the light backgrounds.

## Typography

The typography strategy balances the bold, condensed impact of **Anton** for headlines with the modern, technical precision of **Hanken Grotesk** for functional text.

**Anton** is the brand's voice. To evolve it into a premium space, it must always be used with **generous letter spacing** (tracking). This prevents it from feeling "cramped" and allows the letterforms to breathe, mimicking high-end editorial design.

**Hanken Grotesk** handles all body copy and UI labels. It should be set with comfortable line heights to maintain the "airy" feel of the coastal theme. Use uppercase labels with slight tracking for navigation and small headers to maintain a disciplined, professional hierarchy.

## Layout & Spacing

This design system uses a **Fluid Grid** with fixed maximum constraints. The layout philosophy is centered on "intentional emptiness."

- **Horizontal Rhythm:** Use a 12-column grid for desktop with wide 64px outer margins to center the content and provide a focused reading experience.
- **Vertical Rhythm:** Sections are separated by large gaps (`120px+`) to emphasize the "Open/Airy" brand pillar. Avoid crowding elements; if in doubt, add more whitespace.
- **Desktop vs. Mobile:** On mobile, margins shrink to 20px, and the 12-column grid collapses to a single-column stack. Content-heavy cards should transition from multi-column rows to vertical stacks to maintain legibility.

## Elevation & Depth

The "Coastal Premium" look avoids heavy, dark shadows. Instead, it uses **Tonal Layers** and **Ambient Light Shadows** to create a sense of floating quality.

- **Surfaces:** Use the Soft Cream (`#FDF9F4`) as a secondary elevation layer on top of the Pure White background.
- **Shadows:** Only two levels of shadow are permitted. Both must be extremely diffused (High blur, low opacity) using a hint of the Nautical Blue in the shadow color (e.g., `rgba(29, 63, 130, 0.06)`). This prevents the shadows from looking "dirty" or grey.
- **Outlines:** Use very thin (1px) low-contrast borders in a lightened version of the Nautical Blue or a soft warm grey to define inputs and cards without adding visual "noise."

## Shapes

The shape language is **Soft (Level 1)**. Elements like buttons and cards feature a subtle 0.25rem (4px) radius. This provides a professional, "architectural" feel that is more structured than fully rounded pill shapes, but more approachable than sharp 90-degree corners.

- **Buttons:** Subtle rounded corners.
- **Product Cards:** 0.5rem (8px) radius for a slightly softer feel for consumer-facing elements.
- **Imagery:** Large lifestyle photography should remain sharp or have the same subtle 4px radius to feel like framed prints.

## Components

- **Buttons:** Primary buttons are solid Nautical Blue with white text, utilizing uppercase labels in Hanken Grotesk. Secondary buttons use a transparent background with a Nautical Blue 1px border.
- **Cards:** Product cards use the Soft Cream background. They feature a "Gold Leaf" accent bar (2px) at the very top or bottom to denote premium categories.
- **Input Fields:** Clean, white backgrounds with a subtle 1px border. Focus states use a thin Gold accent border.
- **Chips:** Used for beer styles (e.g., "IPA", "Lager"). These should be Nautical Blue outlines with small, uppercase text.
- **Navigation:** A minimal top-bar with wide spacing between links. The logo is the centerpiece. Use a "hover" state that shows a thin Gold underline.
- **Age Gate:** A critical component for the industry. This should be a clean, centered modal with a Pure White background, a large Anton headline, and clear "Yes/No" primary/secondary buttons.