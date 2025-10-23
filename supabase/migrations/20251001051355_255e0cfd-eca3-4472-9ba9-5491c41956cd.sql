-- Allow public viewing of products (browse only)
-- Users still need age verification to purchase
DROP POLICY IF EXISTS "Products viewable by age-verified users only" ON products;

CREATE POLICY "Products viewable by everyone"
ON products
FOR SELECT
USING (true);

-- Add new product fields for enhanced discovery
ALTER TABLE products
ADD COLUMN IF NOT EXISTS strain_type text CHECK (strain_type IN ('indica', 'sativa', 'hybrid', 'cbd')),
ADD COLUMN IF NOT EXISTS effects text[], -- e.g., ['relaxing', 'uplifting', 'creative']
ADD COLUMN IF NOT EXISTS terpenes jsonb, -- e.g., {"myrcene": 2.5, "limonene": 1.8}
ADD COLUMN IF NOT EXISTS vendor_name text,
ADD COLUMN IF NOT EXISTS usage_tips text,
ADD COLUMN IF NOT EXISTS strain_lineage text;