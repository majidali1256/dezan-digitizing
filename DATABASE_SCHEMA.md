# Database Schema & Security Rules Specification (DATABASE_SCHEMA.md)

## 1. Entity Model Overview

The database uses three primary operational collections and one administrative audit log collection:

```
 ┌─────────────────┐       1:N       ┌─────────────────┐
 │      users      ├─────────────────┤     orders      │
 └────────┬────────┘                 └────────┬────────┘
          │                                   │
          │ 1:N                               │ 1:1
          ▼                                   ▼
 ┌─────────────────┐                 ┌─────────────────┐
 │ digitizer_tasks │◄────────────────┤   audit_logs    │
 └─────────────────┘                 └─────────────────┘
```

---

## 2. Collection Schemas

### 2.1 `users` Collection
Stores authentication metadata, assigned roles, and user profile information.

```json
{
  "uid": "USER_FIREBASE_AUTH_UID_STRING",
  "role": "client", // Enum: "client" | "admin" | "digitizer"
  "email": "customer@example.com",
  "displayName": "John Doe",
  "company": "Falcon Apparel Co.", // Optional, Client role only
  "phone": "+1 555-0199", // Optional
  "status": "active", // Enum: "active" | "pending" | "suspended"
  "createdAt": "TIMESTAMP",
  "lastLoginAt": "TIMESTAMP"
}
```

### 2.2 `orders` Collection (Master Commercial Records)
> [!CAUTION]
> **Strict Authorization**: Readable only by `role == 'admin'` or `clientId == request.auth.uid`. Digitizers have ZERO read permissions on this collection.

```json
{
  "orderId": "ORD-2026-8841",
  "clientId": "CLIENT_USER_UID",
  "clientName": "John Doe",
  "clientEmail": "customer@example.com",
  "clientCompany": "Falcon Apparel Co.",
  "serviceType": "Digitizing", // "Digitizing" | "Vectorizing"
  "plan": "Left Chest / Hat",
  "projectName": "Falcon Crest Left Chest",
  "placement": "Left Chest",
  "sizing": "3.5\" W x 2.2\" H",
  "fileFormat": "DST, EMB",
  "instructions": "Need 3D puff on the letter 'F', 75/11 needle density for pique polo fabric.",
  "rawArtworkFiles": [
    {
      "name": "falcon_logo.ai",
      "url": "https://firebasestorage.googleapis.com/.../artworks/falcon_logo.ai",
      "size": 1548290,
      "type": "application/postscript",
      "uploadedAt": "TIMESTAMP"
    }
  ],
  "pricing": {
    "amount": 25.00,
    "currency": "USD",
    "paymentStatus": "paid", // "unpaid" | "invoice_sent" | "paid" | "refunded"
    "paymentMethod": "PayPal",
    "transactionId": "PP-9823481239"
  },
  "assignment": {
    "digitizerId": "WORKER_USER_UID",
    "digitizerName": "Alex M.",
    "assignedAt": "TIMESTAMP"
  },
  "status": "in_progress", // "pending_review" | "assigned" | "in_progress" | "qa_review" | "completed" | "revision"
  "deliverables": [
    {
      "format": "dst",
      "url": "https://firebasestorage.googleapis.com/.../deliverables/falcon_crest.dst",
      "name": "falcon_crest.dst",
      "size": 24900,
      "uploadedAt": "TIMESTAMP"
    },
    {
      "format": "emb",
      "url": "https://firebasestorage.googleapis.com/.../deliverables/falcon_crest.emb",
      "name": "falcon_crest.emb",
      "size": 128400,
      "uploadedAt": "TIMESTAMP"
    }
  ],
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

### 2.3 `digitizer_tasks` Collection (Sanitized Worker Queue)
> [!IMPORTANT]
> **Data Masking Guarantee**: Contains NO client name, NO email, NO company, and NO pricing data. Digitizers can only read documents where `assignedDigitizerId == request.auth.uid`.

```json
{
  "taskId": "TSK-2026-8841",
  "orderId": "ORD-2026-8841", // Reference code
  "assignedDigitizerId": "WORKER_USER_UID",
  "serviceType": "Digitizing",
  "placement": "Left Chest",
  "sizing": "3.5\" W x 2.2\" H",
  "fileFormat": "DST, EMB",
  "instructions": "Need 3D puff on the letter 'F', 75/11 needle density for pique polo fabric.",
  "rawArtworkFiles": [
    {
      "name": "falcon_logo.ai",
      "url": "https://firebasestorage.googleapis.com/.../artworks/falcon_logo.ai",
      "size": 1548290
    }
  ],
  "status": "in_progress", // "assigned" | "in_progress" | "completed" | "revision"
  "deliverables": [
    {
      "format": "dst",
      "url": "https://firebasestorage.googleapis.com/.../deliverables/falcon_crest.dst",
      "name": "falcon_crest.dst",
      "uploadedAt": "TIMESTAMP"
    }
  ],
  "assignedAt": "TIMESTAMP",
  "completedAt": null
}
```

---

## 3. Cloud Firestore Security Rules (RBAC & Data Masking)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }

    function isAdmin() {
      return isAuthenticated() && getUserData().role == 'admin';
    }

    function isClient() {
      return isAuthenticated() && getUserData().role == 'client';
    }

    function isDigitizer() {
      return isAuthenticated() && getUserData().role == 'digitizer';
    }

    // USERS COLLECTION
    match /users/{userId} {
      // Users can read and update their own profile; Admin can read and edit all
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    // ORDERS COLLECTION (STRICTLY FORBIDDEN TO DIGITIZERS)
    match /orders/{orderId} {
      // Digitizers can NEVER read or list orders
      allow read: if isAdmin() || (isClient() && resource.data.clientId == request.auth.uid);
      
      // Only Clients (for creating) and Admins can write
      allow create: if isClient() && request.resource.data.clientId == request.auth.uid;
      allow update: if isAdmin() || (isClient() && resource.data.clientId == request.auth.uid);
      allow delete: if isAdmin();
    }

    // DIGITIZER TASKS COLLECTION (SANITIZED WORKER QUEUE)
    match /digitizer_tasks/{taskId} {
      // Digitizers can only read tasks explicitly assigned to their UID; Admin sees all
      allow read: if isAdmin() || (isDigitizer() && resource.data.assignedDigitizerId == request.auth.uid);
      
      // Only Admin can create and assign tasks
      allow create: if isAdmin();
      
      // Digitizer can update status to in_progress/completed and append deliverables
      allow update: if isAdmin() || (isDigitizer() && resource.data.assignedDigitizerId == request.auth.uid);
      allow delete: if isAdmin();
    }
  }
}
```
