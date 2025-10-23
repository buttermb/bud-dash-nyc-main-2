-- Add verification and fraud prevention columns to giveaway_entries
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_otp TEXT,
ADD COLUMN IF NOT EXISTS phone_otp TEXT,
ADD COLUMN IF NOT EXISTS otp_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS device_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Create index for verification lookups
CREATE INDEX IF NOT EXISTS idx_giveaway_entries_verification 
ON giveaway_entries(email_verified, phone_verified, status);

CREATE INDEX IF NOT EXISTS idx_giveaway_entries_fraud 
ON giveaway_entries(fraud_score, device_fingerprint);

-- Create failed attempts tracking table
CREATE TABLE IF NOT EXISTS giveaway_failed_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  phone TEXT,
  instagram_handle TEXT,
  ip_address TEXT,
  device_fingerprint TEXT,
  error_message TEXT,
  error_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for fraud detection
CREATE INDEX IF NOT EXISTS idx_failed_attempts_ip 
ON giveaway_failed_attempts(ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_device 
ON giveaway_failed_attempts(device_fingerprint, created_at);

-- Add RLS policies for failed attempts (admin only)
ALTER TABLE giveaway_failed_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view failed attempts"
ON giveaway_failed_attempts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert failed attempts"
ON giveaway_failed_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp TEXT;
BEGIN
  otp := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
  RETURN otp;
END;
$$;

-- Function to check fraud score
CREATE OR REPLACE FUNCTION calculate_fraud_score(
  p_email TEXT,
  p_phone TEXT,
  p_device_fingerprint TEXT,
  p_ip_address TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score INTEGER := 0;
  duplicate_count INTEGER;
  failed_count INTEGER;
BEGIN
  -- Check for duplicate entries
  SELECT COUNT(*) INTO duplicate_count
  FROM giveaway_entries
  WHERE email = p_email OR phone = p_phone OR device_fingerprint = p_device_fingerprint;
  
  IF duplicate_count > 0 THEN
    score := score + 50;
  END IF;
  
  -- Check failed attempts from same IP/device
  SELECT COUNT(*) INTO failed_count
  FROM giveaway_failed_attempts
  WHERE (ip_address = p_ip_address OR device_fingerprint = p_device_fingerprint)
    AND created_at > now() - interval '1 hour';
  
  IF failed_count > 3 THEN
    score := score + 30;
  END IF;
  
  -- Check for suspicious patterns
  IF p_email LIKE '%test%' OR p_email LIKE '%fake%' THEN
    score := score + 20;
  END IF;
  
  RETURN score;
END;
$$;