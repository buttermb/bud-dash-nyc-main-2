-- Fix commission calculation to use subtotal instead of total_amount
-- This ensures courier commission is calculated on product prices only, not delivery fees

CREATE OR REPLACE FUNCTION create_earnings_on_delivery()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL(5,2);
  v_commission_amount DECIMAL(10,2);
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.courier_id IS NOT NULL THEN
    -- Get courier commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM couriers
    WHERE id = NEW.courier_id;
    
    -- Calculate commission on SUBTOTAL only (excludes delivery fee)
    v_commission_amount := NEW.subtotal * (v_commission_rate / 100);
    
    -- Create earnings record
    INSERT INTO courier_earnings (
      courier_id,
      order_id,
      order_total,
      commission_rate,
      commission_amount,
      tip_amount,
      total_earned
    ) VALUES (
      NEW.courier_id,
      NEW.id,
      NEW.total_amount,
      v_commission_rate,
      v_commission_amount,
      COALESCE(NEW.tip_amount, 0),
      v_commission_amount + COALESCE(NEW.tip_amount, 0)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_create_earnings ON orders;
CREATE TRIGGER trigger_create_earnings
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION create_earnings_on_delivery();