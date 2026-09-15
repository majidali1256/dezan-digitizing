-- ===================================================================
-- DEZAN DIGITIZING — SECURITY RLS CONTAINMENT & TENANT ISOLATION
-- Migration: 20260915130000_secure_rls_containment.sql
-- Date: 2026-09-15
-- ===================================================================

-- 1. DROP PERMISSIVE ALLOW-ALL POLICIES
DROP POLICY IF EXISTS "allow_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "allow_all_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_all_tasks" ON public.digitizer_tasks;

-- 2. SECURE PROFILES POLICIES
DROP POLICY IF EXISTS "Profiles viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by owner or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Profiles updatable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles updatable by owner or admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (
    (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    OR public.is_admin()
);

-- 3. SECURE ORDERS POLICIES
DROP POLICY IF EXISTS "Orders viewable by owner client or admin" ON public.orders;
CREATE POLICY "Orders viewable by owner client or admin"
ON public.orders FOR SELECT
TO authenticated
USING (auth.uid() = client_id OR public.is_admin());

DROP POLICY IF EXISTS "Clients can create orders" ON public.orders;
CREATE POLICY "Clients can create orders"
ON public.orders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Guests can insert guest orders" ON public.orders;
CREATE POLICY "Guests can insert guest orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (
    client_id IS NULL
    AND client_email IS NOT NULL
    AND status IN ('pending_review', 'quote_requested')
);

DROP POLICY IF EXISTS "Orders updatable by admin or client" ON public.orders;
CREATE POLICY "Orders updatable by admin or client"
ON public.orders FOR UPDATE
TO authenticated
USING (is_admin() OR (auth.uid() = client_id))
WITH CHECK (is_admin() OR (auth.uid() = client_id));

-- 4. SECURE DIGITIZER TASKS POLICIES
DROP POLICY IF EXISTS "Digitizers view only assigned tasks, admin views all" ON public.digitizer_tasks;
CREATE POLICY "Digitizers view only assigned tasks, admin views all"
ON public.digitizer_tasks FOR SELECT
TO authenticated
USING ((auth.uid() = assigned_digitizer_id) OR public.is_admin());

DROP POLICY IF EXISTS "Digitizer or admin can update digitizer tasks" ON public.digitizer_tasks;
CREATE POLICY "Digitizer or admin can update digitizer tasks"
ON public.digitizer_tasks FOR UPDATE
TO authenticated
USING ((auth.uid() = assigned_digitizer_id) OR public.is_admin())
WITH CHECK ((auth.uid() = assigned_digitizer_id) OR public.is_admin());

DROP POLICY IF EXISTS "Admin or client can create digitizer tasks" ON public.digitizer_tasks;
CREATE POLICY "Admin or client can create digitizer tasks"
ON public.digitizer_tasks FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR auth.uid() IS NOT NULL);
