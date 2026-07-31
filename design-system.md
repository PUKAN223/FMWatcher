# Design System Specification & Architecture

## 1. Overview & Core Design Philosophy

This document defines the comprehensive Design System for modern web and mobile applications. It establishes standardized design tokens, component specifications, color systems, typography scale, layout grids, and interactive patterns to ensure consistency, accessibility, and high visual aesthetics across all digital products.

### Design Principles
1. **Visual Excellence & Rich Aesthetics**: Utilize harmonious color palettes, subtle glassmorphism, dynamic gradients, and refined dark mode modes to create a premium user experience.
2. **Accessibility First**: Compliant with WCAG 2.1 AA guidelines for contrast ratios, screen readers, keyboard navigation, and visible focus indicators.
3. **Consistency & Scalability**: Modular component design powered by atomic tokens, ensuring effortless maintenance and cross-platform alignment.
4. **Fluid Motion & Delighters**: Micro-animations and responsive feedback elevate usability without introducing unnecessary friction or cognitive overhead.

---

## 2. Design Tokens & Foundations

### 2.1 Color System & Tokens

The color system uses HSL/CSS custom properties for dynamic light and dark theme switching.

#### Functional Palette (`:root` - Light Mode)

```css
:root {
  /* Brand Primary */
  --primary: 234 89% 64%;          /* #4F46E5 - Indigo 600 */
  --primary-foreground: 0 0% 100%;
  --primary-hover: 234 89% 58%;

  /* Brand Secondary */
  --secondary: 250 84% 54%;        /* #6366F1 - Indigo 500 */
  --secondary-foreground: 0 0% 100%;

  /* Neutral Backgrounds & Surfaces */
  --background: 220 20% 97%;       /* #F4F6F9 */
  --surface: 0 0% 100%;            /* #FFFFFF */
  --surface-hover: 220 14% 94%;    /* #EAEFF5 */
  --card: 0 0% 100%;
  --card-foreground: 224 71% 4%;

  /* Functional Status Colors */
  --success: 142 71% 45%;          /* #16A34A - Emerald 600 */
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;           /* #F59E0B - Amber 500 */
  --warning-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;        /* #EF4444 - Red 500 */
  --destructive-foreground: 0 0% 100%;
  --info: 199 89% 48%;             /* #0EA5E9 - Sky 500 */
  --info-foreground: 0 0% 100%;

  /* Typography & Muted Elements */
  --foreground: 224 71% 4%;        /* #030712 */
  --muted: 220 14% 94%;
  --muted-foreground: 220 9% 46%;  /* #64748B */
  --border: 220 13% 91%;           /* #E2E8F0 */
  --input: 220 13% 91%;
  --ring: 234 89% 64%;

  /* Glassmorphism Overlays */
  --glass-bg: rgba(255, 255, 255, 0.75);
  --glass-border: rgba(255, 255, 255, 0.4);
  --glass-blur: 16px;
}
```

#### Dark Mode Palette (`.dark`)

```css
.dark {
  /* Brand Primary */
  --primary: 234 89% 64%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 234 89% 70%;

  /* Brand Secondary */
  --secondary: 250 84% 64%;
  --secondary-foreground: 0 0% 100%;

  /* Neutral Backgrounds & Surfaces */
  --background: 224 71% 4%;        /* #030712 - Very Dark Slate */
  --surface: 224 71% 7%;          /* #0B0F19 */
  --surface-hover: 224 50% 12%;
  --card: 224 71% 7%;
  --card-foreground: 210 20% 98%;

  /* Functional Status Colors */
  --success: 142 71% 45%;
  --warning: 38 92% 50%;
  --destructive: 0 62% 50%;
  --info: 199 89% 48%;

  /* Typography & Muted Elements */
  --foreground: 210 20% 98%;       /* #F8FAFC */
  --muted: 217 33% 15%;
  --muted-foreground: 215 20% 65%;  /* #94A3B8 */
  --border: 217 33% 17%;           /* #1E293B */
  --input: 217 33% 17%;
  --ring: 234 89% 64%;

  /* Glassmorphism Overlays */
  --glass-bg: rgba(11, 15, 25, 0.75);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-blur: 16px;
}
```

---

### 2.2 Typography System

The typography scale utilizes modular scaling with modern geometric sans-serif fonts for primary text and tabular numbers for data/monetary displays.

- **Primary Sans Font**: `Inter`, `Kanit`, `Sarabun`, `-apple-system`, `BlinkMacSystemFont`, `sans-serif`
- **Monospace / Data Font**: `JetBrains Mono`, `Fira Code`, `Consolas`, `monospace`

