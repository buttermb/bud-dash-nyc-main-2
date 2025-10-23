-- Fix search_path for the loyalty points function
CREATE OR REPLACE FUNCTION public.update_loyalty_points_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;