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
- **Backend / Database Engine:** InsForge BaaS (`https://e8rw998g.us-east.insforge.app` with PostgreSQL, Row-Level Security, JWT Auth, and S3 Storage)
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

---

## 5. Site Map & Route Architecture

### Public Marketing Pages
- `/index.html`: Home page (Hero with Before/After Comparison Slider: zero bounding box or card border around the astronaut patch, allowing the slider divider line to sweep end-to-end across the full artwork; bold typography with gold shine `Dezan Digitizing Service`; all 3 action buttons `Order Now`, `View Pricing`, and `Get Quote` arranged in a proud, touch-friendly side-by-side row on both mobile and desktop below the slider, Services preview, Live Feedback Carousel, Trust stats).
- `/about.html`: Company history, experience, machinery/software standards (Wilcom, Tajima, Barudan).
- `/services.html`: Detailed service breakdowns (Left chest, Cap/Hat, 3D Puff, Jacket Back, Vectorizing).
- `/portfolio.html`: High-resolution gallery and customer feedback showcase.
- `/pricing.html`: Dedicated flat-rate Pricing showcase in responsive 2-column grid layout, strictly adhering to Dezan's brand color scheme (Dezan Gold `#d4af35`, Dark Luxury `#201d12`, Card Dark `#16140c`, Warm Canvas `#f8f7f6`):
  - **Hero**: "QUALITY DIGITIZING. REAL PEOPLE.", "Simple Flat-Rate Pricing", subtitle "Professional embroidery digitizing with clean, honest pricing.", 3 circular icon badges (Next Day Turnaround, Digitized by hand - no auto conversion, Order history and online downloads), and real stitch proof embroidery patch visual floating freely with zero bounding box or card border.
  - **Digitizing 2-Column Grid (Compact & Centered)**: Centered `max-w-2xl mx-auto` container with refined proportions (20px padding, 44px icon badges, 32-36px pricing typography) preventing wide/bloated cards:
    - Card 1: **$15 Hat / Left Chest Logos** (Up to 5.5 inches) with compact bespoke SVG icon featuring baseball cap and collared polo shirt.
    - Card 2: **$25 Larger Designs** (Over 5.5 inches) with compact bespoke SVG icon featuring varsity/bomber jacket and back embroidery emblem.
    - Full-width Trust Bar: "Flat rate pricing you can depend on. Zero hidden stitch-count charges."
  - **Vector Art 2-Column Grid (Compact & Centered)**: Centered `max-w-2xl mx-auto` container:
    - Card 1: **$15 Simple Vector Redraw** with bespoke SVG bezier pen tool icon.
    - Card 2: **$25 Complex Vector Redraw** with bespoke SVG multilayer mascot shield icon.
  - **Responsive Hero & Above-The-Fold Pricing**:
    - **Mobile First-Screen Parity (`media_1788643251172.png`)**:
      - Hero layout on mobile is side-by-side (`grid grid-cols-12`): Left column (`col-span-7`) hosts typography and 3 compact circular feature bullets (Next Day Turnaround, Digitized by hand, Order history); Right column (`col-span-5`) hosts the pure embroidery patch logo freely floating with zero surrounding box or card container.
      - Immediately below the hero, the "OUR PRICING / Digitizing Pricing" header and both pricing cards (`Hat / Left Chest Logos $15` and `Larger Designs $25`) display as sleek, horizontal pill rows (`flex items-center justify-between`) followed by the compact trust bar ("Flat rate pricing you can depend on.") and subtle tagline ("BRANDS LOOK BETTER HERE").
      - **Dynamic Authentication Banner Placement & Styling**: Restored to its original placement right inside the Hero section (immediately above Section 1: Digitizing Pricing). Styled identically to laptop screen on all devices with single horizontal row layout (`flex items-center justify-between`), subtle sage emerald background (`bg-emerald-500/12 dark:bg-emerald-950/40 border border-emerald-500/30`), verified user shield icon, client greeting, and deep forest green action button (`bg-[#064e3b]` with `New Order +`).
      - Zero vertical scrolling required to view prices on mobile viewports (e.g. 390x844).
    - **Desktop Grid Parity**: Larger screens (`md:`) seamlessly render the full 2-column feature checklist cards with action buttons and spacious trust bars.
  - **Strictly Pricing Only**: Zero embedded order forms or quote submission inputs. Authenticated client banners and action buttons route to `client-portal.html` (for logged-in clients) or `portal-login.html?redirect=...` (for unauthenticated visitors).
  - **Instant Visibility & Zero CLS**: Removed `.reveal` opacity blocking so all cards and sections render immediately across all devices, with full light/dark mode contrast parity verified via Playwright visual verification across Desktop (1440x900), Tablet (834x1112), and Mobile (390x844).
