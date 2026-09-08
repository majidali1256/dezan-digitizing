# System Architecture & Workflow Specification (ARCHITECTURE.md)

## 1. System Architectural Overview

The Dezan Digitizing platform combines a high-performance marketing web app with a secured **Role-Based Access Control (RBAC) Order Portal**. The architecture is engineered to run serverless on global CDN edges (Vercel & GitHub Pages) with an asynchronous Express.js REST API backed by an enterprise PostgreSQL database (InsForge BaaS).

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           PUBLIC FRONTEND                              │
 │   index.html · services.html · portfolio.html · pricing.html · app.js  │
 └────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      AUTHENTICATION & ROUTE GUARD                      │
 │                           portal-login.html                            │
 └──────────────┬─────────────────────┼────────────────────┬──────────────┘
                │                     │                    │
          Role: Client           Role: Admin          Role: Digitizer
                ▼                     ▼                    ▼
     ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
     │  CLIENT PORTAL   │  │  ADMIN BACKEND   │  │ WORKER WORKSPACE │
     │ - New Orders     │  │ - Master Control │  │ - Assigned Tasks │
     │ - Ticket History │  │ - All Revenue    │  │ - Zero Client PII│
     │ - Pay Invoices   │  │ - Assign Workers │  │ - Upload .dst    │
     │ - Download .dst  │  │ - Quality Check  │  │ - Mark Complete  │
     └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
              │                     │                     │
              ▼                     ▼                     │ (Masked Access)
     ┌────────────────────────────────────────┐           │
     │         public.orders Table            │           │
     │   (Client PII, Pricing, Master State)  │           │
     └──────────────────────┬─────────────────┘           │
                            │                             │
                            │ Synchronous DB query        │
                            ▼                             ▼
     ┌─────────────────────────────────────────────────────────┐
     │               /api/tasks (Sanitized View)               │
     │      (Order ID, Placement, Sizing, Raw Logo ONLY)       │
     └─────────────────────────────────────────────────────────┘
```

---

## 2. Zero-PII Worker Protection Model

### Problem Statement
In conventional single-collection architectures, client-side data masking (`display: none` or JavaScript object stripping) is vulnerable to browser DevTools inspection. Any digitizer can inspect outgoing WebSocket / REST packets and retrieve customer emails, company names, and pricing.

### Architectural Solution
We enforce strict server-side physical projection and sanitization:

1. **Master Commercial Table (`public.orders`)**:
   - Contains: Client UID, Full Name, Email, Phone, Company, Price, Currency, Payment Status, Gateway IDs.
   - Read Access: Admin (`role == 'admin'`) and the specific Client owner (`client_id = req.user.id`).
   - Digitizers are **cryptographically forbidden** from querying `/api/orders` directly.

2. **Worker Task Queue Endpoint (`/api/tasks`)**:
   - Projected columns: Task ID, Order Reference ID, Placement, Dimensions, Sizing, Technical Notes, Raw Logo Asset Links, and Deliverable Links.
   - Contains **ZERO** Client PII (no name, no email, no phone, no company) and **ZERO** pricing data.
   - Access: Admin and the assigned Digitizer worker (`assigned_digitizer_id = req.user.id`).

---

## 3. Order Lifecycle State Machine

```
 [Client Creates Order]
           │
           ▼
     (Pending Review)
           │
           ├──────────────────────────── Admin Rejection / Cancel
           ▼
     [Admin Assigns] ──► Task appears in worker queue (/api/tasks)
           │
           ▼
       (Assigned)
           │
           ▼
      (In Progress)   ──► Digitizer downloads raw logo, executes Wilcom stitches
           │
           ▼
      (QA Review)     ──► Digitizer uploads .dst & .emb deliverables
           │
           ├──────────────────────────── Admin requests fix / revision
           ▼
     [Admin Approves]
           │
           ▼
      (Completed)     ──► Client downloads final production files
```

### State Definitions

| State Code | Description | Authorized Actors |
| :--- | :--- | :--- |
| `pending_review` | Order placed by client; waiting for admin review & digitizer assignment. | Client, Admin |
| `assigned` | Admin has delegated the design specs to a specific digitizer. | Admin, Assigned Digitizer |
| `in_progress` | Digitizer has acknowledged the ticket and is actively digitizing. | Admin, Assigned Digitizer |
| `qa_review` | Digitizer has uploaded `.dst`/`.emb` files; waiting for admin quality approval. | Admin, Assigned Digitizer |
| `revision` | Admin or Client requested technical adjustments to density or sizing. | Client, Admin, Digitizer |
| `completed` | Design approved and invoice settled; deliverables unlocked for client download. | Client, Admin, Digitizer |
| `cancelled` | Order revoked or refunded. | Admin |

---

## 4. Storage Architecture & Security Isolation

Cloud Storage buckets and local uploads are partitioned into isolated paths:

- `/artworks/{orderId}/*`: Raw vector art (`.ai`, `.eps`, `.pdf`, `.png`).
  - Read: Admin, Client Owner, Assigned Digitizer.
  - Write: Client Owner (at creation time), Admin.
- `/deliverables/{orderId}/*`: Production stitch files (`.dst`, `.emb`, `.pxf`, `.pes`).
  - Write: Assigned Digitizer, Admin.
  - Read: Admin, Assigned Digitizer, Client Owner (when `status == 'completed'`).
- `/invoices/{orderId}/*`: Billing PDFs and receipts.
  - Read & Write: Admin and Client Owner only. **Digitizers have zero access.**

---

## 5. Technology Integration Stack

- **Authentication:** JWT (JSON Web Tokens) with bcrypt password hashing and Role-Based Access Control (`client`, `admin`, `digitizer`).
- **Database:** PostgreSQL (InsForge BaaS) with SSL connection pooling (`pg.Pool`).
- **Backend API:** Express.js 5.x REST API with Helmet security headers, CORS protection, and input sanitization.
- **File Storage:** S3-compatible cloud storage / Multer uploads with strict MIME-type validation.
- **Payments:** PayPal JavaScript SDK integration + Custom direct invoicing hooks.
- **Notifications:** Automated email triggers via Nodemailer / SMTP service.
- **Testing:** Native Node.js test runner (`node:test`) with end-to-end API coverage (`npm test`).

