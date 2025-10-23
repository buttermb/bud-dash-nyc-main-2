-- Add prices JSONB column to products table for weight-based pricing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS prices JSONB DEFAULT '{}';

-- Add selected_weight column to cart_items to track which weight was selected
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS selected_weight TEXT DEFAULT '3.5g';

-- Update existing products with sample pricing structure for flower products
-- This sets up the pricing format: {"3.5g": 35.99, "7g": 65.99, "14g": 120.99, "28g": 220.99}
UPDATE products 
SET prices = jsonb_build_object(
  '3.5g', price,
  '7g', price * 1.8,
  '14g', price * 3.3,
  '28g', price * 6.0
)
WHERE category = 'flower' AND (prices IS NULL OR prices = '{}');

-- For non-flower products, set a simple single-size pricing
UPDATE products 
SET prices = jsonb_build_object('unit', price)
WHERE category != 'flower' AND (prices IS NULL OR prices = '{}');

-- Add comment explaining the prices column
COMMENT ON COLUMN products.prices IS 'JSONB object storing weight-based pricing. Format: {"3.5g": 35.99, "7g": 65.99, "14g": 120.99, "28g": 220.99} for flower, or {"unit": price} for other products';