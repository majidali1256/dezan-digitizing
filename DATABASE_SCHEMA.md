# Database Schema & Security Rules Specification (DATABASE_SCHEMA.md)
*Engine: InsForge (Agent-Native PostgreSQL BaaS with Row-Level Security & S3 Storage)*

---

## 1. Entity Relationship Model

```
 ┌─────────────────┐       1:N       ┌─────────────────┐
 │ public.profiles ├─────────────────┤  public.orders  │
 └────────┬────────┘                 └────────┬────────┘
          │                                   │
          │ 1:N                               │ 1:1
          ▼                                   ▼
 ┌────────────────────────┐          ┌─────────────────┐
 │ public.digitizer_tasks │◄─────────┤   audit_logs    │
 └────────────────────────┘          └─────────────────┘
```

---

## 2. InsForge PostgreSQL Tables & DDL

### 2.1 `public.profiles` Table
Stores user profile information, contact metadata, and the critical `role` attribute (`client`, `admin`, `digitizer`).

```sql
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'admin', 'digitizer')),
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile or admin can view all" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Users can update own profile or admin can update all" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

---

### 2.2 `public.orders` Table (Master Commercial Orders)
> [!CAUTION]
> **Strict Authorization**: Readable only by Admin and the Client owner (`client_id == auth.uid()`). Digitizers are **strictly blocked** by RLS from reading or writing to this table.

```sql
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'ORD-2026-8841'
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    client_name VARCHAR(255) NOT NULL,       -- PII (Masked from Worker)
    client_email VARCHAR(255) NOT NULL,      -- PII (Masked from Worker)
    client_company VARCHAR(255),             -- PII (Masked from Worker)
    service_type VARCHAR(50) NOT NULL,       -- 'Digitizing' | 'Vectorizing'
    plan_name VARCHAR(100) NOT NULL,         -- 'Left Chest / Hat', 'Jacket Back', etc.
    project_name VARCHAR(255) NOT NULL,
    placement VARCHAR(100) NOT NULL,         -- 'Left Chest', 'Cap', 'Jacket Back'
    sizing VARCHAR(100) NOT NULL,            -- e.g. '3.5" W x 2.2" H'
    file_format VARCHAR(100) NOT NULL,       -- 'DST, EMB'
    instructions TEXT,
    raw_artwork_files JSONB DEFAULT '[]'::jsonb, -- [{ name, url, size, type }]
    
    -- Commercial & Financial Details (Masked from Worker)
    price NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'invoice_sent', 'paid', 'refunded')),
    payment_method VARCHAR(50),              -- 'PayPal', 'Card'
    transaction_id VARCHAR(255),
    
    -- Assignment Tracking
    assigned_digitizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_digitizer_name VARCHAR(255),
    assigned_at TIMESTAMPTZ,
    
    status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'assigned', 'in_progress', 'qa_review', 'completed', 'revision', 'cancelled'
    )),
    deliverables JSONB DEFAULT '[]'::jsonb,   -- [{ format: 'dst', url: '...', name: '...' }]
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders Policies
CREATE POLICY "Clients can view their own orders; Admins can view all"
ON public.orders FOR SELECT
USING (
    auth.uid() = client_id 
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Clients can insert orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Admins can update all orders, Clients can update pending orders"
ON public.orders FOR UPDATE
USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    OR (auth.uid() = client_id AND status = 'pending_review')
);

CREATE POLICY "Only admins can delete orders"
ON public.orders FOR DELETE
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
```

---

### 2.3 `public.digitizer_tasks` Table (Sanitized Worker Queue)
> [!IMPORTANT]
> **Data Masking Guarantee**: Contains **zero** client PII and **zero** pricing information. Digitizers can only read records where `assigned_digitizer_id == auth.uid()`.

```sql
CREATE TABLE public.digitizer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number VARCHAR(50) UNIQUE NOT NULL,  -- e.g. 'TSK-2026-8841'
    order_number VARCHAR(50) NOT NULL,       -- Reference code 'ORD-2026-8841'
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    assigned_digitizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    placement VARCHAR(100) NOT NULL,
    sizing VARCHAR(100) NOT NULL,
    file_format VARCHAR(100) NOT NULL,
    instructions TEXT,
    raw_artwork_files JSONB DEFAULT '[]'::jsonb, -- [{ name, url, size }]
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'revision')),
    deliverables JSONB DEFAULT '[]'::jsonb,       -- [{ format: 'dst', url: '...', name: '...' }]
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.digitizer_tasks ENABLE ROW LEVEL SECURITY;

-- Digitizer Tasks Policies
CREATE POLICY "Digitizers can view only their assigned tasks; Admins view all"
ON public.digitizer_tasks FOR SELECT
USING (
    auth.uid() = assigned_digitizer_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Only admins can insert new tasks"
ON public.digitizer_tasks FOR INSERT
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Digitizers can update status & deliverables on assigned tasks"
ON public.digitizer_tasks FOR UPDATE
USING (
    auth.uid() = assigned_digitizer_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
```

---

## 3. InsForge S3 Storage Buckets

1. **`artworks` Bucket**:
   - Location: `/artworks/{order_number}/*`
   - Allowed Extensions: `.ai`, `.eps`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.svg`, `.zip`, `.rar`
   - Read Access: Client owner, Admin, and assigned Digitizer.
2. **`deliverables` Bucket**:
   - Location: `/deliverables/{order_number}/*`
   - Allowed Extensions: `.dst`, `.emb`, `.pxf`, `.pes`, `.exp`, `.pdf`
   - Write Access: Assigned Digitizer and Admin.
   - Read Access: Assigned Digitizer, Admin, and Client owner (when `payment_status = 'paid'`).
