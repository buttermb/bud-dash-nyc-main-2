-- Add commission_rate column to couriers table
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 30.00;

-- Add comment to explain the column
COMMENT ON COLUMN couriers.commission_rate IS 'Commission percentage (e.g., 30.00 for 30%)';

-- Update existing couriers to have default commission rate
UPDATE couriers 
SET commission_rate = 30.00 
WHERE commission_rate IS NULL;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_courier_earnings_on_order_delivered ON orders;

-- Recreate the trigger
CREATE TRIGGER create_courier_earnings_on_order_delivered
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered'))
  EXECUTE FUNCTION create_courier_earnings_on_delivery();