-- Courier authentication and profile
CREATE TABLE IF NOT EXISTS couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  full_name TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT,
  license_number TEXT NOT NULL,
  
  -- Location tracking
  current_lat NUMERIC,
  current_lng NUMERIC,
  last_location_update TIMESTAMPTZ,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  available_for_orders BOOLEAN DEFAULT true,
  
  -- Verification
  age_verified BOOLEAN DEFAULT false,
  background_check_status TEXT DEFAULT 'pending',
  background_check_date TIMESTAMPTZ,
  
  -- Documents
  license_front_url TEXT,
  license_back_url TEXT,
  vehicle_insurance_url TEXT,
  vehicle_registration_url TEXT,
  
  -- Earnings settings
  commission_rate NUMERIC(5,2) DEFAULT 30.00,
  weekly_earnings_goal NUMERIC(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Courier earnings tracking
CREATE TABLE IF NOT EXISTS courier_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  
  -- Amounts
  order_total NUMERIC(10,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  tip_amount NUMERIC(10,2) DEFAULT 0,
  total_earned NUMERIC(10,2) NOT NULL,
  
  -- Payment status
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  week_start_date DATE NOT NULL,
  notes TEXT
);

-- Courier location history
CREATE TABLE IF NOT EXISTS courier_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  accuracy NUMERIC(10,2),
  speed NUMERIC(10,2),
  heading NUMERIC(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

-- Courier shifts/sessions
CREATE TABLE IF NOT EXISTS courier_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  total_hours NUMERIC(5,2),
  total_deliveries INT DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active'
);

-- Courier performance metrics
CREATE TABLE IF NOT EXISTS courier_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Daily stats
  deliveries_completed INT DEFAULT 0,
  deliveries_cancelled INT DEFAULT 0,
  total_distance_miles NUMERIC(10,2) DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  avg_delivery_time_minutes INT,
  
  -- Ratings
  avg_rating NUMERIC(3,2),
  total_ratings INT DEFAULT 0,
  
  -- Compliance
  late_deliveries INT DEFAULT 0,
  id_verification_failures INT DEFAULT 0,
  
  UNIQUE(courier_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_couriers_user_id ON couriers(user_id);
CREATE INDEX IF NOT EXISTS idx_couriers_is_online ON couriers(is_online);
CREATE INDEX IF NOT EXISTS idx_courier_earnings_courier_id ON courier_earnings(courier_id);
CREATE INDEX IF NOT EXISTS idx_courier_earnings_week_start ON courier_earnings(week_start_date);
CREATE INDEX IF NOT EXISTS idx_courier_location_history_courier ON courier_location_history(courier_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_courier_shifts_courier ON courier_shifts(courier_id, started_at);

-- Update orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES couriers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_assigned_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_accepted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Update deliveries table
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS pickup_photo_url TEXT;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- Trigger to create earnings record when order is delivered
CREATE OR REPLACE FUNCTION create_courier_earnings_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_amount NUMERIC;
  v_commission_rate NUMERIC;
  v_week_start DATE;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.courier_id IS NOT NULL THEN
    SELECT commission_rate INTO v_commission_rate
    FROM couriers
    WHERE id = NEW.courier_id;
    
    v_commission_amount := NEW.total_amount * (v_commission_rate / 100);
    v_week_start := DATE_TRUNC('week', NOW())::DATE;
    
    INSERT INTO courier_earnings (
      courier_id,
      order_id,
      order_total,
      commission_rate,
      commission_amount,
      total_earned,
      week_start_date
    ) VALUES (
      NEW.courier_id,
      NEW.id,
      NEW.total_amount,
      v_commission_rate,
      v_commission_amount,
      v_commission_amount,
      v_week_start
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_create_courier_earnings ON orders;
CREATE TRIGGER trigger_create_courier_earnings
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_courier_earnings_on_delivery();

-- RLS Policies for couriers
ALTER TABLE couriers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can view own profile" ON couriers;
CREATE POLICY "Couriers can view own profile" ON couriers
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Couriers can update own profile" ON couriers;
CREATE POLICY "Couriers can update own profile" ON couriers
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage couriers" ON couriers;
CREATE POLICY "Admins can manage couriers" ON couriers
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE courier_earnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can view own earnings" ON courier_earnings;
CREATE POLICY "Couriers can view own earnings" ON courier_earnings
  FOR SELECT USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage earnings" ON courier_earnings;
CREATE POLICY "Admins can manage earnings" ON courier_earnings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE courier_location_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can insert own location" ON courier_location_history;
CREATE POLICY "Couriers can insert own location" ON courier_location_history
  FOR INSERT WITH CHECK (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view location history" ON courier_location_history;
CREATE POLICY "Admins can view location history" ON courier_location_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE courier_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can manage own shifts" ON courier_shifts;
CREATE POLICY "Couriers can manage own shifts" ON courier_shifts
  FOR ALL USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all shifts" ON courier_shifts;
CREATE POLICY "Admins can view all shifts" ON courier_shifts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE courier_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Couriers can view own metrics" ON courier_metrics;
CREATE POLICY "Couriers can view own metrics" ON courier_metrics
  FOR SELECT USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all metrics" ON courier_metrics;
CREATE POLICY "Admins can view all metrics" ON courier_metrics
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));