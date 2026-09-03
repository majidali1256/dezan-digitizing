---
name: playwright-visual-verification
description: >-
  Playwright CLI & visual QA verification engine. Automatically captures multi-viewport screenshots (Desktop 1512x982, Tablet 834x1112, Mobile 390x844), inspects visual rendering, detects layout overflow/clipping bugs, verifies UI changes, and generates multi-device presentation mockups. Use ALWAYS before declaring UI/frontend work complete.
---

# Playwright Visual Verification & UI Quality Assurance

Never guess if a web page looks right or assume responsive styles work without seeing them. **Playwright Visual Verification** enables real browser rendering, multi-device screenshot capture, and visual validation.

---

## 1. Quick Screenshot Commands (CLI)

Use `npx -y playwright screenshot` with system Chrome (`--channel chrome`):

### 1.1 Desktop Screenshot (MacBook Pro 1512 × 982)
```bash
npx -y playwright screenshot --channel chrome --wait-for-timeout 1500 --viewport-size "1512, 982" http://localhost:8080/index.html desktop_preview.png
```

### 1.2 Tablet Screenshot (iPad Pro 834 × 1112)
```bash
npx -y playwright screenshot --channel chrome --wait-for-timeout 1500 --viewport-size "834, 1112" http://localhost:8080/index.html tablet_preview.png
```

### 1.3 Mobile Screenshot (iPhone 14/15 Pro 390 × 844)
```bash
npx -y playwright screenshot --channel chrome --wait-for-timeout 1500 --viewport-size "390, 844" http://localhost:8080/index.html mobile_preview.png
```

### 1.4 Full Page Screenshot (Entire scrollable height)
```bash
npx -y playwright screenshot --channel chrome --full-page --viewport-size "1440, 900" http://localhost:8080/index.html fullpage_preview.png
```

---

## 2. Multi-Device Mockup Generation Pipeline

To create professional multi-device client deliverables (like Fiverr/Upwork gig showcases):

1. **Start Local Server**: Run `python3 -m http.server 8089` in background.
2. **Capture Real Viewports**: Capture `desktop_index.png`, `tablet_index.png`, and `mobile_index.png`.
3. **Assemble Device Mockup Canvas**: Render an HTML template (e.g. `mockup_presentation.html`) containing 3D/realistic frames for MacBook Pro, iPad Pro, and iPhone 15 Pro.
4. **Export High-Res Showcase**: Capture the canvas at `1920x1080` (16:9 standard Fiverr/Portfolio ratio) into `.png` and `.jpg`.

---

## 3. Visual QA Checklist

When inspecting captured screenshots, verify:
- [ ] **Navbar & Hamburger Menu**: Collapses neatly on mobile without overlapping logo or theme toggles.
- [ ] **Hero Section**: Headline wraps cleanly without awkward single-word orphan lines; CTA buttons stack properly on mobile.
- [ ] **Images & Sliders**: Correct aspect ratio, crisp rendering, no squished or stretched assets.
- [ ] **No Horizontal Scrollbar**: Entire layout stays within the 100vw viewport.
- [ ] **Padding & Gutters**: Consistent left/right container padding (minimum 16px on mobile, 24px-32px on desktop).
