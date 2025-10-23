-- Add IP address tracking and blocking features

-- Add IP addresses table
CREATE TABLE IF NOT EXISTS public.user_ip_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_blocked BOOLEAN DEFAULT false,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_by UUID REFERENCES auth.users(id),
  blocked_reason TEXT,
  times_used INTEGER DEFAULT 1,
  UNIQUE(user_id, ip_address)
);

-- Add blocked devices table
CREATE TABLE IF NOT EXISTS public.blocked_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint TEXT NOT NULL UNIQUE,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  user_id UUID REFERENCES auth.users(id)
);

-- Add blocked IPs table (global IP blacklist)
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_by UUID REFERENCES auth.users(id),
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Update device_fingerprints table to track blocking
ALTER TABLE public.device_fingerprints
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS blocked_reason TEXT;

-- Update account_logs to track IP addresses
ALTER TABLE public.account_logs
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT;

-- Enable RLS on new tables
ALTER TABLE public.user_ip_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_ip_addresses
CREATE POLICY "Admins can view all IP addresses"
  ON public.user_ip_addresses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert IP addresses"
  ON public.user_ip_addresses
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update IP addresses"
  ON public.user_ip_addresses
  FOR UPDATE
  USING (true);

-- RLS policies for blocked_devices
CREATE POLICY "Admins can manage blocked devices"
  ON public.blocked_devices
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for blocked_ips
CREATE POLICY "Admins can manage blocked IPs"
  ON public.blocked_ips
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to track IP address usage
CREATE OR REPLACE FUNCTION public.track_ip_address(_user_id UUID, _ip_address TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_ip_addresses (user_id, ip_address, times_used)
  VALUES (_user_id, _ip_address, 1)
  ON CONFLICT (user_id, ip_address)
  DO UPDATE SET
    last_seen = now(),
    times_used = user_ip_addresses.times_used + 1;
END;
$$;

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_ips
    WHERE ip_address = _ip_address
    AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- Function to check if device is blocked
CREATE OR REPLACE FUNCTION public.is_device_blocked(_fingerprint TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_devices
    WHERE fingerprint = _fingerprint
  );
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_ip_addresses_user_id ON public.user_ip_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ip_addresses_ip ON public.user_ip_addresses(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_devices_fingerprint ON public.blocked_devices(fingerprint);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON public.blocked_ips(ip_address);