-- Create loyalty_points table
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  lifetime_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_points
CREATE POLICY "Users can view own loyalty points"
  ON public.loyalty_points
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert loyalty points"
  ON public.loyalty_points
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update loyalty points"
  ON public.loyalty_points
  FOR UPDATE
  USING (true);

-- Create function to update loyalty points timestamp
CREATE OR REPLACE FUNCTION public.update_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loyalty_points
DROP TRIGGER IF EXISTS update_loyalty_points_updated_at_trigger ON public.loyalty_points;
CREATE TRIGGER update_loyalty_points_updated_at_trigger
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION public.update_loyalty_points_updated_at();