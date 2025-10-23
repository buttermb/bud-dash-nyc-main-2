-- Create function to add items to cart with automatic upsert
CREATE OR REPLACE FUNCTION public.add_to_cart(
  p_user_id UUID,
  p_product_id UUID,
  p_quantity INTEGER,
  p_selected_weight TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO cart_items (user_id, product_id, quantity, selected_weight)
  VALUES (p_user_id, p_product_id, p_quantity, p_selected_weight)
  ON CONFLICT (user_id, product_id, selected_weight)
  DO UPDATE SET 
    quantity = cart_items.quantity + p_quantity,
    created_at = NOW();
END;
$$;

-- Ensure the unique constraint exists for ON CONFLICT to work
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_weight_idx 
ON cart_items (user_id, product_id, selected_weight);