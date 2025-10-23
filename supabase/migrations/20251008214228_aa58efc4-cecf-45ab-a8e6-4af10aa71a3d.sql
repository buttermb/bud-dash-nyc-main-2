-- Phase 1: Critical Security Fixes (Final)

-- 1.1 Consolidate Admin Authorization System
-- Migrate existing admin_users to user_roles if not already present
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::app_role
FROM public.admin_users
WHERE is_active = true 
  AND user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = admin_users.user_id 
    AND user_roles.role = 'admin'::app_role
  );

-- Make admin_users.user_id NOT NULL for data integrity
UPDATE public.admin_users 
SET user_id = id 
WHERE user_id IS NULL AND id IS NOT NULL;

ALTER TABLE public.admin_users 
ALTER COLUMN user_id SET NOT NULL;

-- 1.2 Fix Orders Table User ID - CRITICAL SECURITY FIX
-- First, delete any orders without a user (anonymous orders not allowed)
DELETE FROM public.orders WHERE user_id IS NULL;

-- Now make user_id NOT NULL to prevent future anonymous orders
ALTER TABLE public.orders 
ALTER COLUMN user_id SET NOT NULL;

-- Drop old permissive policy that allowed anonymous orders
DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;

-- Create strict policy - users can only create orders for themselves
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);