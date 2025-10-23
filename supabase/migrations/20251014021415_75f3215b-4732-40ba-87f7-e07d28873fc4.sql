-- Enhanced Profiles Table with Risk Management
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_type TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS id_expiry_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 50;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_level TEXT DEFAULT 'new';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_orders INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS average_order_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_order_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_value NUMERIC(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chargebacks INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_payments INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancelled_orders INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reported_issues INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_limit NUMERIC(10,2) DEFAULT 500;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_limit NUMERIC(10,2) DEFAULT 2000;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_limit INTEGER DEFAULT 3;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name_change_count INTEGER DEFAULT 0;

-- Enhanced Addresses Table with Risk Assessment
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS neighborhood TEXT;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS risk_zone TEXT DEFAULT 'green';
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS delivery_count INTEGER DEFAULT 0;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS issue_count INTEGER DEFAULT 0;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS coordinates JSONB;
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Fraud Flags Table
CREATE TABLE IF NOT EXISTS fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flag_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  auto_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id)
);

ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud flags"
  ON fraud_flags FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage fraud flags"
  ON fraud_flags FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Risk Factors Table (Neighborhood-based)
CREATE TABLE IF NOT EXISTS risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood TEXT UNIQUE NOT NULL,
  borough TEXT NOT NULL,
  risk_level INTEGER NOT NULL DEFAULT 5,
  scam_reports INTEGER DEFAULT 0,
  avg_income NUMERIC(10,2),
  crime_rate NUMERIC(5,2),
  delivery_issues INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE risk_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view risk factors"
  ON risk_factors FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage risk factors"
  ON risk_factors FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Device Fingerprints Table
CREATE TABLE IF NOT EXISTS device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  ip_address TEXT,
  multiple_accounts BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE device_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own device fingerprints"
  ON device_fingerprints FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert device fingerprints"
  ON device_fingerprints FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all device fingerprints"
  ON device_fingerprints FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Account Logs Table
CREATE TABLE IF NOT EXISTS account_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  ip_address TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE account_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account logs"
  ON account_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all account logs"
  ON account_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert account logs"
  ON account_logs FOR INSERT
  WITH CHECK (true);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  card_holder_name TEXT,
  is_default BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
  ON payment_methods FOR ALL
  USING (auth.uid() = user_id);

-- Function to generate user ID code
CREATE OR REPLACE FUNCTION generate_user_id_code(p_user_id UUID, p_borough TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  zone_code TEXT;
  year_code TEXT;
  random_code TEXT;
  checksum CHAR(1);
BEGIN
  -- Get zone code from borough
  zone_code := CASE p_borough
    WHEN 'Manhattan' THEN 'MAN'
    WHEN 'Brooklyn' THEN 'BRK'
    WHEN 'Queens' THEN 'QNS'
    WHEN 'Bronx' THEN 'BRX'
    WHEN 'Staten Island' THEN 'STI'
    ELSE 'NYC'
  END;
  
  -- Get year code
  year_code := TO_CHAR(NOW(), 'YY');
  
  -- Generate random code
  random_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || p_user_id::TEXT) FROM 1 FOR 4));
  
  -- Generate checksum
  checksum := UPPER(SUBSTRING(MD5(p_user_id::TEXT) FROM 1 FOR 1));
  
  RETURN 'BUD-' || zone_code || '-' || year_code || '-' || random_code || '-' || checksum;
END;
$$;

-- Function to calculate risk score
CREATE OR REPLACE FUNCTION calculate_risk_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score INTEGER := 100;
  v_profile RECORD;
  v_address RECORD;
  v_flags INTEGER;
BEGIN
  -- Get user profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  
  -- Get primary address
  SELECT * INTO v_address FROM addresses WHERE user_id = p_user_id AND is_default = true LIMIT 1;
  
  -- New user penalty
  IF v_profile.total_orders = 0 THEN
    v_score := v_score - 25;
  END IF;
  
  -- Cancellation rate
  IF v_profile.total_orders > 0 THEN
    IF (v_profile.cancelled_orders::FLOAT / v_profile.total_orders) > 0.3 THEN
      v_score := v_score - 30;
    END IF;
  END IF;
  
  -- Chargebacks
  IF v_profile.chargebacks > 0 THEN
    v_score := v_score - (v_profile.chargebacks * 25);
  END IF;
  
  -- Failed payments
  IF v_profile.failed_payments > 3 THEN
    v_score := v_score - 20;
  END IF;
  
  -- Address risk zone
  IF v_address.risk_zone = 'red' THEN
    v_score := v_score - 40;
  ELSIF v_address.risk_zone = 'yellow' THEN
    v_score := v_score - 20;
  END IF;
  
  -- Active fraud flags
  SELECT COUNT(*) INTO v_flags FROM fraud_flags 
  WHERE user_id = p_user_id AND resolved_at IS NULL;
  
  v_score := v_score - (v_flags * 30);
  
  -- Ensure score is between 0 and 100
  v_score := GREATEST(0, LEAST(100, v_score));
  
  RETURN v_score;
END;
$$;

-- Trigger to update risk score
CREATE OR REPLACE FUNCTION update_user_risk_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.risk_score := calculate_risk_score(NEW.user_id);
  
  -- Update trust level based on risk score
  IF NEW.risk_score >= 80 THEN
    NEW.trust_level := 'vip';
  ELSIF NEW.risk_score >= 60 THEN
    NEW.trust_level := 'regular';
  ELSIF NEW.risk_score >= 40 THEN
    NEW.trust_level := 'new';
  ELSE
    NEW.trust_level := 'flagged';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profile_risk_score
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_risk_score();

-- Insert some default risk factors for NYC neighborhoods
INSERT INTO risk_factors (neighborhood, borough, risk_level, scam_reports, delivery_issues) VALUES
  ('Upper East Side', 'Manhattan', 2, 0, 0),
  ('Tribeca', 'Manhattan', 1, 0, 0),
  ('Park Slope', 'Brooklyn', 2, 0, 1),
  ('Williamsburg', 'Brooklyn', 3, 1, 2),
  ('Bedford-Stuyvesant', 'Brooklyn', 5, 3, 5),
  ('East New York', 'Brooklyn', 8, 10, 15),
  ('Brownsville', 'Brooklyn', 9, 12, 18),
  ('Jamaica', 'Queens', 5, 4, 8),
  ('Fordham', 'Bronx', 6, 5, 10),
  ('Hunts Point', 'Bronx', 8, 8, 12)
ON CONFLICT (neighborhood) DO NOTHING;