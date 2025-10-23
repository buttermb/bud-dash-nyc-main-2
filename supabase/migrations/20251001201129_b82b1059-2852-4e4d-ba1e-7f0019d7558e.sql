-- Fix the create_earnings_on_delivery function to include week_start_date
CREATE OR REPLACE FUNCTION public.create_earnings_on_delivery()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_commission_rate DECIMAL(5,2);
  v_commission_amount DECIMAL(10,2);
  v_week_start DATE;
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') AND NEW.courier_id IS NOT NULL THEN
    -- Get courier commission rate
    SELECT commission_rate INTO v_commission_rate
    FROM couriers
    WHERE id = NEW.courier_id;
    
    -- Calculate commission on SUBTOTAL only (excludes delivery fee)
    v_commission_amount := NEW.subtotal * (v_commission_rate / 100);
    
    -- Calculate week start date (Monday of current week)
    v_week_start := DATE_TRUNC('week', NOW())::DATE;
    
    -- Create earnings record with week_start_date
    INSERT INTO courier_earnings (
      courier_id,
      order_id,
      order_total,
      commission_rate,
      commission_amount,
      tip_amount,
      total_earned,
      week_start_date
    ) VALUES (
      NEW.courier_id,
      NEW.id,
      NEW.total_amount,
      v_commission_rate,
      v_commission_amount,
      COALESCE(NEW.tip_amount, 0),
      v_commission_amount + COALESCE(NEW.tip_amount, 0),
      v_week_start
    );
  END IF;
  
  RETURN NEW;
END;
$$;