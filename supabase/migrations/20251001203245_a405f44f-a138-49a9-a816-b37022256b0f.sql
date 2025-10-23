-- Add customer order history tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES auth.users(id);

-- Add accepted_at timestamp for countdown timer
ALTER TABLE orders ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

-- Track courier acceptance timing
CREATE OR REPLACE FUNCTION set_accepted_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.courier_id IS NOT NULL AND (OLD.courier_id IS NULL OR OLD.courier_id != NEW.courier_id) THEN
    NEW.accepted_at := NOW();
    NEW.courier_accepted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_accepted_time ON orders;
CREATE TRIGGER trigger_set_accepted_time
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_accepted_time();

-- Add courier notification preferences
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;
ALTER TABLE couriers ADD COLUMN IF NOT EXISTS notification_vibrate BOOLEAN DEFAULT true;

-- Add customer_id to profiles if not exists (for tracking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;