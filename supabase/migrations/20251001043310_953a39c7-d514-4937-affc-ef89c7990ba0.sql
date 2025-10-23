-- CRITICAL SECURITY FIX: Phase 1 - Legal Compliance & RLS Vulnerabilities

-- 1. Remove auto-age verification triggers and functions (CRITICAL LEGAL RISK)
-- Drop triggers first, then functions
DROP TRIGGER IF EXISTS auto_verify_age_on_signup ON public.profiles;
DROP TRIGGER IF EXISTS auto_verify_age_trigger ON public.profiles;
DROP TRIGGER IF EXISTS set_age_verified_trigger ON public.profiles;

-- Now drop functions
DROP FUNCTION IF EXISTS public.auto_verify_age_on_profile_creation();
DROP FUNCTION IF EXISTS public.set_age_verified_on_signup();

-- 2. Fix courier privilege escalation - restrict to assigned orders only
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON public.orders;
CREATE POLICY "Couriers can view assigned orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  (auth.uid() = courier_id) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Update courier update policy to only allow updates to assigned orders
DROP POLICY IF EXISTS "Couriers can update assigned orders" ON public.orders;
CREATE POLICY "Couriers can update assigned orders"
ON public.orders
FOR UPDATE
TO authenticated
USING (
  (auth.uid() = courier_id) OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Add proper INSERT policies for loyalty_transactions (prevent manipulation)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
CREATE POLICY "Users can view own transactions"
ON public.loyalty_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Only system functions can insert loyalty transactions
CREATE POLICY "System can insert loyalty transactions"
ON public.loyalty_transactions
FOR INSERT
TO authenticated
WITH CHECK (false); -- Blocked for all users - only server functions

-- 4. Fix purchase_limits RLS to allow system updates via function
DROP POLICY IF EXISTS "System can update via function" ON public.purchase_limits;
DROP POLICY IF EXISTS "Users can view own limits" ON public.purchase_limits;
DROP POLICY IF EXISTS "Users can view own limits only" ON public.purchase_limits;

CREATE POLICY "Users can view own limits"
ON public.purchase_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow system to insert/update via security definer functions
CREATE POLICY "System can manage limits"
ON public.purchase_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- 5. Create audit log for security events
CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address text,
  user_agent text,
  details jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can log security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Add age verification status tracking columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS verification_rejection_reason text;

-- Update existing age_verified column to default false for new users
ALTER TABLE public.profiles 
  ALTER COLUMN age_verified SET DEFAULT false;

-- Create index for faster age verification checks
CREATE INDEX IF NOT EXISTS idx_profiles_age_verified ON public.profiles(age_verified);

-- 7. Log this security update
INSERT INTO public.audit_logs (entity_type, entity_id, action, details)
VALUES (
  'security_fix',
  'phase_1',
  'SECURITY_HARDENING',
  jsonb_build_object(
    'fixes', ARRAY[
      'Removed auto-age verification',
      'Fixed courier privilege escalation',
      'Added loyalty_transactions protection',
      'Enhanced purchase_limits security',
      'Added security events table'
    ],
    'timestamp', now()
  )
);