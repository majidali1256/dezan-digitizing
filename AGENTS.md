# AGENTS.md

<!-- INSFORGE:START -->
## InsForge backend

This project uses [InsForge](https://insforge.dev): an all-in-one, open-source Postgres-based backend (BaaS) that gives this app a database, authentication, file storage, edge functions, realtime, an AI model gateway, and payments through one platform.

- **Project:** **dezan-digitizing** (API base `https://e8rw998g.us-east.insforge.app`)
- **Skills:** these InsForge skills are installed for supported coding agents. Reach for them before implementing any InsForge feature instead of guessing the API:
  - `insforge`: app code with the `@insforge/sdk` client (database CRUD, auth, storage, edge functions, realtime, AI, email, and Stripe payments).
  - `insforge-cli`: backend and infrastructure via the `insforge` CLI (projects, SQL, migrations, RLS policies, storage buckets, functions, secrets, payment setup, schedules, deploys).
  - `insforge-debug`: diagnosing failures (SDK/HTTP errors, RLS denials, auth and OAuth issues) and running security or performance audits.
  - `insforge-integrations`: wiring external auth providers (Clerk, Auth0, WorkOS, Better Auth, etc.) for JWT-based RLS, or the OKX x402 payment facilitator.
  - `find-skills`: discovering additional skills on demand.
- **Credentials:** app code reads keys from `.env.local`; the CLI reads `.insforge/project.json`. Never hardcode or commit keys.

Key patterns:

- Database inserts take an array: `insert([{ ... }])`.
- Reference users with `auth.users(id)`; use `auth.uid()` in RLS policies.
- For storage uploads, persist both the returned `url` and `key`.
<!-- INSFORGE:END -->

## Universal Image Optimization Directive: WebP by Default & SVG Preservation

- **Optimized WebP by Default for Raster**: Use optimized WebP (`.webp`) for all raster website images by default (heroes, mockups, photos, stitchouts, thumbnails). Slashes payloads by 70%+ while preserving crystal-clear visual quality and alpha transparency.
- **Preserve SVG for Vector Graphics**: Preserve native **SVG (`.svg`)** for vector graphics, icons, badges, line art, and vector logos. Do NOT rasterize clean SVG vectors into WebP.
- **Retain Originals**: Always retain master/original files (PNG, JPG, PSD, SVG) on disk as source archives and fallbacks. Never destroy original source files.
- **Avoid Unnecessary Re-encoding**: Do not re-encode or re-compress image assets that are already optimized WebP or clean SVG to prevent generational quality loss and compression artifacts.
- **Pre-Replacement Verification**: Thoroughly verify visual quality, sharpness, alpha channel rendering, intrinsic dimensions (`naturalWidth`/`naturalHeight`), and aspect ratios before replacing or swapping assets in production markup to guarantee zero layout shifts (CLS).
- **Tooling & Encoding Guidelines**: When new raster image assets are introduced in PNG or JPEG format, convert them to `.webp` (using Python `Pillow` with `quality=95, alpha_quality=100` for graphics/logos or `quality=85-90` for photography/renders), and ensure HTML/CSS references point directly to `.webp`.


## Strict Git Push Safety Mandate: Never Push Automatically

- **NEVER Push Autonomously**: NEVER run `git push` on your own under any circumstance for any project. Repositories are linked directly to live production hosting (e.g. Vercel, GitHub Pages, CI/CD pipelines), so pushing triggers immediate live deployments.
- **Mandatory User Confirmation**: After making changes and testing them locally, ALWAYS report the changes and explicitly ASK the user for permission before pushing to GitHub.
- **Workflow Protocol**:
  1. Make and test changes locally.
  2. Summarize what was changed and verified.
  3. Ask the user if they would like to push to GitHub or review locally first.
  4. Run `git push` ONLY when the user gives explicit consent.

## Universal Senior Engineering Development Rules

- **Full Specification**: Adhere strictly to the 10 Universal Development Rules detailed in [.agents/rules/universal_development_rules.md](file:///Users/macbookair/VS%20CODE%20PROJECTS/DEZAN%20Desitizing/.agents/rules/universal_development_rules.md) and globally at `~/.gemini/config/rules/universal-development-rules.md`.
- **Core Principles**: Understand first, make focused complete changes, respect existing design, protect security and data, handle real-world failure, verify proportionally, keep quality practical, keep documentation useful, work within authorization, and finish honestly.


