-- Fix search_path for generate_admin_pin function
CREATE OR REPLACE FUNCTION generate_admin_pin()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pin TEXT;
BEGIN
  pin := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN pin;
END;
$$;