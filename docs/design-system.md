# NutriVerse Design System

This document outlines the core tokens, scales, components, and motion guidelines used to maintain visual consistency across all NutriVerse pages.

---

## 1. Design Tokens & Scales

### Typography Scale
* **font-sans:** `Inter` (body, forms, labels, tables)
* **font-display:** `Plus Jakarta Sans` (headings, display numbers, metrics)
* **tracking-tight:** Heading character spacing
* **tracking-wide:** Eyebrows and button labels

### Color Palette (Semantic Tokens)
* **Primary (Brand):** `#059669` (Light) / `#10b981` (Dark)
* **Brand Bright:** `#10b981` (Light) / `#34d399` (Dark)
* **Brand Soft:** `#d1fae5` (Light) / `#064e3b` (Dark)
* **Accent (Lime):** `#65a30d` (Light) / `#a3e635` (Dark)
* **Warning (Amber):** `#d97706` (Light) / `#fbbf24` (Dark)
* **Secondary (Muted Surface):** `#eef4ee` (Light) / `#16231c` (Dark)
* **Border (Line):** `#e0e8e0` (Light) / `#26362d` (Dark)

### Spacing Scale
* Standard 4px-based rhythm (e.g. `gap-2` = 8px, `gap-4` = 16px, `p-5` = 20px, `p-6` = 24px)
* **Cards:** `.card-pad` enforces `p-5` on mobile and `p-6` on desktop.

### Radius Scale
* **Inputs/Badges/Pills:** `calc(var(--radius) - 4px)` (8px)
* **Buttons:** Fully rounded (`rounded-full`) for high interactive distinction.
* **Cards:** `var(--radius)` (12px) or `calc(var(--radius) + 8px)` (20px) for parent frames.

### Shadow Scale
* **--shadow-soft:** Standard card rest state shadow.
* **--shadow-lift:** Lifted hover card shadow.
* **--shadow-premium:** Ambient drop shadow with subtle borders.

---

## 2. Reusable Component Inventory

* **Buttons (`.btn`):**
  * `btn-primary`: Filled emerald brand action.
  * `btn-outline`: Transparent light-border action.
  * `btn-ghost`: Plain background secondary action.
* **Badges & Pills:**
  * `.pill`: Small metadata tags (status, category).
  * `.eyebrow`: Capsule tags for page/card sections.
* **Inputs (`.input`):**
  * Focus rings default to `0 0 0 3px color-mix(in srgb, var(--brand) 25%)`.
* **Progress Visualizers:**
  * `.h-2 rounded-full`: Default track for linear meters.
  * `<svg>` circles: For radial metrics.

---

## 3. Motion System presets

* **Page Fade-in:** `animate-fade-up-premium` (0.8s cubic-bezier(0.16, 1, 0.3, 1))
* **Floating Cycle:** `animate-float` (8s ease-in-out infinite loop)
* **Breathing Glow:** `animate-breathe` (3s slow emerald shadow wave)
* **Switch Transitions:** `transition-all duration-300 ease-out`
