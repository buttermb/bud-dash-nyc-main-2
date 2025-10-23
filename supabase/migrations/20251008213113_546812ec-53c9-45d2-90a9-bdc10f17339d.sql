-- Update tracking function to include all required fields
DROP FUNCTION IF EXISTS public.get_order_by_tracking_code(TEXT);

CREATE OR REPLACE FUNCTION public.get_order_by_tracking_code(code TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'id', o.id,
    'order_number', o.order_number,
    'tracking_code', o.tracking_code,
    'status', o.status,
    'created_at', o.created_at,
    'estimated_delivery', o.estimated_delivery,
    'delivered_at', o.delivered_at,
    'delivery_address', o.delivery_address,
    'delivery_borough', o.delivery_borough,
    'total_amount', o.total_amount,
    'eta_minutes', o.eta_minutes,
    'eta_updated_at', o.eta_updated_at,
    'merchant', jsonb_build_object(
      'business_name', m.business_name,
      'address', m.address
    ),
    'courier', CASE 
      WHEN c.id IS NOT NULL THEN jsonb_build_object(
        'full_name', c.full_name,
        'phone', c.phone,
        'vehicle_type', c.vehicle_type,
        'vehicle_make', c.vehicle_make,
        'vehicle_model', c.vehicle_model,
        'current_lat', c.current_lat,
        'current_lng', c.current_lng,
        'rating', COALESCE(c.rating, 5.0)
      )
      ELSE NULL
    END,
    'order_items', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'product_name', oi.product_name,
          'quantity', oi.quantity,
          'price', oi.price,
          'product', jsonb_build_object(
            'name', COALESCE(p.name, oi.product_name),
            'image_url', COALESCE(p.image_url, '/placeholder.svg')
          )
        )
      )
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = o.id
    )
  ) INTO result
  FROM orders o
  LEFT JOIN merchants m ON o.merchant_id = m.id
  LEFT JOIN couriers c ON o.courier_id = c.id
  WHERE UPPER(o.tracking_code) = UPPER(code);
  
  RETURN result;
END;
$$;

-- Grant execute permission to anonymous users for public tracking
GRANT EXECUTE ON FUNCTION public.get_order_by_tracking_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_by_tracking_code(TEXT) TO authenticated;