---
trigger: always_on
description: Universal rule mandating WebP (.webp) format for all pictures, illustrations, logos, and mockups added to any website or project.
---

# Universal WebP Image Optimization Rule

Whenever creating, modifying, adding, or converting pictures, graphics, mockups, logos, hero artwork, or thumbnails for any website or project:

## 1. Universal WebP Format Mandate
- **Strict Requirement**: ALWAYS use modern WebP (`.webp`) format for every image added to the site.
- **Why**: Drastically reduces page payload (consistently 70%+ bandwidth savings), accelerates Largest Contentful Paint (LCP), minimizes load time, and preserves pristine high-resolution visual quality with complete alpha channel transparency.
- **Never use raw heavy PNG or JPEG assets** directly in production markup when WebP can be used.

## 2. Encoding & Fidelity Guidelines
- **Transparent Logos, Badges, Icons & Vector Renders**:
  - Encode with high quality (`quality=95`, `alpha_quality=100`, RGBA mode) using method 6.
  - Ensures crisp vector-like edges with zero fringing, haloing, or color banding.
- **Photography, Embroidery Stitchouts & Realistic Mockups**:
  - Encode at `quality=85-90` with method 6 for optimal compression and visually indistinguishable fidelity from raw uncompressed sources.
- **Source Preservation**:
  - Keep master raw files (PNG/JPEG) preserved on disk as fallbacks if needed, but serve `.webp` exclusively across all HTML, CSS, and JS files.

## 3. Workflow When Adding New Images
1. Whenever a new image file is introduced to the repository in PNG, JPG, or SVG raster format, immediately convert it to `.webp` using Python `Pillow`:
   ```python
   from PIL import Image
   im = Image.open("input.png")
   im.save("output.webp", "WEBP", quality=95, alpha_quality=100, method=6)
   ```
2. Reference the `.webp` path across all markup:
   - `<img src="path/to/image.webp" ...>`
   - `<link rel="preload" href="path/to/image.webp" as="image" type="image/webp">`
   - CSS: `background-image: url('path/to/image.webp');`
3. Always provide explicit `width`, `height`, or aspect ratio classes (e.g., `aspect-[4/3]`) to guarantee zero Cumulative Layout Shift (CLS).
4. Verify that all newly added images render with `naturalWidth > 0` and zero broken HTTP requests using Playwright visual checks.
