-- Add customer location tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS customer_location_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_lat NUMERIC,
ADD COLUMN IF NOT EXISTS customer_lng NUMERIC,
ADD COLUMN IF NOT EXISTS customer_location_accuracy INTEGER,
ADD COLUMN IF NOT EXISTS customer_location_updated_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster location queries
CREATE INDEX IF NOT EXISTS idx_orders_customer_location 
ON orders(customer_lat, customer_lng) 
WHERE customer_location_enabled = true;

-- Add index for courier locations
CREATE INDEX IF NOT EXISTS idx_couriers_current_location 
ON couriers(current_lat, current_lng) 
WHERE is_online = true;