# Project Memory: Dezan Digitizing

## 1. Project Overview & Identity
- **Business Name:** Dezan Digitizing
- **Service Domain:** Premium Embroidery Digitizing & Vector Art Conversion (Operating since 2016)
- **Tagline:** High-Precision Stitch Craftsmanship & Vector Artwork
- **Primary Contacts:** `fdezan91@gmail.com`
- **Social Presence:** Facebook (`fdezan91`), Instagram (`dezan.digitizing`), TikTok (`@dezandigitizing`)

---

## 2. Live Deployments & Hosting
- **Vercel Production:** `https://dezan-digitizing.vercel.app/`
- **GitHub Pages Production:** `https://majidali1256.github.io/dezan-digitizing/`
- **GitHub Repository:** `https://github.com/majidali1256/dezan-digitizing.git` (Branch: `main`)
- **Configuration:** `vercel.json` (cleans URLs, sets caching, routes `/` to `index.html`)

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
    - **Bottom Line (Craft Subtitle)**: `<span class="text-[9.5px] sm:text-[10.5px] font-extrabold tracking-[0.18em] text-primary uppercase mt-1">Digitizing</span>`.
  - Nested within `<div class="flex flex-col text-left leading-none">` alongside the circular emblem `logo.png` (`w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover`).
  - Gives the brand a refined, high-fashion horology/atelier lockup with optimal visual hierarchy and enhanced horizontal clearance on mobile viewports.

---

## 5. Site Map & Route Architecture

### Public Marketing Pages
- `/index.html`: Home page (Hero with Before/After Comparison Slider: zero bounding box or card border around the astronaut patch, allowing the slider divider line to sweep end-to-end across the full artwork; bold typography with gold shine `Dezan Digitizing Service`; all 3 action buttons `Order Now`, `View Pricing`, and `Get Quote` arranged in a proud, touch-friendly side-by-side row on both mobile and desktop below the slider; Live Feedback Carousel; Trust reviews; the dedicated **"Why Choose Dezan Digitizing?"** section highlighting manual craftsmanship, production-ready stitch files, fast turnaround, and free revisions with 4 How-It-Works styled circular icon feature cards; and the modern, interactive **"Frequently Asked Questions" (FAQ) Accordion** at the bottom of the page featuring 5 rows with CSS grid transitions, rotating gold-accented chevrons, accessible `aria-expanded` attributes, and responsive typography).
- `/about.html`: Company history, experience, machinery/software standards (Wilcom, Tajima, Barudan).
- `/services.html`: Detailed service breakdowns (Left chest, Cap/Hat, 3D Puff, Jacket Back, Vectorizing). Clean hero without dark background image, side-by-side action buttons in a 2-col grid on mobile, and 2-column grid for Expert Services fitting above the fold on mobile without scrolling.
  - **Brand Color Harmonization**: Eliminated all mismatched dark brown / amber shades (`text-amber-800` on hero eyebrow and "Order Now" links), replacing with brand gold token `text-primary`. Harmonized Card 2 in the Transparent Pricing section (removed jarring solid yellow card and dark brown text `sm:bg-primary sm:text-background-dark`, aligned with clean card styling and 2px primary border), and updated pricing preview figures ($15 Left Chest/Hat, $25 Jacket Back / Large).
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
- `/contact.html`: Contact form for general inquiries, and authenticated "Request a Custom Quote" portal showcase. Legacy unauthenticated quote submission forms have been removed.
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
- `/portal-login.html`: Unified authentication page with automatic role routing, order intent banners, simplified client-only registration (role field removed; all public signups are assigned `role: 'client'`), and 1-click predefined staff & client logins (Master Admin: `admin@dezandigitizing.com`, Digitizer Worker: `worker.alex@dezandigitizing.com`, Demo Client: `client@falconapparel.com`).

#### Client Portal Suite (Modular Multi-Page Architecture)
Powered by shared stylesheet [`client-workspace.css`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-workspace.css) and shared controller [`js/client-workspace.js`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/js/client-workspace.js):
- **Sticky Segmented Navigation Bar (`#client-sticky-nav`)**: Sticky top sub-header with horizontal scroll on mobile, active indicator pill with brand gold fill (`#d4af35`), live notification badges, and "+ New Order" primary CTA button.
- **Fixed Bottom Navigation Dock (Mobile)**: 5 dedicated touch-friendly buttons (`Dashboard`, `Orders`, `Quotes`, `Billing`, `Settings`) with 44x44px minimum touch targets and automatic active state highlighting across all pages.
- **Dedicated Subpages**:
  1. [`client-portal.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-portal.html): Executive Dashboard overview with 3 quick-action cards (`Place Order`, `Request Quote`, `Track Order`), 4 metric cards (`Open Orders`, `Completed`, `Quotes`, `Balance Due`), and quick preview queues.
  2. [`client-orders.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-orders.html): Dedicated My Orders page with status filter pills (`All Orders`, `In Production`, `Delivered / Ready`, `Revisions`, `Payment Due`), live search input, order cards, physical stitch-out revision modal trigger, and order specification drawer.
  3. [`client-quotes.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-quotes.html): Dedicated Custom Quotes estimation page with 100% Free Digitizer Estimation guarantee banner, empty state, and 1-click quote creation.
  4. [`client-invoices.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-invoices.html): Dedicated Invoices & Billing page with financial metrics (`Total Invoiced`, `Total Settled`, `Balance Due`), itemized receipt cards with payment status tags, printable tax invoice modal, and PayPal settlement integration.
  5. [`client-profile.html`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/client-profile.html): Dedicated Profile & Settings page with contact info form, machinery defaults (default machine format `.DST`, target fabric), and password security.

