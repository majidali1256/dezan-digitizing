# Project Roadmap & Implementation Milestones (ROADMAP.md)

## 📌 Status Summary
- **Current Milestone:** Phase 2 — RBAC Architecture & Database Foundation
- **Target Launch:** Dezan Digitizing Portal v2.0

---

## 🗺️ Implementation Phases

### Phase 1: Marketing Website & Portfolio (Completed ✅)
- [x] Responsive dark luxury design system (`#201d12` and `#d4af35`).
- [x] Touch-enabled interactive Vector vs Embroidery comparison slider.
- [x] 36-image touch carousel for verified customer feedback.
- [x] Comprehensive service showcases (Left chest, Cap, 3D puff, Jacket Back, Vectorizing).
- [x] Dual production deployment to **Vercel** (`dezan-digitizing.vercel.app`) and **GitHub Pages**.
- [x] Multi-device Fiverr gig presentation mockups.

---

### Phase 2: RBAC Architecture & Documentation Foundation (Current 🔄)
- [x] Establish single source of truth in `MEMORY.md`.
- [x] Draft high-level `README.md` with setup and deployment instructions.
- [x] Specify system data flow in `ARCHITECTURE.md`.
- [x] Define entity models, collections, and security rules in `DATABASE_SCHEMA.md`.
- [x] Define data masking invariants and compliance checklist in `SECURITY.md`.
- [ ] Connect Firebase configuration (`firebaseConfig.js`) or Supabase client.
- [ ] Deploy and verify database security rules.

---

### Phase 3: Authentication & Role Router
- [ ] Design `/portal/login.html` following `DESIGN.md` guidelines.
- [ ] Support Email/Password registration and login.
- [ ] Implement smart role detection router:
  - Role `'client'` $\rightarrow$ redirect to `/portal/client-dashboard.html`
  - Role `'admin'` $\rightarrow$ redirect to `/portal/admin-dashboard.html`
  - Role `'digitizer'` $\rightarrow$ redirect to `/portal/worker-dashboard.html`
- [ ] Session persistence and secure logout handlers.

---

### Phase 4: Client Portal (`client-dashboard.html`)
- [ ] Order creation modal/wizard with vector art drag-and-drop uploader.
- [ ] Real-time order status stepper (`Submitted` $\rightarrow$ `In Production` $\rightarrow$ `Quality Check` $\rightarrow$ `Ready`).
- [ ] Completed order card with one-click `.dst` and `.emb` downloads.
- [ ] PayPal invoice payment button integration.
- [ ] Revision request submission form.

---

### Phase 5: Admin Master Backend (`admin-dashboard.html`)
- [ ] KPI Overview Cards (Total Revenue, Active Orders, Unassigned Tickets, Average Turnaround).
- [ ] Global Orders Management Table with live filtering and search.
- [ ] "Assign Digitizer" modal with instant worker selection dropdown.
- [ ] Automatic task synchronization to `digitizer_tasks` collection upon assignment.
- [ ] Deliverable Quality Check approval & release triggers.
- [ ] Client management directory and worker directory.

---

### Phase 6: Digitizer Restricted Workspace (`worker-dashboard.html`)
- [ ] Worker task queue displaying only tickets assigned to `auth.uid`.
- [ ] Clean sanitized ticket view (Order ID, placement, sizing, instructions, raw artwork link).
- [ ] **Strict zero-leakage enforcement**: Verify no client PII or price fields are received over the wire.
- [ ] Single-click raw artwork download.
- [ ] Deliverables drag-and-drop dropzone strictly accepting `.dst` and `.emb` files.
- [ ] "Mark Completed" trigger that updates status and alerts Admin.

---

### Phase 7: Automation, Notifications & Visual QA
- [ ] EmailJS / SendGrid webhook triggers for order creation, assignment, and completion.
- [ ] Multi-viewport visual verification across Desktop (1512x982), Tablet (834x1112), and Mobile (390x844).
- [ ] End-to-end user testing of the full Client $\rightarrow$ Admin $\rightarrow$ Digitizer workflow loop.
- [ ] Production deployment to Vercel and GitHub repository sync.
