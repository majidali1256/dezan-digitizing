---
name: web-design-guidelines
description: >-
  Audits and guides frontend code against Vercel's official design engineering guidelines and modern web interface standards. Flags weak UI points, layout shifts, unresponsive states, and accessibility issues (WCAG 2.1 AA) before shipping. Use ALWAYS when auditing, structuring, or coding frontend layouts and components.
---

# Web Design Guidelines & Vercel Design Engineering Rules

This skill provides a rigorous design audit checklist and engineering rules based on Vercel's interface standards, Apple Human Interface Guidelines, and WCAG 2.1 AA web accessibility.

---

## 1. Layout & Alignment Rules

### 1.1 The 4px / 8px Spatial Grid
All margins, paddings, gap spacing, and dimensions must map strictly to multiples of 4px / 8px:
- `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`, `96px`, `128px`.
- Never use random values like `margin-top: 17px` or `padding: 13px 21px`.

### 1.2 Optical vs Mathematical Alignment
- **Icon + Text Vertical Centering**: Icons frequently appear optically lower than adjacent text. Use flexbox with `align-items: center` and ensure icon `height` matches the cap-height or line-height.
- **Button Padding**: Horizontal padding should generally be `1.5x` to `2x` the vertical padding (e.g. `py-2.5 px-6` or `py-3 px-8`).
- **Pill Badges**: When creating rounded pill badges, ensure font size is slightly smaller (`11px - 13px`) with bold weight (`600` or `700`) and tight tracking.

### 1.3 Fluid Responsive Typography
Avoid sudden jarring text breakpoint jumps. Prefer CSS `clamp()` or clean responsive classes:
```css
h1 {
  font-size: clamp(2rem, 5vw + 1rem, 4.5rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
}
```

---

## 2. Accessibility & Usability (WCAG 2.1 AA)

### 2.1 Contrast Ratios
- **Body & Paragraph Text**: Minimum **4.5:1** contrast against its background.
- **Large Headings & UI Elements**: Minimum **3:1** contrast.
- Never use light gray text (`#9ca3af`) on a light background or dim dark gray (`#3f3f46`) on black without checking readability.

### 2.2 Touch Target Minimums
- All clickable buttons, links, toggles, and form inputs must have a minimum target size of **44 × 44px** on touch devices.
- For small visual icons (e.g., 20px close button), expand the clickable area using padding (`p-3`) or an invisible pseudo-element (`::after`).

### 2.3 Keyboard Navigation & Focus Rings
Never strip outline without replacing it with an accessible `:focus-visible` ring:
```css
:focus-visible {
  outline: 2px solid #d4af35;
  outline-offset: 2px;
}
```

### 2.4 Semantic HTML & ARIA
- Use `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`, `<aside>`.
- Use `<button>` for actions, `<a>` with `href` for navigation.
- Accessible names: Add `aria-label` or `sr-only` text for icon-only buttons (e.g., theme toggle, hamburger menu, close modal).

---

## 3. Interactive State Machine (Every Component)

Every interactive element (button, card, input, tab) MUST define all 6 states:
1. **Default / Rest**: Clean, legible, inviting.
2. **Hover**: Subtle lift, glow, or brightness increase (`brightness(1.08)`).
3. **Focus-Visible**: High-contrast outline ring for keyboard users.
4. **Active / Pressed**: Subtle scale down (`scale(0.98)`) or pressed depth.
5. **Disabled**: Reduced opacity (`opacity-50`), `cursor-not-allowed`, no hover transform.
6. **Loading**: Spinner or skeleton state with disabled interaction.

---

## 4. Layout Stability & Zero CLS (Cumulative Layout Shift)

- **Images & Media**: Always declare explicit `width` and `height` attributes or `aspect-ratio` in CSS so space is reserved before the asset finishes loading.
- **Dynamic Content & Skeletons**: Use skeleton loaders (`bg-white/5 animate-pulse rounded-lg`) matching the exact shape of incoming content.
- **Sticky Headers**: Use `backdrop-filter: blur(12px)` with semi-transparent background to prevent jarring edge collisions during scroll.

---

## 5. Pre-Ship Audit Checklist

- [ ] Tested on Mobile (375px - 390px), Tablet (768px - 834px), and Desktop (1440px+).
- [ ] No horizontal scroll overflow on any screen size (`overflow-x: hidden` on viewport roots).
- [ ] Color contrast passes WCAG 2.1 AA.
- [ ] All interactive buttons and inputs have active/hover/focus states.
- [ ] Images have descriptive `alt` tags and reserved aspect ratios.
