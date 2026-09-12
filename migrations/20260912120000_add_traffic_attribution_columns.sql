-- Migration: Add Traffic & Ad Attribution Tracking Columns to public.orders
-- Created: 2026-09-12

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS original_source VARCHAR(100) DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS last_source VARCHAR(100) DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS landing_page TEXT,
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS utm_source VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_content VARCHAR(255),
ADD COLUMN IF NOT EXISTS utm_term VARCHAR(255),
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS gbraid TEXT,
ADD COLUMN IF NOT EXISTS wbraid TEXT,
ADD COLUMN IF NOT EXISTS attribution_data JSONB DEFAULT '{}'::jsonb;

-- Create indexes for analytics performance
CREATE INDEX IF NOT EXISTS idx_orders_original_source ON public.orders (original_source);
CREATE INDEX IF NOT EXISTS idx_orders_last_source ON public.orders (last_source);
CREATE INDEX IF NOT EXISTS idx_orders_gclid ON public.orders (gclid) WHERE gclid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign ON public.orders (utm_campaign) WHERE utm_campaign IS NOT NULL;
