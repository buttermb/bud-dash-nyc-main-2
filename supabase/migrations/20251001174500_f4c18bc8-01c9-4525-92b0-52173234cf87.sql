-- Essential courier fields only
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 30.00;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;

-- Essential order fields
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_lat DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_lng DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;

-- Simple earnings table (only if not exists)
CREATE TABLE IF NOT EXISTS courier_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id),
  order_id UUID REFERENCES orders(id),
  order_total DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  tip_amount DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  week_start_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add week_start_date if missing
ALTER TABLE courier_earnings ADD COLUMN IF NOT EXISTS week_start_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Auto-calculate earnings when order delivered
CREATE OR REPLACE FUNCTION create_courier_earnings_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL;
  v_commission_amount DECIMAL;
  v_week_start DATE;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.courier_id IS NOT NULL THEN
    -- Get courier commission rate
    SELECT commission_rate INTO v_commission_rate FROM couriers WHERE id = NEW.courier_id;
    
    -- Calculate commission
    v_commission_amount := NEW.total_amount * (v_commission_rate / 100);
    
    -- Get week start date
    v_week_start := DATE_TRUNC('week', NOW())::DATE;
    
    -- Create earning record
    INSERT INTO courier_earnings (
      courier_id, order_id, order_total, commission_rate,
      commission_amount, tip_amount, total_earned, week_start_date
    ) VALUES (
      NEW.courier_id, NEW.id, NEW.total_amount, v_commission_rate,
      v_commission_amount, COALESCE(NEW.tip_amount, 0),
      v_commission_amount + COALESCE(NEW.tip_amount, 0),
      v_week_start
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_create_earnings ON orders;
CREATE TRIGGER trigger_create_earnings
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_courier_earnings_on_delivery();

-- Generate tracking codes
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-generate tracking code
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_set_tracking_code ON orders;
CREATE TRIGGER trigger_set_tracking_code
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_tracking_code();

-- RLS policies for courier_earnings
ALTER TABLE courier_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can view own earnings" ON courier_earnings;
CREATE POLICY "Couriers can view own earnings" ON courier_earnings
  FOR SELECT USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage earnings" ON courier_earnings;
CREATE POLICY "Admins can manage earnings" ON courier_earnings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));