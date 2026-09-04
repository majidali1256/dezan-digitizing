-- ===================================================================
-- DEZAN DIGITIZING — RBAC TABLES & ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'admin', 'digitizer')) DEFAULT 'client',
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin without RLS recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles RLS Policies
CREATE POLICY "Profiles viewable by owner or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles updatable by owner or admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());


-- 2. ORDERS TABLE (Master Commercial Records)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_company VARCHAR(255),
    service_type VARCHAR(50) NOT NULL DEFAULT 'Digitizing',
    plan_name VARCHAR(100) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    placement VARCHAR(100) NOT NULL,
    sizing VARCHAR(100) NOT NULL,
    file_format VARCHAR(100) NOT NULL DEFAULT 'DST, EMB',
    instructions TEXT,
    raw_artwork_files JSONB DEFAULT '[]'::jsonb,
    
    -- Commercial pricing (Masked from worker)
    price NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'invoice_sent', 'paid', 'refunded')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    
    -- Worker assignment
    assigned_digitizer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_digitizer_name VARCHAR(255),
    assigned_at TIMESTAMPTZ,
    
    status VARCHAR(50) DEFAULT 'pending_review' CHECK (status IN (
        'pending_review', 'assigned', 'in_progress', 'qa_review', 'completed', 'revision', 'cancelled'
    )),
    deliverables JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Orders RLS Policies (Digitizers have NO access)
CREATE POLICY "Orders viewable by owner client or admin"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = client_id OR public.is_admin());

CREATE POLICY "Clients can create orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Orders updatable by admin or pending client"
ON public.orders FOR UPDATE
TO authenticated
USING (
    public.is_admin() 
    OR (auth.uid() = client_id AND status = 'pending_review')
)
WITH CHECK (
    public.is_admin() 
    OR (auth.uid() = client_id AND status = 'pending_review')
);

CREATE POLICY "Only admin can delete orders"
ON public.orders FOR DELETE
TO authenticated
USING (public.is_admin());


-- 3. DIGITIZER TASKS TABLE (Sanitized Worker Queue)
CREATE TABLE IF NOT EXISTS public.digitizer_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_number VARCHAR(50) UNIQUE NOT NULL,
    order_number VARCHAR(50) NOT NULL,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    assigned_digitizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL DEFAULT 'Digitizing',
    placement VARCHAR(100) NOT NULL,
    sizing VARCHAR(100) NOT NULL,
    file_format VARCHAR(100) NOT NULL DEFAULT 'DST, EMB',
    instructions TEXT,
    raw_artwork_files JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'revision')),
    deliverables JSONB DEFAULT '[]'::jsonb,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS on digitizer_tasks
ALTER TABLE public.digitizer_tasks ENABLE ROW LEVEL SECURITY;

-- Digitizer Tasks RLS Policies
CREATE POLICY "Digitizers view only assigned tasks, admin views all"
ON public.digitizer_tasks FOR SELECT
TO authenticated
USING (auth.uid() = assigned_digitizer_id OR public.is_admin());

CREATE POLICY "Only admin can create digitizer tasks"
ON public.digitizer_tasks FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Digitizer can update status and deliverables on assigned tasks"
ON public.digitizer_tasks FOR UPDATE
TO authenticated
USING (auth.uid() = assigned_digitizer_id OR public.is_admin())
WITH CHECK (auth.uid() = assigned_digitizer_id OR public.is_admin());

CREATE POLICY "Only admin can delete tasks"
ON public.digitizer_tasks FOR DELETE
TO authenticated
USING (public.is_admin());
