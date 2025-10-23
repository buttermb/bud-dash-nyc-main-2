-- Fix search_path for track_status_change function
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'system', 'Status automatically updated');
  END IF;
  RETURN NEW;
END;
$$;