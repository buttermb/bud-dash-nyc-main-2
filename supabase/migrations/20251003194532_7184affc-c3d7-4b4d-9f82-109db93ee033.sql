-- Add PIN hash column to couriers table for security
ALTER TABLE public.couriers
ADD COLUMN IF NOT EXISTS pin_hash TEXT;