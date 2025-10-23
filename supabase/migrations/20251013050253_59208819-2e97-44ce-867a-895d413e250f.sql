-- Fix hash_admin_pin to use the correct schema for pgcrypto functions
CREATE OR REPLACE FUNCTION public.hash_admin_pin(pin_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  RETURN '$sha256$' || encode(digest(pin_text, 'sha256'), 'hex');
END;
$$;