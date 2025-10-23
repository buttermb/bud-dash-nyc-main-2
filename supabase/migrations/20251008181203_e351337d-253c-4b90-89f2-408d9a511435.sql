-- Comprehensive security fix: Restrict anonymous access to all sensitive tables

-- 1. Fix couriers table - require authentication for reads
DROP POLICY IF EXISTS "Public can view couriers" ON public.couriers;
CREATE POLICY "Authenticated users can view active couriers"
ON public.couriers
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Block anonymous access to couriers"
ON public.couriers
FOR SELECT
TO anon
USING (false);

-- 2. Fix profiles table - require authentication for reads
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 3. Fix age_verifications table - require authentication
DROP POLICY IF EXISTS "Public can view verifications" ON public.age_verifications;
CREATE POLICY "Block anonymous access to age_verifications"
ON public.age_verifications
FOR SELECT
TO anon
USING (false);

-- 4. Fix courier_applications table - only admins can read
DROP POLICY IF EXISTS "Public can view applications" ON public.courier_applications;
CREATE POLICY "Block anonymous access to courier_applications"
ON public.courier_applications
FOR SELECT
TO anon
USING (false);

-- 5. Fix orders table - require authentication for reads
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
CREATE POLICY "Block anonymous access to orders"
ON public.orders
FOR SELECT
TO anon
USING (false);

-- 6. Fix courier_location_history - require authentication
DROP POLICY IF EXISTS "Public can view location history" ON public.courier_location_history;
CREATE POLICY "Customers can view courier location for their orders"
ON public.courier_location_history
FOR SELECT
TO authenticated
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Block anonymous access to courier_location_history"
ON public.courier_location_history
FOR SELECT
TO anon
USING (false);

-- 7. Fix merchants table - require authentication
DROP POLICY IF EXISTS "Public can view merchants" ON public.merchants;
CREATE POLICY "Authenticated users can view active merchants"
ON public.merchants
FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Block anonymous access to merchants"
ON public.merchants
FOR SELECT
TO anon
USING (false);

-- 8. Fix admin_users table - explicit deny for anon
CREATE POLICY "Block anonymous access to admin_users"
ON public.admin_users
FOR SELECT
TO anon
USING (false);

-- 9. Fix public_order_tracking view security
-- Since it's a view, we secure it through a function that requires tracking code
-- Drop the view and recreate with security definer function
DROP VIEW IF EXISTS public.public_order_tracking;

CREATE OR REPLACE FUNCTION public.get_order_tracking_by_code(tracking_code_param text)
RETURNS TABLE (
  id uuid,
  order_number text,
  tracking_code text,
  status text,
  created_at timestamptz,
  estimated_delivery timestamptz,
  delivered_at timestamptz,
  delivery_address text,
  delivery_borough text,
  total_amount numeric,
  merchant_name text,
  merchant_address text,
  courier_name text,
  courier_lat numeric,
  courier_lng numeric,
  courier_vehicle text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.order_number,
    o.tracking_code,
    o.status,
    o.created_at,
    o.estimated_delivery,
    o.delivered_at,
    o.delivery_address,
    o.delivery_borough,
    o.total_amount,
    m.business_name as merchant_name,
    m.address as merchant_address,
    c.full_name as courier_name,
    c.current_lat as courier_lat,
    c.current_lng as courier_lng,
    c.vehicle_type as courier_vehicle
  FROM orders o
  LEFT JOIN merchants m ON o.merchant_id = m.id
  LEFT JOIN couriers c ON o.courier_id = c.id
  WHERE o.tracking_code = tracking_code_param;
END;
$$;