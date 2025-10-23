-- Create function to process giveaway entry on delivery
CREATE OR REPLACE FUNCTION process_giveaway_on_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_giveaway giveaways;
  v_entry_result jsonb;
BEGIN
  -- Only process when status changes to delivered
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    
    -- Check if entry already exists
    IF EXISTS (
      SELECT 1 FROM giveaway_entries 
      WHERE order_id = NEW.id
    ) THEN
      RETURN NEW;
    END IF;
    
    -- Get active giveaway
    SELECT * INTO v_giveaway
    FROM giveaways
    WHERE status = 'active'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no active giveaway, skip
    IF v_giveaway.id IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Create giveaway entry directly using the safe function
    BEGIN
      SELECT create_giveaway_entry_safe(
        v_giveaway.id,
        COALESCE(NEW.customer_email, ''),
        COALESCE(NEW.customer_phone, ''),
        COALESCE(SPLIT_PART(NEW.customer_name, ' ', 1), ''),
        COALESCE(SUBSTRING(NEW.customer_name FROM POSITION(' ' IN NEW.customer_name) + 1), ''),
        COALESCE(NEW.delivery_borough, ''),
        '',
        '',
        'system',
        'delivery',
        'purchase',
        NEW.id
      ) INTO v_entry_result;
      
      RAISE LOG 'Giveaway entry created for order %: %', NEW.id, v_entry_result;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but don't fail the order
      RAISE WARNING 'Failed to create giveaway entry for order %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic giveaway entry creation
DROP TRIGGER IF EXISTS trigger_giveaway_on_delivery ON orders;
CREATE TRIGGER trigger_giveaway_on_delivery
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION process_giveaway_on_delivery();

-- Enable realtime for giveaway_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE giveaway_entries;