- `/contact.html`: Contact form for general inquiries, and authenticated "Request a Custom Quote" portal showcase. Legacy unauthenticated quote submission forms have been removed.
- `/order-success.html`: Order confirmation receipt page with transaction lookup parameters.

### Client Authentication Gate & Order / Quote Dispatcher (Implemented)
- **Universal Order & Quote Authentication Gates (`window.handleOrderClick`, `window.handleQuoteClick`)**:
  - Both **orders** and **quotes** can strictly only be submitted after client authentication.
  - All "Order Now" CTAs across the site (`index.html` Hero, `services.html` service cards, `pricing.html` price cards, and `profile.html`) verify client session state before ordering.
  - All "Get Quote" / "Request a Quote" CTAs (`index.html`, `about.html`, `portfolio.html`, `pricing.html`, `contact.html`) verify client session state before requesting quotes.
  - **Logged-Out Behavior**: Redirects directly to `portal-login.html?redirect=new_order` or `portal-login.html?redirect=request_quote` with optional `&service=...` and `&plan=...` parameters.
  - **Contextual Notice on Login**: `portal-login.html` presents a dedicated `#order-intent-banner` dynamically tailored to whether the user is signing in to place an order or request a custom quote.
  - **Seamless Post-Login Handoff**: Once authenticated (via email/password, new registration, or 1-click demo client), `window.insforgeClient.redirectToDashboard` routes directly to `client-portal.html?action=new_order` or `client-portal.html?action=request_quote`.
  - **Automatic Modal Launch**: `client-portal.html` detects `action=new_order` or `action=request_quote`, automatically launches the interactive wizard pre-selected to the requested service/plan, and cleans the URL query parameters.
  - **Logged-In Fast-Track**: If the client is already authenticated, clicking "Order Now" or "Get Quote" on any marketing page bypasses login and goes straight to the portal with the respective wizard open.

