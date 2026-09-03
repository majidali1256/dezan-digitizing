---
name: twenty-first-dev
description: >-
  21st.dev component library & modern UI patterns engine. Provides access to 10,000+ interactive UI component patterns, animated widgets, Magic UI / Aceternity effects, bento layouts, shining buttons, comparison sliders, and modern Tailwind/CSS snippets. Use ALWAYS when looking for state-of-the-art UI components and interactive elements.
---

# 21st.dev: Modern UI Component Library & Interactive Patterns

Inspired by 21st.dev, Magic UI, Aceternity UI, and modern design engineering, this skill provides drop-in ready patterns for high-converting, visually rich components.

---

## 1. Top Modern Component Patterns

### 1.1 Touch-Enabled Before / After Comparison Slider
A signature hero pattern for design, digitizing, AI art, and photo editing:
```html
<div class="relative w-full max-w-lg aspect-square rounded-2xl overflow-hidden cursor-col-resize select-none" id="compare-slider">
  <!-- After Image (Base) -->
  <img src="after.png" class="absolute inset-0 w-full h-full object-cover" />
  <!-- Before Image (Clipped) -->
  <div class="absolute inset-0 overflow-hidden" id="compare-clip" style="width: 50%;">
    <img src="before.png" class="absolute inset-0 w-full h-full object-cover" style="min-width: 100%;" />
  </div>
  <!-- Divider Handle -->
  <div class="absolute top-0 bottom-0 w-1 bg-white" id="compare-handle" style="left: 50%;">
    <div class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800">
      ⇄
    </div>
  </div>
</div>
```

### 1.2 Radiant Gold & Shimmer Button (21st.dev Style)
```css
.btn-shimmer {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #d4af35 0%, #b89326 100%);
  color: #090806;
  font-weight: 800;
  border-radius: 12px;
  padding: 14px 32px;
  box-shadow: 0 10px 25px -5px rgba(212, 175, 53, 0.4);
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s;
}

.btn-shimmer::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    60deg,
    transparent 20%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 80%
  );
  transform: rotate(30deg) translateY(-100%);
  transition: transform 0.6s ease;
}

.btn-shimmer:hover::before {
  transform: rotate(30deg) translateY(100%);
}

.btn-shimmer:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px -5px rgba(212, 175, 53, 0.6);
}
```

### 1.3 Bento Grid Layout
Organize features in an engaging, asymmetrical grid:
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
  <!-- Large Hero Feature (Spans 2 columns) -->
  <div class="md:col-span-2 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md relative overflow-hidden">
    <div class="relative z-10">
      <span class="text-xs uppercase font-bold tracking-widest text-primary">Core Advantage</span>
      <h3 class="text-2xl font-bold mt-2">12-24h Ultra-Fast Turnaround</h3>
      <p class="text-slate-400 mt-2 text-sm">Industry-leading speed without sacrificing stitch precision.</p>
    </div>
  </div>
  
  <!-- Single Column Feature -->
  <div class="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
    <span class="text-xs uppercase font-bold tracking-widest text-primary">Guarantee</span>
    <h3 class="text-xl font-bold mt-2">Unlimited Free Revisions</h3>
  </div>
</div>
```

### 1.4 Glowing Border Card
```css
.card-glowing-border {
  position: relative;
  background: #12100c;
  border-radius: 16px;
  padding: 2px;
}
.card-glowing-border::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 17px;
  background: linear-gradient(90deg, #d4af35, transparent, #d4af35);
  opacity: 0.3;
  transition: opacity 0.3s;
}
.card-glowing-border:hover::before {
  opacity: 0.8;
}
```

---

## 2. Component Selection Guidelines
- **Landing Pages**: Hero comparison slider, Bento feature grid, interactive testimonials marquee, dynamic pricing calculator.
- **Portfolios**: Filterable lightbox gallery, responsive masonry layout, zoomable modal preview.
- **E-Commerce / Pricing**: Tier cards with highlighted "Most Popular" badge, file upload drag-and-drop zone, order summary receipt.
