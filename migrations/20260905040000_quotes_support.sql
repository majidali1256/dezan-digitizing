-- ===================================================================
-- DEZAN DIGITIZING: SEPARATE QUOTE & ORDER WORKFLOW ENHANCEMENT
-- ===================================================================

-- 1. Add quote-specific & adaptive columns to public.orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS is_quote BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_admin_notes TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS quote_priced_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS special_options JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS turnaround_speed VARCHAR(50) DEFAULT 'standard';

-- 2. Update orders_status_check to include 'quote_requested' and 'quote_ready'
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN (
    'pending_review', 'assigned', 'in_progress', 'qa_review', 'completed', 'revision', 'revision_requested', 'cancelled', 'quote_requested', 'quote_ready'
));
