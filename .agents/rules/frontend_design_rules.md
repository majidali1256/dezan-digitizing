---
trigger: always_on
description: Mandatory frontend design rules and 5-skill execution pipeline for all UI/web tasks.
---

# Mandatory Frontend Design Rules & 5-Skill Pipeline

Whenever designing, implementing, modifying, or auditing any frontend web page, UI component, CSS style, or layout:

## 1. The 5-Skill Design Pipeline (Always Follow)

1. **Taste Skill (`taste`)**:
   - Apply curated, top-tier aesthetic benchmarks (Linear, Stripe, Apple, Vercel, Raycast).
   - Enforce anti-vibe-coding standards (no generic gray cards, no unstyled default fonts, no flat lifeless components).
   - Use layered 1px translucent borders, dark luxury or clean SaaS themes, tailored HSL colors, and micro-interactions.

2. **Web Design Guidelines Skill (`web-design-guidelines`)**:
   - Audit against Vercel's design engineering standards & WCAG 2.1 AA accessibility.
   - Enforce 4px/8px spatial grid, optical alignment, 44x44px minimum touch targets, and contrast ratios (>= 4.5:1).
   - Implement zero-CLS layouts (explicit aspect ratios) and complete 6-state component machines (default, hover, focus-visible, active, disabled, loading).

3. **Full Design System Skill (`awesome-design-md`)**:
   - Adhere to the project's 3-layer design token system (Primitive → Semantic → Component).
   - Prevent hardcoded arbitrary color or spacing values; maintain consistency across all pages via `DESIGN.md`.

4. **21st.dev MCP & Component Library (`twenty-first-dev`)**:
   - Leverage modern interactive components (touch before/after comparison sliders, radiant shimmer buttons, bento grids, glowing cards, marquee carousels, dynamic bottom bars).

5. **Playwright Visual Verification Skill (`playwright-visual-verification`)**:
   - Verify all frontend work with real headless browser screenshots across Desktop (1512x982), Tablet (834x1112), and Mobile (390x844).
   - Catch visual bugs, layout overflows, clipping, or contrast defects before delivering results to the user.
