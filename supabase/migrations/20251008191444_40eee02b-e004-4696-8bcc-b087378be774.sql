-- Fix pg_cron by enabling pg_net extension
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create override_requests table
CREATE TABLE IF NOT EXISTS public.override_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  courier_id UUID REFERENCES couriers(id) NOT NULL,
  current_distance_miles NUMERIC NOT NULL,
  reason TEXT,
  driver_location_lat NUMERIC NOT NULL,
  driver_location_lng NUMERIC NOT NULL,
  customer_location_lat NUMERIC NOT NULL,
  customer_location_lng NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sms_enabled BOOLEAN DEFAULT true,
  sms_all_updates BOOLEAN DEFAULT true,
  sms_critical_only BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  push_all_updates BOOLEAN DEFAULT true,
  push_critical_only BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT true,
  email_all_updates BOOLEAN DEFAULT false,
  email_confirmation_only BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create gps_anomalies table for tracking GPS issues
CREATE TABLE IF NOT EXISTS public.gps_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_id UUID REFERENCES couriers(id) NOT NULL,
  order_id UUID REFERENCES orders(id),
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('offline', 'mock_location', 'impossible_speed', 'low_accuracy')),
  lat NUMERIC,
  lng NUMERIC,
  accuracy_meters INTEGER,
  speed_mph NUMERIC,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved BOOLEAN DEFAULT false,
  admin_notified BOOLEAN DEFAULT false
);

-- RLS Policies for override_requests
ALTER TABLE public.override_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Couriers can create override requests"
ON public.override_requests FOR INSERT
TO authenticated
WITH CHECK (
  courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
);

CREATE POLICY "Couriers can view own override requests"
ON public.override_requests FOR SELECT
TO authenticated
USING (
  courier_id IN (SELECT id FROM couriers WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can view all override requests"
ON public.override_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update override requests"
ON public.override_requests FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for gps_anomalies
ALTER TABLE public.gps_anomalies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can insert GPS anomalies"
ON public.gps_anomalies FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view GPS anomalies"
ON public.gps_anomalies FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update GPS anomalies"
ON public.gps_anomalies FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_override_requests_order ON override_requests(order_id);
CREATE INDEX idx_override_requests_courier ON override_requests(courier_id);
CREATE INDEX idx_override_requests_status ON override_requests(status);
CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX idx_gps_anomalies_courier ON gps_anomalies(courier_id);
CREATE INDEX idx_gps_anomalies_resolved ON gps_anomalies(resolved);

-- Update trigger for notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();