| Token | Size | Line Height | Weight | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-display` | 2.5rem (40px) | 1.15 | 700 (Bold) | Marketing Hero / Landing Page Headers |
| `text-h1` | 2rem (32px) | 1.2 | 700 (Bold) | Main Page Titles |
| `text-h2` | 1.5rem (24px) | 1.25 | 600 (SemiBold) | Section Headers |
| `text-h3` | 1.25rem (20px) | 1.3 | 600 (SemiBold) | Subsections / Card Titles |
| `text-h4` | 1.125rem (18px) | 1.4 | 600 (SemiBold) | Small Component Headers |
| `text-body-lg` | 1rem (16px) | 1.5 | 400 (Regular) | Primary Body Text |
| `text-body` | 0.875rem (14px)| 1.5 | 400 (Regular) | Default Interface Text |
| `text-sm` | 0.8125rem (13px)| 1.4 | 400 / 500 | Compact Lists / Table Data |
| `text-xs` | 0.75rem (12px) | 1.4 | 500 (Medium) | Badges, Captions, Helper Text |

---

### 2.3 Spacing, Radii & Elevation Scale

#### Spacing Scale (4pt Grid)
- `space-1`: 0.25rem (4px)
- `space-2`: 0.5rem (8px)
- `space-3`: 0.75rem (12px)
- `space-4`: 1rem (16px)
- `space-6`: 1.5rem (24px)
- `space-8`: 2rem (32px)
- `space-12`: 3rem (48px)
- `space-16`: 4rem (64px)

#### Border Radius Scale
- `radius-sm`: 0.375rem (6px) - Buttons, Inputs, Badges
- `radius-md`: 0.5rem (8px) - Cards, Modals, Menus
- `radius-lg`: 0.75rem (12px) - Large Panels, Drawers
- `radius-xl`: 1rem (16px) - Outer Containers, Hero Banners
- `radius-full`: 9999px - Avatars, Pill Buttons

#### Elevation & Shadows
- `shadow-sm`: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- `shadow-md`: `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`
- `shadow-glow`: `0 0 20px -3px hsl(var(--primary) / 0.35)`

---

## 3. Core Component Specifications

### 3.1 Buttons (`<Button />`)

#### Variants
1. **Primary (Solid)**: Background `hsl(var(--primary))`, text `hsl(var(--primary-foreground))`. High-emphasis actions.
2. **Secondary**: Background `hsl(var(--secondary))`, text `hsl(var(--secondary-foreground))`. Supporting actions.
3. **Outline**: Transparent background, 1px border `hsl(var(--border))`, hover background `hsl(var(--surface-hover))`.
4. **Ghost**: Subtle hover effect `hsl(var(--muted))`, text `hsl(var(--foreground))`. Context menus, toolbars.
5. **Destructive**: Background `hsl(var(--destructive))`, text white. Dangerous or irreversible actions.

#### Sizes
- **Small (`sm`)**: Height 32px, Padding 0 12px, Font Size 13px
- **Medium (`md`)**: Height 40px, Padding 0 16px, Font Size 14px (Default)
- **Large (`lg`)**: Height 48px, Padding 0 24px, Font Size 16px

#### States
- **Hover**: Smooth background transition (150ms ease-in-out), subtle scale transform (`scale(1.01)`).
- **Active**: `scale(0.98)`.
- **Focus**: `ring-2 ring-offset-2 ring-[hsl(var(--ring))] outline-none`.
- **Disabled**: Opacity 50%, `cursor-not-allowed`, `pointer-events-none`.
- **Loading**: Displays inline spinner, hides icon, disables interactions.

```tsx
// Example React Button implementation pattern
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}
```

---

### 3.2 Form Inputs & Controls (`<Input />`, `<Select />`, `<Switch />`)

#### Text Input Specification
- **Height**: 40px (Medium)
- **Background**: `hsl(var(--surface))`
- **Border**: 1px solid `hsl(var(--border))`
- **Radius**: `var(--radius-sm)`
- **Placeholder Text**: `hsl(var(--muted-foreground))`
- **Focus State**: Border transitions to `hsl(var(--primary))` with a 2px glow ring `hsl(var(--primary) / 0.2)`.
- **Error State**: Border `hsl(var(--destructive))`, helper message text in `hsl(var(--destructive))`.

#### Input Group with Icon
- Icons placed on left or right must be aligned centrally with 12px inset.
- Clear button (X icon) appears dynamically when input contains text.

---

### 3.3 Cards & Containers (`<Card />`)

#### Standard Surface Card
- Background: `hsl(var(--card))`
- Border: 1px solid `hsl(var(--border))`
- Radius: `var(--radius-md)`
- Padding: 20px (Content), 16px (Header/Footer)
- Shadow: `var(--shadow-sm)`

#### Glassmorphism Card (Glass Surface)
- Background: `var(--glass-bg)`
- Backdrop Filter: `blur(var(--glass-blur))`
- Border: 1px solid `var(--glass-border)`
- Shadow: `var(--shadow-lg)`

---

### 3.4 Feedback & Overlays

#### Dialog / Modal (`<Dialog />`)
- **Backdrop**: Semi-transparent dark overlay (`rgba(0, 0, 0, 0.6)`) with `backdrop-filter: blur(4px)`.
- **Dialog Box**: Centered, max-width 500px, entrance animation: `zoom-in 95%`, `fade-in 150ms`.
- **Header**: Title (18px SemiBold) + Close Button (X icon top-right).
- **Body**: Scrollable if content exceeds 70vh.
- **Footer**: Right-aligned action buttons (Cancel + Confirm).

#### Toast Notifications (`<Toast />`)
- **Position**: Top-Right or Bottom-Right.
- **Auto-dismiss**: 4000ms.
- **Variants**: `success` (Green icon), `error` (Red icon), `info` (Blue icon), `warning` (Amber icon).

---

## 4. Motion & Micro-Animations

Smooth animations increase delight and signify system status changes.

- **Fast Transition (Micro-interactions)**: `150ms cubic-bezier(0.4, 0, 0.2, 1)` (Hover, Focus, Toggle switches)
- **Standard Transition (Modals, Menus)**: `250ms cubic-bezier(0.16, 1, 0.3, 1)` (Dropdowns, Dialog popups)
- **Slow Transition (Page Transitions, Drawers)**: `350ms cubic-bezier(0.16, 1, 0.3, 1)` (Slide-in drawers, complex transitions)

---

## 5. CSS Utility & Token Implementation

Add these core tokens to your project's stylesheet (`index.css` / `globals.css`):

```css
@layer base {
  * {
    border-color: hsl(var(--border));
  }
  body {
    background-color: hsl(var(--background));
    color: hsl(var(--foreground));
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }
}

.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
}
```
