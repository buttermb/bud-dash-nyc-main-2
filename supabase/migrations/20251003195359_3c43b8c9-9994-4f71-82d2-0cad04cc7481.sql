-- Add admin PIN and ETA fields to couriers table
ALTER TABLE couriers
ADD COLUMN IF NOT EXISTS admin_pin TEXT,
ADD COLUMN IF NOT EXISTS admin_pin_verified BOOLEAN DEFAULT false;

-- Add ETA fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS eta_minutes INTEGER,
ADD COLUMN IF NOT EXISTS eta_updated_at TIMESTAMP WITH TIME ZONE;

-- Create admin PIN verification function
CREATE OR REPLACE FUNCTION verify_admin_pin(courier_user_id UUID, pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin TEXT;
BEGIN
  SELECT admin_pin INTO stored_pin
  FROM couriers
  WHERE user_id = courier_user_id;
  
  RETURN stored_pin = pin;
END;
$$;

-- Function to generate random admin PIN
CREATE OR REPLACE FUNCTION generate_admin_pin()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  pin TEXT;
BEGIN
  pin := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN pin;
END;
$$;