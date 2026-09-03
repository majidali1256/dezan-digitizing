---
name: taste
description: >-
  Pulls real design references and aesthetic benchmarks from top-tier websites (Linear, Stripe, Apple, Vercel, Raycast, Supabase, Framer, Cosmos) to eliminate generic "vibe-coded" UI. Enforces curated typography pairings, distinct contrast ratios, sophisticated surface hierarchy (glassmorphism, subtle 1px borders, subtle gradients), micro-interactions, and bespoke brand-aligned aesthetics. Use ALWAYS when designing, building, or refining frontend web pages, components, and user interfaces.
---

# Taste: Curated Design References & Anti-Vibe-Coding Standard

"Vibe-coding" produces generic, washed-out websites that look like standard Bootstrap templates or uninspired AI-generated layouts. **Taste** brings intentionality, craftsmanship, and visual distinction inspired by the finest modern web products.

---

## 1. The Anti-Vibe-Coding Checklist (What to Ban)

❌ **NEVER do these (Vibe-Coded Sins):**
1. **Generic Gray Boxes**: Flat `#f0f0f0` or `#222222` rectangles with no border, glow, or surface depth.
2. **Default Browser Fonts**: Relying on unstyled Arial, Times New Roman, or generic Sans-serif without tight letter-spacing.
3. **Harsh, Saturated Primitive Colors**: Using pure `#ff0000` red, `#0000ff` blue, or `#00ff00` green instead of tailored HSL/Oklch palettes.
4. **Huge Blurry Drop Shadows**: Lazy `box-shadow: 0 10px 30px rgba(0,0,0,0.5)` with no layered ambient depth or inner borders.
5. **Lifeless Static Buttons**: Buttons that don't react dynamically on hover, click, or focus.
6. **Centering Everything Mindlessly**: Placing every single element in a centered flex column with no asymmetric visual interest or grid rhythm.
7. **Empty Placeholders & Lorem Ipsum**: Fake, unstyled dummy data instead of crisp, context-rich real copy and imagery.

---

## 2. World-Class Design Archetypes & Benchmarks

When designing, choose and commit to a coherent **Visual Archetype**:

### A. Dark Luxury / High Precision (Reference: Linear, Raycast, Apple Dark)
- **Backgrounds**: Deep obsidian `#08080a`, graphite `#121316`, warm charcoal `#14120e` with ambient radial gold/cyan glow.
- **Surfaces**: Layered cards with `1px` subtle translucent borders (`border: 1px solid rgba(255, 255, 255, 0.08)`), `backdrop-filter: blur(12px)`.
- **Accents**: Subtle metallic or luminous gradients (e.g. Gold: `#d4af35` → `#f7e59c`, Cyber: `#6366f1` → `#a855f7`).
- **Typography**: Ultra-clean geometric or grotesk sans (`Inter`, `Geist`, `Plus Jakarta Sans`) with tight tracking (`letter-spacing: -0.02em` on titles).

### B. Clean Editorial & Minimal SaaS (Reference: Stripe, Vercel, Supabase)
- **Backgrounds**: Pure crisp `#ffffff` or cool off-white `#fafafa` with subtle dot/grid mesh.
- **Surfaces**: White cards with crisp 1px borders (`#e5e7eb` or `#eaecf0`) and subtle dual-layer shadows (`0 1px 3px rgba(0,0,0,0.05), 0 10px 25px -5px rgba(0,0,0,0.04)`).
- **Typography**: High contrast crisp text (`#09090b` for headings, `#52525b` for body).

### C. Creative Studio & Craft (Reference: Framer, Cosmos, Figma)
- **Visuals**: Dynamic comparison sliders, interactive bento cards, tactile hover micro-animations, glass cards, bespoke typography pairing (e.g. Serif Display + Sans Body).

---

## 3. The 5 Principles of High-End UI Execution

### 1. Layered Surface Depth (The 1px Rule)
Every card, modal, or floating element must feel physically tangible:
```css
.card-premium {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.2),
    0 12px 24px -4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(16px);
  border-radius: 16px;
}
```

### 2. Typographic Polish
- Apply `-webkit-font-smoothing: antialiased;` to body.
- Headings: `font-weight: 800` or `900`, `line-height: 1.05 - 1.15`, `letter-spacing: -0.03em`.
- Subheadings/Eyebrows: `text-transform: uppercase`, `letter-spacing: 0.1em`, `font-size: 11px - 13px`, `font-weight: 700`.
- Body text: `font-size: 15px - 16px`, `line-height: 1.6`, high contrast against the background.

### 3. Responsive Bento & Asymmetric Grids
Instead of boring identical rows, use Bento Grid layouts (`grid-cols-1 md:grid-cols-3` with spanning items `md:col-span-2`), hero showcases, and interactive comparison splitters.

### 4. Micro-Interactions & Transitions
Every interactive element must have smooth state transitions:
```css
.btn-interactive {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.btn-interactive:hover {
  transform: translateY(-2px);
  filter: brightness(1.1);
  box-shadow: 0 8px 20px -2px rgba(212, 175, 53, 0.4);
}
.btn-interactive:active {
  transform: translateY(0);
}
```

### 5. Ambient Lighting / Visual Glows
Elevate flat backgrounds with soft, low-opacity radial gradients behind key hero components to create atmospheric lighting.

---

## 4. Design Verification Rule
Before concluding any UI work:
1. Does this look like an award-winning site on Awwwards / Dribbble / Behance?
2. Are font sizes, colors, and margins cohesive?
3. Is it responsive, mobile-ready, and polished across all breakpoints?
