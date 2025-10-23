-- Welcome Discount System
CREATE TABLE IF NOT EXISTS user_welcome_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT DEFAULT 'WELCOME10',
  discount_percentage INT DEFAULT 10,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  order_id UUID,
  UNIQUE(user_id)
);

-- Auto-issue welcome discount on user creation
CREATE OR REPLACE FUNCTION issue_welcome_discount()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_welcome_discounts (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_issue_discount
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION issue_welcome_discount();

-- Coupon Codes System
CREATE TABLE IF NOT EXISTS coupon_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  total_usage_limit INT,
  per_user_limit INT DEFAULT 1,
  used_count INT DEFAULT 0,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  never_expires BOOLEAN DEFAULT false,
  auto_apply BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID REFERENCES coupon_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_coupon_codes_code ON coupon_codes(code);
CREATE INDEX idx_coupon_codes_status ON coupon_codes(status);
CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);

-- Enable RLS
ALTER TABLE user_welcome_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_welcome_discounts
CREATE POLICY "Users can view own welcome discount"
  ON user_welcome_discounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert welcome discounts"
  ON user_welcome_discounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update welcome discounts"
  ON user_welcome_discounts FOR UPDATE
  USING (true);

-- RLS Policies for coupon_codes
CREATE POLICY "Public can view active coupons"
  ON coupon_codes FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage coupons"
  ON coupon_codes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for coupon_usage
CREATE POLICY "Users can view own coupon usage"
  ON coupon_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert coupon usage"
  ON coupon_usage FOR INSERT
  WITH CHECK (true);