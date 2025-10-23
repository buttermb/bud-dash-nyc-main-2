-- Add tracking code columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_code ON orders(tracking_code);

-- Function to generate unique tracking code (format: ABC-DEF-GH12)
CREATE OR REPLACE FUNCTION generate_tracking_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..3 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  result := result || '-';
  FOR i IN 1..4 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate tracking code on order creation
CREATE OR REPLACE FUNCTION set_tracking_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.tracking_code IS NULL THEN
    LOOP
      new_code := generate_tracking_code();
      SELECT EXISTS(SELECT 1 FROM orders WHERE tracking_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.tracking_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_tracking_code ON orders;
CREATE TRIGGER trigger_set_tracking_code
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_tracking_code();

-- Generate tracking codes for existing orders
UPDATE orders 
SET tracking_code = generate_tracking_code()
WHERE tracking_code IS NULL;

-- Create public order tracking view (safe for anonymous access)
CREATE OR REPLACE VIEW public_order_tracking AS
SELECT 
  o.id,
  o.tracking_code,
  o.order_number,
  o.status,
  o.created_at,
  o.delivered_at,
  o.estimated_delivery,
  o.delivery_address,
  o.delivery_borough,
  o.total_amount,
  m.business_name as merchant_name,
  m.address as merchant_address,
  c.full_name as courier_name,
  c.vehicle_type as courier_vehicle,
  c.current_lat as courier_lat,
  c.current_lng as courier_lng
FROM orders o
LEFT JOIN merchants m ON o.merchant_id = m.id
LEFT JOIN couriers c ON o.courier_id = c.id;

-- Grant access to the view
GRANT SELECT ON public_order_tracking TO anon, authenticated;

-- RLS Policy: Anyone can track with valid code (drop first if exists)
DROP POLICY IF EXISTS "Anyone can track with code" ON orders;
CREATE POLICY "Anyone can track with code" ON orders
  FOR SELECT
  TO anon, authenticated
  USING (tracking_code IS NOT NULL);