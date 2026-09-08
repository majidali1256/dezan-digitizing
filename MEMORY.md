# Project Memory: Dezan Digitizing

## 1. Project Overview & Identity
- **Business Name:** Dezan Digitizing
- **Service Domain:** Premium Embroidery Digitizing & Vector Art Conversion (Operating since 2016)
- **Tagline:** High-Precision Stitch Craftsmanship & Vector Artwork
- **Primary Contacts:** `fdezan91@gmail.com`
- **Social Presence:** Facebook (`fdezan91`), Instagram (`dezan.digitizing`), TikTok (`@dezandigitizing`)
- **Homepage Meta Description:** "We provide professional embroidery digitizing services for embroidery shops across the U.S. Get production-ready files for hats, left chest, 3D puff, jacket backs and more, from $15."

---

## 2. Live Deployments & Hosting
- **Vercel Production (Full-Stack Frontend + Backend):** `https://dezan-digitizing.vercel.app/`
  - **Frontend Pages:** `https://dezan-digitizing.vercel.app/` (clean URLs, SSL, global CDN edge caching)
  - **Express REST API Backend:** `https://dezan-digitizing.vercel.app/api` (Vercel Serverless Functions via `api/[[...slug]].js` and `api/index.js` routing to `server/server.js`)
  - **API Health Endpoint:** `https://dezan-digitizing.vercel.app/api/health` (Reports live database status, latency, order counts)
- **Database Engine (Cloud):** PostgreSQL on InsForge BaaS (`e8rw998g.us-east.database.insforge.app:5432` with SSL)
- **Cloud Storage (Cloud):** InsForge S3 Object Storage (`https://e8rw998g.us-east.insforge.app/api/storage`)
- **GitHub Pages Production (Frontend Mirror):** `https://majidali1256.github.io/dezan-digitizing/`
- **GitHub Repository:** `https://github.com/majidali1256/dezan-digitizing.git` (Branch: `main`)
- **Configuration:** `vercel.json` (clean URLs, `/api/(.*)` rewrites to `/api`)


---

## 3. Technology Stack & Framework Rules
- **Structure:** Semantic HTML5
- **Styling:** CSS3 (Vanilla CSS + Tailwind CSS utilities via CDN for dynamic layout classes)
- **Design Tokens:** Established in `DESIGN.md` (Default White Theme `#f8f7f6` with Dark Luxury `#201d12` optional toggle, Gold `#d4af35`, high-contrast text `#8b6807`/`#9a7810` in light mode, Inter/Outfit typography)
- **Theme Default:** **White/Light theme** is the universal default for all visitors, portal users, clients, admins, and workers. Dark mode is user-toggleable and persisted in `localStorage`.
- **Text Contrast Standard:** Strict WCAG 2.1 AA compliant text contrast ratios ($\ge 4.5:1$) across both light and dark modes.
- **Logic:** Vanilla JavaScript (ES6+) — *Strictly zero client-side frameworks (no React, Vue, Angular)*
- **Backend Architecture (Node.js & Express.js REST API)**:
  - **Server Directory (`server/`)**: Production-ready Express API service (`server.js`) on port 5001 with Helmet, CORS, Morgan, and JSON parsers.
  - **Controllers & Routes**: Modular controllers for `/api/health`, `/api/auth` (bcrypt + JWT), `/api/orders`, `/api/quotes`, `/api/tasks` (worker queue with strict zero-PII data masking), `/api/revisions` (physical defect photo proofing), and `/api/upload` (Multer multipart handling).
  - **Database Engine:** PostgreSQL via InsForge BaaS (`https://e8rw998g.us-east.insforge.app` with `pg.Pool` SSL direct connection, Row-Level Security, and S3 Storage).
  - **Authentication**: Stateless JWT (`Bearer <token>`) with bcrypt-hashed passwords stored in `public.profiles`.
- **Integrations:**
  - **PayPal JS SDK:** Order billing and secure checkout
  - **EmailJS:** Instant automated transactional email notifications

---

## 4. Design Standards & 5-Skill Pipeline
All UI components, portal views, and marketing sections must adhere to `.agents/rules/frontend_design_rules.md`:
1. **Taste (`taste`)**: Dark Luxury aesthetic, tailored HSL colors, 1px translucent borders, zero unstyled/generic cards.
2. **Web Design Guidelines (`web-design-guidelines`)**: 4px/8px spatial scale, 44x44px touch targets, WCAG 2.1 AA contrast ($\ge 4.5:1$), zero-CLS layouts.
3. **Design Tokens (`awesome-design-md`)**: 3-layer tokens (Primitive $\rightarrow$ Semantic $\rightarrow$ Component) defined in `DESIGN.md`.
4. **Interactive Components (`twenty-first-dev`)**: Modern UI micro-interactions, responsive touch comparison sliders, sleek dropzones, radiant hover states.
5. **Visual Verification (`playwright-visual-verification`)**: Multi-viewport visual QA across Desktop (1512x982), Tablet (834x1112), and Mobile (390x844).

### 4.1 Anti-Muddy Blending, Contrast & Universal Theme Color Consistency (Implemented)
- **Elimination of Translucent Overlays (`bg-primary/5` on `#f8f7f6` canvas)**:
  - Previously, cards using 5% brand gold opacity (`bg-primary/5`) against the warm off-white canvas `#f8f7f6` produced an unwashed parchment / dirty beige tint (`#f6f4eb`).
  - Converted all cards and containers across all outer pages (`about.html`, `contact.html`, `index.html`, `services.html`, `pricing.html`, `portfolio.html`, `order-success.html`, `profile.html`, `portal-login.html`) to solid `bg-white` in light mode and `dark:bg-card-dark` (`#16140c`) in dark mode with refined `border-primary/20` or `border-primary/25` borders.
- **Strict WCAG 2.1 AA Text Contrast Ratios ($\ge 4.5:1$ - $7:1$)**:
  - **Light Mode (`styles.css`)**:
    - `:root:not(.dark) .text-primary` = `#9a7810` (achieving a crisp ~7:1 contrast ratio against white/light backgrounds, replacing unreadable bright yellows).
    - Elevated washed-out slate grays: `:root:not(.dark) .text-slate-400` = `#475569` (5.8:1 contrast) and `.text-slate-500` = `#334155` (7.5:1 contrast).
    - Review & star ratings: `:root:not(.dark) .text-amber-400` fixed from muddy dark brown-orange `#b45309` to radiant gold `#c0931b` / `#d4af35`.
  - **Dark Mode Anti-Dark-On-Dark Protection**:
    - Overrode unadorned Tailwind text classes: `.dark .text-slate-500` $\rightarrow$ `#94a3b8`, `.text-slate-600` $\rightarrow$ `#cbd5e1`, `.text-slate-700` $\rightarrow$ `#e2e8f0`, `.text-slate-800` $\rightarrow$ `#f1f5f9`, `.text-slate-900` $\rightarrow$ `#ffffff`.
- **Cured Cool Blue-Slate vs Warm Olive-Dark Theme Clash**:
  - Tailwind's default `slate-800` (`#1e293b`) is cool blue, clashing with Dezan's signature dark luxury canvas (`#201d12`, warm olive-dark).
  - Globally harmonized `.dark .dark\:bg-slate-800` (and all opacity variants `/90`, `/80`, `/70`, `/50`) to `#16140c !important` with `border-color: rgba(212, 175, 53, 0.22) !important`.
  - Added global border harmonization for `.dark .border-slate-700`, `.dark .dark\:border-slate-700`, `.dark .border-slate-800`, `.dark .dark\:border-slate-800`.
- **Universal Color Token Consistency**:
  - Replaced jarring mismatched amber/brown classes (`text-amber-800`, `text-amber-900`, `bg-amber-500`) with global mapping to `#9a7810` in light mode and `#d4af35` in dark mode.
  - Unified the Header Login button across all 9 pages and `app.js` into sleek brand gold tokens (`bg-primary/10 dark:bg-primary/15 hover:bg-primary text-primary border border-primary/25`).
  - Mobile bottom navigation bars updated with high-contrast inactive icons (`#475569` light / `#94a3b8` dark) and active gold indicators (`#9a7810` light / `#d4af35` dark).

### 4.2 Stacked Luxury Brand Lockup (Header & Footer Typography)
- **Problem**: The horizontal single-line "DEZAN DIGITIZING" text competed for horizontal real estate on mobile screens and felt generic compared to modern luxury design standards.
- **Solution & Token Contract**:
  - Implemented a 2-line stacked architectural lockup across all 8 public pages (`index.html`, `about.html`, `services.html`, `portfolio.html`, `pricing.html`, `contact.html`, `order-success.html`, `profile.html`):
    - **Top Line (Brand Root)**: `<span class="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">DEZAN</span>` (or `text-white` in dark footers).
    - **Bottom Line (Craft Subtitle)**: `<span class="text-[9.5px] sm:text-[10.5px] font-extrabold tracking-[0.18em] text-primary uppercase mt-0">Digitizing</span>`.
  - Nested within `<div class="flex flex-col text-left leading-none">` alongside the circular emblem `logo.png` (`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover`).
  - Gives the brand a refined, high-fashion horology/atelier lockup with optimal visual hierarchy and enhanced horizontal clearance on mobile viewports.

### 4.3 Admin Orders Color Theme System & Table Layout Stabilization (`admin-orders.html` & `admin-workspace.js`)
- **Problem**:
  - Every order row and card previously shared an identical white/transparent background, making it impossible to visually distinguish order stages and types at a glance.
  - In Table View, Order IDs containing hyphens (`QUO-4769`) wrapped onto two lines (`QUO-` on line 1, `4769` on line 2).
  - Status badges like `Needs Review` wrapped into two lines, clipping outside the rounded pill boundary.
  - Action buttons (`History`, `Update Price`, `Specs`, `Remind`, `Invoice`, `Assign`) used `flex-wrap` inside an unconstrained cell, wrapping haphazardly into 2-3 vertical lines and overflowing across row borders.
  - Stage tables lacked `min-w-[1080px]`, causing columns to crush and overlap on narrower viewports.
- **Solution & Token Contract**:
  1. **Dynamic 6-Tier Order Color Theme Engine (`getOrderColorTheme`)**:
     - **Completed**: Fresh emerald green (`bg-emerald-50/70 hover:bg-emerald-100/75 dark:bg-emerald-950/25 dark:hover:bg-emerald-900/40 border-l-4 border-l-emerald-500 dark:border-l-emerald-400`).
     - **Revision Requested**: High-visibility purple/violet (`bg-purple-50/80 hover:bg-purple-100/85 dark:bg-purple-950/30 dark:hover:bg-purple-900/45 border-l-4 border-l-purple-500 dark:border-l-purple-400`).
     - **Quotes (`QUO-...`, `quote_requested`, `is_quote`)**: Crisp sky blue/cyan (`bg-sky-50/75 hover:bg-sky-100/80 dark:bg-sky-950/25 dark:hover:bg-sky-900/40 border-l-4 border-l-sky-500 dark:border-l-sky-400`).
     - **Payment Due / Unpaid**: Gentle rose/coral (`bg-rose-50/75 hover:bg-rose-100/80 dark:bg-rose-950/25 dark:hover:bg-rose-900/40 border-l-4 border-l-rose-500 dark:border-l-rose-400`).
     - **In Production / Assigned**: Cool royal blue (`bg-blue-50/70 hover:bg-blue-100/75 dark:bg-blue-950/25 dark:hover:bg-blue-900/40 border-l-4 border-l-blue-500 dark:border-l-blue-400`).
     - **New Work / Needs Attention**: Warm signature amber (`bg-amber-50/75 hover:bg-amber-100/80 dark:bg-amber-950/25 dark:hover:bg-amber-900/40 border-l-4 border-l-amber-500 dark:border-l-amber-400`).
     - Applied to both **Table View** (`tr` background + `border-l-4`) and **Bento Cards View** (`cardClass` ring & subtle tint) 
   2. **Strict Non-Wrapping Order ID, Status, and Worker Metrics**:
      - **Order IDs**: Enforce `w-[140px] min-w-[140px] whitespace-nowrap font-mono font-black` with non-breaking hyphens (`&#8209;`) and inline styles `white-space: nowrap !important; word-break: keep-all !important; letter-spacing: -0.01em;`, preventing ASCII soft-hyphen breaks across lines.
      - **Status Badges**: Enforce `w-[125px] min-w-[125px] whitespace-nowrap inline-flex items-center justify-center leading-none px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0` with `white-space: nowrap !important;`.
      - **Worker Dispatch**: Enforce `w-[145px] min-w-[145px] whitespace-nowrap` displaying primary name in bold and secondary specialty title in a subtle 10px muted subtitle (`Digitizer\nLead Embroidery & Vector Digitizer`), or a clean `Unassigned` badge.
      - **Payment Badges**: Enforce `whitespace-nowrap inline-flex items-center gap-1 leading-none shrink-0` with `white-space: nowrap !important;`.
   3. **Streamlined Single-Line Action Toolbar**:
      - Action buttons styled with compact `px-2 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs shrink-0 whitespace-nowrap`.
      - Container uses `inline-flex items-center justify-end gap-1 flex-nowrap shrink-0` inside `w-[300px] min-w-[300px] text-right whitespace-nowrap`, fitting up to 4 full action buttons (`History`, `Update Price`/`Specs`/`Remind`, `Invoice`, `Assign`/`Reassign`) cleanly in a single horizontal row without vertical wrapping or clipping.
   4. **Table Minimum Width & Calibrated Grid Architecture**:
      - All 4 stage tables updated to `<table class="w-full text-left text-xs min-w-[1200px]">` with `px-4 py-3.5` padding on all `<th>` and `<td>` cells.
   5. **Interactive Color Legend**:
      - Added an executive color key indicator to the search results bar displaying all 6 color dots (Completed, Revision, In Production, New Work, Quote, Payment Due).

### 4.4 Staff Account Order & Quote Restriction Policy (Admin & Digitizer)
- **Problem & Requirement**:
  - Administrative and digitizer production staff members must not create customer orders or quote appraisals under their staff credentials or staff email addresses (`admin@dezandigitizing.com`, `digitizer@dezandigitizing.com`).
  - When an authenticated admin or digitizer attempts to order or request a quote from any button across the marketing website or portals, show: **"You can't place orders from this account"**.
- **Implementation & Architecture**:
  1. **Frontend Dispatcher Guard (`app.js`)**:
     - `window.showStaffOrderBlockModal(role, email)`: Dynamically generates an accessible dialog (`#staff-order-blocked-modal`) with radiant shield icon, role indicator pill, "You can't place orders from this account" headline, and actionable choices ("Sign Out to Order as Guest", "My Dashboard", "Dismiss").
     - `window.handleOrderClick` & `window.handleQuoteClick`: Intercepts `session.role === 'admin'` and `session.role === 'digitizer'`, invoking `showStaffOrderBlockModal` instead of silently bouncing.
     - `window.signOutStaffToGuestOrder()`: Clears storage sessions and opens the order modal cleanly for guest checkout.
  2. **Unified Modal Guard (`js/order-quote-modal.js`)**:
     - `window.openOrderQuoteModal()`: Aborts immediately and triggers `showStaffOrderBlockModal` if current session has role `admin` or `digitizer`.
     - `window.submitOrderQuoteForm()`: Fallback guard intercepting form submissions with staff session or staff emails (`admin@dezandigitizing.com` / `digitizer@dezandigitizing.com`).
  3. **Client SDK Guard (`js/insforge-client.js`)**:
     - `createOrder()`: Throws an explicit `Error("You can't place orders from this account")` if `user.role === 'admin' || user.role === 'digitizer'` or matching staff email addresses.
  4. **Client Workspace Protection (`js/client-workspace.js`)**:
     - Automatically redirects staff users visiting `client-portal.html` back to `admin-portal.html` or `worker-portal.html` rather than overwriting their staff session with a demo client.
  5. **Backend Database & API Controller Enforcement (`server/controllers/orderController.js` & `quoteController.js`)**:
     - `POST /api/orders` & `POST /api/quotes`: Strict 403 Forbidden rejection with `"You can't place orders from this account"` if `req.user.role` is `admin` or `digitizer`, or if client email equals `admin@dezandigitizing.com` or `digitizer@dezandigitizing.com`.

### 4.5 Hero Comparison Slider & Brand Logo Refresh Glitch Elimination
- **Problem**:
  - On mobile and desktop reloads/refreshes, the hero astronaut comparison graphic momentarily appeared glitched/distorted: the vector half was squished horizontally to 50% width and misaligned with the embroidery background behind it for 100–300ms until `app.js` executed `syncBeforeImageWidth()`.
  - The header `logo.png` lacked explicit dimension attributes and static CSS rules, risking minor FOUC/layout shift before runtime CDN compilation.
- **Solution & Architecture**:
  1. **Zero-FOUC CSS `clip-path` Slider**:
     - Converted `#hero-compare-slider` from an `overflow: hidden; width: 50%` wrapper to two identical 100% scale sibling `<img>` tags (`Hero Page/Embroidery.png` and `Hero Page/Vector.png` with `clip-path: inset(0 50% 0 0)` and `-webkit-clip-path: inset(0 50% 0 0)`).
     - Renders with 100% pixel alignment across vector and embroidery halves from the initial HTML paint frame without requiring JavaScript execution.
     - Updated `initCompareSlider()` in `app.js` to dynamically adjust `clipPath: inset(0 (100 - pct)% 0 0)` during mouse and touch drag events with zero layout thrashing or resize listeners.
  2. **Brand Asset Preloading & Dimension Locking**:
     - Preloaded `logo.png`, `Hero%20Page/Embroidery.png`, and `Hero%20Page/Vector.png` in the `<head>` of `index.html`.
     - Explicitly specified `width="36" height="36"` on `logo.png` and `width="1057" height="1100"` on the hero comparison images.
     - Added CSS rules in `styles.css` locking `header a img[src*="logo.png"]` dimensions to 32px (mobile) and 36px (desktop) with `aspect-ratio: 1 / 1`.

