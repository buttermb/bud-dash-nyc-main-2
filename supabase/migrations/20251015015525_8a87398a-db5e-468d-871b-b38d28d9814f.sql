-- Improve giveaway_entries table with safe defaults and constraints
ALTER TABLE giveaway_entries
ALTER COLUMN user_email TYPE VARCHAR(255),
ALTER COLUMN user_phone TYPE VARCHAR(20),
ALTER COLUMN instagram_handle TYPE VARCHAR(50),
ALTER COLUMN device_fingerprint TYPE VARCHAR(255),
ALTER COLUMN ip_address SET DEFAULT 'unknown',
ALTER COLUMN user_agent SET DEFAULT '',
ALTER COLUMN fraud_score SET DEFAULT 0,
ALTER COLUMN status SET DEFAULT 'pending';

-- Add entry_type to track source
ALTER TABLE giveaway_entries
ADD COLUMN IF NOT EXISTS entry_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS order_id UUID,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error TEXT;

-- Create error logging table
CREATE TABLE IF NOT EXISTS giveaway_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  attempt_data JSONB,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_giveaway_errors_type ON giveaway_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_giveaway_errors_resolved ON giveaway_errors(resolved, created_at);

-- Create queue table for reliable processing
CREATE TABLE IF NOT EXISTS giveaway_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID,
  user_id UUID,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_giveaway_queue_status ON giveaway_queue(status, attempts);
CREATE INDEX IF NOT EXISTS idx_giveaway_queue_order ON giveaway_queue(order_id);

-- Add RLS policies
ALTER TABLE giveaway_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE giveaway_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view errors"
ON giveaway_errors FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert errors"
ON giveaway_queue FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view queue"
ON giveaway_queue FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to generate unique entry number with collision prevention
CREATE OR REPLACE FUNCTION generate_entry_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  entry_num TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    entry_num := 'GIVE-' || 
                 TO_CHAR(NOW(), 'YYMMDD') || '-' || 
                 UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    
    SELECT EXISTS(
      SELECT 1 FROM giveaway_entries WHERE entry_number_start::TEXT = entry_num
    ) INTO exists;
    
    EXIT WHEN NOT exists;
  END LOOP;
  
  RETURN entry_num;
END;
$$;

-- Function to create entry with retry logic
CREATE OR REPLACE FUNCTION create_giveaway_entry_safe(
  p_giveaway_id UUID,
  p_email TEXT,
  p_phone TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_borough TEXT,
  p_instagram TEXT,
  p_device_fingerprint TEXT,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_entry_type TEXT DEFAULT 'manual',
  p_order_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_entry giveaway_entries;
  v_entry_start INTEGER;
  v_entry_end INTEGER;
  v_total_entries INTEGER;
  v_giveaway giveaways;
BEGIN
  -- Get giveaway
  SELECT * INTO v_giveaway FROM giveaways WHERE id = p_giveaway_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Giveaway not found';
  END IF;
  
  -- Calculate entries based on type
  IF p_entry_type = 'purchase' THEN
    v_total_entries := 5; -- 5 entries for purchases
  ELSE
    v_total_entries := v_giveaway.base_entries;
  END IF;
  
  -- Get next entry number
  SELECT COALESCE(MAX(entry_number_end), 0) + 1 
  INTO v_entry_start
  FROM giveaway_entries
  WHERE giveaway_id = p_giveaway_id;
  
  v_entry_end := v_entry_start + v_total_entries - 1;
  
  -- Create entry with safe defaults
  INSERT INTO giveaway_entries (
    giveaway_id,
    user_email,
    user_first_name,
    user_last_name,
    user_phone,
    user_borough,
    instagram_handle,
    device_fingerprint,
    ip_address,
    user_agent,
    entry_type,
    order_id,
    base_entries,
    total_entries,
    entry_number_start,
    entry_number_end,
    status
  ) VALUES (
    p_giveaway_id,
    LOWER(COALESCE(p_email, '')),
    COALESCE(p_first_name, ''),
    COALESCE(p_last_name, ''),
    COALESCE(p_phone, ''),
    COALESCE(p_borough, ''),
    LOWER(COALESCE(p_instagram, '')),
    COALESCE(p_device_fingerprint, ''),
    COALESCE(p_ip_address, 'unknown'),
    COALESCE(p_user_agent, ''),
    p_entry_type,
    p_order_id,
    v_total_entries,
    v_total_entries,
    v_entry_start,
    v_entry_end,
    'pending'
  )
  RETURNING * INTO v_entry;
  
  -- Update giveaway totals
  UPDATE giveaways
  SET 
    total_entries = total_entries + v_total_entries,
    total_participants = total_participants + 1
  WHERE id = p_giveaway_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'entry_id', v_entry.id,
    'entry_start', v_entry_start,
    'entry_end', v_entry_end,
    'total_entries', v_total_entries
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error
    INSERT INTO giveaway_errors (error_type, error_message, error_stack)
    VALUES ('CREATE_ENTRY', SQLERRM, SQLSTATE);
    
    RAISE EXCEPTION 'Failed to create entry: %', SQLERRM;
END;
$$;