### Role-Based Order Portal (Implemented & Live)
- `/portal-login.html`: Unified authentication page with automatic role routing, order intent banners, and 1-click test switcher.
- `/client-portal.html`: Redesigned Client Portal (Matching user's reference mockup with warm Dezan gold theme):
  - **Header**: Bold title + "Track orders, pay invoices, and request quotes easily."
  - **3 Quick-Action Cards**: Place Order, Request Quote, Track Order.
  - **4 Stat Metric Badges**: Open Orders, Completed, Quotes, **Balance Due** (Dynamically calculates total outstanding balance for unpaid/pending orders; displays rose badge with count `X Due` when > $0, or emerald `All settled` when $0.00; clickable to instantly filter by due payments).
  - **Adaptive 2-Stage Place Order Flow**:
    - **Step 1 (Clean Choice)**: Modal opens showing *only* "What type of work do you need?" with two large cards: **Embroidery Digitizing** and **Vector Art Conversion**. All detailed form inputs stay completely hidden until a card is selected.
    - **Step 2 (Tailored Form)**:
      - **Digitizing Specific Controls**: Job Name/Reference, Target Placement, Fabric/Garment Material (Cotton/Pique, 6-Panel Structured Cap, Beanie, Fleece, Denim, Leather), Target Size ($W \times H$ in/cm), Required Machine File Formats (DST, EMB, PES, EXP, CND, JEF), Special Technical Options (3D Puff $+ \$5$, Applique, Match Sample, Flame Specs), Drag-and-drop artwork uploader, Production Notes, and Turnaround Speed (Standard vs. Rush $+ \$10$).
      - **Vector Specific Controls**: Job Name, Intended Vector Usage, Formats (AI, EPS, SVG, PDF, CDR, PNG), Drag-and-drop uploader, Production Notes.
      - **Dynamic Price Engine**: Updates price and itemized breakdown live as options and turnaround speeds change.
      - **Service Switcher Banner**: Sticky top banner allowing clients to switch service type instantly without page reload.
  - **Foolproof Revision & Physical Stitch-Out Feedback Engine**:
    - Completed orders render side-by-side action buttons: Primary `[ Download Files / DST ]` and Secondary `[ Request a Revision ]`.
    - Clicking `[ Request a Revision ]` opens `#revision-request-modal`:
      - Specific feedback note textarea (e.g. pull compensation, lettering density, cap seam curvature).
      - Picture submission dropzone specifically for uploading a physical garment/cap sew-out defect photo with live thumbnail preview.
      - 1-click submit updating order status to `revision_requested`, broadcasting event, and auto-routing to assigned digitizer.
      - Order card immediately updates with pulsing amber `Revision In Progress` badge and client feedback callout.
  - **Due Payment & Incomplete Order Flow**:
    - Orders created with deferred payment or incomplete checkouts have `payment_status: 'unpaid'`.
    - Unpaid order cards feature a glowing rose accent border, a `Payment Due` badge, and an amber `Pay Now ($XX.00)` button.
    - **1-Click Checkout Modal (`#checkout-payment-modal`)**: Tabbed payment interface supporting PayPal and Credit Card with instant 256-bit encrypted simulated gateway, toast alert notifications, and real-time InsForge PostgreSQL patch updates.
    - **New Order Wizard**: Allows clients to select payment preference ("Pay on Invoice (Due Later)" vs. "Pay Upfront Now").
  - **Sectioned Layout**:
    - **Open Orders**: Dynamic cards with Order #, Date, Job Name, Price, Status Badge, Pay Now button (if unpaid), Revision in Progress badge, and View Details.
    - **Completed Orders**: Machine deliverable downloads (`.DST`, `.EMB`) + `[ Request a Revision ]` + View Invoice & Receipt.
    - **Quotes**: Quote estimation status or clean empty state with `+ Request Quote` action.
  - **Client Invoice & Printable Receipt Modal**: Official itemized tax invoice and work order with `@media print` support, unpaid alert banner, and direct "Pay Balance Due" action button.
  - **Header & Navigation Refinement (Implemented)**:
    - **Header**: Features side-by-side action buttons: Primary Gold `[ + New Order ]` (`#open-new-order-btn`), Secondary Outline `[ 📄 Quote ]` (`#open-new-quote-btn`), Desktop Profile button (`#header-account-btn` with client monogram avatar and name), Desktop Settings button (`#header-settings-btn` with gear icon), and dark mode toggle.
    - **Fixed Bottom Navigation Dock (5 Distinct Buttons)**: Full access suite with 5 dedicated tabs:
      1. **Home**: Quick scroll to dashboard top overview.
      2. **Orders**: Direct anchor jump to active & open orders.
      3. **Quotes**: Direct anchor jump to quotes queue.
      4. **Profile**: Dedicated button with client initials monogram avatar (`JF`), opens `#client-profile-modal` strictly containing **only profile and machinery preferences**: Full Name, Company/Brand, Locked Primary Email, Phone/WhatsApp, and Production & Machinery Preferences (Default Machine Format `.DST`, Default Fabric, Preferred Turnaround Speed).
      5. **Settings**: Dedicated button with gear icon, opens `#client-settings-modal` strictly containing **only portal settings and security**: Appearance & Theme switchers (Light vs. Dark buttons), Portal Password Change (with live password strength meter and match indicator), Email Notification Preferences (Orders, Revisions, Invoices), and Active Session Management with Sign Out.
  - **Distinct Quote vs. Order Architecture**:
    - **Shared Unified Technical Specs**: Both Quote and Order modes share the exact same comprehensive technical specifications (Embroidery Digitizing vs. Vector Art, placement, garment fabric, dimensions, file formats, 3D puff, turnaround speed, and artwork upload dropzone).
    - **Order Flow (Mandatory Upfront Payment)**: Price summary and turnaround options are active. Dual payment term radios were removed; orders strictly require upfront payment to initiate production (`status: 'pending_review'`), launching the secure checkout modal immediately upon placement.
    - **Quote Flow (Zero Upfront Payment & Admin Price Appraisal)**: Custom/personalized pieces use the Quote vehicle where no upfront payment is charged. Price breakdown is hidden and reassurance banner confirms free appraisal. Quotes are created with prefix `QUO-XXXX`, `is_quote: true`, and `status: 'quote_requested'`.
    - **Admin Pricing Workflow (`admin-portal.html`)**: Stage 3 ("Incomplete Bookings, Payment Due & Quotes") features an amber `[ Give Price ]` action button for quotes, opening `#set-quote-price-modal`. The admin specifies approved USD price and notes (e.g., stitch density breakdown). Submitting patches InsForge PostgreSQL, updates status to `quote_ready`, and broadcasts `quote_priced`.
    - **Client Quote Conversion Flow (`client-portal.html`)**: Real-time listeners detect quote pricing, displaying a pulsing `• Price Ready: $XX.XX` badge, Admin Pricing Note callout, and a prominent `[ Pay $XX.XX & Start Order ]` CTA. Paying via `#checkout-payment-modal` automatically converts the quote into an active production order (`is_quote: false`, `status: 'pending_review'`).
  - **Comprehensive Client Account & Security Suite (`#account-modal`)**:
    - **Dock Integration**: Accessible directly from the bottom dock `Settings` tab.
    - **3-Tab Modular Architecture**:
      1. **Profile & Machinery Defaults (`#client-tab-profile`)**: Edit Full Name, Company / Brand Name, primary contact Phone / WhatsApp, preferred embroidery machine file format (`.DST`, `.EMB`, `.PES`, `.EXP`, `.JEF`, `.VP3`, `.AI Vector`), default fabric/garment type (Pique Cotton, Structured Twill Caps, Fleece, Dri-FIT, Canvas, Patches), and default turnaround SLA speed (`standard`, `rush`, `urgent`). Displays locked primary billing email and verified client badge. Synchronizes with session storage, `localStorage`, and InsForge PostgreSQL backend.
      2. **Password & Credential Security (`#client-tab-security`)**: Secure password change flow featuring current password verification, new password with dynamic 4-segment strength meter (Too Weak, Weak, Good, Strong), confirmation password match validator with live visual feedback, show/hide eye toggle buttons, and toast alerts.
      3. **Account & Billing Overview (`#client-tab-overview`)**: Monogram avatar, Client ID `#FC-882`, verified badge, lifetime order volume counter, live balance due metric, Net 30 billing terms, VIP fast-track SLA badge, and portal sign-out.
- `/worker-portal.html`: Redesigned Digitizer Studio:
  - **Revision & Sew-Out Inspection Queue**: Tasks with status `revision_requested` display a prominent amber border with subtle glow, a pulsing `⚠️ Revision Requested` badge, and an eye-catching `Client Physical Stitch-Out Revision Feedback` callout containing the client's exact instructions and physical garment photo thumbnail.
  - **Click-to-Zoom Modal (`#stitch-out-zoom-modal`)**: Digitizers can click any sew-out photo to inspect embroidery defects at maximum resolution.
  - **Revised Deliverables Submission**: Primary action button changes to `Submit Revised Deliverables` to upload version 2 stitch files with InsForge Storage and database sync.
  - **Strict Data Masking (Zero-Leakage Compliance)**: Customer personal identity (`client_name`, `client_email`, `client_company`) and pricing/payment status are 100% masked from workers at both the UI and database levels.
  - **Studio Controls**: 3 quick-action cards, 4 production metric badges, instant search & filter toolbar (with `⚠️ Revision Requested` filter), technical work order specs modal, machine format cheatsheet modal, worker profile modal, and mobile bottom navigation dock.
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
