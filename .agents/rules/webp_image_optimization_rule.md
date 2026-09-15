---
trigger: always_on
description: Universal rule mandating optimized WebP for raster website images by default, preserving SVG for vector graphics, retaining originals, avoiding unnecessary re-encoding, and verifying visual quality and dimensions before replacement.
---

# Universal Web Image & WebP Optimization Rule

Whenever creating, modifying, adding, optimizing, or converting images, graphics, mockups, logos, hero artwork, or thumbnails for any website or project:

## 1. Optimized WebP for Raster Images by Default
- **Default Raster Format**: Use optimized WebP (`.webp`) for all raster website images (photography, realistic mockups, embroidery stitchouts, complex renders, raster screenshots, and textures).
- **Performance & Loading**: WebP slashes network payloads by 70%+ compared to standard PNG/JPEG, accelerates Largest Contentful Paint (LCP), and eliminates layout shifts with full alpha transparency support.
- **Avoid Heavy Legacy Formats**: Never serve uncompressed or heavy PNG/JPEG files in production markup when WebP can be used.

## 2. Preserve SVG for Vector Graphics
- **Strict Vector Preservation**: Preserve native **SVG (`.svg`)** for vector graphics, icons, line art, vector logos, and glyphs.
- **Never Rasterize Vectors**: Do NOT convert clean SVG vector assets into raster WebP images. SVGs deliver infinite resolution scalability, smaller file footprints for vectors, and direct CSS/DOM styling capabilities.

## 3. Retain Originals
- **Preserve Master Source Assets**: Always retain original source files (master PNGs, JPEGs, PSDs, or SVGs) on disk in designated asset or raw folders as source archives and fallbacks.
- **Non-Destructive Workflow**: Never destroy original raw sources when generating optimized web production assets.

## 4. Avoid Unnecessary Re-encoding
- **Prevent Generation Loss**: Do not re-encode or re-compress image files that are already properly optimized WebP or clean SVG.
- **Idempotent Asset Handling**: Check existing asset format and compression before processing. Avoid repeated lossy compression cycles that introduce artifacts, blurriness, or color banding.

## 5. Pre-Replacement Verification (Quality & Dimensions)
Before replacing or swapping any image asset in production markup:
1. **Verify Dimensions**: Ensure intrinsic dimensions (`naturalWidth` and `naturalHeight`) and aspect ratios match or exceed the layout requirements to guarantee zero Cumulative Layout Shift (CLS).
2. **Verify Visual Quality**: Inspect rendered output for sharpness, proper alpha channel transparency (zero dark fringing or halos), accurate color gamut, and absence of compression artifacts.
3. **Verify Zero Broken Links**: Ensure the target file exists on disk, renders with `naturalWidth > 0`, and produces zero HTTP 404/broken image warnings.

## 6. Encoding & Fidelity Guidelines
- **Transparent Logos & Badges (when raster)**:
  - Encode with high quality (`quality=95`, `alpha_quality=100`, method 6).
- **Photography, Renders & Stitchouts**:
  - Encode at `quality=85-90`, method 6 for visually lossless rendering and optimal weight.
- **Layout Integration**:
  - Always declare explicit `width`, `height`, or aspect-ratio styling (`aspect-[4/3]`, `aspect-square`, etc.) on `<img>` tags.
