-- Allow guest orders (user_id can be null for guest checkout)
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- Add back the foreign key but allow NULL
ALTER TABLE orders 
  ADD CONSTRAINT orders_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE SET NULL;

-- Update RLS policy to allow guest orders
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;

CREATE POLICY "Users can create orders (including guests)"
  ON orders
  FOR INSERT
  WITH CHECK (
    -- Either authenticated user creating own order
    (auth.uid() = user_id)
    OR 
    -- Or guest checkout (no auth, user_id is null, has customer info)
    (auth.uid() IS NULL AND user_id IS NULL AND customer_name IS NOT NULL AND customer_phone IS NOT NULL)
  );

-- Allow guests to view their order by tracking code
CREATE POLICY "Anyone can view orders by tracking code"
  ON orders
  FOR SELECT
  USING (tracking_code IS NOT NULL);

-- Update order_items to allow guest order items
DROP POLICY IF EXISTS "Users can create order items" ON order_items;

CREATE POLICY "Users can create order items (including guests)"
  ON order_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.user_id = auth.uid() OR orders.user_id IS NULL)
    )
  );