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

## Universal Image Format Directive: Always Use WebP

- **Mandatory WebP Format**: For every picture added to this site/project (heroes, mockups, logos, thumbnails, reviews, portfolio showcases, service banners, and icons), ALWAYS use the modern **WebP (`.webp`)** format.
- **Benefits**: Maximizes loading speed, minimizes payload size (typically 70%+ bandwidth savings), eliminates layout shifts (CLS), and maintains pristine high-resolution visual quality (lossless or 90-95% quality with alpha transparency preserved).
- **Tooling & Conversion**: When new image assets are introduced in PNG or JPEG format, convert them immediately to `.webp` (using Python `Pillow` with `quality=95, alpha_quality=100` for graphics/logos or `quality=85-90` for photography/renders), and ensure HTML/CSS references point directly to `.webp`.

## Strict Git Push Safety Mandate: Never Push Automatically

- **NEVER Push Autonomously**: NEVER run `git push` on your own under any circumstance for any project. Repositories are linked directly to live production hosting (e.g. Vercel, GitHub Pages, CI/CD pipelines), so pushing triggers immediate live deployments.
- **Mandatory User Confirmation**: After making changes and testing them locally, ALWAYS report the changes and explicitly ASK the user for permission before pushing to GitHub.
- **Workflow Protocol**:
  1. Make and test changes locally.
  2. Summarize what was changed and verified.
  3. Ask the user if they would like to push to GitHub or review locally first.
  4. Run `git push` ONLY when the user gives explicit consent.
