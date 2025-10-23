-- Add new columns for enhanced product details
ALTER TABLE products
ADD COLUMN IF NOT EXISTS coa_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS coa_qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS growing_info JSONB DEFAULT '{"method": "indoor", "organic": false, "location": ""}'::jsonb,
ADD COLUMN IF NOT EXISTS consumption_methods TEXT[],
ADD COLUMN IF NOT EXISTS effects_timeline JSONB DEFAULT '{"onset": "5-15 minutes", "peak": "1-2 hours", "duration": "2-4 hours"}'::jsonb,
ADD COLUMN IF NOT EXISTS medical_benefits TEXT[];

-- Create a table for recent purchases to show social proof
CREATE TABLE IF NOT EXISTS recent_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on recent_purchases
ALTER TABLE recent_purchases ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read recent purchases (for social proof)
CREATE POLICY "Recent purchases are viewable by everyone"
ON recent_purchases
FOR SELECT
USING (true);

-- Only system can insert (will be done via trigger)
CREATE POLICY "System can insert recent purchases"
ON recent_purchases
FOR INSERT
WITH CHECK (false);

-- Add photo support to reviews
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS photo_urls TEXT[];

-- Create a function to add recent purchase on order completion
CREATE OR REPLACE FUNCTION add_recent_purchase()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    -- Get a random product from the order
    INSERT INTO recent_purchases (product_id, customer_name, location)
    SELECT 
      oi.product_id,
      COALESCE(
        (SELECT full_name FROM profiles WHERE user_id = NEW.user_id LIMIT 1),
        'Customer'
      ),
      NEW.delivery_borough
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    LIMIT 1;
    
    -- Delete old entries (keep only last 50)
    DELETE FROM recent_purchases
    WHERE id IN (
      SELECT id FROM recent_purchases
      ORDER BY created_at DESC
      OFFSET 50
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for recent purchases
DROP TRIGGER IF EXISTS trigger_add_recent_purchase ON orders;
CREATE TRIGGER trigger_add_recent_purchase
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION add_recent_purchase();

-- Enable realtime for recent purchases
ALTER PUBLICATION supabase_realtime ADD TABLE recent_purchases;