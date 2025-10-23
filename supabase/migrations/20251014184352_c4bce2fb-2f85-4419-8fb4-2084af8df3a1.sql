-- Add missing columns to orders table for delivery coordinates
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC,
ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC,
ADD COLUMN IF NOT EXISTS dropoff_lat NUMERIC,
ADD COLUMN IF NOT EXISTS dropoff_lng NUMERIC;

-- Add index for better performance on courier queries
CREATE INDEX IF NOT EXISTS idx_orders_courier_id ON orders(courier_id) WHERE courier_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Add missing columns to couriers table
ALTER TABLE couriers
ADD COLUMN IF NOT EXISTS vehicle_plate TEXT;