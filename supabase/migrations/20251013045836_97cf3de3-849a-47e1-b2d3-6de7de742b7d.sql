-- Create a function to hash PINs consistently
CREATE OR REPLACE FUNCTION public.hash_admin_pin(pin_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN '$sha256$' || encode(digest(pin_text, 'sha256'), 'hex');
END;
$$;