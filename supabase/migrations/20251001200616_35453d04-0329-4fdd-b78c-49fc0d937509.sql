-- Ensure order statuses are standardized
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'));

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT, -- 'customer', 'courier', 'admin', 'merchant', 'system'
  changed_by_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

-- Enable RLS on order_status_history
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all status history
CREATE POLICY "Admins can view status history"
ON order_status_history FOR SELECT
USING (check_is_admin(auth.uid()));

-- Couriers can view status history for their orders
CREATE POLICY "Couriers can view own order status history"
ON order_status_history FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE courier_id IN (
      SELECT id FROM couriers WHERE user_id = auth.uid()
    )
  )
);

-- Users can view status history for their orders
CREATE POLICY "Users can view own order status history"
ON order_status_history FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  )
);

-- System can insert status history
CREATE POLICY "System can insert status history"
ON order_status_history FOR INSERT
WITH CHECK (true);

-- Function to track status changes
CREATE OR REPLACE FUNCTION track_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'system', 'Status automatically updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_track_status ON orders;
CREATE TRIGGER trigger_track_status
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION track_status_change();