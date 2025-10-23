-- Add trigger to auto-verify age on signup (since this is a demo/MVP)
-- In production, you'd want proper ID verification
CREATE OR REPLACE FUNCTION public.auto_verify_age_on_profile_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set age_verified to true for new profiles
  -- In production, remove this and use proper ID verification
  NEW.age_verified := true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_verify_age_trigger ON public.profiles;

-- Create trigger for automatic age verification
CREATE TRIGGER auto_verify_age_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_verify_age_on_profile_creation();

-- Update existing profiles to be age-verified (for testing)
UPDATE public.profiles SET age_verified = true WHERE age_verified = false;