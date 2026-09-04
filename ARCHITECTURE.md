# System Architecture & Workflow Specification (ARCHITECTURE.md)

## 1. System Architectural Overview

The Dezan Digitizing platform combines a high-performance marketing web app with a secured **Role-Based Access Control (RBAC) Order Portal**. The architecture is engineered to run serverless on global CDN edges (Vercel & GitHub Pages) with an asynchronous cloud backend (Cloud Firestore / Firebase Auth / Cloud Storage).

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           PUBLIC FRONTEND                              │
 │   index.html · services.html · portfolio.html · pricing.html · app.js  │
 └────────────────────────────────────┬───────────────────────────────────┘
                                      │
                                      ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      AUTHENTICATION & ROUTE GUARD                      │
 │                         /portal/login.html                             │
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
     │         orders Collection              │           │
     │   (Client PII, Pricing, Master State)  │           │
     └──────────────────────┬─────────────────┘           │
                            │                             │
                            │ Sync sanitized task         │
                            ▼                             ▼
     ┌─────────────────────────────────────────────────────────┐
     │             digitizer_tasks Collection                  │
     │      (Order ID, Placement, Sizing, Raw Logo ONLY)       │
     └─────────────────────────────────────────────────────────┘
```

---

## 2. The Two-Collection Physical Separation Model

### Problem Statement
In conventional single-collection architectures, client-side data masking (`display: none` or JavaScript object stripping) is vulnerable to browser DevTools inspection. Any digitizer can inspect outgoing WebSocket / REST packets and retrieve customer emails, company names, and pricing.

### Architectural Solution
We enforce physical separation into two distinct collections with non-overlapping access policies:

1. **`orders` Collection (Private Commercial Record)**:
   - Contains: Client UID, Full Name, Email, Phone, Company, Price, Currency, Payment Status, Gateway IDs.
   - Read Access: Admin (`role == 'admin'`) and the specific Client owner (`request.auth.uid == resource.data.clientId`).
   - Digitizers are **cryptographically blocked** from querying this collection.

2. **`digitizer_tasks` Collection (Sanitized Operational Queue)**:
   - Contains: Task ID, Order Reference ID, Placement, Dimensions, Sizing, Technical Notes, Raw Logo Asset Link, and Deliverable Upload Links.
   - Contains **ZERO** Client PII (no name, no email, no company) and **ZERO** pricing data.
   - Read Access: Admin and the assigned Digitizer (`request.auth.uid == resource.data.assignedDigitizerId`).

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
     [Admin Assigns] ──► Sync sanitized task to digitizer_tasks
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

Cloud Storage buckets are partitioned into isolated paths:

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

- **Authentication:** Firebase Authentication (Email/Password + Google OAuth) with Role Claims.
- **Database:** Cloud Firestore with real-time listeners for instant ticket updates.
- **File Storage:** Firebase Cloud Storage with granular security rules.
- **Payments:** PayPal JavaScript SDK + Direct invoicing hooks.
- **Notifications:** EmailJS / Webhooks for automated status updates.
