-- Add missing columns for full courier functionality

-- Enhance couriers table
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS total_deliveries INT DEFAULT 0;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS on_time_rate DECIMAL(5,2) DEFAULT 100.0;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;

-- Enhance orders table with delivery details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_lat DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_lng DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_lat DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dropoff_lng DOUBLE PRECISION;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_miles DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tip_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS requires_id_check BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_of_delivery_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_signature_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_rating INT CHECK (courier_rating >= 1 AND courier_rating <= 5);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_feedback TEXT;

-- Update courier_earnings to include tips and bonuses
ALTER TABLE courier_earnings ADD COLUMN IF NOT EXISTS base_pay DECIMAL(10,2);
ALTER TABLE courier_earnings ADD COLUMN IF NOT EXISTS bonus_amount DECIMAL(10,2) DEFAULT 0;

-- Add coordinates to merchants and addresses if not exists
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create courier chat messages table
CREATE TABLE IF NOT EXISTS courier_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courier_messages_order ON courier_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_courier_messages_courier ON courier_messages(courier_id);

-- Create courier performance bonuses table
CREATE TABLE IF NOT EXISTS courier_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  bonus_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  earned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courier_bonuses_courier ON courier_bonuses(courier_id);

-- Create courier streaks table
CREATE TABLE IF NOT EXISTS courier_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  streak_date DATE NOT NULL,
  consecutive_deliveries INT DEFAULT 0,
  bonus_earned DECIMAL(10,2) DEFAULT 0,
  UNIQUE(courier_id, streak_date)
);

-- Function to apply peak hours bonus
CREATE OR REPLACE FUNCTION apply_peak_hours_bonus()
RETURNS TRIGGER AS $$
DECLARE
  hour INT;
  bonus DECIMAL;
BEGIN
  hour := EXTRACT(HOUR FROM NEW.created_at);
  
  -- Lunch rush (11 AM - 2 PM) - 20% bonus
  IF hour >= 11 AND hour <= 14 THEN
    bonus := NEW.commission_amount * 0.20;
    NEW.bonus_amount := COALESCE(NEW.bonus_amount, 0) + bonus;
    
    INSERT INTO courier_bonuses (courier_id, bonus_type, amount, description)
    VALUES (NEW.courier_id, 'peak_hours', bonus, 'Lunch rush bonus (20%)');
  END IF;
  
  -- Dinner rush (5 PM - 9 PM) - 25% bonus
  IF hour >= 17 AND hour <= 21 THEN
    bonus := NEW.commission_amount * 0.25;
    NEW.bonus_amount := COALESCE(NEW.bonus_amount, 0) + bonus;
    
    INSERT INTO courier_bonuses (courier_id, bonus_type, amount, description)
    VALUES (NEW.courier_id, 'peak_hours', bonus, 'Dinner rush bonus (25%)');
  END IF;
  
  -- Recalculate total_earned with tips and bonuses
  NEW.total_earned := NEW.commission_amount + COALESCE(NEW.tip_amount, 0) + COALESCE(NEW.bonus_amount, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for peak hours bonus
DROP TRIGGER IF EXISTS trigger_peak_hours_bonus ON courier_earnings;
CREATE TRIGGER trigger_peak_hours_bonus
BEFORE INSERT ON courier_earnings
FOR EACH ROW
EXECUTE FUNCTION apply_peak_hours_bonus();

-- Function to update streak bonuses
CREATE OR REPLACE FUNCTION update_delivery_streak()
RETURNS TRIGGER AS $$
DECLARE
  today_deliveries INT;
  streak_bonus DECIMAL := 0;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.courier_id IS NOT NULL THEN
    -- Count today's deliveries
    SELECT COUNT(*) INTO today_deliveries
    FROM orders
    WHERE courier_id = NEW.courier_id
      AND DATE(delivered_at) = CURRENT_DATE
      AND status = 'delivered';
    
    -- Update or insert streak record
    INSERT INTO courier_streaks (courier_id, streak_date, consecutive_deliveries)
    VALUES (NEW.courier_id, CURRENT_DATE, today_deliveries)
    ON CONFLICT (courier_id, streak_date)
    DO UPDATE SET consecutive_deliveries = today_deliveries;
    
    -- Award bonuses at milestones
    IF today_deliveries = 5 THEN
      streak_bonus := 10.00;
      INSERT INTO courier_bonuses (courier_id, bonus_type, amount, description)
      VALUES (NEW.courier_id, 'completion_streak', streak_bonus, '5 deliveries streak bonus');
    ELSIF today_deliveries = 10 THEN
      streak_bonus := 25.00;
      INSERT INTO courier_bonuses (courier_id, bonus_type, amount, description)
      VALUES (NEW.courier_id, 'completion_streak', streak_bonus, '10 deliveries streak bonus');
    ELSIF today_deliveries = 15 THEN
      streak_bonus := 50.00;
      INSERT INTO courier_bonuses (courier_id, bonus_type, amount, description)
      VALUES (NEW.courier_id, 'completion_streak', streak_bonus, '15 deliveries streak bonus');
    END IF;
    
    -- Update courier total deliveries count
    UPDATE couriers
    SET total_deliveries = total_deliveries + 1
    WHERE id = NEW.courier_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for delivery streaks
DROP TRIGGER IF EXISTS trigger_delivery_streak ON orders;
CREATE TRIGGER trigger_delivery_streak
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_delivery_streak();

-- RLS Policies for new tables
ALTER TABLE courier_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courier_streaks ENABLE ROW LEVEL SECURITY;

-- Couriers can view their own messages
CREATE POLICY "Couriers can view own messages" ON courier_messages
  FOR SELECT USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

-- Couriers can insert messages
CREATE POLICY "Couriers can insert messages" ON courier_messages
  FOR INSERT WITH CHECK (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

-- Couriers can view their own bonuses
CREATE POLICY "Couriers can view own bonuses" ON courier_bonuses
  FOR SELECT USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

-- Couriers can view their own streaks
CREATE POLICY "Couriers can view own streaks" ON courier_streaks
  FOR SELECT USING (
    courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
  );

-- Admins can view all
CREATE POLICY "Admins can view all messages" ON courier_messages
  FOR SELECT USING (check_is_admin(auth.uid()));

CREATE POLICY "Admins can view all bonuses" ON courier_bonuses
  FOR SELECT USING (check_is_admin(auth.uid()));

CREATE POLICY "Admins can view all streaks" ON courier_streaks
  FOR SELECT USING (check_is_admin(auth.uid()));