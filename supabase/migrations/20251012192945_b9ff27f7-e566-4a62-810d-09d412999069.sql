-- ============================================
-- BUD DASH NYC GIVEAWAY SYSTEM
-- ============================================

-- 1. GIVEAWAYS TABLE
CREATE TABLE IF NOT EXISTS giveaways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tagline TEXT,
  description TEXT,
  
  -- Dates
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  
  -- Prizes
  grand_prize_title TEXT DEFAULT '1 LB Premium Flower',
  grand_prize_description TEXT DEFAULT 'Full pound delivered same-day',
  grand_prize_value DECIMAL(10,2) DEFAULT 4000.00,
  
  second_prize_title TEXT DEFAULT '$200 Bud Dash Credit',
  second_prize_value DECIMAL(10,2) DEFAULT 200.00,
  
  third_prize_title TEXT DEFAULT '$50 Bud Dash Credit',
  third_prize_value DECIMAL(10,2) DEFAULT 50.00,
  
  -- Entry Config
  base_entries INT DEFAULT 1,
  newsletter_bonus_entries INT DEFAULT 1,
  instagram_story_bonus_entries INT DEFAULT 2,
  instagram_post_bonus_entries INT DEFAULT 5,
  referral_bonus_entries INT DEFAULT 3,
  
  -- Stats
  total_entries INT DEFAULT 0,
  total_participants INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ENTRIES TABLE
CREATE TABLE IF NOT EXISTS giveaway_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- User Info
  user_email TEXT,
  user_first_name TEXT,
  user_last_name TEXT,
  user_phone TEXT,
  user_borough TEXT,
  
  -- Instagram
  instagram_handle TEXT,
  instagram_verified BOOLEAN DEFAULT true,
  instagram_tag_url TEXT,
  
  -- Entry Counts
  base_entries INT DEFAULT 1,
  newsletter_entries INT DEFAULT 0,
  instagram_story_entries INT DEFAULT 0,
  instagram_post_entries INT DEFAULT 0,
  referral_entries INT DEFAULT 0,
  total_entries INT DEFAULT 1,
  
  -- Entry Numbers (for drawing)
  entry_number_start INT,
  entry_number_end INT,
  
  status TEXT DEFAULT 'verified',
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(giveaway_id, user_id)
);

-- 3. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS giveaway_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID REFERENCES giveaways(id) ON DELETE CASCADE,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  referral_code TEXT UNIQUE NOT NULL,
  clicked_at TIMESTAMPTZ,
  signed_up_at TIMESTAMPTZ,
  converted BOOLEAN DEFAULT false,
  entries_awarded INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(giveaway_id, referred_user_id)
);

-- 4. WINNERS TABLE
CREATE TABLE IF NOT EXISTS giveaway_winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id UUID REFERENCES giveaways(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES giveaway_entries(id) ON DELETE CASCADE,
  
  prize_rank INT NOT NULL,
  prize_title TEXT,
  prize_value DECIMAL(10,2),
  winning_entry_number INT,
  
  status TEXT DEFAULT 'pending',
  notified_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  
  credit_code TEXT UNIQUE,
  credit_amount DECIMAL(10,2),
  
  selected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_entries_giveaway ON giveaway_entries(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_entries_user ON giveaway_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON giveaway_referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_giveaways_slug ON giveaways(slug);

-- 6. ROW LEVEL SECURITY
ALTER TABLE giveaways ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_winners ENABLE ROW LEVEL SECURITY;

-- 7. POLICIES
CREATE POLICY "Public can view active giveaways" 
ON giveaways FOR SELECT 
USING (status = 'active');

CREATE POLICY "Admins can manage giveaways" 
ON giveaways FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own entries" 
ON giveaway_entries FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create entries" 
ON giveaway_entries FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all entries" 
ON giveaway_entries FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own referrals" 
ON giveaway_referrals FOR SELECT 
USING (auth.uid() = referrer_user_id);

CREATE POLICY "System can create referrals" 
ON giveaway_referrals FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can view winners" 
ON giveaway_winners FOR SELECT 
USING (status = 'announced');

CREATE POLICY "Admins can manage winners" 
ON giveaway_winners FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. AUTO-UPDATE STATS FUNCTION
CREATE OR REPLACE FUNCTION update_giveaway_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE giveaways
  SET 
    total_entries = (
      SELECT COALESCE(SUM(total_entries), 0) 
      FROM giveaway_entries 
      WHERE giveaway_id = NEW.giveaway_id
    ),
    total_participants = (
      SELECT COUNT(DISTINCT user_id)
      FROM giveaway_entries
      WHERE giveaway_id = NEW.giveaway_id
    ),
    updated_at = NOW()
  WHERE id = NEW.giveaway_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. TRIGGER
DROP TRIGGER IF EXISTS update_giveaway_stats_trigger ON giveaway_entries;
CREATE TRIGGER update_giveaway_stats_trigger
  AFTER INSERT OR UPDATE ON giveaway_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_giveaway_stats();

-- 10. INSERT TEST GIVEAWAY
INSERT INTO giveaways (
  title,
  slug,
  tagline,
  description,
  start_date,
  end_date,
  status
) VALUES (
  'NYC''s Biggest Flower Giveaway',
  'nyc-biggest-flower',
  'Win 1 LB of Premium Flower',
  'Enter to win $4,000+ in premium NYC flower. Three winners. FREE to enter.',
  NOW(),
  NOW() + INTERVAL '30 days',
  'active'
) ON CONFLICT (slug) DO NOTHING;