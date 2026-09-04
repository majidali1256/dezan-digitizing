# Security Policy & Data Masking Invariants (SECURITY.md)
*Database & Auth Engine: InsForge (Agent-Native PostgreSQL BaaS with RLS)*

---

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

## 2. Technical Safeguards & Invariants in InsForge

### Invariant 1: PostgreSQL Row-Level Security (RLS) Isolation
- Data masking **MUST NOT** rely on UI-level hiding (`display: none`, opacity, or frontend JavaScript filtering).
- Workers must **NEVER** have `SELECT` permission on the `orders` table.
- Workers interact solely with the `digitizer_tasks` table, which is structurally devoid of client identity and financial fields.
- InsForge PostgreSQL RLS policy enforcement:
  ```sql
  -- Digitizers can only read tasks where assigned_digitizer_id matches their JWT uid
  CREATE POLICY "Digitizers can view only their assigned tasks"
  ON public.digitizer_tasks FOR SELECT
  USING (
      auth.uid() = assigned_digitizer_id
      OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
  ```

### Invariant 2: Storage Bucket Path Isolation
- Client vector files and worker deliverables are segregated into separate S3-compatible InsForge storage buckets.
- Digitizers are permitted read access only to `/artworks/{order_number}/*` for tasks assigned to them.
- Deliverable uploads are restricted strictly to valid stitch formats (`.dst`, `.emb`, `.pxf`, `.pes`).

### Invariant 3: Principle of Least Privilege
- **Clients** can only query records where `client_id == auth.uid()`.
- **Digitizers** can only query tasks where `assigned_digitizer_id == auth.uid()`.
- **Admin** is the single account with unrestricted master visibility across all tables and buckets.

---

## 3. RBAC Permissions Matrix

| Resource / Action | Client Role | Admin Role | Digitizer Worker Role |
| :--- | :---: | :---: | :---: |
| **Authenticate / Reset Password** | ✅ | ✅ | ✅ |
| **Read Client PII** | ✅ (Own PII) | ✅ (All) | ❌ **FORBIDDEN** |
| **Read Job Pricing & Revenue** | ✅ (Own Orders) | ✅ (All) | ❌ **FORBIDDEN** |
| **Query `orders` Table** | ✅ (Filtered to own UID) | ✅ (Full) | ❌ **FORBIDDEN** |
| **Query `digitizer_tasks` Table** | ❌ **FORBIDDEN** | ✅ (Full) | ✅ (Filtered to own UID) |
| **Assign Digitizer to Order** | ❌ | ✅ | ❌ |
| **Download Raw Logo Art** | ✅ (Own files) | ✅ (All) | ✅ (Assigned tasks only) |
| **Upload `.dst` / `.emb` Deliverables** | ❌ | ✅ | ✅ (Assigned tasks only) |
| **Mark Task Completed** | ❌ | ✅ | ✅ (Assigned tasks only) |
| **Approve Final QA & Release** | ❌ | ✅ | ❌ |

---

## 4. Zero-Leakage Audit Checklist (For Testing & Verification)

Before releasing any worker portal build to production, the following checks must pass:

- [ ] **Network Tab Inspection:** Log in as a Digitizer, load the dashboard, and inspect all incoming HTTP/REST requests. Confirm no client name, email, or price is present in any JSON payload.
- [ ] **Direct InsForge Query Test:** From the worker session console, attempt `insforge.from('orders').select('*')`. Verify that the request returns an empty set or `403 Forbidden` error.
- [ ] **Cross-Worker Query Test:** From worker A's session, attempt to query a task assigned to worker B. Verify that the query returns 0 results.
- [ ] **File Extension Validation:** Attempt to upload an `.exe`, `.js`, or unauthorized file format to the deliverables dropzone. Confirm rejection on both client and server.

---

## 5. Vulnerability Reporting
For any security or privacy inquiries, contact the administrator directly at:
- **Email:** `fdezan91@gmail.com`
- **Response SLA:** Within 24 hours
