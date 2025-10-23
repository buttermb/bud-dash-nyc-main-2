-- Fix RLS policies for giveaway_entries to ensure users can see their entries

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own entries" ON giveaway_entries;
DROP POLICY IF EXISTS "Users can create entries" ON giveaway_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON giveaway_entries;

-- Recreate policies with proper user_id checking
CREATE POLICY "Users can view own giveaway entries"
ON giveaway_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
ON giveaway_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all giveaway entries"
ON giveaway_entries
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update giveaway entries"
ON giveaway_entries
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow system/edge functions to create entries (for purchases)
CREATE POLICY "Service role can manage entries"
ON giveaway_entries
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);