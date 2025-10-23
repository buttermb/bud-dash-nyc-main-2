-- Add PIN tracking columns to couriers table
ALTER TABLE couriers 
ADD COLUMN IF NOT EXISTS pin_set_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pin_last_verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for efficient PIN expiration queries
CREATE INDEX IF NOT EXISTS idx_couriers_pin_set_at ON couriers(pin_set_at);

COMMENT ON COLUMN couriers.pin_set_at IS 'Timestamp when courier set their PIN (expires after 5 days)';
COMMENT ON COLUMN couriers.pin_last_verified_at IS 'Timestamp of last successful PIN verification';