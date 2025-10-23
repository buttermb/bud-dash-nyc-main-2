-- Allow guest checkouts by making user_id nullable
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to support guest checkouts
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;

-- Allow guests to create orders (without user_id)
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));

-- Allow users to view their own orders, and allow anyone to view orders with tracking code
CREATE POLICY "Users can view own orders or track with code"
ON orders FOR SELECT
USING (
  auth.uid() = user_id 
  OR tracking_code IS NOT NULL 
  OR (auth.uid() = courier_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Update addresses table to allow NULL user_id for guest checkouts
ALTER TABLE addresses ALTER COLUMN user_id DROP NOT NULL;

-- Update address RLS policies
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;

CREATE POLICY "Users can insert addresses"
ON addresses FOR INSERT
WITH CHECK (auth.uid() = user_id OR (auth.uid() IS NULL AND user_id IS NULL));