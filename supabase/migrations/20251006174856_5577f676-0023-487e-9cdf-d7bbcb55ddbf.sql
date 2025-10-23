-- Drop all SELECT policies on orders to recreate them properly
DROP POLICY IF EXISTS "Anyone can track with code" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders or track with code" ON public.orders;
DROP POLICY IF EXISTS "Couriers can view assigned orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Recreate with proper security

-- 1. Users can view their own orders
CREATE POLICY "Users can view own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Couriers can view their assigned orders
CREATE POLICY "Couriers can view assigned orders"
ON public.orders
FOR SELECT
USING (
  courier_id IN (
    SELECT id FROM couriers WHERE user_id = auth.uid()
  )
);

-- 3. Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- 4. Create a security definer function for public tracking lookups
-- This provides controlled access for tracking codes without RLS bypasses
CREATE OR REPLACE FUNCTION public.get_order_by_tracking_code(code TEXT)
RETURNS TABLE (
  id UUID,
  order_number TEXT,
  tracking_code TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_address TEXT,
  delivery_borough TEXT,
  total_amount NUMERIC,
  merchant_name TEXT,
  merchant_address TEXT,
  courier_name TEXT,
  courier_vehicle TEXT,
  courier_lat NUMERIC,
  courier_lng NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
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
    CONCAT(c.vehicle_make, ' ', c.vehicle_model) as courier_vehicle,
    c.current_lat as courier_lat,
    c.current_lng as courier_lng
  FROM orders o
  LEFT JOIN merchants m ON o.merchant_id = m.id
  LEFT JOIN couriers c ON o.courier_id = c.id
  WHERE o.tracking_code = code
  LIMIT 1;
$$;