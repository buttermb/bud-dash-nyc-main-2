-- Add notification tracking columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_1 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_2 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_3 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_4 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_5 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_6 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_7 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notification_sent_stage_8 BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Create notifications_log table
CREATE TABLE IF NOT EXISTS notifications_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  notification_stage INTEGER NOT NULL,
  notification_type TEXT NOT NULL,
  recipient_phone TEXT,
  recipient_email TEXT,
  message_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create geofence_checks table
CREATE TABLE IF NOT EXISTS geofence_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES couriers(id) ON DELETE CASCADE,
  check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  driver_lat NUMERIC NOT NULL,
  driver_lng NUMERIC NOT NULL,
  customer_lat NUMERIC NOT NULL,
  customer_lng NUMERIC NOT NULL,
  distance_miles NUMERIC NOT NULL,
  within_geofence BOOLEAN NOT NULL,
  action_attempted TEXT,
  action_allowed BOOLEAN NOT NULL,
  override_requested BOOLEAN DEFAULT FALSE,
  override_approved BOOLEAN,
  override_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update courier_location_history to track mock locations
ALTER TABLE courier_location_history ADD COLUMN IF NOT EXISTS is_mock_location BOOLEAN DEFAULT FALSE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_notification_stages ON orders(
  notification_sent_stage_1,
  notification_sent_stage_2,
  notification_sent_stage_3,
  notification_sent_stage_4,
  notification_sent_stage_5,
  notification_sent_stage_6,
  notification_sent_stage_7,
  notification_sent_stage_8
);

CREATE INDEX IF NOT EXISTS idx_notifications_log_order_id ON notifications_log(order_id);
CREATE INDEX IF NOT EXISTS idx_geofence_checks_order_id ON geofence_checks(order_id);
CREATE INDEX IF NOT EXISTS idx_geofence_checks_driver_id ON geofence_checks(driver_id);

-- Enable RLS
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_checks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications_log
CREATE POLICY "Admins can view all notifications"
  ON notifications_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order notifications"
  ON notifications_log FOR SELECT
  TO authenticated
  USING (order_id IN (
    SELECT id FROM orders WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert notifications"
  ON notifications_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for geofence_checks
CREATE POLICY "Admins can view all geofence checks"
  ON geofence_checks FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Couriers can view own geofence checks"
  ON geofence_checks FOR SELECT
  TO authenticated
  USING (driver_id IN (
    SELECT id FROM couriers WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert geofence checks"
  ON geofence_checks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update geofence checks"
  ON geofence_checks FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));