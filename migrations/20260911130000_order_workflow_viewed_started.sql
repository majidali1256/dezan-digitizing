-- ===================================================================
-- DEZAN DIGITIZING: ORDER WORKFLOW VIEWED & STARTED TRACKING
-- ===================================================================

-- 1. Enhance orders table with viewed and started timestamps
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS digitizer_viewed_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_unread BOOLEAN DEFAULT TRUE;

-- 2. Enhance digitizer_tasks table with viewed and started timestamps
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS digitizer_viewed_at TIMESTAMPTZ;
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE public.digitizer_tasks ADD COLUMN IF NOT EXISTS is_unread BOOLEAN DEFAULT TRUE;

-- 3. Ensure status check constraints allow all production and quote statuses
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending_review', 'new', 'assigned', 'in_progress', 'qa_review', 'completed', 'revision', 'revision_requested', 'quote_requested', 'quote_ready', 'cancelled'
));

ALTER TABLE public.digitizer_tasks DROP CONSTRAINT IF EXISTS digitizer_tasks_status_check;
ALTER TABLE public.digitizer_tasks ADD CONSTRAINT digitizer_tasks_status_check CHECK (status IN (
    'assigned', 'in_progress', 'completed', 'revision', 'revision_requested'
));
