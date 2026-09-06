-- Migration: Guest Checkout Support
-- Date: 2026-09-06
-- Description: Makes client_id nullable on public.orders for guest checkout,
-- adds lowercase index on client_email for efficient order claiming upon registration.

-- 1. Make client_id nullable for guest checkout
ALTER TABLE public.orders ALTER COLUMN client_id DROP NOT NULL;

-- 2. Add performance index on lowercase client_email for guest order claiming
CREATE INDEX IF NOT EXISTS idx_orders_client_email_lower ON public.orders(LOWER(client_email));
