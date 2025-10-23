-- Update verify_admin_pin to work with SHA-256 hashes
CREATE OR REPLACE FUNCTION public.verify_admin_pin(courier_user_id uuid, pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_pin_hash TEXT;
  input_hash TEXT;
BEGIN
  -- Get stored PIN hash
  SELECT admin_pin INTO stored_pin_hash
  FROM public.couriers
  WHERE user_id = courier_user_id;
  
  -- If no PIN set, return false
  IF stored_pin_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Compute SHA-256 hash of input PIN
  input_hash := '$sha256$' || encode(digest(pin, 'sha256'), 'hex');
  
  -- Compare hashes
  RETURN stored_pin_hash = input_hash;
END;
$$;

-- Log PIN verification attempts
CREATE OR REPLACE FUNCTION public.log_pin_verification(
  courier_user_id uuid,
  success boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details
  ) VALUES (
    'courier_pin_verification',
    courier_user_id,
    jsonb_build_object(
      'success', success,
      'timestamp', now()
    )
  );
END;
$$;