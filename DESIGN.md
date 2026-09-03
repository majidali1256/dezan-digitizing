# Design System Specification (DESIGN.md)

## Project Overview
- **Brand Name**: Dezan Digitizing
- **Tagline**: Premium Embroidery Digitizing & Vector Art Conversion
- **Design Archetype**: Dark Luxury / High-Precision Craftsmanship with Radiant Gold Accents

---

## 1. Design Token Architecture

### 1.1 Primitive Color Tokens
- `--gold-300`: `#f7e59c`
- `--gold-400`: `#e5c158`
- `--gold-500`: `#d4af35` (Primary Brand Gold)
- `--gold-600`: `#b89326`
- `--dark-950`: `#080705` (Deep Canvas)
- `--dark-900`: `#12100c` (Dark Card Surface)
- `--dark-800`: `#201d12` (Theme Background Dark)
- `--light-50`: `#f8f7f6` (Theme Background Light)
- `--light-100`: `#ffffff` (Light Card Surface)

### 1.2 Semantic Color Tokens
| Semantic Token | Light Mode | Dark Mode | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#f8f7f6` | `#201d12` | Body background |
| `--surface-card` | `#ffffff` | `#12100c` | Cards, modals, containers |
| `--accent-primary` | `#d4af35` | `#d4af35` | Primary CTA, active nav, highlights |
| `--text-primary` | `#0f172a` | `#f8fafc` | Main headings, bold titles |
| `--text-muted` | `#64748b` | `#94a3b8` | Subtitles, body descriptions |
| `--border-subtle` | `rgba(212, 175, 53, 0.2)` | `rgba(212, 175, 53, 0.25)` | 1px card/divider borders |

### 1.3 Typography Scale (Font: Inter & Outfit)
- **Hero Title**: `clamp(2.75rem, 6vw, 5rem)`, Bold 900, Line Height `1.05`, Tracking `-0.03em`
- **Section Heading (H2)**: `2rem - 2.5rem`, Bold 800, Line Height `1.15`, Tracking `-0.02em`
- **Card Heading (H3)**: `1.25rem - 1.5rem`, Bold 700
- **Body Copy**: `0.95rem - 1.05rem`, Regular 400/500, Line Height `1.6`
- **Eyebrow / Badge**: `0.75rem - 0.8rem`, Bold 700, Uppercase, Tracking `+0.1em`

### 1.4 Spatial Scale & Radius
- **Grid Unit**: 4px / 8px Base Scale
- **Card Padding**: `p-6` (24px) / `p-8` (32px)
- **Button Padding**: `py-3 px-8` (12px vertical, 32px horizontal)
- **Border Radius**:
  - Small / Badges: `rounded-md` (6px) or `rounded-full` (9999px)
  - Interactive Buttons / Inputs: `rounded-lg` (8px - 10px)
  - Cards / Modals: `rounded-2xl` (16px)

---

## 2. Component Specifications

### 2.1 Buttons & Interactive Elements
- **Primary CTA (`.btn-primary`)**:
  - Background: `#d4af35` with dark text `#201d12`
  - Hover: `transform: translateY(-2px); filter: brightness(1.1); box-shadow: 0 10px 25px -5px rgba(212, 175, 53, 0.4);`
  - Active: `transform: translateY(0);`
  - Focus-Visible: `outline: 2px solid #d4af35; outline-offset: 2px;`
- **Secondary / Outline (`.btn-secondary`)**:
  - Border: `1px solid rgba(212, 175, 53, 0.3)`
  - Background: `rgba(212, 175, 53, 0.05)`
  - Hover: `background: rgba(212, 175, 53, 0.12); border-color: rgba(212, 175, 53, 0.6);`

### 2.2 Signature Interactive Patterns
- **Touch-Enabled Comparison Slider**: 50/50 split comparing raw Vector Art vs Finished High-Density Embroidery Stitches.
- **Client Feedbacks Carousel**: Touch/swipe enabled thumbnail and full preview slider.
- **Responsive Multi-Device Delivery**: Seamless scaling across MacBook, iPad, and iPhone viewports.
