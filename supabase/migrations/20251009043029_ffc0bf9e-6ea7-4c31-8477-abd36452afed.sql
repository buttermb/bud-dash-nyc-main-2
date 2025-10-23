-- Create optimized RPC function to get all dashboard metrics in one call
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'totalOrders', (SELECT COUNT(*) FROM orders),
    'todayOrders', (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE),
    'activeOrders', (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'accepted', 'picked_up', 'in_transit')),
    'totalUsers', (SELECT COUNT(*) FROM profiles),
    'totalMerchants', (SELECT COUNT(*) FROM merchants WHERE is_active = true),
    'activeCouriers', (SELECT COUNT(*) FROM couriers WHERE is_online = true AND is_active = true),
    'pendingVerifications', (SELECT COUNT(*) FROM age_verifications WHERE verified = false),
    'flaggedOrders', (SELECT COUNT(*) FROM orders WHERE flagged_at IS NOT NULL),
    'todayRevenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= CURRENT_DATE AND status = 'delivered')
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- Create optimized function to get courier list with earnings
CREATE OR REPLACE FUNCTION public.get_couriers_with_daily_earnings()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone text,
  vehicle_type text,
  rating numeric,
  total_deliveries integer,
  is_online boolean,
  is_active boolean,
  created_at timestamp with time zone,
  today_earnings numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    c.id,
    c.full_name,
    c.email,
    c.phone,
    c.vehicle_type,
    c.rating,
    c.total_deliveries,
    c.is_online,
    c.is_active,
    c.created_at,
    COALESCE(SUM(ce.total_earned) FILTER (WHERE ce.created_at >= CURRENT_DATE), 0) as today_earnings
  FROM couriers c
  LEFT JOIN courier_earnings ce ON c.id = ce.courier_id
  GROUP BY c.id
  ORDER BY c.created_at DESC;
$function$;

-- Create optimized function to get recent orders with all related data
CREATE OR REPLACE FUNCTION public.get_admin_orders(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  order_number text,
  status text,
  total_amount numeric,
  created_at timestamp with time zone,
  delivery_address text,
  delivery_borough text,
  customer_name text,
  customer_phone text,
  courier_name text,
  courier_phone text,
  merchant_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.created_at,
    o.delivery_address,
    o.delivery_borough,
    o.customer_name,
    o.customer_phone,
    c.full_name as courier_name,
    c.phone as courier_phone,
    m.business_name as merchant_name
  FROM orders o
  LEFT JOIN couriers c ON o.courier_id = c.id
  LEFT JOIN merchants m ON o.merchant_id = m.id
  ORDER BY o.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
$function$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status) WHERE status IN ('pending', 'accepted', 'picked_up', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_orders_flagged ON orders(flagged_at) WHERE flagged_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_couriers_online ON couriers(is_online, is_active) WHERE is_online = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_age_verifications_pending ON age_verifications(verified) WHERE verified = false;
CREATE INDEX IF NOT EXISTS idx_courier_earnings_courier_id ON courier_earnings(courier_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchants_active ON merchants(is_active) WHERE is_active = true;