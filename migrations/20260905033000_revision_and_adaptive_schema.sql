-- ===================================================================
-- DEZAN DIGITIZING: REVISION WORKFLOW & ADAPTIVE ATTRIBUTES ENHANCEMENT
-- ===================================================================

-- 1. Enhance orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fabric_type VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stitch_out_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS revision_count INTEGER DEFAULT 0;

-- Update orders_status_check to support both revision and revision_requested
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending_review', 'assigned', 'in_progress', 'qa_review', 'completed', 'revision', 'revision_requested', 'cancelled'
));

-- 2. Enhance digitizer_tasks table
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS fabric_type VARCHAR(100);
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS revision_notes TEXT;
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS stitch_out_photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS revision_requested_at TIMESTAMPTZ;

-- Update digitizer_tasks_status_check
ALTER TABLE public.digitizer_tasks DROP CONSTRAINT IF EXISTS digitizer_tasks_status_check;
ALTER TABLE public.digitizer_tasks ADD CONSTRAINT digitizer_tasks_status_check CHECK (status IN (
    'assigned', 'in_progress', 'completed', 'revision', 'revision_requested'
));

-- 3. Update orders RLS policies so clients can request revisions on their own completed orders
DROP POLICY IF EXISTS "Orders updatable by admin or pending client" ON public.orders;
CREATE POLICY "Orders updatable by admin or client"
ON public.orders FOR UPDATE
TO authenticated
USING (
    public.is_admin() 
    OR (auth.uid() = client_id)
)
WITH CHECK (
    public.is_admin() 
    OR (auth.uid() = client_id)
);
