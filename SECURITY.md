# Security Policy & Data Masking Invariants (SECURITY.md)

## 1. Security Core Mandate: Zero-Leakage Data Masking

The primary security objective of the Dezan Digitizing portal is **absolute confidentiality of client PII and commercial pricing from digitizer workers**.

> [!CAUTION]
> **Data Masking Rule**: At no point may a Digitizer's browser receive, cache, or query any packet containing:
> 1. Client Full Name
> 2. Client Email Address
> 3. Client Phone Number
> 4. Client Company / Brand Name
> 5. Job Pricing, Quote Amount, or Revenue figures
> 6. Invoice Status or Payment Gateway Transaction IDs

---

## 2. Technical Safeguards & Invariants

### Invariant 1: Database-Level Isolation
- Data masking **MUST NOT** rely on UI-level hiding (`display: none`, opacity, or frontend JavaScript filtering).
- Workers must **NEVER** have read permission on the `orders` collection.
- Workers interact solely with the `digitizer_tasks` collection, which is structurally devoid of client identity and financial fields.

### Invariant 2: Storage Bucket Path Isolation
- Client vector files and worker deliverables are segregated into separate paths.
- Digitizers are permitted read access only to `/artworks/{orderId}/*` for tasks assigned to them.
- Invoices and billing PDFs stored in `/invoices/{orderId}/*` are strictly blocked from all digitizer accounts via Cloud Storage rules:
  ```
  match /invoices/{orderId}/{fileName} {
    allow read, write: if request.auth != null && (
      getUserRole() == 'admin' || 
      isOrderOwner(orderId)
    );
  }
  ```

### Invariant 3: Principle of Least Privilege
- **Clients** can only query records where `clientId == request.auth.uid`.
- **Digitizers** can only query tasks where `assignedDigitizerId == request.auth.uid`.
- **Admin** is the single account with unrestricted master visibility across all collections.

---

## 3. RBAC Permissions Matrix

| Resource / Action | Client Role | Admin Role | Digitizer Worker Role |
| :--- | :---: | :---: | :---: |
| **Authenticate / Reset Password** | ✅ | ✅ | ✅ |
| **Read Client PII** | ✅ (Own PII) | ✅ (All) | ❌ **FORBIDDEN** |
| **Read Job Pricing & Revenue** | ✅ (Own Orders) | ✅ (All) | ❌ **FORBIDDEN** |
| **Read `orders` Collection** | ✅ (Filtered to own UID) | ✅ (Full) | ❌ **FORBIDDEN** |
| **Read `digitizer_tasks` Collection** | ❌ **FORBIDDEN** | ✅ (Full) | ✅ (Filtered to own UID) |
| **Assign Digitizer to Order** | ❌ | ✅ | ❌ |
| **Download Raw Logo Art** | ✅ (Own files) | ✅ (All) | ✅ (Assigned tasks only) |
| **Upload `.dst` / `.emb` Deliverables** | ❌ | ✅ | ✅ (Assigned tasks only) |
| **Mark Task Completed** | ❌ | ✅ | ✅ (Assigned tasks only) |
| **Approve Final QA & Release** | ❌ | ✅ | ❌ |

---

## 4. Zero-Leakage Audit Checklist (For Testing & Verification)

Before releasing any worker portal build to production, the following checks must pass:

- [ ] **Network Tab Inspection:** Log in as a Digitizer, load the dashboard, and inspect all incoming WebSocket and HTTP requests. Confirm no client name, email, or price is present in any JSON payload.
- [ ] **Direct Firestore Read Test:** From the worker session console, attempt `db.collection('orders').get()`. Verify that the request is rejected with `permission-denied`.
- [ ] **Cross-Worker Query Test:** From worker A's session, attempt to query a task assigned to worker B. Verify that the query returns 0 results or throws `permission-denied`.
- [ ] **File Extension Validation:** Attempt to upload an `.exe`, `.js`, or unauthorized file format to the deliverables dropzone. Confirm rejection on both client and server.

---

## 5. Vulnerability Reporting
For any security or privacy inquiries, contact the administrator directly at:
- **Email:** `fdezan91@gmail.com`
- **Response SLA:** Within 24 hours