#### Worker Studio Suite (Modular Multi-Page Architecture)
Powered by shared stylesheet [`worker-workspace.css`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/worker-workspace.css) and shared controller [`js/worker-workspace.js`](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/js/worker-workspace.js):
- **Sticky Segmented Navigation Bar (`#worker-sticky-nav`)**: Sticky studio sub-header with studio tokens, active indicator pill, and live task counters.
- **Fixed Bottom Navigation Dock (Mobile)**: 5 dedicated buttons (`Studio`, `Tasks`, `Archive`, `Specs`, `Settings`) with automatic active state highlighting.
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
  - **Header**: Logo, `Digitizer Studio` gold badge, `Client PII & Price Masked` security pill, Alex Miller profile trigger, and theme toggle.
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
  - `#worker-account-modal`: Alex Miller profile, Master Level 4 status, licensed workstation tools (Wilcom e4.5, Tajima Pulse), masking privacy contract status, and sign out.
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
    - Visual team performance and workload oversight cards for **Alex Miller**, **Sam Chen**, and **Maria Garcia**.
    - Displays active assignment counts, completed project totals, and core technical proficiencies.
    - Interactive **"View Assigned Orders"** button instantly isolates orders assigned to that specific worker in the main queue.
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
- **Brand Text Update to "DEZAN DIGITIZING" Across All Headers & Footers**:
  - Replaced standalone "DEZAN" brand title with full name **"DEZAN DIGITIZING"** across all 8 marketing and client-facing pages (`index.html`, `about.html`, `services.html`, `portfolio.html`, `pricing.html`, `contact.html`, `order-success.html`, `profile.html`).
  - Added `whitespace-nowrap text-base sm:text-lg font-black tracking-tight` ensuring zero layout wrapping on compact mobile devices (390px) while maintaining bold desktop presence.
  - Verified with Playwright visual screenshots on mobile and desktop.
- **Admin Orders Auto-Assign Worker Engine (`admin-orders.html`, `admin-portal.html`, `js/insforge-client.js`, `js/admin-workspace.js`)**:
  - **Single Digitizer Scope**: Directs all auto-assigned production tickets to primary digitizer **Alex Miller (Lead Digitizer)** (`id: '00000000-0000-0000-0000-000000000003'`, `worker.alex@dezandigitizing.com`).
  - **Interactive Auto-Assign Toggle**:
    - Prominent action button in top bar (`#admin-auto-assign-btn`), header bar (`#header-auto-assign-btn`), and Stage 1 "Needs attention" banner (`#stage-auto-assign-strip`) across both `admin-orders.html` and `admin-portal.html`.
    - **When ON**:
      - Incoming customer orders (guest checkout or authenticated client portal) skip manual admin review and directly assign to Alex Miller (`assigned_digitizer_id = '00000000-0000-0000-0000-000000000003'`, `status = 'in_progress'`).
      - Sanitized technical task is automatically upserted into `dezan_digitizer_tasks` (and remote InsForge PostgreSQL `digitizer_tasks`).
      - Realtime event `order_assigned` broadcasts across open tabs so worker portal (`worker-portal.html`) immediately receives the task without page reload.
      - Emerald active pill state with robot/lightning icon and live confirmation toasts.
    - **When OFF**:
      - Incoming bookings pause in `pending_review` with `assigned_digitizer_id = null`, requiring manual admin assignment.
    - **1-Click Batch Dispatch**:
      - Inside Stage 1 ("Needs attention"), added `#assign-all-pending-btn` displaying exact count (e.g. `Assign 7 to Alex Miller`) to dispatch all accumulated unassigned orders to Alex Miller in one click.
    - **Automated Verification**:
      - 100% verified with automated Playwright headless test (`scratch/test_auto_assign.js`): verified toggle ON, direct auto-assignment to Alex Miller, immediate presence in worker portal active queue, toggle OFF, and 1-click batch assignment.
- **Public Signup Role Restriction & Predefined Staff Logins (`portal-login.html`, `js/insforge-client.js`)**:
  - Removed user-facing account role dropdown from registration form on `portal-login.html`.
  - Public registration automatically and unconditionally assigns `role: 'client'`.
  - Admin (`admin@dezandigitizing.com`) and worker (`worker.alex@dezandigitizing.com`) accounts use predefined logins.
  - Enhanced `signIn()` in `js/insforge-client.js` with demo alias matching for instant staff access.
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


