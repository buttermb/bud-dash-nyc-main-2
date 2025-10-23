-- Fix function search path security issue by dropping trigger first
DROP TRIGGER IF EXISTS trigger_set_accepted_time ON orders;
DROP FUNCTION IF EXISTS set_accepted_time();

CREATE OR REPLACE FUNCTION set_accepted_time()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.courier_id IS NOT NULL AND (OLD.courier_id IS NULL OR OLD.courier_id != NEW.courier_id) THEN
    NEW.accepted_at := NOW();
    NEW.courier_accepted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER trigger_set_accepted_time
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_accepted_time();