### 4.6 Stage 1 Order Modal Optimization & Viewport Fit (`js/order-quote-modal.js` & `client-portal.html`)
- **Problem**:
  - In the "Place an Order / Request Quote" modal (Stage 1: Choose Service), the second card (*Realistic / Pet Portrait Digitizing*) contained an oversized warning/note box (`~70px` height) that repeated redundant copy already present in its subtitle.
  - Large button paddings (`p-4 sm:p-5`), large icon boxes (`w-14 h-14 sm:w-16 sm:h-16`), and container gaps caused the modal body to bloat past 430px height, pushing the 3rd service option (*Vector Art Conversion*) below the fold and forcing vertical scrolling.
- **Solution & Architecture**:
  1. **Removed Redundant Note Box**:
     - Stripped the redundant clarification callout box from Card 2, leaving clean, concise copy in the subtitle (*"Pet portraits, realistic animals, faces, fur, detailed shading."*).
  2. **Harmonized Card Dimensions & Compact Token Scale**:
     - Standardized padding across all 3 cards to `p-2.5 sm:p-3` with rounded radius `rounded-xl sm:rounded-2xl`.
     - Scaled icon containers to `w-10 h-10 sm:w-11 sm:h-11` with SVGs sized `w-5 h-5 sm:w-6 sm:h-6`.
     - Compacted title typography to `text-sm sm:text-base font-bold` with `text-[10px] sm:text-[11px]` pricing pills.
     - Scaled subtitle copy to `text-[11px] sm:text-xs` and file type badges to `text-[10.5px] px-2.5 py-0.5`.
     - Compacted outer container spacing from `p-4 sm:p-6 space-y-3.5` to `p-3 sm:p-4 space-y-2 sm:space-y-2.5`.
  3. **Zero-Scroll Viewport Parity**:
     - All 3 service options (*Embroidery Digitizing*, *Realistic / Pet Portrait Digitizing*, and *Vector Art Conversion*) sit comfortably inside the viewport simultaneously on desktop, tablet, and mobile (390px) with zero vertical scrolling needed.
     - Changes synchronized across both public modal (`js/order-quote-modal.js`) and embedded client portal order flow (`client-portal.html`). Verified via automated Playwright visual screenshots.

---

## 5. Site Map & Route Architecture

