-- Create security definer function to check age verification
CREATE OR REPLACE FUNCTION public.is_age_verified(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT age_verified FROM public.profiles WHERE user_id = _user_id),
    false
  )
$$;

-- Drop the old public products policy
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

-- Create new age-verified policy for products
CREATE POLICY "Products viewable by age-verified users only"
ON public.products FOR SELECT
USING (
  -- Allow if user is authenticated and age-verified
  (auth.uid() IS NOT NULL AND public.is_age_verified(auth.uid()) = true)
  OR
  -- Allow admins regardless
  public.has_role(auth.uid(), 'admin')
);

-- Create trigger to auto-set age_verified for new profiles
CREATE OR REPLACE FUNCTION public.set_age_verified_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-verify age for new signups (they passed the age gate to sign up)
  NEW.age_verified := true;
  RETURN NEW;
END;
$$;

-- Add trigger to profiles table
DROP TRIGGER IF EXISTS auto_verify_age_on_signup ON public.profiles;
CREATE TRIGGER auto_verify_age_on_signup
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_age_verified_on_signup();