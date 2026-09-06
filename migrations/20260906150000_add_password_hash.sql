-- Migration: Add password_hash and preferences to public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS machinery_preferences JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_fabric VARCHAR(100);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_turnaround VARCHAR(50) DEFAULT 'standard';

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_digitizer_id ON public.orders(assigned_digitizer_id);
CREATE INDEX IF NOT EXISTS idx_digitizer_tasks_assigned_digitizer ON public.digitizer_tasks(assigned_digitizer_id);
CREATE INDEX IF NOT EXISTS idx_digitizer_tasks_order_id ON public.digitizer_tasks(order_id);