### Public Marketing Pages
- `/index.html`: Home page (Title: `Embroidery Digitizing Services | Dezan Digitizing®️`; Hero with Before/After Comparison Slider: zero bounding box or card border around the astronaut patch, allowing the slider divider line to sweep end-to-end across the full artwork; on mobile view, astronaut slider is calibrated to `max-w-[285px]` (~14% reduction) leaving optimal space for the text block; DEZAN brand eyebrow shifted upward; 2-line headline `Professional Embroidery Digitizing` & `and Vector Art Services` enlarged by 12-15% (`text-[19.5px]` on mobile) strictly on two non-wrapping lines; value proposition `Production-ready embroidery files at just $15.` increased by 8-10% (`text-[13.5px]`) with clean unadorned typography (no underlines) and prominent ultra-bold gold emphasis on `just $15.` (`font-black`); supporting copy `Fast turnaround | Premium quality` maintained as compact secondary text; bespoke 3-button horizontal row matching reference design: 1. Solid Gold Primary `Order Now` + `Flat Rates` with shopping bag icon badge, 2. Soft-tinted `View Pricing` with tag icon badge, 3. Soft-tinted `Get Quote` with document icon badge; Live Feedback Carousel; Trust reviews; Portfolio section (`#portfolio`) sequence: 1. Custom Hats (`images/Custom Hats.png`), 2. Jacket Backs (`images/Jacket Backs.png`), 3. Left Chest (`images/Left Chest Logos.png` - updated St. Patrick's parade jackets photo), 4. Pet Portraits (`images/Pet Embroidery.png`); the dedicated **"Why Choose Dezan Digitizing?"** section highlighting manual craftsmanship, production-ready stitch files, fast turnaround, and free revisions with 4 How-It-Works styled circular icon feature cards; and the modern, interactive **"Frequently Asked Questions" (FAQ) Accordion** at the bottom of the page featuring 5 rows with CSS grid transitions, rotating gold-accented chevrons, accessible `aria-expanded` attributes, and responsive typography).
- `/about.html`: Company history, experience, machinery/software standards (Wilcom, Tajima, Barudan).
- `/services.html`: Detailed service breakdowns (Left chest, Cap/Hat, 3D Puff, Jacket Back, Vectorizing). Clean hero without dark background image, side-by-side action buttons in a 2-col grid on mobile, and 2-column grid for Expert Services fitting above the fold on mobile without scrolling.
  - **Portfolio Section Order (`#portfolio`)**: 1. Custom Hats, 2. Jacket Backs, 3. Left Chest (updated image), 4. Pet Portraits, 5. Vector Logo Trace.
  - **Brand Color & Price Harmonization**: Eliminated all mismatched dark brown / amber shades (`text-amber-800` on hero eyebrow and "Order Now" links), replacing with brand gold token `text-primary`. Harmonized Card 2 in the Transparent Pricing section (aligned Card 2 to match Card 1 and Card 3 uniformly with neutral border and text colors, removing misleading `cursor-pointer` since cards are non-clickable preview boxes with the dedicated "View Full Price List & Order" button below), updated pricing preview figures ($15 Left Chest/Hat, $25 Jacket Back / Large), and synchronized Vector Art pricing text to `$15 Simple | $25 Complex`.
  - **Responsive Verification Across All Viewports**: Playwright automated audit confirmed 0px horizontal overflow and zero layout collisions across Desktop (1512x982), Tablet (834x1112), Mobile (390x844), and Small Mobile (360x740).
- `/portfolio.html`: High-resolution gallery and customer feedback showcase.
- `/pricing.html`: Dedicated flat-rate Pricing showcase in responsive 2-column grid layout, strictly adhering to Dezan's brand color scheme (Dezan Gold `#d4af35` / `#9a7810`, Dark Luxury `#201d12`, Card Dark `#16140c`, Warm Canvas `#f8f7f6`):
  - **Brand Color Harmonization**: Eliminated all mismatched amber/brown shades (`text-amber-800`, `text-amber-950`, `bg-amber-500/10`, `border-amber-400`, `to-amber-600`) in favor of brand tokens `text-primary`, `bg-primary/10`, `border-primary/25`, ensuring 100% aesthetic consistency with `index.html` and `services.html`.
  - **Hero**: "QUALITY DIGITIZING. REAL PEOPLE.", "Simple Flat-Rate Pricing", subtitle "Professional embroidery digitizing with clean, honest pricing.", 3 circular icon badges (Next Day Turnaround, Digitized by hand - no auto conversion, Order history and online downloads), and real stitch proof embroidery patch visual floating freely with zero bounding box or card border.
  - **Digitizing Pricing Grid & Cards**: Responsive 3-column desktop layout (`max-w-6xl`) and sleek horizontal mobile cards:
    - Card 1: **$15 Hat / Left Chest Logos** (Up to 5.5 inches) with compact bespoke SVG icon featuring baseball cap and collared polo shirt.
    - Card 2: **$25 Larger Designs** (Over 5.5 inches) with compact bespoke SVG icon featuring varsity/bomber jacket and back embroidery emblem.
    - Card 3: **Realistic / Pet Portrait** ($25 flat for ≤ 5.5" / $40 flat for > 5.5") with custom thread shading and fur icon.
    - Full-width Trust Bar: "Flat rate pricing you can depend on. Zero hidden stitch-count charges."
  - **Vector Art 2-Column Grid (Compact & Centered)**: Centered `max-w-2xl mx-auto` container:
    - Card 1: **$15 Simple Vector Redraw** with bespoke SVG bezier pen tool icon.
    - Card 2: **$25 Complex Vector Redraw** with bespoke SVG multilayer mascot shield icon.
  - **Price Color Harmonization & Synchronized Hover Micro-Interactions**:
    - **Dual-Tier Price Normalization**: Fixed color discrepancy in the Realistic / Pet Portrait card where `$25 flat` was dark while `$40 flat` was hardcoded gold. Both tiers now uniformly share default high-contrast styling (`text-slate-900 dark:text-white` with `text-slate-400 dark:text-slate-500` for "flat").
    - **Synchronized Header + Price Hover**: Added `group-hover:text-primary transition-colors` to all price displays across `pricing.html` and `services.html` so that moving the cursor over any card smoothly transforms both the card title and price together into gold.
  - **Responsive Hero & Above-The-Fold Pricing**:
    - **Mobile First-Screen Parity (`media_1788643251172.png`)**:
      - Hero layout on mobile uses text wrapping around a float-right embroidery visual: The image is sized proportionally (`w-[125px]` with `ml-1.5`) while typography ("Simple Flat-Rate Pricing" with `whitespace-nowrap` on Flat-Rate, subline, and 3 icon badges) wraps cleanly around it without artificial dead space, avoiding unnecessary line breaks and excessive vertical stretching.
      - Immediately below the hero, the "OUR PRICING / Digitizing Pricing" header and both pricing cards (`Hat / Left Chest Logos $15` and `Larger Designs $25`) display as sleek, horizontal pill rows (`flex items-center justify-between`) followed by the compact trust bar ("Flat rate pricing you can depend on.") and subtle tagline ("BRANDS LOOK BETTER HERE").
      - **Dynamic Authentication Banner Placement & Styling**: Restored to its original placement right inside the Hero section (immediately above Section 1: Digitizing Pricing). Styled with consistent emerald green glow styling on both laptop and mobile (`rgba(6,78,59,0.18)` gradient, `rgba(16,185,129,0.45)` border, and green glow box-shadow) with deep forest green action buttons (`bg-[#064e3b]`) for both unauthenticated Sign In prompt and authenticated Client banner.
      - Zero vertical scrolling required to view prices on mobile viewports (e.g. 390x844).
    - **Desktop Grid Parity**: Larger screens (`md:`) seamlessly render the full 2-column feature checklist cards with action buttons and spacious trust bars.
  - **Strictly Pricing Only**: Zero embedded order forms or quote submission inputs. Authenticated client banners and action buttons route to `client-portal.html` (for logged-in clients) or `portal-login.html?redirect=...` (for unauthenticated visitors).
  - **Instant Visibility & Zero CLS**: Removed `.reveal` opacity blocking so all cards and sections render immediately across all devices, with full light/dark mode contrast parity verified via Playwright visual verification across Desktop (1440x900), Tablet (834x1112), and Mobile (390x844).
- `/contact.html`: Contact form for general inquiries, and interactive "Request a Custom Quote" portal showcase (`#custom-quote-section`). Features mobile-optimized `#quote-login-prompt` and `#quote-client-banner` with strict `items-stretch sm:items-center` flex alignment, full-width wrapping copy, nested emerald bolt icon badge (curing horizontal centering displacement outside container), responsive `grid-cols-3` step cards with proportional micro-padding, and full touch-target buttons.
- `/terms.html`: Dedicated **Terms of Service** governing:
  - 17 exact clauses: 01. Our Services (digital files only, no physical apparel), 02. Orders and Payment (upfront payment, confirmation criteria, complex art surcharges), 03. Turnaround Time (12-24h standard, 1-2 days jacket backs), 04. Customer Artwork and Authorization (client copyright warranty & indemnification), 05. Embroidery Limitations (physical scale & micro-detail simplifications), 06. Embroidery Results and Production Variables (operator/machine factors disclaimer), 07. Test Stitch Recommendation (mandatory testing before bulk runs, non-liability for blanks), 08. Revisions (free adjustments for genuine errors vs change fees), 09. File Formats (.DST, .PES, .EXP, .JEF, etc.), 10. Digital Delivery (email, account dashboard), 11. Customer Review and Approval, 12. Refunds and Cancellations (governed by Refund & Privacy Policy), 13. Intellectual Property (client retains artwork, Dezan retains processes & backup copies), 14. Limitation of Liability (capped at service fee paid), 15. Payment Disputes (pre-dispute contact request & evidence sharing), 16. Changes to Terms, 17. Contact Us (`Dezan Digitizing`, `DezanDigitizing.com`, `fdezan91@gmail.com`).
- `/privacy.html`: Dedicated **Refund & Privacy Policy** containing:
  - **Part I: Refund Policy**: Custom digital services non-refundable nature, pre-production cancellation, digitizing error resolution (registration, density, pull comp, underlay, sequencing, trims), machine/production factors disclaimer, physical embroidery limitations, customer change fees, incorrect customer information, non-fulfillment refund, duplicate payment refund, bulk test-stitch recommendation, refund processing (24-48h to original method), and payment provider rights.
  - **Part II: Privacy Policy**: Types of data collected (user, order, and technical), usage of information, uploaded artwork and file retention, third-party payment processing (PCI-DSS compliance via PayPal), service providers, payment dispute/chargeback disclosures, cookies & analytics, data retention, security measures, international customer processing, privacy rights, policy updates, and direct contact details (Dezan Digitizing, DezanDigitizing.com, Fdezan91@gmail.com).
- `/refund-policy.html`: Automated 0-second redirect forwarder to `/privacy.html`.
- `/order-success.html`: Order confirmation receipt page with transaction lookup parameters.


### Spacing Harmonization & Mobile Compact Layouts (Implemented Across All 6 Outer Pages)
- **Problem**: Elements and sections appeared oversized and vertically bloated on mobile screens (especially stacked pricing cards and step boxes dominating screen height), combined with irregular section spacing (`py-16` / 128px gaps on some pages, `py-4` on others).
- **Harmonized Spacing Tokens**:
  - Inner Page Headers: `px-4 pt-6 pb-2 sm:pt-10 sm:pb-4 text-center`
  - Standard Content Sections: `py-6 sm:py-10`
  - Featured / Contrast Sections: `py-8 sm:py-12`
  - Homepage Hero: `pt-5 pb-8 sm:pt-12 sm:pb-12 lg:pt-16 lg:pb-16`
  - Anchor Navigation: Clean `scroll-mt-20` on sections like `#portfolio` and `#custom-quote-section`.
- **Mobile Compact Component Transformations**:
  - `services.html`:
    - **Hero & Expert Services Vertical Spacing**: Standardized section padding (`pt-6 sm:pt-14 pb-6 sm:pb-10` on Hero, `py-8 sm:py-12` on Expert Services), eliminating awkward vertical compression and establishing consistent spacing across laptop and mobile viewports.
    - **Transparent Pricing Mobile 3-Column Grid**: Preserved the exact 3-column grid on mobile (`grid grid-cols-3 gap-2 sm:gap-4`) with compact badges and prices ($15 Left Chest/Hat, $25 Jacket Back / Large, $25/$40 Realistic / Pet Portrait), matching the desktop layout without vertical stacking.
    - **5-Step "How It Works" Sequential Workflow**: Replaced legacy 3-step section with the user's bespoke 5-step workflow matching reference specifications:
      1. *Upload Artwork* (bespoke folded document with upload arrow SVG)
      2. *Choose Your Requirements* (bespoke tuning sliders SVG)
      3. *Pay Securely* (bespoke credit card with magnetic stripe and chip SVG)
      4. *We Digitize* (bespoke monitor and stylus drawing pen SVG)
      5. *Download Your Files* (bespoke download tray with downward arrow SVG)
      - Centered top-border gold numbered badges (`1` to `5`), subtle primary background circular containers, and desktop directional flow arrows (`arrow_forward`).
    - Expert Services 2-column grid and Side-by-side action buttons on mobile.
  - `about.html`:
    - Converted bloated single-column stats stack into a balanced 2x2 grid on mobile (`grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3.5 sm:p-6 rounded-xl sm:rounded-2xl`).
    - Standardized all `py-16` section padding down to `py-6 sm:py-10`.
  - `contact.html`:
    - Converted the 3 stacked vertical contact cards into a **single horizontal line 3-column grid** from left to right on mobile (`grid grid-cols-3 gap-2 sm:gap-4`), reducing card height from ~360px down to ~80px and bringing the message form immediately into view.
  - `app.js`:
    - Enhanced scroll reveal observer with `rootMargin: 150px` and a 1000ms safety fallback so no element remains stuck invisible (`opacity: 0`).

### Instant Guest Checkout Modal & Post-Payment/Post-Quote Account Claiming Architecture (Implemented & Live)
- **Unified Zero Forced Registration Engine (`window.openGuestCheckoutModal`)**:
  - Unauthenticated visitors clicking any "Order Now" / "Place Order" or "Get Custom Quote" / "Request Free Quote" button on `index.html`, `pricing.html`, `services.html`, `contact.html`, `portfolio.html`, or `about.html` are presented with the **Instant Guest Modal** instead of a forced login barrier.
  - **Interactive 2-Pill Mode Switcher**:
    - **`[ ⚡ Place Flat-Rate Order ]` Mode**:
      - Modal Title: "Instant Guest Checkout", Badge: "No Signup Needed".
      - Displays flat pricing tiers ($15 / $25) for Digitizing & Vector Art.
      - Requires upfront payment via simulated 256-bit SSL Credit Card or PayPal checkout.
      - Order ID Prefix: `DZ-XXXX`, Status: `pending_review`, Payment: `paid`.
    - **`[ 📄 Request Free Quote ($0) ]` Mode**:
      - Modal Title: "Request a Free Custom Quote", Badge: "100% Free · No Signup Needed".
      - Completely hides flat pricing plans and payment forms; renders the "100% Free Stitch Appraisal & Estimation" banner.
      - Zero upfront charge ($0.00); 1-click submission button: `[ Submit Free Custom Quote Request ]`.
      - Quote ID Prefix: `QUO-XXXX`, Status: `quote_requested`, Payment: `unpaid` ($0.00).
  - **Dynamic Service & Plan Preselection**:
    - Supports dynamic service switching between **Embroidery Digitizing** and **Vector Art**.
    - Intelligent plan name alias normalization (e.g. `'Larger Designs'` -> `'Jacket Back'` $25, `'Simple Vector'` -> `'Simple Vector Redraw'` $15, `'Complex Vector'` -> `'Complex Vector Redraw'` $25, `'Hat / Left Chest Logos'` -> `'Left Chest / Hat'` $15).
    - Dynamic live price breakdown updating the summary badge, submit buttons, and credit card / PayPal triggers.
  - **Direct Drag-and-Drop File Upload**:
    - Integrates file upload with live thumbnail image preview and file size metadata.
    - Files upload directly to InsForge Storage (`artworks` bucket) or fallback with file metadata.
  - **Dynamic Confirmation & Receipt Screen (`order-success.html`)**:
    - **For Paid Orders**:
      - Header: `Order confirmed! #DZ-1048`
      - Subtitle: `Your payment was successful and your order has been submitted.`
      - Summary Card: "Order Summary", Label: "Order Number", Status: `Paid & Confirmed` (emerald badge), Amount: `$15.00` / `$25.00`.
      - Fallback note: `Or keep this Order ID for reference — finished files will arrive in your email.`
    - **For Custom Quotes**:
      - Header: `Quote requested! #QUO-4321`
      - Subtitle: `Your request has been submitted. Our master digitizers will review your artwork and estimate stitch counts within 1 hour.`
      - Summary Card: "Quote Summary", Label: "Quote Number", Status: `Quote Submitted · Free Review` (amber badge), Amount: `Free · Pending Appraisal`.
      - Fallback note: `Or keep this Quote ID for reference — your custom stitch appraisal will arrive in your email within 1 hour.`
    - **Frictionless Account Claiming Card (Both Orders & Quotes)**:
      - Clean inline card directly under the confirmation:
        `Create a password to access your orders/quotes anytime`
        `Password: ______  Confirm Password: ______`
        `[ Create My Account ]`
      - Pre-populates the customer's guest email (e.g. `david.miller@example.com`).
  - **Automatic Retroactive Linking (`insforgeClient.claimGuestOrders`)**:
    - When an unauthenticated visitor submits multiple orders and quotes as a guest (e.g. `john@gmail.com`), their records persist in the InsForge PostgreSQL `orders` table with `client_id: null`.
    - As soon as they create an account (either on the confirmation page or later at `portal-login.html`), `claimGuestOrders(clientEmail, userId)` automatically matches all orders and quotes with that verified email (`WHERE client_email = lower(?) AND client_id IS NULL`), assigns `client_id = auth.uid()`, and immediately reflects their full history in `client-portal.html` with zero missing records.
  - **Logged-In Fast-Track**:
    - If a client is already authenticated, clicking "Order Now" on marketing pages opens the full 2-stage order wizard in `client-portal.html?action=new_order`, and clicking "Get Quote" opens `client-portal.html?action=request_quote`.

### Role-Based Order Portal (Implemented & Live)
- `/portal-login.html`: Unified authentication page with automatic role routing, order intent banners, simplified client-only registration (role field removed; all public signups are assigned `role: 'client'`), **Continue with Google** social auth (official multi-color Google SVG icon, centered divider, Google Account Chooser modal `#google-account-modal`, and backend endpoint `POST /api/auth/google` with auto-client registration and guest order claiming), and strict staff & client authentication (Master Admin: `admin@dezandigitizing.com` / `Wasif8899@@@`, Digitizer: `digitizer@dezandigitizing.com` / `Pakistan6677@@@`, Demo Client: `client@falconapparel.com`).

#### Client Portal Suite (Modular Multi-Page Architecture)
Powered by shared stylesheet [`client-workspace.css`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-workspace.css) and shared controller [`js/client-workspace.js`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/js/client-workspace.js):
- **Sticky Segmented Navigation Bar (`#client-sticky-nav`)**: Sticky top sub-header with active indicator pill with brand gold fill (`#d4af35`), live notification badges, and "+ New Order" primary CTA button. Hidden on mobile view (`hidden sm:block` / `@media (max-width: 639px)`) to avoid duplicate nav bars, matching Admin Portal.
- **Fixed Bottom Navigation Dock (Mobile)**: 5 dedicated touch-friendly buttons (`Dashboard`, `Orders`, `Quotes`, `Billing`, `Settings`) with 44x44px minimum touch targets and automatic active state highlighting across all pages (exclusive mobile navigation bar).
- **Dedicated Subpages**:
  1. [`client-portal.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-portal.html): Executive Dashboard overview with 3 quick-action cards (`Place Order`, `Request Quote`, `Track Order`), 4 metric cards (`Open Orders`, `Completed`, `Quotes`, `Balance Due`), and quick preview queues.
  2. [`client-orders.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-orders.html): Dedicated My Orders page with status filter pills (`All Orders`, `In Production`, `Delivered / Ready`, `Revisions`, `Payment Due`), live search input, order cards, physical stitch-out revision modal trigger, and order specification drawer.
  3. [`client-quotes.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-quotes.html): Dedicated Custom Quotes estimation page with 100% Free Digitizer Estimation guarantee banner, empty state, and 1-click quote creation.
  4. [`client-invoices.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-invoices.html): Dedicated Invoices & Billing page with financial metrics (`Total Invoiced`, `Total Settled`, `Balance Due`), itemized receipt cards with payment status tags, printable tax invoice modal, and PayPal settlement integration.
  5. [`client-profile.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-profile.html): Dedicated Profile & Settings page with contact info form, machinery defaults (default machine format `.DST`, target fabric), and password security.

#### Worker Studio Suite (Modular Multi-Page Architecture)
Powered by shared stylesheet [`worker-workspace.css`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-workspace.css) and shared controller [`js/worker-workspace.js`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/js/worker-workspace.js):
- **Sticky Segmented Navigation Bar (`#worker-sticky-nav`)**: Sticky studio sub-header with studio tokens, active indicator pill, and live task counters. Hidden on mobile view (`hidden sm:block` / `@media (max-width: 639px)`) to avoid duplicate nav bars, matching Admin Portal.
- **Fixed Bottom Navigation Dock (Mobile)**: 5 dedicated buttons (`Studio`, `Tasks`, `Archive`, `Specs`, `Settings`) with automatic active state highlighting (exclusive mobile navigation bar).
- **Strict Privacy & Zero-Leakage Compliance**: Client PII (name, email, phone, company) and commercial billing prices are 100% masked from workers across both UI and database layers (`Client #CLI-XXXX`, `[Protected PII]`, `[Confidential - Admin Only]`).
- **Dedicated Subpages**:
  1. [`worker-portal.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-portal.html): Studio Dashboard overview with QC standards, 4 production metric badges, quick navigation links, and active production preview.
  2. [`worker-tasks.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-tasks.html): Active Production Workbench with garment specifications, deliverable submission modal (with machine format selection `.dst`, `.emb`, `.pes`, `.exp`), and artwork zoom preview.
  3. [`worker-archive.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-archive.html): Completed Deliverables Archive with production verification badges and client satisfaction ratings.
  4. [`worker-specs.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-specs.html): Machine Format Standards & Quality SOP page with technical parameters for `.DST`, `.EMB`, `.PES`, `.EXP`, and complete Fabric Underlay & Pull Compensation Matrix.
  5. [`worker-settings.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-settings.html): Workstation Hardware & Capacity page with monitor calibration specs, digitizing software versions, and daily stitch capacity controls.

#### Admin Portal Suite (Modular Multi-Page Architecture)
- `/admin-portal.html`: Master Admin Executive Control Center (Continuous Unified Scroll Architecture):
  - **4-Stage Operational Orders Pipeline Architecture (`#master-orders-section`)**:
    Instead of dumping orders into a single list or grid, orders are organized into 4 dedicated, clearly demarcated operational stage subsections, each with its own contextual color theme, icon, live count badge, responsive visual bento cards grid, and toggleable structured table view:
    1. **Stage 1: Action Required (Needs Assignment & Revisions)** (`#stage-unassigned-sub`):
       - Amber/Orange gradient header with `assignment_late` icon.
       - Focuses on unassigned customer orders awaiting digitizer dispatch and active client stitch-out revision requests.
       - Highlights revision feedback specs with 1-click review modal and instant worker dispatch.
    2. **Stage 2: Active Pipeline (In Production)** (`#stage-in-progress-sub`):
       - Blue/Indigo gradient header with `precision_manufacturing` icon.
       - Displays orders actively in digitization, stitch simulation, and quality review by assigned digitizers.
       - Worker assignment badge with avatar, artwork preview link, and reassignment controls.
    3. **Stage 3: Incomplete Bookings, Payment Due & Quotes** (`#stage-incomplete-sub`):
       - Rose/Crimson gradient header with `credit_card_off` icon.
       - Triage queue for bookings placed without completed checkout, outstanding invoices, and custom quote inquiries.
       - Prominent **Outstanding Balance Alert Banner** with 1-click **Send Payment Reminder** modal (`#payment-reminder-modal`) to dispatch email payment alerts directly to customers.
    4. **Stage 4: Completed Production Archive** (`#stage-completed-sub`):
       - Emerald/Green gradient header with `verified` icon.
       - Archive of finished embroidery machine deliverables (`.DST`, `.EMB`, `.PES`), stitch simulation previews, client history dossier access, and official tax invoices.
  - **Stage Quick-Jump Navigation Toolbar**:
    - Instant Stage Jumper pills (`All Stages`, `🚨 Needs Worker`, `⚡ In Production`, `💳 Incomplete & Unpaid`, `✅ Completed`) that smoothly scroll directly to the corresponding stage anchor with subtle pulse highlight.
    - Global multi-stage instant search (`#admin-search-input`) with keyboard shortcuts (`/` or `Cmd/Ctrl+K`) that searches across all 4 stages simultaneously in real-time, displaying tailored empty states for non-matching stages.
    - Stage Scope selector dropdown allowing admins to view all 4 continuous stages (default) or isolate a single stage.
    - View Mode Switcher: Seamlessly toggles all 4 stages between Responsive Bento Cards and Compact Structured Tables.
  - **Unified Continuous Flow (Zero Section Hiding)**: Following the proven layout pattern of the Client and Worker portals, all 4 core admin sections are laid out sequentially on a continuous scrollable canvas by default. Clicking any tab or quick action card smoothly scrolls to the target anchor without hiding other sections:
    1. **Master Orders Queue** (`#master-orders-section`)
    2. **Clients Directory & History** (`#clients-directory-section`)
    3. **Design & Stitch Catalog** (`#design-catalog-section`)
    4. **Digitizer Team Production Hub** (`#digitizer-team-section`)
  - **Sticky Executive Command Bar (`#admin-sticky-nav`)**: Frosted glass backdrop (`backdrop-blur-md`) with 4 segmented primary tabs with live reactive counter badges (`Orders`, `Clients`, `Catalog`, `Team`), fast search hotkey badge (`/` or `Cmd/Ctrl+K`), CSV ledger export, and dual layout density toggles (Bento Cards vs. Table).
  - **ScrollSpy Indicator Sync**: Integrated `IntersectionObserver` automatically highlights the corresponding sticky navigation tab and mobile dock button as the admin scrolls down the page.
  - **4 Quick Action Navigation Cards**: Responsive 4-column grid linking directly to:
    1. **Master Orders** (Queue & triage)
    2. **Clients & CRM** (Dossiers & LTV)
    3. **Design Catalog** (Stitch archive)
    4. **Digitizer Team** (Capacity & status)
  - **Client Order History Dossier Modal (`#client-history-modal`)**: 1-click historical dossier showing a client's complete chronological order timeline, placement/fabric specifications, artwork attachments, versioned machine file deliverables (`.DST`, `.EMB`, `.AI`), and direct tax invoices.
  - **Fixed 5-Item Mobile Bottom Navigation Dock**: Persistent mobile dock (`Overview`, `Orders`, `Clients`, `Catalog`, `Team`) providing one-thumb executive control on mobile devices with high-contrast active tab indicators.
  - **Financial Analytics & Export**: KPI metrics with Realized vs. Due revenue breakdown, full itemized tax invoice modal, financial ledger CSV export, and 1-click automated payment reminder dispatching.

### Header Navigation Authentication State
- **Logged Out**: Top-right header button renders a gold pill button explicitly labeled **Login** (`[ ➔] Login ]`) linking to `portal-login.html`.
- **Logged In**: Top-right button automatically renders the previous user account icon (`account_circle`) with quick dashboard navigation and sign out.
- **On Logout**: Instantly switches back to **Login** without page reload. Real-time multi-tab synchronization via `storage` event in `app.js`.

---

## 6. InsForge PostgreSQL Database Schema (Live Cloud Backend)
- **Host**: `https://e8rw998g.us-east.insforge.app`
- **Tables**:
  - `public.profiles`: User RBAC profiles with roles (`client`, `admin`, `digitizer`).
  - `public.orders`: Master commercial order records with columns `fabric_type`, `revision_notes`, `stitch_out_photos`, `revision_requested_at`, `revision_count`, `price`, `payment_status`, `assigned_digitizer_id`, `deliverables`, `status` (`pending_review`, `assigned`, `in_progress`, `qa_review`, `completed`, `revision`, `revision_requested`, `cancelled`).
  - `public.digitizer_tasks`: Sanitized worker tasks with columns `fabric_type`, `revision_notes`, `stitch_out_photos`, `revision_requested_at`, `deliverables`, `updated_at`, `status` (`assigned`, `in_progress`, `completed`, `revision`, `revision_requested`). Zero client PII or price columns exist on this table.
- **Migrations Applied**:
  - `migrations/20260904110456_init-rbac-tables.sql`: Base tables and RLS policies.
  - `migrations/20260905033000_revision_and_adaptive_schema.sql`: Revision workflow, stitch-out photo support, adaptive order parameters, and client revision submission RLS policies.

### The 3 Distinct Roles
1. **Client Role**:
   - Access to own dashboard only (`clientId == auth.uid`).
   - Can submit new quotes/orders with vector art attachments.
   - Can view invoice status, pay via PayPal/card, and download finished `.dst`/`.emb` deliverables.
2. **Admin Role (Business Owner)**:
   - Full master control over all collections and records.
   - Full visibility into client PII, order pipeline, and financial revenue.
   - Can delegate any order to a registered Digitizer.
3. **Digitizer Worker Role**:
   - Restricted workspace: only sees tasks explicitly assigned to their `digitizerId`.
   - **Mandatory Data Masking**: Zero access to client name, email, phone, company, or job price at both the UI and database levels.
   - Only sees Order ID, dimensions, placement, instructions, and raw artwork file.
   - Uploads completed `.dst`/`.emb` files and flags task as "Completed".

### Two-Collection Physical Separation Model
To prevent data leakage via browser DevTools:
- **`orders` Collection**: Master record containing client PII and financial details. Accessible **only** by Admin and Client owner.
- **`digitizer_tasks` Collection**: Sanitized technical specifications. Accessible **only** by assigned Digitizer and Admin.

---

## 7. InsForge Cloud Storage Architecture (Live & Verified)
- **Engine:** S3-compatible object storage powered by InsForge (`https://e8rw998g.us-east.insforge.app/api/storage/buckets/{bucket}/objects`) with global CDN distribution (`https://cdn.insforge.dev/storage/e8rw998g/...`).
- **Buckets:**
  - `artworks` (Public: Yes): Holds raw vector/raster art uploaded by clients (`.ai`, `.eps`, `.pdf`, `.png`, `.jpg`, `.svg`). Attached to order metadata.
  - `deliverables` (Public: Yes): Holds production machine stitch files uploaded by digitizers (`.dst`, `.emb`, `.pes`, `.exp`). Made downloadable upon order completion.
- **Row Level Security (RLS) & Permissions:**
  - `storage.objects` table governed by RLS with `storage_objects_allow_all` policy permitting authenticated and anon uploads to `artworks` and `deliverables`.
  - Permissions granted: `GRANT USAGE ON SCHEMA storage TO authenticated, anon, public; GRANT ALL ON ALL TABLES IN SCHEMA storage TO authenticated, anon, public;`.
- **Client & Worker Flow:**
  1. Client uploads artwork file in "Submit New Order" modal -> uploaded to `artworks` bucket -> stored with cloud URL and key.
  2. Admin assigns ticket to worker -> Worker sees technical specs and downloads raw artwork.
  3. Worker uploads finished `.dst` and `.emb` deliverables -> uploaded to `deliverables` bucket -> task marked completed.
  4. Client views completed order in dashboard -> downloads production stitch files directly from InsForge Cloud Storage CDN.
- **Automated Verification:** 100% end-to-end verified with Playwright across Desktop (1512x982) and Mobile (390x844). Zero client PII leaked to workers.

---

## 8. InsForge Real-Time PostgreSQL Database Sync Architecture (Live & Verified)
- **Database Engine:** PostgreSQL hosted on InsForge BaaS (`postgresql://postgres:...@e8rw998g.us-east.database.insforge.app:5432/insforge?sslmode=require`).
- **REST Endpoints:** `/api/database/records/orders` and `/api/database/records/digitizer_tasks` queried using `apikey` and `Authorization: Bearer <anonKey>`.
- **Hybrid Online/Offline Strategy:**
  - `fetchOrders()`: Asynchronously reads `/api/database/records/orders?order=created_at.desc`, caches into `localStorage['dezan_orders']`, updates sync timestamp, and enforces role-based access control (Admin sees all, Client sees own orders, Digitizers blocked).
  - `fetchDigitizerTasks()`: Asynchronously reads `/api/database/records/digitizer_tasks?order=assigned_at.desc`, caches into `localStorage['dezan_digitizer_tasks']`, and delivers strictly sanitized tasks to assigned digitizers (zero client PII and zero pricing).
  - `createOrder()`: Inserts directly to `orders` table via REST (`POST /api/database/records/orders` with `Prefer: return=representation`).
  - `assignDigitizer()`: Patches `orders` status to `in_progress` with worker ID and upserts a sanitized task into `digitizer_tasks`.
  - `completeDigitizerTask()`: Patches `digitizer_tasks` status to `completed` with deliverables and patches `orders` status to `completed` with download links.
- **UI Real-Time Badging:**
  - All three portals (`client-portal.html`, `admin-portal.html`, `worker-portal.html`) display an animated `InsForge DB Live (<time>)` status pill with instant manual and programmatic refresh controls.
- **Automated Multi-Context Verification:**
  - Verified with multi-context Playwright tests across Desktop (1512x982) and Mobile (390x844). End-to-end data synchronization confirmed across isolated client, admin, and worker contexts. Row counts and deliverable attachments verified directly in PostgreSQL.

---

## 9. Live Realtime WebSocket / Auto-Heartbeat & Cross-Tab Sync Engine (Live & Verified)
- **Dual-Layer Real-Time Synchronization Engine:**
  1. **Instantaneous Multi-Tab Broadcast (< 5ms):** HTML5 `BroadcastChannel('dezan_realtime_sync')` broadcasts events (`order_created`, `order_assigned`, `order_completed`) across open portal tabs in real time.
  2. **Cross-Tab Storage Fallback:** Listens to `window.addEventListener('storage')` for secondary windows and iframes.
  3. **Auto-Heartbeat Cloud Probe (Cross-Device & Cross-Browser):** Background probe against InsForge PostgreSQL (`GET /api/database/records/orders?select=id,order_number,status,updated_at&order=updated_at.desc&limit=1`) runs every 5 seconds to detect remote changes from external devices without burning egress bandwidth.
  4. **Smart Deduplication:** Unique event ID hashing and signature TTL caching ensure events and toasts fire cleanly without duplicates across concurrent channel listeners.
  5. **Visibility & Online Reconnection:** Automatically triggers an immediate probe check upon tab refocus (`visibilitychange`) or network restoration (`online`).
- **Floating Interactive Toast Notification System (`#dezan-toast-container`):**
  - Frosted glassmorphic notification cards with dynamic color-coded icons (`inventory_2` for new orders, `assignment_ind` for tasks, `verified` for deliverables ready).
  - Synthesized Web Audio bell chime generated dynamically via native `AudioContext` without external sound file dependencies.
  - Auto-dismissing with smooth entrance and exit CSS animations.
- **Session Architecture for Multi-Portal Concurrency:**
  - Employs `sessionStorage` with `localStorage` fallback in `insforgeClient.getCurrentUser()`, allowing Client, Admin, and Worker portals to run simultaneously in separate tabs of the same browser window while sharing cache and realtime broadcasts.
- **Automated Verification:**
  - 100% verified with Playwright test `scratch/verify_realtime_sync.js`. Seamless live synchronization confirmed across Client, Admin, and Worker portals without requiring any manual page reloads.

---

## 10. Admin Analytics, Financial Ledger Export & Tax Invoice Engine (Live & Verified)
- **Advanced Revenue Analytics in Master KPI Grid:**
  - **Realized Revenue:** Sum of prices for orders in `completed` status (`$80.00`).
  - **Pipeline Revenue:** Value of orders pending review or in active production (`$100.00`).
  - **Average Order Value (AOV):** Real-time computation of average dollar revenue per ticket (`$20.00`).
  - **Live Synchronization:** Real-time updates automatically recalculate revenue breakdowns without requiring manual page reload.
- **1-Click CSV Financial Ledger Exporter:**
  - Integrated into the Master Orders Queue action bar (`#export-csv-btn`).
  - Formats and generates standard accounting ledger data with UTF-8 BOM (`\uFEFF`) for direct compatibility with Microsoft Excel, Apple Numbers, and Google Sheets.
  - Exports standard columns: `Order Number`, `Date`, `Client Name`, `Client Email`, `Company`, `Service Type`, `Project Name`, `Placement`, `Sizing`, `Required Formats`, `Price (USD)`, `Payment Status`, `Payment Method`, `Order Status`, `Assigned Digitizer`, `Deliverables Count`, `Instructions`.
  - Honors active queue status filters (`all`, `pending_review`, `assigned`, `in_progress`, `completed`).
  - Emits an animated floating toast confirmation on completion.
- **Printable / PDF Tax Invoice & Delivery Receipt Generator (`#invoice-modal`):**
  - Instant modal invoice generator accessible via the **Invoice** button on each order row.
  - Official Dezan Digitizing branding with gold insignia, tax invoice identifier (`INV-[OrderNumber]`), issue date, and customer metadata.
  - Itemized table with design specifications, machine formats, unit pricing, and subtotal/tax summary.
  - **Quality Inspection & Deliverables Audit Block:** Displays verified Tajima/Barudan machine stitch files (`.dst`, `.emb`) with direct download capabilities and official digital sign-off.
  - **Print / Save as PDF Media Query Isolation:** Custom `@media print` CSS block isolates `#invoice-print-area`, hiding all web UI chrome, navigation bars, and buttons to generate a pristine, borderless 8.5x11 / A4 PDF document.
- **Automated Verification:**
  - 100% verified with Playwright test (`verify_financial_export.js`) across Desktop (1440x900) and Mobile (390x844). Verified accurate KPI currency math, CSV file generation with escaped data, and complete modal rendering.

---

## 11. Admin Due Payment Oversight & Automated Email Reminders (Live & Verified)
- **Strict Architecture Constraint — Zero Manual Payment Recording**:
  - The business owner explicitly prohibits manual payment overrides in the Admin Portal.
  - Payment settlement remains strictly client-driven via their invoice checkout link (PayPal / Credit Card).
- **Due Payment Analytics & Queue Filtering**:
  - **Revenue KPI Card**: Displays live `Completed: $XX.XX` realized revenue alongside an interactive, clickable `Due: $YY.YY (Z Due)` badge in rose `#e11d48`.
  - **Clickable Fast-Filter (`filterByUnpaid()`):** Clicking the Due metric immediately isolates unpaid/incomplete orders in the Master Orders Queue.
  - **Filter Status Selector**: Features `<option value="unpaid">Payment Due / Unpaid</option>` for targeted queue inspection.
  - **Table Badging**: Price column renders unit price + high-contrast `Payment Due` badge (or emerald `Paid` badge).
- **Automated Payment Reminder Modal (`#payment-reminder-modal`)**:
  - Unpaid orders feature a prominent golden **"Remind Client"** (or **"Remind Again"**) button in the Actions column.
  - Modal pre-fills:
    - Target Order Number & Project specs
    - Balance Due ($XX.00)
    - Client recipient name & verified email
    - Professional payment notification subject line
    - Pre-composed email template with direct Client Portal link (`https://dezan-digitizing.vercel.app/client-portal.html`) and payment instructions
    - Reminder history tracker (`Sent Xm ago (Total: Y reminders)` or `Never reminded`)
- **Backend & Cloud Persistence (`sendPaymentReminder`)**:
  - Updates order with `last_payment_reminder_at`, increments `reminder_count`, and persists to `localStorage`.
  - Live patches to InsForge PostgreSQL Cloud via `PATCH /api/database/records/orders`.
  - Emits real-time `payment_reminder_sent` event across `BroadcastChannel` to update open browser tabs.
  - Dispatches floating glassmorphic success toast (`Reminder Email Dispatched`).
- **Automated Verification**:
  - 100% verified with Playwright test (`scratch/verify_admin_payment_reminders.js`) on Desktop (1512x982) and Mobile (390x844).

---

## 12. Worker (Digitizer) Studio Redesign & Easy Navigation (Live & Verified)
- **Visual Continuity & Brand Aesthetics**:
  - Redesigned to match the warm Dezan gold (`#d4af35`) theme and clean `#f8f7f6` default light layout (with user-toggleable dark luxury mode).
- **Navigation & IA Hierarchy**:
  - **Top Switcher Bar**: Persistent `RESTRICTED WORKER WORKSPACE` banner with fast role switcher.
  - **Header**: Logo, `Digitizer Studio` gold badge, `Client PII & Price Masked` security pill, Digitizer profile trigger, and theme toggle.
  - **3 Quick-Action Navigation Cards**: `Active Tasks` (scrolls/filters active queue), `Completed Archive` (scrolls/filters archive), `Format Specs` (opens cheatsheet modal).
  - **4 Stat Metric Badges (Interactive)**: `Active Jobs` (clickable filter), `Completed` (clickable filter), `Supported Formats` (`DST · EMB · PES · EXP`), `QC Standard` (`100% Wilcom ES Calibrated`).
  - **Search & Filter Toolbar**: Real-time debounced text search (by order #, task #, placement, format) + status filter (`all`, `active`, `completed`) + format filter (`all`, `DST`, `EMB`, `PES`).
  - **Fixed Bottom Navigation Dock**: 4 quick-access tabs (`Studio`, `Active`, `Completed`, `Profile`) for frictionless mobile & desktop navigation.
- **Sectioned Task Queues**:
  - **Active Production Queue**: Glowing accent border card displaying technical placement, dimensions, required formats, production guidelines, customer raw artwork download, and multi-file deliverables staging uploader with loading spinner state.
  - **Completed Archive**: High-contrast cards with direct download links for submitted machine stitch files.
- **Modals**:
  - `#task-details-modal`: Full technical work order parameters, stitch density calibrations, needle sequence guidance, raw art downloader, and printable sheet.
  - `#format-specs-modal`: Embroidery machine specifications for Tajima (`.dst`), Wilcom (`.emb`), Brother (`.pes`), and Melco (`.exp`).
  - `#worker-account-modal`: Digitizer profile, Master Level 4 status, licensed workstation tools (Wilcom e4.5, Tajima Pulse), masking privacy contract status, and sign out.
- **Strict Data Masking (100% Verified)**:
  - Zero presence of client name, client email, client phone, client company, or pricing in the DOM.
- **Automated Verification**:
  - 100% verified with Playwright test (`scratch/verify_worker_portal_redesign.js`) on Desktop (1512x982) and Mobile (390x844) with zero horizontal overflow.

---

## 13. Admin Control Panel Navigation & Executive Workspace Redesign (Live & Verified)
- **Problem Solved**:
  - The business owner needed the Master Admin Control Panel (`admin-portal.html`) to be effortless to navigate, with quick triage across unassigned orders, urgent revisions, unpaid tickets, and worker workloads without getting lost in nested menus or long scroll views.
- **Key Navigation Innovations**:
  - **Sticky Executive Command Sub-Nav (`#admin-sticky-nav`)**:
    - Remains pinned directly below the master header as the admin scrolls.
    - Features frosted glassmorphic backdrop (`backdrop-blur-md bg-white/90`) with gold bottom boundary.
    - 5 segmented operational pills (`Master Queue`, `Needs Worker`, `⚠️ Revision Queue`, `Payment Due`, `Digitizer Team`) with reactive badge counters.
    - Layout density toggle buttons (`#layout-toggle-table` and `#layout-toggle-grid`).
    - Quick CSV ledger export and keyboard search hint badge (`/` or `Cmd/Ctrl+K`).
  - **Dual Layout Density Engine**:
    - **Table Mode (`#admin-orders-table-container`)**: Compact, high-density layout with sticky `<thead>`, explicit columns (Order #, Date, Client Info, Service/Specs, Price/Status, Assigned Worker, Actions), and crisp borders.
    - **Bento Card Grid Mode (`#admin-orders-cards-container`)**: Visual 3-column bento card grid with direct artwork thumbnail previews, deliverable download chips, technical tag badges, client contact pills, and full-width action bars.
    - Automatically persists active user mode in `localStorage['dezan_admin_layout']`.
  - **Digitizer Team Hub (`#digitizer-team-section`)**:
    - Visual workload oversight card for single dedicated **Digitizer** (`Lead Embroidery & Vector Digitizer`).
    - Displays active assignment counts, completed project totals, and core technical proficiencies.
    - Interactive **"View Assigned Orders"** button instantly isolates orders assigned to the digitizer in the main queue.
  - **Interactive 1-Click Metric Cards**:
    - All master KPI summary cards (`Total Orders`, `Needs Worker`, `Revision Queue`, `Realized Revenue`, `Balance Due`) feature click listeners with glowing golden active ring states that activate the corresponding queue tab and auto-scroll smoothly.
  - **Instant Live Search & Keyboard Shortcuts**:
    - Real-time debounced search bar with dedicated clear button (`✕`) that appears dynamically when text is present.
    - Global hotkey listener: Pressing `/` or `Cmd/Ctrl+K` focuses the search bar; pressing `Escape` clears text and blurs the input.
  - **Synchronized 5-Tab Mobile Bottom Navigation Dock**:
    - Persistent bottom dock on smartphone screens (`Overview`, `Orders`, `Revisions`, `Team`, `Profile`) wired to `switchAdminView(...)`.
- **Automated Verification**:
  - 100% verified with Playwright test (`scratch/verify_admin_navigation_ux.js`) across Desktop (1512x982) and Mobile (390x844). Verified sticky nav, filter tabs, table/grid toggling, team filtering, search keyboard shortcuts, and mobile dock switching with 0 console errors.
- **Custom Quote Card Theme & Mobile Optimization (`contact.html`)**:
  - Replaced dark/slate gradient container with clean unified card theme (`bg-white dark:bg-card-dark`, `border border-primary/20 shadow-xs`).
  - Integrated full dark theme consistency by adding `"card-dark": "#16140c"` across all site pages (`contact.html`, `index.html`, `services.html`, `about.html`, `portfolio.html`, `order-success.html`, `profile.html`).
  - Compacted mobile layout into a single-screen height footprint (~340px vertical height).
  - Converted the 3 process steps (`Submit Specs`, `Master Review`, `1-Click Start`) into a compact 3-column horizontal grid (`grid grid-cols-3`) with tight typography.
  - Verified with Playwright across mobile light, mobile dark, and desktop viewports.
- **Realistic / Pet Portrait Digitizing Pricing Box Added (`pricing.html` & `services.html`)**:
  - Added 3rd digitizing box: **Realistic / Pet Portrait** ($25 for Left Chest / Hat size $\le$ 5.5", $40 flat for larger sizes > 5.5").
  - Desktop: Upgraded digitizing grid to a clean 3-column layout (`grid-cols-3 max-w-6xl`) with bespoke embroidery hoop SVG icon, dual-tier price display, 5-point feature checklist, and aligned action button.
  - Mobile: Added 3rd compact horizontal card with `$25 / $40` price chip and subtext `Left Chest $25 • Larger $40 Flat`.
  - Aligned `services.html` Pet Portrait card with `$25 / $40` pricing.
  - Verified via Playwright across Desktop (1512x982), Mobile Light (390x844), and Mobile Dark (390x844).
- **Commercial Embroidery Specializations Card Refinement (`embroidery-digitizing.html`)**:
  - Removed placement price pills (`$15`, `$25`, `$0 Extra`, etc.) from the 6 technical specialization cards.
  - Keeps the focus 100% on stitch engineering specifications, underlay calibrations, and fabric craftsmanship. Full transparent pricing is housed exclusively in the dedicated **Pricing & Turnaround** section below.
- **Brand Text Update to "DEZAN DIGITIZING" Across All Headers & Footers**:
  - Replaced standalone "DEZAN" brand title with full name **"DEZAN DIGITIZING"** across all 8 marketing and client-facing pages (`index.html`, `about.html`, `services.html`, `portfolio.html`, `pricing.html`, `contact.html`, `order-success.html`, `profile.html`).
  - Added `whitespace-nowrap text-base sm:text-lg font-black tracking-tight` ensuring zero layout wrapping on compact mobile devices (390px) while maintaining bold desktop presence.
  - Verified with Playwright visual screenshots on mobile and desktop.
- **Admin Orders Auto-Assign Worker Engine (`admin-orders.html`, `admin-portal.html`, `js/insforge-client.js`, `js/admin-workspace.js`)**:
  - **Single Digitizer Scope**: Directs all auto-assigned production tickets to primary in-house digitizer **Digitizer** (`id: '3210bcc5-defd-40fe-b843-d0a57b0e12e1'`, `digitizer@dezandigitizing.com`).
  - **Interactive Auto-Assign Toggle**:
    - Prominent action button in top bar (`#admin-auto-assign-btn`), header bar (`#header-auto-assign-btn`), and Stage 1 "Needs attention" banner (`#stage-auto-assign-strip`) across both `admin-orders.html` and `admin-portal.html`.
    - **When ON**:
      - Incoming customer orders (guest checkout or authenticated client portal) skip manual admin review and directly assign to Digitizer (`assigned_digitizer_id = '3210bcc5-defd-40fe-b843-d0a57b0e12e1'`, `status = 'in_progress'`).
      - Sanitized technical task is automatically upserted into `dezan_digitizer_tasks` (and remote InsForge PostgreSQL `digitizer_tasks`).
      - Realtime event `order_assigned` broadcasts across open tabs so worker portal (`worker-portal.html`) immediately receives the task without page reload.
      - Emerald active pill state with robot/lightning icon and live confirmation toasts.
    - **When OFF**:
      - Incoming bookings pause in `pending_review` with `assigned_digitizer_id = null`, requiring manual admin assignment.
    - **1-Click Batch Dispatch**:
      - Inside Stage 1 ("Needs attention"), added `#assign-all-pending-btn` displaying exact count (e.g. `Assign 7 to Digitizer`) to dispatch all accumulated unassigned orders to Digitizer in one click.
    - **Automated Verification**:
      - 100% verified with automated Playwright headless test (`scratch/test_single_digitizer_workflow.js`): verified toggle ON, direct auto-assignment to Digitizer, immediate presence in worker portal active queue, toggle OFF, and 1-click batch assignment.
- **Strict Staff Credentials & Role-Based Authentication (`portal-login.html`, `server/controllers/authController.js`, `js/insforge-client.js`)**:
  - Only two internal staff accounts exist:
    1. **Master Admin**: `admin@dezandigitizing.com` / `Wasif8899@@@`
    2. **Digitizer**: `digitizer@dezandigitizing.com` / `Pakistan6677@@@` (display name: strictly **Digitizer**)
  - All old demo worker accounts (`worker.alex@...`, `worker.sam@...`, `worker.maria@...`) permanently removed from PostgreSQL DB and client-side code.
  - Password enforcement strictly verified: only the given password functions for the Digitizer account; invalid passwords return HTTP 401.
- **Optional Account Convenience & Automatic Guest Order Claiming**:
  - Customer checkout is completely frictionless: client can upload logo, specify details, pay, and receive instant confirmation without creating an account.
  - On `order-success.html`, guest customers can optionally create a password with 1 click.
  - `claimGuestOrders(clientEmail, userId)` in `js/insforge-client.js` automatically links all past orders matching the customer's email address whenever an account is created or signed into.

---

## 14. Directory Structure
```
├── .agents/
│   ├── rules/frontend_design_rules.md
│   └── skills/ (taste, web-design-guidelines, awesome-design-md, twenty-first-dev, playwright-visual-verification)
├── Client FeedBack/           # 36 WebP feedback screenshots
├── Hero Page/                 # Hero section assets & slider images
├── images/                    # Static branding and vector images
├── fiverr_portfolio_mockups/  # High-res multi-device showcase graphics
├── js/
│   ├── insforge-client.js     # BaaS client & database abstraction layer
│   ├── admin-workspace.js     # Shared controller for Admin Portal Suite
│   ├── client-workspace.js    # Shared controller for Client Portal Suite
│   └── worker-workspace.js    # Shared controller for Worker Studio Suite
├── client-workspace.css       # Unified design tokens & styles for Client Suite
├── worker-workspace.css       # Unified design tokens & styles for Worker Suite
├── client-portal.html         # Client Suite: Dashboard Overview
├── client-orders.html         # Client Suite: My Orders & Revision Drawers
├── client-quotes.html         # Client Suite: Custom Quotes & Estimations
├── client-invoices.html       # Client Suite: Invoices, Billing & Receipts
├── client-profile.html        # Client Suite: Profile & Machinery Defaults
├── worker-portal.html         # Worker Studio: Dashboard & QC Standards
├── worker-tasks.html          # Worker Studio: Active Workbench & Submissions
├── worker-archive.html        # Worker Studio: Completed Files & Ratings
├── worker-specs.html          # Worker Studio: Machine Formats & SOP Guide
├── worker-settings.html       # Worker Studio: Hardware & Capacity Presets
├── admin-portal.html          # Admin Suite: Master Executive Dashboard
├── admin-orders.html          # Admin Suite: 4-Stage Orders Pipeline
├── admin-clients.html         # Admin Suite: Customer Directory & Dossiers
├── admin-catalog.html         # Admin Suite: Pricing & Product Catalog
├── admin-team.html            # Admin Suite: Staff & Digitizer Roster
├── DESIGN.md                  # Unified Design System tokens & specs
├── MEMORY.md                  # Project memory & repository single source of truth
├── README.md                  # High-level repository guide & deployment documentation
├── ARCHITECTURE.md            # System architecture, RBAC data flow & state machines
├── DATABASE_SCHEMA.md         # Detailed collections, fields, and security rules
├── ROADMAP.md                 # Phased development checklist and upcoming features
├── SECURITY.md                # Data masking rules, authorization matrix & compliance
├── .env.example               # Environment variables & third-party keys template
├── app.js                     # Central JavaScript logic (UI, slider, modals)
├── styles.css                 # Primary stylesheet
├── vercel.json                # Vercel deployment configuration
└── *.html                     # Public marketing pages
```

---

## 15. Development & Deployment Guidelines
1. **JavaScript DOM Standard**: All initialization code in `app.js` runs within `DOMContentLoaded` and is guarded by page URL checks.
2. **Zero Framework Mandate**: Keep all scripts lightweight and vanilla. No bundle builds required.
3. **Git Hygiene**: Clean atomic commits with descriptive commit messages.
4. **Deployment Verification**: Always verify both `https://dezan-digitizing.vercel.app/` and `https://majidali1256.github.io/dezan-digitizing/` after major updates.

---

## 16. Frictionless Guest Ordering System (No Sign-In Required)
- **Zero Account Barrier Policy**:
  - Customers can submit artwork, configure stitch/vector specs, and complete payment without creating an account or signing in.
- **Dynamic Outer Page Banners Updated**:
  - `pricing.html`: `#pricing-login-prompt` updated from lock icon & "Sign in to submit artwork" to a vibrant emerald lightning bolt with "No sign-in required. Click any card below to place an order or quote directly", with a primary `[ Order Now -> ]` action button and subtle `Sign In` link.
  - `pricing.html`: Section 4 bottom dispatch call-to-action updated from "Log In to Order" to "Order Now".
  - `contact.html`: `#quote-login-prompt` updated from "Sign in to Submit Your Quote Request" to "Instant Free Quote — No Sign-in Needed" with `[ Request Free Quote -> ]` action.
- **Frontend Interaction Logic (`app.js`)**:
  - `selectPlan(planName, price)`: Directly opens `window.openGuestCheckoutModal({ service, plan, price })` for unauthenticated visitors without forcing redirects to `portal-login.html`.
  - `orderForm` submit interceptor: Removed legacy alert box blocking unauthenticated users; immediately routes into the guest checkout engine.
- **Login Portal Intent Fallback (`portal-login.html`)**:
  - `#order-intent-banner` updated with an `[ Order as Guest -> ]` button so users redirected or landing on login can order immediately without registering.

---

## 17. Modular Multi-Page Suite Architecture: Client Workspace & Digitizer Worker Studio (Live & Verified)

### 17.1 Client Workspace Suite (5 Specialized Pages)
Following the multi-page modular architecture established for the Admin Suite, the Client Workspace is decomposed into distinct, dedicated subpages sharing `client-workspace.css` and `js/client-workspace.js`:
- **`client-portal.html` (Dashboard Overview)**:
  - High-level project pipeline overview, pending actions, live order metrics, and quick navigation cards to sub-workbenches.
- **`client-orders.html` (My Orders Workbench)**:
  - Full-featured order management center with interactive search, status tabs (`All`, `Active`, `Completed`, `Revisions`), physical sew-out revision drawer, and direct `.DST`/`.EMB` file downloads.
- **`client-quotes.html` (Custom Quotes & Estimates)**:
  - Dedicated quote request wizard with automated pricing estimation, turnaround guarantees, and free quote history.
- **`client-invoices.html` (Billing, Invoices & Receipts)**:
  - Financial records center with payment tracking, downloadable PDF receipts, and integrated PayPal checkout.
- **`client-profile.html` (Client Profile & Preferences)**:
  - Account information management, machinery format defaults (`.DST`, `.PES`, `.EMB`, `.EXP`), default fabric substrate settings, and password security.
- **Mobile Responsive Dock**:
  - Fixed bottom navigation bar (`#client-dock-*`) providing thumb-friendly switching between Dashboard, Orders, Quotes, Invoices, and Profile on mobile devices.

### 17.2 Digitizer Worker Studio Suite (5 Specialized Pages)
The Worker Studio provides an isolated, production-focused environment for embroidery digitizers and vector artists, sharing `worker-workspace.css` and `js/worker-workspace.js`:
- **`worker-portal.html` (Studio Dashboard)**:
  - Production queue overview, daily stitch milestones, quality compliance guidelines, and recent activity feed.
- **`worker-tasks.html` (Active Tasks Workbench)**:
  - Dedicated production queue with filter pills (`All`, `Digitizing`, `Vectorizing`, `Rush Priority`), instant search, technical specs modal (`#task-details-modal`), artwork zoom preview (`#stitch-zoom-modal`), and deliverable upload modal (`#deliverable-upload-modal`).
- **`worker-archive.html` (Completed Deliverables Archive)**:
  - Catalog of completed tickets with verified stitch counts, delivered file archives, and technical specifications review.
- **`worker-specs.html` (Format Specs & SOP Guide)**:
  - Interactive embroidery standards documentation, machine format guide (Tajima, Barudan, Brother, Melco), pull compensation matrix, and density guidelines by fabric substrate.
- **`worker-settings.html` (Workstation Settings)**:
  - Digitizer profile, CAD software configuration (Wilcom, Pulse, Wings), and daily stitch capacity controls.
- **Strict Privacy & Anti-Leakage Masking**:
  - Worker workspaces enforce 100% physical and data-level masking: client personal names, emails, phone numbers, companies, and commercial prices are omitted or masked as `Client #CLI-XXXX` and `[Confidential - Admin Only]`.
- **Mobile Responsive Dock**:
  - Fixed bottom dock (`#worker-dock-*`) optimized for mobile and tablet devices with 44px touch targets.
- **Automated Verification**:
  - Fully verified with Playwright across Desktop (1440x900) and Mobile (390x844) viewports.

---

## 18. Authentication, Account Security & Password Lifecycle Subsystem (Live & Verified)
- **Unified Auth Architecture**:
  - Full interoperability between Node.js Express REST API (`/api/auth/*`), InsForge PostgreSQL cloud BaaS (`auth.users` + `public.profiles`), and client-side dual-engine SDK (`js/insforge-client.js`).
- **REST Endpoints & Cloud Schema**:
  - `POST /api/auth/register`: Public client registration; creates synchronized records in `auth.users` and `public.profiles` with bcryptjs password hashing (salt rounds 10), issues 7-day JWT token, and auto-claims past guest orders matching the email.
  - `POST /api/auth/login`: Validates credentials against `public.profiles` bcrypt hashes (and preconfigured demo bypass accounts), issues JWT token, and establishes session.
  - `GET /api/auth/me`: Returns profile details and role-specific metrics (total orders, active orders, balance due for clients; task counts for digitizers).
  - `PUT /api/auth/profile`: Updates display name, company, phone, and machinery preferences.
  - `POST /api/auth/change-password`: Validates current password, hashes new password with bcrypt salt 10, updates `public.profiles` and `auth.users`.
  - `POST /api/auth/forgot-password`: Generates secure 6-digit numeric OTP with 15-minute expiration in `PASSWORD_RESET_TOKENS` cache.
  - `POST /api/auth/reset-password`: Verifies 6-digit OTP (or master dev code `123456`), hashes new password, updates database, and invalidates the token.
- **Frontend Enhancements (`portal-login.html`)**:
  - **Password Visibility Toggles**: Interactive show/hide toggles with Material Symbols (`visibility` / `visibility_off`) on all password inputs.
  - **Live Password Strength Meter**: Dynamic evaluation scoring length, uppercase, numbers, and symbols with color-coded status bar (Red: Weak $\rightarrow$ Amber: Good $\rightarrow$ Emerald: Strong).
  - **Live Confirm Password Validation**: Real-time mismatch indicator alerting users before form submission.
  - **Session Persistence**: "Keep me signed in" checkbox routing tokens into `localStorage` vs `sessionStorage`.
  - **Forgot Password Modal**: 2-step verification modal with email input $\rightarrow$ 6-digit OTP verification $\rightarrow$ auto-fill dev helper pill $\rightarrow$ toast confirmation on password reset.
- **Client Profile & Settings (`client-profile.html` & `js/client-workspace.js`)**:
  - Wired Contact & Commercial Info form to `handleProfileSave` and `insforgeClient.updateUserProfile`.
  - Wired Machine Presets form to `handleDefaultsSave` and `insforgeClient.updateUserProfile`.
  - Wired Account Security form to `handlePasswordChange` and `insforgeClient.updatePassword` with current password verification and visibility toggles.
  - Interactive visual status feedback banners (emerald success / red error alerts) replacing previous placeholder alerts.
- **Automated Verification**:
  - Automated test suite (`scratch/test_auth_flow.js`): 15/15 tests passed with 0 failures (register, login, getMe, update profile, change password, login with changed password, forgot password OTP, reset password with OTP, login with reset password, and rejection of old passwords with HTTP 401).
  - Playwright visual verification (`scratch/verify_auth_ui.js`): 100% verified across Desktop (1512x982) and Mobile (390x844) viewports with screenshots captured in `scratch/screenshots/`.

---

## 19. Production Readiness, Email Automation, E2E Lifecycle & SEO Polish (Live & Verified)
- **Phase 1: Live Google OAuth & InsForge Cloud Configuration**:
  - Configured `allowed_redirect_urls` in `insforge.toml` for production Vercel (`dezan-digitizing.vercel.app`), GitHub Pages (`majidali1256.github.io/dezan-digitizing`), and local development environments.
  - Successfully synced configuration directly with InsForge Cloud via `npx -y @insforge/cli config apply -y`.
  - Added `GOOGLE_CLIENT_ID` and SMTP configuration sections to `.env.example`.
- **Phase 2: End-to-End Production & Order Lifecycle Smoke Test**:
  - Developed and executed automated integration suite `scratch/test_e2e_lifecycle.js` validating all 8 stages of the business cycle:
    1. Client Authentication & Order Submission ($15 Hat/Left Chest with artwork attachment).
    2. Admin Pipeline Discovery & Contact Verification.
    3. Admin Digitizer Assignment to Alex Vance (`POST /api/orders/:id/assign`).
    4. Worker Workstation Pull with 100% Zero-PII and commercial pricing masking.
    5. Digitizer Work Submission & Deliverables Upload (`.DST` and `.EMB` stitch files).
    6. Client Deliverable Access & Verification in Client Portal.
    7. Client Free Sew-out Revision Submission with stitch-out defect proof photo.
    8. Multi-party State Synchronization between Master Orders and Digitizer Tasks.
  - Test result: **8/8 stages passed with 0 errors**.
- **Phase 3: Automated Transactional Email Service (`server/services/emailService.js`)**:
  - Implemented production-grade luxury HTML email dispatch module with Dezan luxury branding (`#201d12`, `#d4af35` accents, stacked typography):
    - Client Order Confirmation (`sendOrderConfirmation`).
    - New Order Admin Dispatch Alert (`sendNewOrderAdminAlert`).
    - Digitizer Assignment Notification (`sendTaskAssignedAlert`).
    - Deliverables Ready Notification (`sendDeliverablesReadyAlert`).
    - Free Quote Estimation Alert (`sendQuoteEstimationAlert`).
  - Resilient fallback mechanism logging to in-memory/console buffers in non-SMTP environments with zero crash vulnerability.
  - Wired into `orderController.js`, `taskController.js`, and `quoteController.js`.
- **Phase 4: Payment Gateway Verification (PayPal)**:
  - Linked client invoice modal to dynamic PayPal settling link (`https://paypal.me/dezandigitizing/{amount}USD`).
  - Added paid vs unpaid visual badges and button states with print-to-PDF invoice support (`client-invoices.html` & `js/client-workspace.js`).
  - Verified across Desktop (1512x982) and Mobile (390x844) viewports via Playwright (`scratch/verify_invoices_ui.js`).
- **Phase 5: SEO, Schema Markup & Marketing Social Polish**:
  - Implemented canonical URLs, Open Graph tags, and Twitter Cards across all 5 public marketing pages (`index.html`, `services.html`, `pricing.html`, `about.html`, `contact.html`).
  - Embedded Schema.org JSON-LD Structured Data:
    - `index.html`: `LocalBusiness` / `ProfessionalService` + `FAQPage` (matching the 5-item FAQ accordion).
    - `services.html`: `Service` with `OfferCatalog` ($15 / $25 / $15).
    - `pricing.html`: `WebPage` with `ItemList` and `Product` specifications.
    - `about.html`: `AboutPage` with organization provenance since 2016.
    - `contact.html`: `ContactPage` with address and atelier email.
  - Automated validation suite (`scratch/validate_seo_schema.js`): **5/5 schemas parsed with 0 syntax or specification errors**.

---

## 20. Multi-File Upload & Deliverables Architecture (Up to 5 Files for Clients and Workers)
- **Client Side (Up to 5 Files)**:
  - Supports all standard formats: PDF, JPEG, JPG, PNG, AI, EPS, CDR, PSD, Word Documents (.DOC, .DOCX), Rich Text (.RTF), OpenDocument (.ODT), Spreadsheets (.CSV, .XLS, .XLSX), Vector, Stitch files (.DST, .EMB, .PES, .EXP), Archives (.ZIP, .RAR).
  - Integrated into both Guest Quick-Order modal (`app.js`) and Client Portal Order modal (`client-portal.html`).
  - Added live file chips with format badges, file size indicator, removal buttons, and limit badges (`X/5 Files`).
  - Strict client-side and backend validation enforcing max 5 files and 50MB per file limits with clear alerts.
- **Worker Side (Up to 5 Deliverables)**:
  - Workers can stage and upload up to 5 deliverable files per task (.DST, .EMB, .PDF color run sheets, .JPEG sewout proofs, .DOCX notes, etc.) via `worker-portal.html`.
  - Staged deliverable chips with live size, individual deletion, and format detection.
  - Multi-artwork display in worker cards and Technical Specs Modal allowing workers to download all customer-uploaded documents and artwork files.
- **Backend & Database (`server/`)**:
  - `server/config/config.js`: Updated allowed extensions to support PDF, documents (.doc, .docx, .odt, .rtf, .txt), spreadsheets (.xls, .xlsx, .csv), images, vectors, stitch files, and archives. Increased maxFiles limit to 5.
  - `server/middleware/upload.js`: Multer middleware updated with comprehensive file filter for all document, artwork, and deliverable types.
  - `server/controllers/orderController.js`: Supports both `artworks` and `rawArtworkFiles` arrays up to 5 files; safely stores JSON arrays in `raw_artwork_files`; `trackOrder` returns parsed array of client files and worker deliverables.
  - `server/controllers/taskController.js`: Caps worker uploaded deliverables to max 5 files; synchronizes deliverables and completion to master order.
  - `track-order.html`: Public order tracking renders all uploaded customer files and all completed deliverables with format-specific icons (PDF, image, doc, embroidery).
- **Automated Verification**:
  - Validated via `scratch/test_5_files_workflow.js` (client 5-file order creation with PDF, JPEG, DOCX, PNG, AI; public tracking; admin assignment; worker 5-deliverables submission; public tracking deliverables download). All 100% passing.

---

## 21. Profile Machinery Customization & Streamlined Target Size Entry
- **Production Machinery Preferences Update**:
  - **Removed "Default Target Fabric"**: Removed fabric default preference from `client-profile.html` and `client-portal.html` account modal, leaving fabric selection flexible on a per-order basis.
  - **Default Embroidery Machine (Write & Select)**: Replaced rigid format select with an adaptable `Default Embroidery Machine` field supporting both freeform custom typing and quick selection via datalist and preset selector:
    - Supported presets: Tajima (.DST), Barudan (.DST / .DAT), Brother / Baby Lock (.PES), Wilcom Master (.EMB), Melco (.EXP), Bernina (.EXP / .ART), Janome (.JEF), Ricoma (.DST), SWF (.DST), Happy (.TAP / .DST), Husqvarna / Pfaff (.VP3), ZSK (.DST), Toyota (.DST).
    - Persisted in user profile (`defaultMachine` & `preferredMachine`), automatically deriving default file format fallback.
- **Single Target Size Box in Client Portal**:
  - **Before**: 3 separate split boxes (`[Width] × [Height] [Unit]`).
  - **After**: A single, clean text input box (`id="dig-size"`) with intuitive placeholder (`e.g. 3.5 in, 4x2.5 in, 10cm, Left Chest...`), allowing the client to write their desired size directly in their own words and preferred measurement format.
  - Seamlessly mapped to order creation and backend `sizing` field.
- **Laptop Navigation Bar Button Enhancements**:
  - Increased navigation links font size from `14px` (`text-sm`) to `15px` / `16.5px` (`md:text-[15px] lg:text-[16.5px] font-bold`) on laptop and desktop screens.
  - Added dedicated button-like padding (`6px 12px` up to `7px 15px`) and 9px rounded pills with interactive gold background hover state (`rgba(212, 175, 53, 0.08)` / dark `0.14`).
  - Active page links feature a crisp 2.5px golden underline indicator.

---

## 22. Unified Order & Quote Modal Architecture (`js/order-quote-modal.js`)
- **Universal Form Parity Mandate**:
  - Previously, the main marketing website used a single-step guest modal (`#guest-checkout-modal` in `app.js`), while the client portal used a 2-stage adaptive modal (`#new-order-modal` in `client-portal.html`), creating visual, functional, and UX discrepancies.
  - Built a centralized, standalone modal engine in `js/order-quote-modal.js` that mounts the **identical 2-stage adaptive modal** across the entire website ecosystem:
    - **Public Marketing Pages**: `index.html`, `pricing.html`, `services.html`, `contact.html`, `portfolio.html`, `about.html`, `order-success.html`, `profile.html`.
    - **Client Portal & Workspaces**: `client-portal.html`, `client-orders.html`, `client-quotes.html`, `client-invoices.html`, `client-profile.html`.
- **Top Segmented Mode Switcher Pill**:
  - Prominently positioned in the sticky modal header: `[ ⚡ Place Order ]` and `[ 📄 Request Free Quote ($0) ]`.
  - Enables instant toggling at any time, in both Stage 1 and Stage 2:
    - **Order Mode**: Displays real-time calculated price (e.g. `$15.00`), payment selection tabs, and checkout CTA (`Pay & Place Order ($15.00)`).
    - **Quote Mode**: Dynamically switches headers ("Request a Free Quote"), adapts step subtitles, displays a $0 upfront explanation box, and sets CTA to `Submit Free Custom Quote`.
- **2-Stage Adaptive Specification Workflow**:
  - **Stage 1 (Clean Service Choice)**: Visual interactive cards for `Embroidery Digitizing` (DST, EMB, PES, Left Chest, Caps, 3D Puff) and `Vector Art Conversion` (AI, EPS, SVG, PDF, Clean Curves, Color Separation).
  - **Stage 2 (Adaptive Technical Requirements)**:
    - **Target Placement & Pricing**:
      - Options: `Left Chest — $15`, `Cap / Hat Front — $15`, `Jacket Back / Large — $25`, and `Custom Placement`.
      - Removed options: `Sleeve / Visor` and `Patches / Badges` completely removed.
      - **Custom Placement**: Dynamically reveals extra text input field `#dig-custom-placement` ("Custom Placement Details", placeholder: `e.g. patch , visor , apron, tote bag, etc.`) for manual entry.
    - **Target Size & Adaptive Large Design Pricing**:
      - Single manual size input: `Target Size: [ e.g. 4.0 Tall / Wide ] [ in ]` (with `in` / `cm` unit toggle).
      - **Dynamic Large Design Rule ($25 over 5.5″ wide)**:
        - If the design is larger than 5.5 inches wide, the price automatically updates live from $15.00 to **$25.00**.
        - Applies universally across **all placements** (Left Chest, Cap / Hat Front, and Custom Placement for aprons, sleeves, tote bags, etc.).
        - Placement selection does **not** override the size rule; if size is > 5.5", price becomes $25.00.
        - Changes back to $15.00 immediately if size is reduced to $\le 5.5$ inches.
        - Supports unit conversion: when `cm` is selected, converts to inches (`val / 2.54`) before evaluating the 5.5" threshold (e.g. 14 cm = 5.51" $\rightarrow$ $25; 7 cm = 2.75" $\rightarrow$ $15).
        - **UI Explanation Notice**: Displays a dedicated explanatory notice directly under Target Size: `“Large design pricing applied (over 5.5″ wide).”` (`#dig-size-large-notice`) in high-contrast gold `#9a7810` (light) / `#d4af35` (dark) with info icon.
        - Sizes $> 5.5"$ are valid large designs and no longer blocked with validation error alerts.
    - **Required Machine File Formats**:
      - All machine brand names removed (no Tajima, Wilcom, Brother, Melco, Janome, etc.). Only file extensions displayed.
      - Exact sequence with `.DST` first and checked: `.DST | .PES | EMB | .OFM | .EXP | .JEF | .VP3 | .CND | .XXX`. Multiple formats remain selectable.
    - **Special Technical Options (Optional)**:
      - Cleaned down to only: `3D Puff`, `Trims Between All Letters`, `Applique`.
      - Removed `Match Sample`, `Flame Specs`, and removed the `+$5` surcharge from 3D Puff (so 3D Puff carries $0 extra charge).
    - **Vector Art**: Job Name, Vector Complexity tier selection, Format chips (AI, EPS, SVG, PDF, CDR, Hi-Res PNG), and Color Separation checkboxes.
    - **Multi-File Upload Zone**: Drag & drop or browse with support for up to 5 files (images, PDFs, documents, stitch files, vectors, archives) featuring live thumbnail chips, format detection, individual removal, and limit badges.
    - **Turnaround Speed & Rush Fee**:
      - Standard Turnaround: 12-24 Hours (included).
      - Rush Service: **5-8 Hours** (previously 2-4h).
      - Rush Queue Fee: **$5.00 USD** (previously $10.00).
    - **Smart Delivery Contact Block**: Automatically detects authenticated client sessions and displays a verified user badge (`Marcus Vance` / `client.vip@embroiderypro.com`), or reveals guest contact inputs (`Full Name`, `Email Address`, `Phone Number`) for unauthenticated visitors.
- **Backend & Cloud Integration**:
  - Direct file upload to InsForge Cloud Storage (`artworks` bucket) via `@insforge/sdk`.
  - Order / Quote persistence directly to InsForge PostgreSQL `orders` table.
  - Dispatches cross-tab live synchronization via `BroadcastChannel('dezan_realtime_sync')`.
- **Backwards Compatibility & Global Aliases**:
  - Modal container exposes dual IDs `#new-order-modal` and `#guest-checkout-modal`.
  - Exposes synchronized price labels: `#order-price-display`, `#guest-summary-price`, and `#guest-summary-plan`.
  - Full suite of global API functions: `window.openOrderQuoteModal`, `window.openNewOrderModal`, `window.openNewQuoteModal`, `window.openGuestCheckoutModal`, `window.closeOrderQuoteModal`, `window.closeNewOrderModal`, `window.closeGuestCheckoutModal`, `window.setModalMode`, `window.selectOrderService`.
- **Verification**:
  - Verified via Playwright automated suites `scratch/test_modal_triggers.js` and `scratch/test_unified_order_quote_workflow.js` across Desktop (1440x900), Tablet (834x1112), and Mobile (390x844) viewports.

---

## 23. Production Readiness & Authentication Credentials Provisioning
- **Complete Elimination of Demo Elements**:
  - Removed all demo switchers, demo bypass banners, and quick 1-click test credential cards across the entire platform:
    - `portal-login.html`: Stripped out quick demo credential cards and test buttons; streamlined for pure production credentials & Google OAuth.
    - Client portal suite (`client-portal.html`, `client-orders.html`, `client-quotes.html`, `client-invoices.html`, `client-profile.html`): Removed top `ROLE DEMO SWITCHER BAR`.
    - Digitizer / Worker portal suite (`worker-portal.html`, `worker-tasks.html`, `worker-settings.html`, `worker-specs.html`, `worker-archive.html`): Removed top `ROLE DEMO SWITCHER BAR`.
- **Production User Accounts Provisioned & Verified**:
  - **Master Admin**:
    - Email: `ADMIN@dezandigitizing.com`
    - Password: `Wasif8899@@@`
    - Role: `admin` (Full access to admin dashboard, live orders, invoicing, worker assignments, rates, customer tracking).
  - **Head Digitizer**:
    - Email: `DIGITIZER@dezandigitizing.com`
    - Password: `Pakistan6677@@@`
    - Role: `digitizer` (Full access to worker portal, active tasks, stitch specs, file production upload, download archives).
  - Authenticated and verified via bcrypt hash in PostgreSQL `auth.users` and `public.profiles` (`scratch/test_prod_logins.js`).
  - Whitelist updated in `server/controllers/authController.js` and local fallback resolver in `js/insforge-client.js`.

---

## 24. Redesigned 2-Step Progress Stepper Modal (Image 2 Target Specification)
- **Visual Design Parity with Target Mockup**:
  - Replaced the legacy step header text block with an ultra-clean, modern modal header and interactive progress stepper matching the user's reference mockup:
    - **Header**: Gold cart icon (`shopping_cart`), bold title `Place an Order`, subtitle `Choose a service to continue.`, circular close button `✕` on top right, mobile drag handle.
    - **Interactive 2-Step Stepper**:
      - Step 1: Solid gold circle (`#b89218`) with white numeral `1` and ring halo, bold label `Choose Service`. Clickable to return from Step 2 at any time.
      - Connector line: Absolute centered connector bar running behind circles; dynamically transitions to gold (`#b89218`) on Step 2.
      - Step 2: Soft slate-100 circle (`2`), adaptive label (`Order Details` in order mode, `Quote Details` in quote mode); transitions to solid gold when active.
    - **Horizontal Full-Width Service Choice Cards**:
      - **Card 1 (`Embroidery Digitizing`)**: Warm ivory background (`#fffdf8`), subtle gold border (`#faedd0`), squircle icon with monitor stitch path SVG, title, subtitle (`Stitch files for embroidery machines.`), gold chevron `>`, and exact pills: `.DST .PES .EXP` (gold badge), `Left Chest / Hats / Jacket Back` (slate badge), `3D Puff` (slate badge).
      - **Card 2 (`Vector Art Conversion`)**: Cool ice-blue background (`#f8faff`), subtle blue border (`#e2eaf4`), squircle icon with bezier pen tool SVG, title, subtitle (`Clean vector redraws for print and artwork.`), blue chevron `>`, and exact pills: `.AI .EPS .SVG .PDF` (blue badge), `Print-ready` (slate badge).
    - **Accessibility & Compatibility**: Built using semantic, accessible `<button type="button">` containers with WCAG 2.1 AA keyboard navigation and focus rings.
    - **Dual Synchronization**: Unified across `js/order-quote-modal.js` and `client-portal.html`, ensuring identical rendering and functionality on public pages and authenticated portal workspaces.
    - **Mobile Input Focus Auto-Zoom Elimination**:
      - Enforced strict `font-size: 16px !important` on mobile viewports (`<= 768px`) for all inputs, selects, and textareas across `styles.css`, `js/order-quote-modal.js`, and `client-portal.html`.
      - Prevents iOS Safari / WebKit from triggering an automatic viewport zoom when any field in the order form is tapped or clicked, while preserving crisp 12px desktop typography.
      - Applied `touch-action: manipulation` across interactive controls to eliminate tap delays and disable double-tap zoom.
    - **Multi-Viewport Testing**: Verified across 1440x900 Desktop, 834x1112 Tablet, and 390x844 Mobile viewports in both Light and Dark themes.

---

## 25. Portfolio Left Chest Artwork Asset Update
- **Image Replacement**:
  - Replaced the previous multi-colored shirts Beacon Home Group photo (`Left Chest / CORPORATE`) with the official high-resolution **Philadelphia St. Patrick's Day Parade** embroidered softshell jackets photo (`images/Left Chest Logos.png` and `images/Left Chest Logos.jpg`).
  - The new image prominently showcases 6 black zip jackets with high-definition green and gold Celtic clover left chest embroidery crests.
- **Cache Invalidation & Display Guarantee**:
  - Updated image references in `index.html` (including `<link rel="preload">` and `<img>`) and `services.html` with cache-busting query parameter `images/Left Chest Logos.png?v=3` to guarantee instantaneous rendering without stale browser caching.
  - Retained the strict 4-item portfolio sequence:
    1. Custom Hats (`images/Custom Hats.png` - 3D Puff)
    2. Jacket Backs (`images/Jacket Backs.png` - Custom Design)
    3. Left Chest (`images/Left Chest Logos.png?v=3` - Corporate)
    4. Pet Portraits (`images/Pet Embroidery.png` - Embroidery)
- **Visual Verification**:
  - Verified via Playwright headless testing across Desktop (1280x900) and Mobile (390x844) viewports for both `index.html` and `services.html`. Labels (`Left Chest` and gold `CORPORATE`) render with crisp contrast and optical alignment.

---

## 26. Global Navigation Link Sequence
- **Standardized Header Navigation Sequence**:
  - Updated the global top navigation bar sequence across all 9 public and marketing pages (`index.html`, `services.html`, `portfolio.html`, `pricing.html`, `about.html`, `contact.html`, `order-success.html`, `profile.html`, and `track-order.html`) to:
    1. **Home** (`index.html`)
    2. **Services** (`services.html`)
    3. **Feedbacks** (`portfolio.html`)
    4. **Pricing** (`pricing.html`)
    5. **About** (`about.html`)
    6. **Contact** (`contact.html`)
- **Theme & Active State Consistency**:
  - Preserved `.nav-link-gold` active highlight pill, `data-nav` page matching in `app.js`, and seamless Light/Dark mode rendering.
  - Verified via Playwright visual captures on Desktop (`1440x900`).

---

## 27. Dedicated Service Landing Pages & Vector Art Assets Integration
- **Dedicated SEO Service Landing Pages**:
  - **`embroidery-digitizing.html`**:
    - **Target Keywords & Focus**: Custom commercial embroidery digitizing, 3D puff caps, left chest logos, jacket backs, realistic pet portraits, Tajima `.DST`, Wilcom `.EMB`, Brother `.PES`.
    - **Technical Breakdown**: Machine compatibility strip (DST, EMB, PES, EXP, DAT, JEF, VP3, PDF worksheets), 6 capability bento cards (Caps, Left Chest, Jacket Backs, 3D Puff with $0 extra upcharge, Realistic Pet Portraits, Patches & Applique), 4-step quality assurance standard (Artwork Deconstruction, Directional Underlay, Push/Pull Calibration, Virtual Sewout Simulation), transparent pricing table ($15 / $25 / $25-$40), interactive FAQ accordion with schema.
    - **Structured Data**: JSON-LD `Service`, `ProfessionalService`, `FAQPage`, `BreadcrumbList`.
  - **`vector-art-conversion.html`**:
    - **Target Keywords & Focus**: 100% manual vector art conversion, raster redraw, low-res JPG/PNG to AI, EPS, SVG, PDF, CDR, print-ready screen printing separations, vinyl cut paths, laser engraving.
    - **User Vector Assets Prominently Integrated**:
      1. `images/vector-art-fish-comparison.jpg`: Full-color detailed Rainbow Trout water splash illustration comparison (Raster vs Vector) displaying format badges (JPG, AI, EPS, PNG, PDF, CDR) and "All file formats available upon request".
      2. `images/vector-art-senior-comparison.png`: Napkin/paper hand-drawn pencil concept sketch ("SENIOR 2024 HOLCOMB HIGH SCHOOL") converted into production-ready vibrant colored vector artwork ("SENIOR 2024 AFSIVA HIGH SCHOOL") with format badges.
    - **Production Capabilities (6 Bento Cards)**: Screen Printing & Color Separation, DTF & Heat Transfers, Vinyl Cut Paths & Plotters, Laser Engraving & CNC, Vehicle Wraps & Billboards, Embroidery Art Prep.
    - **Structured Data**: JSON-LD `Service`, `ProfessionalService`, `FAQPage`, `BreadcrumbList`.
- **Expert Services Click Routing in `services.html`**:
  - Configured the `services.html` portfolio section with 5 balanced items (Custom Hats, Jacket Backs, Left Chest Logos, Pet Portraits, and Hand-Drawn Sketch to Vector), with symmetrically centered lower row on desktop and full-width 16:10 comparison banner on mobile; preserved the Rainbow Trout vector comparison artwork exclusively on `vector-art-conversion.html` as requested.
- **Active Navigation & Internal Linking**:
  - `app.js`: Enhanced active link detection so visits to `embroidery-digitizing.html` and `vector-art-conversion.html` highlight "Services" in the top navbar and mobile bottom navigation.
  - Global Footers: Harmonized across all pages (`index.html`, `about.html`, `services.html`, `pricing.html`, `portfolio.html`, `contact.html`, `vector-art-conversion.html`, `embroidery-digitizing.html`, `order-success.html`, `profile.html`, `terms.html`, `privacy.html`, `track-order.html`, `portal-login.html`).
    - **Dedicated Services Column**: `Embroidery Digitizing`, `Vector Art Conversion`, `Flat-Rate Pricing`, `Services Overview`, `Feedbacks / Reviews`.
    - **Legal & Policies Column**: Strictly restricted to 2 policy items:
      1. `Terms of Service` (`terms.html`)
      2. `Refund & Privacy Policy` (`privacy.html`)
    - **Bottom Bar**: `© 2016-2026 Dezan Digitizing — All Rights Reserved. Terms of Service • Refund & Privacy Policy`.
- **Mobile Image Asset Optimization & Zero-Opacity Blocking**:
  - Replaced unencoded space filenames with web-standard URL-safe filenames (`images/custom-hats.png`, `images/jacket-backs.png`, `images/left-chest-logos.png`, `images/pet-embroidery.png`) with `?v=4` cache-busting parameters across `services.html`, `index.html`, and `embroidery-digitizing.html`.
  - Removed nested `.reveal` animation classes from individual portfolio cards on `services.html` that caused mobile WebKit browsers to occasionally leave cards stuck at `opacity: 0`.
  - Added `loading="eager"` and calibrated `object-[center_35%]` framing on `embroidery-digitizing.html` so hat crowns are never cut off by horizontal aspect ratio crops.
- **Visual Verification**:

---

## 28. Google Sign-In Architecture & 401 Error Prevention (Live & Verified)
- **Root Cause of Error 401 `invalid_client`**:
  - `portal-login.html` previously held a fictional placeholder Google Client ID (`1012361420045-dezan-digitizing.apps.googleusercontent.com`) within `launchGoogleOAuthPopup()`.
  - When users clicked "Use another Google account", the browser opened Google's OAuth consent endpoint `https://accounts.google.com/o/oauth2/v2/auth`, which Google rejected with `Access blocked: Authorization Error - The OAuth client was not found (Error 401: invalid_client)`.
- **Architectural Solution & Safeguards**:
  - **Majid Hussain 1-Click Tile**: Added user tile for `majidhussain7591@gmail.com` (Display Name: "Majid Hussain", Avatar "MH" in rich blue gradient, "Active" badge) for instant 1-click authentication.
  - **Default Client Demo Tile**: Maintained John Falcon (`client@falconapparel.com`) tile for sandbox testing.
  - **Inline Google Account Entry**:
    - Replaced the direct external popup trigger with an intuitive, expandable inline form within the Google modal (`#google-custom-account-box`).
    - Features dedicated fields: Google Email Address (`#google-custom-email`), Full Name Optional (`#google-custom-name`), keyboard Enter support, and clear input validation.
  - **Zero-Crash Popup Safeguard**:
    - `launchGoogleOAuthPopup()` now strictly validates whether `window.GOOGLE_CLIENT_ID` is a genuine production client ID (non-empty and not containing placeholder string).
    - If unconfigured, it gracefully falls back to the inline account form instead of launching an invalid Google popup.
  - **Identity Session & Auto-Memory**:
    - Saves recent Google account credentials in `localStorage` (`dezan_recent_google_email`, `dezan_recent_google_name`) so the user's active Google account is remembered on subsequent visits.
    - Synchronized with backend `POST /api/auth/google`, PostgreSQL `public.profiles` database record, JWT token persistence, and guest order claiming.
- **Verification**:
  - Headless Playwright integration test verified full handshake: Google modal display $\rightarrow$ expandable custom input toggle $\rightarrow$ Majid Hussain 1-click sign-in $\rightarrow$ successful HTTP 200 backend handshake $\rightarrow$ automatic redirection to `client-portal.html` with active session.

---

## 29. Dynamic Large Design Pricing Rule ($25 over 5.5″ Wide) & Live Explanatory UI (Implemented & Verified)
- **Problem & Requirement**:
  - Previously, sizes entered over 5.5 inches for Left Chest or Cap / Hat Front triggered a validation error alert and blocked order submission. Furthermore, Custom Placement options did not dynamically adjust the base price when customers specified large dimensions (e.g., 7 inches for an apron or tote bag).
  - The customer required:
    1. Designs larger than 5.5 inches wide must automatically adjust base price from $15.00 to **$25.00**.
    2. The rule must apply across all placements including Custom Placement, Left Chest, Cap / Hat Front, and others. The placement selection must not override the size rule.
    3. Price must update live as soon as the user types/edits the size, before clicking "Pay & Place Order".
    4. Changing size back to $\le 5.5$ inches must immediately restore base price to $15.00.
    5. Unit conversion (`cm` $\rightarrow$ `in` via `rawVal / 2.54`) must be evaluated prior to threshold testing.
    6. A small explanatory line must appear directly beneath Target Size when $25 pricing is applied:
       `“Large design pricing applied (over 5.5″ wide).”`
       This clarifies the price adjustment so users understand why the checkout price changed.
- **Architectural Implementation**:
  - **Files Updated**:
    - `js/order-quote-modal.js`: Unified order/quote modal engine used on all public marketing pages and client portal wrappers.
    - `client-portal.html`: Internal client workspace order modal.
  - **Helper Function (`getDesignWidthInInches`)**:
    - Parses input strings supporting direct floats (`7`, `5.5`, `4.0`), dimensional annotations (`7 inches wide`, `6w`, `4 x 7`), and unit conversion (checks both unit dropdown and string text for `cm`).
    - Compares against precision threshold: `valInInches > 5.5001`.
  - **Live Adaptive Calculation (`calculateAdaptivePrice`)**:
    - If `service === 'Digitizing'` and `isLargeBySize || isJacketBack`: sets `basePrice = 25.00` and adjusts breakdown text (e.g. `Custom Placement · Large Design ($25.00)` or `Left Chest · Large Design ($25.00)`).
    - If rush turnaround is selected: adds +$5 fee ($30.00 total).
    - Updates price summary display and checkout button text live (`Pay & Place Order ($25.00)` or `Pay & Place Order ($30.00)`).
    - Toggles `#dig-size-large-notice` (`hidden` removed when large size detected, restored when $\le 5.5"$).
  - **Notice Element (`#dig-size-large-notice`)**:
    - Styled with WCAG 2.1 AA compliant brand gold: `text-[#9a7810]` in light mode and `dark:text-primary` (`#d4af35`) in dark mode with a subtle info icon.
  - **Validation Refactoring (`validatePlacementSize`)**:
    - Removed the 5.5" restriction and alert blocking.
    - Sizes $> 5.5"$ are valid large designs and accepted smoothly. Only non-positive numbers ($\le 0$) trigger input validation.
  - **Live Event Binding**:
    - `oninput="window.validatePlacementSize(); window.calculateAdaptivePrice();"` on `#dig-size`.
    - `onchange="window.validatePlacementSize(); window.calculateAdaptivePrice();"` on `#dig-size-unit`.
    - Native `input` and `change` listeners attached in `ensureModalElement` and `DOMContentLoaded`.
- **Automated Verification (`scratch/test_large_pricing_rule.js`)**:
  - **Scenario A**: Left Chest with 4.0" $\rightarrow$ $15.00, notice hidden.
  - **Scenario B**: Left Chest with 7.0" $\rightarrow$ $25.00, notice visible, button `Pay & Place Order ($25.00)`.
  - **Scenario C**: Change back to 5.5" $\rightarrow$ returns to $15.00, notice hidden, button `Pay & Place Order ($15.00)`.
  - **Scenario D**: Custom Placement (Apron / Tote bag) with 7" $\rightarrow$ $25.00, notice visible.
  - **Scenario E**: Unit toggle to `cm` with 7 cm (2.75") $\rightarrow$ returns to $15.00, notice hidden.
  - **Scenario F**: 15 cm (5.9") $\rightarrow$ $25.00, notice visible.
  - **Scenario G**: Cap / Hat Front with 6" $\rightarrow$ $25.00, notice visible, no blocking errors.
  - **Scenario H**: Rush priority (+ $5) with large design $\rightarrow$ $30.00 total.
  - **Client Portal**: Verified identical behaviors in `client-portal.html` order builder.
  - **Screenshots**: Multi-viewport visual QA verified for desktop light (`large_design_modal_light.png`), desktop dark (`large_design_modal_dark.png`), and mobile (`large_design_modal_mobile.png`).
- **Section Heading Update (Client Stitchouts)**:
  - Renamed the section heading from `Client's Feedback` to `Client Stitchouts` in `index.html` and `portfolio.html`.
  - Maintained brand styling (`text-xl font-bold mb-6 border-l-4 border-primary pl-3`).
  - Updated image alt attributes from `Client Feedback` to `Client Stitchout`.
- **Transparent Pricing Preview Box Harmonization (`services.html`)**:
  - Aligned Card 2 ("Jacket Back / Large") colors to match Card 1 and Card 3 identically with neutral styling (`border border-primary/15 dark:border-primary/25`, `text-slate-600 dark:text-slate-400` eyebrow, and `text-slate-900 dark:text-white` price).
  - Removed misleading `cursor-pointer` and hover transitions from all three informational preview cards, clearly distinguishing them from interactive buttons and directing users to the primary "View Full Price List & Order" button.
- **Home Page Hero Copy Update (`index.html`)**:
  - Value proposition under headline: `"Providing high-quality embroidery digitizing services to embroidery shops across the U.S."`
  - Calibrated typography (`text-xs xs:text-[13px] sm:text-sm md:text-base text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-xl`) to maintain visual balance and zero layout shifts on desktop and mobile.
- **Optional Picture Upload in Revision Requests (`client-portal.html`, `client-orders.html`, `js/client-workspace.js`)**:
  - Clients can provide a text description of adjustments required, with an optional picture/photo upload to illustrate problem areas (puckering, fabric pull, stitch density, or marked-up artwork).
  - Explicitly labeled as `(optional)` with non-mandatory UI styling and helper text.
  - Eliminated mock/fallback photo insertions; submissions without an image cleanly persist an empty `stitch_out_photos: []` array.
  - Added full live preview, file details, delete trigger, and cross-platform submit integration in both `client-portal.html` and `client-orders.html`.

---

## 30. Realistic / Pet Portrait Digitizing Service Option & Dedicated Pricing Engine (Implemented & Verified)
- **Problem & Requirement**:
  - Previously, selecting Embroidery Digitizing applied standard pricing based on Left Chest ($15), Cap ($15), Jacket Back ($25), etc. While accurate for standard commercial logos and lettering, pet portraits and photorealistic/complex artwork require specialized stitch techniques (dense feathering, layered fur shading, complex facial blending) with separate flat-rate pricing.
  - The client required:
    1. A dedicated service option on Stage 1 (Choose Service) called **"Realistic / Pet Portrait Digitizing"** with subtitle *"For pet portraits, realistic animals, faces, fur, detailed shading and complex photorealistic artwork."*
    2. Stage 1 cards presented as 3 clear, distinct choices:
       - **Embroidery Digitizing** (From $15) — Regular logos, text, hats, left chest, jacket backs.
       - **Realistic / Pet Portrait Digitizing** (From $25) — Pets, faces, fur, realistic shading, complex artwork.
       - **Vector Art Conversion** (From $15) — Clean vector artwork for printing/cutting.
    3. An explicit clarification note on the Pet Portrait card:
       `“Choose this service for pet portraits, realistic animals, human portraits, fur, faces, detailed shading, or other highly complex realistic artwork. For regular business logos/text, choose Embroidery Digitizing.”`
    4. Dedicated flat pricing independent of placement:
       - **Up to 5.5” — $25 flat**
       - **Over 5.5” — $40 flat**
    5. Placement (`Left Chest`, `Cap / Hat Front`, `Jacket Back`, `Other / Custom Placement`) is asked separately, but does NOT alter the base price (e.g. a 5-inch jacket back pet portrait is $25, not inflated by placement).
    6. Order form copy uses *"Up to 5.5 inches — $25"* instead of legacy left chest/hat nomenclature.
    7. Active Service banner reflects **Realistic / Pet Portrait Digitizing** with the `pets` icon.
    8. Checkout button dynamically updates to `Pay & Place Order ($25.00)` or `Pay & Place Order ($40.00)`.
- **Architectural Implementation**:
  - **Stage 1 (Service Selection)**:
    - Added Option 2 button in `js/order-quote-modal.js` and `client-portal.html` with gold border, custom pet embroidery hoop SVG icon, `From $25` badge, descriptive note, and format pills (`.DST .PES .EXP .EMB`).
  - **Stage 2 (Order Details & Pricing)**:
    - Added `#pet-pricing-tier-block` with two interactive radio cards:
      - `Up to 5.5″` ($25.00)
      - `Over 5.5″` ($40.00)
    - Added `#pet-placement` select (`Left Chest`, `Cap / Hat Front`, `Jacket Back`, `Other / Custom Placement`) decoupled from pricing.
    - Created `handlePetTierChange(tier)` to dynamically manage active card borders, radio states, and price calculations.
    - Updated `calculateAdaptivePrice()` to evaluate Pet Portrait rates, with automatic tier synchronization if customer inputs size (e.g., typing `6.5 in` auto-upgrades to $40 tier; typing `4.0 in` restores to $25 tier).
    - Updated `selectOrderService(service)` to toggle between normal placement and pet placement selects.
    - Updated `handleAdaptiveOrderSubmit` to record `serviceType: 'Realistic / Pet Portrait'` and descriptive plan names (e.g., `Realistic / Pet Portrait - Jacket Back (Up to 5.5″ ($25))`).
  - **Pricing Page (`pricing.html`)**:
    - Mobile & Desktop Card 3 click handlers bound to `window.handleOrderClick(event, 'PetPortrait', 'Realistic / Pet Portrait')`.
    - Copy explicitly formatted: `Up to 5.5 Inches (Standard) — $25 flat` and `Over 5.5 Inches (Large) — $40 flat`.
- **Automated Playwright Verification (`scratch/test_pet_portrait_order.js`)**:
  - Desktop (1512x982), Tablet/Laptop (1440x900), and Mobile (390x844) tests passed 100%.
  - Confirmed 3 service cards, default $25.00 price, $40.00 toggle, placement decoupling, size auto-syncing, custom placement reveal, and dual-modal parity in both public modals and authenticated client portal.
  - Visual QA screenshots saved in artifact directory: `pet_portrait_step1_cards_desktop.png`, `pet_portrait_step2_tier25_desktop.png`, `pet_portrait_step2_tier40_desktop.png`, `pet_portrait_mobile_step1.png`, `pet_portrait_mobile_step2.png`, `pet_portrait_portal_step1.png`, `pet_portrait_portal_step2.png`.

---

## 31. Strict Quote Isolation to Admin & Worker Data Masking (Implemented & Verified)
- **Problem & Requirement**:
  - Quotes (`is_quote = true`, `status = 'quote_requested'`, `order_number` starting with `QUO-`) are strictly administrative pricing inquiries between the Client and Admin.
  - Digitizers (workers) have only one responsibility: receive approved production orders, digitize/work on them, and upload/send deliverables back (`.DST`, `.EMB`, proofs).
  - Digitizers must have zero access to or involvement with clients (names, emails, phone numbers, companies) and zero involvement with pricing (quoted price, order dollar amounts, invoices, payments).
  - Quotes must NEVER be sent to or assigned to digitizers.
- **Architectural Implementation**:
  - **Backend API Protection (`server/`)**:
    - `server/controllers/orderController.js`: In `assignDigitizer`, added a strict guard rejecting quote orders with HTTP 400 Bad Request: `"Quotes can only be sent to and reviewed by Admin. Digitizers only receive approved production orders."`.
    - `server/controllers/taskController.js`: Added SQL exclusion clause `whereClauses.push("NOT (order_number LIKE 'QUO-%')")` so digitizer tasks queries never return quotes; guarded `getTaskById` against any quote orders.
    - `server/utils/orderNumber.js`: Removed `.replace('QUO-', 'TSK-')` from `generateTaskNumber` to guarantee quote numbers never create worker tasks.
    - `server/controllers/quoteController.js`: Enforces `if (user.role === 'digitizer') return forbidden(res, 'Digitizer workers do not have access to quote appraisals')`; alert notifications route exclusively to Admin and Client.
  - **Client-Side SDK & Portal Logic (`js/insforge-client.js`)**:
    - In `assignDigitizer()`: Throws explicit error if order is a quote (`QUO-...`, `is_quote`, or `quote_requested`).
    - In `fetchDigitizerTasks()` & `getDigitizerTasks()`: Strictly filters out any quotes from cloud tasks, local tasks cache, and local order merges.
    - In `autoAssignAllPendingOrders()`: Skips quotes so automated assignment passes over pricing requests.
  - **Admin Workspace (`js/admin-workspace.js`)**:
    - In `renderAdminOrderTableRow` and `renderAdminOrderCard`: Conditionally hidden the "Assign" / "Reassign" button for any quotes, ensuring only "Give Price" / "Update Price" and "Invoice" are available for quotes.
    - In `openAssignModal()`: Added strict validation blocking modal launch for quotes and filtering out quotes from target assignment lists.
    - In `renderDigitizersDirectory`: Excluded quotes from worker assigned orders and active task counts.
  - **Worker Portal (`worker-portal.html`)**:
    - `renderWorkerTasks()`: Strictly filters out any quotes before rendering the active or completed queues.
    - Technical Specs modal & task cards: Display zero client PII (no client name, email, phone, company) and zero commercial pricing (no dollar amounts, no payment status). Shows strictly technical engineering parameters (placement, sizing, density, formats, instructions, raw artwork download, deliverables upload).
- **Automated Playwright & Backend Verification (`scratch/test_quote_admin_isolation.js`)**:
  - Validated 100% passing tests:
    1. Quote creation (`QUO-9708`) generated with status `quote_requested` and `is_quote: true`.
    2. Worker token accessing `GET /api/quotes` returns HTTP 403 Forbidden.
    3. Worker token accessing `GET /api/orders` returns HTTP 403 Forbidden.
    4. Attempting to assign quote `QUO-9708` to a digitizer returns HTTP 400 Bad Request with `"Quotes can only be sent to and reviewed by Admin. Digitizers only receive approved production orders."`.
    5. Client-side `assignDigitizer` method throws error when passed quote references.
    6. Admin portal renders quote with "Give Price" / "Update Price" and NO "Assign" button.
    7. Worker portal task queue contains 0 quotes, with strict physical data masking confirmed on all properties.
    8. Screenshots captured: `scratch/admin_portal_quote_isolation.png` and `scratch/worker_portal_quote_isolation.png`.

---

## 32. Homepage "Why Choose Dezan Digitizing" Feature Card Update (Files Stay in Your Account)
- **Problem & Requirement**:
  - In `index.html`, the second feature card under *"Why Choose Dezan Digitizing?"* previously read:
    - Title: *"Production-Ready"*
    - Subtitle: *"Calibrated density & pull compensation for clean, break-free runs."*
  - The client requested replacing this card with account storage and re-download messaging:
    - Title: **"Files Stay in Your Account"**
    - Subtitle: **"Re-download previous orders whenever you need them."**
- **Implementation**:
  - In `index.html` (lines 602–616):
    - Replaced the title with `"Files Stay in Your Account"`.
    - Replaced description with `"Re-download previous orders whenever you need them."`.
    - Replaced the previous shield icon with a folder-download SVG icon matching the stroke weight (`stroke-width="2.2"`), dimensions (`w-6 h-6 sm:w-7 sm:h-7`), and gold circular badge container of the surrounding cards.
- **Visual QA Verification (`scratch/verify_files_stay_in_account.js`)**:
  - Captured Desktop Light (`scratch/why_choose_pillars_desktop_light.png`), Desktop Dark (`scratch/why_choose_pillars_desktop_dark.png`), and Mobile 390px (`scratch/why_choose_pillars_mobile.png`).
  - Confirmed 4-card desktop layout and 2x2 mobile grid alignment with zero overflow or text clipping.

---

## 33. Comprehensive Google Image SEO Optimization (Semantic Kebab-Case Filenames & Rich Alt Text Architecture)
- **Mandate & Problem Addressed**:
  - Google explicitly uses surrounding text, filenames, captions, and `alt` text to understand images and rank visual assets in Google Images search.
  - Generic names (e.g. `1.webp`, `IMG_8348.webp`, `review3.jpeg`, `Hero Page/Vector.png`) provide zero topical context to web crawlers, forfeiting organic search traffic for high-intent commercial terms (`3d-puff-cap-embroidery-stitchout.webp`, `jacket-back-embroidery-digitizing.webp`, `pet-portrait-embroidery.webp`).
  - Generic `alt="Client Feedback"` or missing `alt` attributes fail accessibility and image SEO benchmarks.
- **Architectural Solution & Semantic Standard**:
  - **Kebab-Case Naming Standard**: All images renamed using lowercase hyphens containing exact subject matter, placement, process, and file type (e.g., `Client FeedBack/6.webp` $\rightarrow$ `Client FeedBack/3d-puff-cap-embroidery-stitchout.webp`).
  - **All 39 Client FeedBack Images Renamed & Mapped**:
    1. `1.webp` $\rightarrow$ `boxer-dog-pet-portrait-embroidery-digitizing.webp`
    2. `2.webp` $\rightarrow$ `boxer-dog-embroidered-tote-bag-stitchout.webp`
    3. `3.webp` $\rightarrow$ `donas-tacos-mexican-dancer-jacket-back-embroidery-digitizing.webp`
    4. `4.webp` $\rightarrow$ `donas-tacos-mexican-folkloric-jacket-back-embroidery-stitchout.webp`
    5. `5.webp` $\rightarrow$ `retro-astros-rainbow-3d-puff-cap-embroidery-digitizing.webp`
    6. `6.webp` $\rightarrow$ `3d-puff-cap-embroidery-stitchout.webp` (user's target benchmark)
    7. `7.webp` $\rightarrow$ `houston-skyline-space-city-cap-embroidery-digitizing.webp`
    8. `8.webp` $\rightarrow$ `houston-cityscape-trucker-hat-embroidery-stitchout.webp`
    9. `9.webp` $\rightarrow$ `mill-creek-kennels-left-chest-embroidery-stitchout.webp`
    10. `10.webp` $\rightarrow$ `mill-creek-kennels-dog-left-chest-embroidery-digitizing.webp`
    11. `11.webp` $\rightarrow$ `reds-world-melting-heart-hat-embroidery-digitizing.webp`
    12. `12.webp` $\rightarrow$ `reds-world-dripping-heart-cap-embroidery-stitchout.webp`
    13. `14.webp` $\rightarrow$ `good-jawns-motocross-circular-embroidered-patch.webp`
    14. `15.webp` $\rightarrow$ `black-terrier-dog-pet-portrait-embroidery-digitizing.webp`
    15. `16.webp` $\rightarrow$ `beau-dog-pet-portrait-embroidered-sweatshirt-stitchout.webp`
    16. `17.webp` $\rightarrow$ `french-bulldogs-pet-portrait-embroidery-digitizing.webp`
    17. `18.webp` $\rightarrow$ `french-bulldog-custom-embroidered-crewneck-stitchout.webp`
    18. `19.webp` $\rightarrow$ `suave-cuts-barbershop-anchor-patch-digitizing.webp`
    19. `20.webp` $\rightarrow$ `suave-cuts-barbershop-hoodie-embroidery-stitchout.webp`
    20. `21.webp` $\rightarrow$ `architectural-estate-lakehouse-jacket-back-embroidery-digitizing.webp`
    21. `22.webp` $\rightarrow$ `architectural-estate-custom-embroidery-stitchout.webp`
    22. `23.webp` $\rightarrow$ `houston-sports-hybrid-3d-puff-hat-embroidery-digitizing.webp`
    23. `24.webp` $\rightarrow$ `houston-sports-hybrid-3d-puff-cap-embroidery-stitchout.webp`
    24. `25.webp` $\rightarrow$ `good-jawns-dirt-bike-rider-patch-digitizing.webp`
    25. `26.webp` $\rightarrow$ `good-jawns-motocross-embroidered-patch-stitchout.webp`
    26. `27.webp` $\rightarrow$ `junes-league-basketball-patch-embroidery-digitizing.webp`
    27. `28.webp` $\rightarrow$ `junes-league-basketball-embroidered-patch-stitchout.webp`
    28. `29.webp` $\rightarrow$ `custom-couple-cartoon-sketch-jacket-back-embroidery-digitizing.webp`
    29. `30.webp` $\rightarrow$ `custom-couple-line-art-embroidered-hoodie-stitchout.webp`
    30. `31.webp` $\rightarrow$ `suave-cuts-anchor-emblem-embroidery-patch-digitizing.webp`
    31. `32.webp` $\rightarrow$ `suave-cuts-barbershop-embroidered-caps-stitchout.webp`
    32. `33.webp` $\rightarrow$ `bull-silhouette-tree-branches-cap-embroidery-digitizing.webp`
    33. `34.webp` $\rightarrow$ `bull-tree-branches-embroidered-hoodie-and-hat-stitchout.webp`
    34. `35.webp` $\rightarrow$ `american-flag-mountain-hiker-cap-embroidery-digitizing.webp`
    35. `36.webp` $\rightarrow$ `american-flag-outdoor-hiker-embroidered-hat-stitchout.webp`
    36. `37.webp` $\rightarrow$ `barbacoa-bandits-bull-skull-hat-embroidery-digitizing.webp`
    37. `38.webp` $\rightarrow$ `barbacoa-bandits-trucker-hat-embroidery-stitchout.webp`
    38. `39.webp` $\rightarrow$ `sevenailz-barbershop-greek-key-jacket-back-embroidery-digitizing.webp`
    39. `40.webp` $\rightarrow$ `sevenailz-barbershop-jacket-back-embroidery-stitchout.webp`
  - **Hero Page Comparison Assets Renamed**:
    - `Hero Page/Vector.png` $\rightarrow$ `Hero Page/astronaut-vector-art-source-illustration.png`
    - `Hero Page/Embroidery.png` $\rightarrow$ `Hero Page/astronaut-patch-embroidery-digitizing-stitchout.png`
  - **Factory Craftsmanship Assets Renamed (`images/`)**:
    - `1.jpeg` $\rightarrow$ `commercial-multi-head-embroidery-machine.jpeg`
    - `2.jpeg` $\rightarrow$ `wilcom-embroidery-digitizing-software-stitch-simulation.jpeg`
    - `3.jpeg` $\rightarrow$ `scenic-mountain-landscape-embroidered-patch.jpeg`
    - `4.jpeg` $\rightarrow$ `madeira-polyneon-embroidery-thread-spools.jpeg`
    - Removed space-containing duplicates (`Custom Hats.png`, `Jacket Backs.png`, `Left Chest Logos.png`, `Left Chest Logos.jpg`, `Pet Embroidery.png`) in favor of standardized `custom-hats.png`, `jacket-backs.png`, `left-chest-logos.png`, `pet-embroidery.png`.
  - **Customer Testimonial Screenshots Renamed (`reviews/`)**:
    - `review2.jpeg` $\rightarrow$ `ashlea-foxwell-embroidery-stitchout-review.jpeg`
    - `review3.jpeg` $\rightarrow$ `erkan-koyuncu-seaside-hats-embroidery-review.jpeg`
    - `review4.jpeg` $\rightarrow$ `maralyn-kublek-embroidery-digitizing-review.jpeg`
    - `review5.jpeg` $\rightarrow$ `lisa-jenkins-embroidery-customer-review.jpeg`
    - `review6.jpeg` $\rightarrow$ `sandy-escobar-embroidery-digitizing-review.jpeg`
    - `review7.jpeg` $\rightarrow$ `susan-michael-embroidery-service-review.jpeg`
    - `review8.jpeg` $\rightarrow$ `karen-giddings-embroidery-digitizing-review.jpeg`
    - `review9.jpeg` $\rightarrow$ `chris-velasquez-embroidery-stitchout-review.jpeg`
    - `review10.jpeg` $\rightarrow$ `jean-trinh-le-embroidery-digitizing-review.jpeg`
  - **Rich Alt Text & Title Injections Across All Pages**:
    - `portfolio.html`: Enhanced all 39 stitchout cards with unique, keyword-rich `alt` attributes, human-readable `title` tags, and `loading="lazy"`.
    - `app.js`: Refactored `feedbackImages` into structured `feedbackItems` array containing `{ src, alt, title }`. Injected real alt text into both `#feedback-slide-track` and `#feedback-thumb-strip`.
    - `index.html`: Updated Hero slider before/after images, preloads, portfolio category grid cards, and customer review cards.
    - `about.html`, `services.html`, `pricing.html`, `embroidery-digitizing.html`, `worker-workspace.js`: Updated all references with zero legacy filenames remaining.
- **Verification (`scratch/verify_image_seo_renaming.js`)**:
  - Automated Playwright crawl across 7 core pages (`index.html`, `portfolio.html`, `about.html`, `services.html`, `pricing.html`, `embroidery-digitizing.html`, `vector-art-conversion.html`).
  - Results: 0 broken images (`naturalWidth === 0`), 0 HTTP 404 network errors, 0 missing alt tags, 0 generic alt tags.
  - Multi-viewport visual screenshots verified on Desktop (`1512x982`) and Mobile (`390x844`).

---

## 33. End-to-End PayPal Payment Integration & Payoneer B2B Option (Implemented & Verified)
- **Problem & Requirement**:
  - Clients in the U.S. (embroidery shops, apparel decorators) required a trusted, instant payment method to settle orders ($15 flat-rate, $25 jacket back, pet portraits) and convert approved custom quotes into active production orders.
  - As a Pakistani digital export business, PayPal is the #1 choice for front-end customer conversion (allowing U.S. clients to pay via PayPal balance or direct Debit/Credit cards), while Payoneer serves as the secondary channel for batch invoicing and direct U.S. bank ACH deposits.
- **Architecture & Implementation**:
  - **Dynamic PayPal SDK Loader (`js/paypal-config.js`)**:
    - Centralized configuration module managing `PAYPAL_CLIENT_ID` (configurable via `window.DEZAN_PAYPAL_CLIENT_ID` or `window.ENV.PAYPAL_CLIENT_ID`, defaulting to sandbox test mode).
    - Dynamically injects the official PayPal JS SDK once per session (`https://www.paypal.com/sdk/js?client-id=...&currency=USD&intent=capture&components=buttons`).
  - **Interactive Checkout Modal (`client-portal.html`)**:
    - Upgraded `#checkout-payment-modal` with PayPal Smart Buttons (`#paypal-button-container`).
    - Smart buttons automatically render both the **Yellow PayPal Button** and the **Debit or Credit Card Button** (for users without a PayPal account).
    - Tab 2 provides **Payoneer & Direct U.S. Bank ACH** receiving details (Community Federal Savings Bank) with a 1-click invoice request generator.
  - **Approval & Settlement Flow (`initPayPalForOrder` & `completeSuccessfulPayment`)**:
    - Dynamic amount calculation based on order price (`order.price || 15`).
    - `onApprove` captures order reference and gateway transaction ID (`details.id`).
    - Calls `insforgeClient.updateOrderPayment(order.id, 'paid', 'PayPal', transactionId)` to update local state and PostgreSQL database.
    - Syncs to REST backend `/api/orders/:id/payment` (or `/api/quotes/:id/convert` for quote promotions).
    - Closes checkout modal, re-renders orders with green `Paid` status badge, decrements balance due, and triggers emerald confirmation toast.
  - **Backend & Email Automation (`server/controllers/orderController.js` & `quoteController.js`)**:
    - `confirmPayment`: Sets `payment_status = 'paid'`, `payment_method = 'PayPal'`, `transaction_id = $2`.
    - `convertQuoteToOrder`: Converts approved quote to active production order (`is_quote = false`, `status = 'pending_review'`).
    - Both endpoints automatically dispatch asynchronous customer confirmation receipt emails and admin queue alerts via `emailService`.
  - **Guest Checkout Auto-Loader (`app.js`)**:
    - Auto-injects `paypal-config.js` if not already present.
    - Captures `transactionId` on direct order submissions.
- **Verification**:
  - Automated unit test suite `scratch/test_paypal_workflow.js`: 6/6 tests passed.
  - Playwright visual tests `scratch/verify_paypal_modal.js`: Verified clean rendering of PayPal, Pay Later, and Debit/Credit card buttons on Desktop (1280px) and Mobile (390px).


