# Dezan Digitizing — Premium Embroidery Digitizing & Vector Portal

[![Live on Vercel](https://img.shields.io/badge/Vercel-Live%20Production-black?style=flat-square&logo=vercel)](https://dezan-digitizing.vercel.app/)
[![Live on GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Production-blue?style=flat-square&logo=github)](https://majidali1256.github.io/dezan-digitizing/)
[![Design System](https://img.shields.io/badge/Design%20System-Awesome%20DESIGN.md-d4af35?style=flat-square)](DESIGN.md)

Welcome to the official repository for **Dezan Digitizing**, a premium embroidery digitizing and vector conversion agency operating since 2016. This platform offers high-precision embroidery files (`.dst`, `.emb`, `.pes`), vector artwork conversion, customer feedback showcases, and an automated, Role-Based Access Control (RBAC) order management portal.

---

## 🌟 Key Highlights

- **Aesthetic Excellence:** Built on a custom Dark Luxury design archetype (`#201d12` canvas with radiant `#d4af35` brand gold accents) following our 5-skill design engineering pipeline.
- **Role-Based Access Control (RBAC):** Three distinct user workspaces:
  1. **Client Portal:** Order submission, real-time ticket tracking, PayPal invoice payments, and final file downloads.
  2. **Admin Master Backend:** Complete pipeline control, global client directory, revenue analytics, and single-click digitizer assignment.
  3. **Digitizer Worker Workspace:** Restricted worker dashboard with **100% cryptographic data masking** (workers never see client PII or job pricing).
- **Zero Framework Footprint:** Pure Semantic HTML5, Vanilla JavaScript (ES6+), and utility-first Tailwind CSS. Ultra-fast page loads and zero compile overhead.
- **Dual Live Deployments:** Configured for automated static delivery on both **Vercel** and **GitHub Pages**.

---

## 🚀 Live Links

| Platform | URL | Purpose |
| :--- | :--- | :--- |
| **Vercel (Primary)** | [dezan-digitizing.vercel.app](https://dezan-digitizing.vercel.app/) | High-speed global edge deployment |
| **GitHub Pages** | [majidali1256.github.io/dezan-digitizing](https://majidali1256.github.io/dezan-digitizing/) | Continuous GitHub repository deployment |

---

## 📁 Repository Structure

```
├── .agents/
│   ├── rules/frontend_design_rules.md    # 5-Skill frontend quality standard
│   └── skills/                           # Local design, taste & verification skills
├── Client FeedBack/                      # High-resolution client review screenshots
├── Hero Page/                            # Hero slider & showcase graphic assets
├── images/                               # Brand logos and iconography
├── fiverr_portfolio_mockups/             # High-res multi-device showcase displays
├── DESIGN.md                             # 3-Layer Design Token Architecture
├── MEMORY.md                             # Project Memory & Single Source of Truth
├── ARCHITECTURE.md                       # RBAC Workflow & System Architecture
├── DATABASE_SCHEMA.md                    # Database Models & Security Rules
├── ROADMAP.md                            # Feature Milestones & Implementation Checklist
├── SECURITY.md                           # Strict Data Masking & RBAC Permissions Matrix
├── .env.example                          # Environment Variables Template
├── app.js                                # Core UI logic, interactive comparison sliders
├── styles.css                            # Custom CSS overrides and animations
├── vercel.json                           # Vercel routing & cache headers
└── *.html                                # Marketing pages (index, services, portfolio, etc.)
```

---

## 💻 Local Development Setup

Because this project uses vanilla web standards, no `npm install` or node bundler is required:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/majidali1256/dezan-digitizing.git
   cd "DEZAN Desitizing"
   ```

2. **Serve locally using any static file server:**
   ```bash
   # Using Python 3
   python3 -m http.server 8000

   # Or using Node.js
   npx serve .
   ```

3. **Open in browser:**
   Navigate to `http://localhost:8000` to view the website.

---

## 🔒 Security & Data Masking Guarantee

This portal strictly enforces data separation between clients and workers:
- Workers interact exclusively with sanitized tasks via the `digitizer_tasks` collection.
- Client identity (Name, Email, Phone, Company) and job prices are kept isolated in the `orders` collection and are inaccessible to digitizers at both the database and network levels.

For full technical specifications, consult [SECURITY.md](SECURITY.md) and [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md).

---

## 📬 Contact & Support
- **Owner & Master Digitizer:** Felix Dezan
- **Email:** `fdezan91@gmail.com`
- **Portfolio & Feedbacks:** [View Feedbacks](https://dezan-digitizing.vercel.app/portfolio.html)
