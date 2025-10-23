-- Add missing INSERT policy for order_items
-- This allows users to create order items only for their own orders
CREATE POLICY "Users can create order items" 
ON order_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = auth.uid()
  )
);