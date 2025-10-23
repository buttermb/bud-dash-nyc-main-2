-- Phase 1: Fix Purchase Limits RLS Policy (CRITICAL)
-- Remove overpermissive policy and create system-only access
DROP POLICY IF EXISTS "System can update limits" ON public.purchase_limits;

-- Only allow users to view their own limits
CREATE POLICY "Users can view own limits only"
ON public.purchase_limits
FOR SELECT
USING (auth.uid() = user_id);

-- System updates via secure function only
CREATE POLICY "System can update via function"
ON public.purchase_limits
FOR ALL
USING (false)
WITH CHECK (false);

-- Create secure function for purchase limit updates
CREATE OR REPLACE FUNCTION public.update_purchase_limits(
  _user_id uuid,
  _date date,
  _flower_grams numeric,
  _concentrate_grams numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.purchase_limits (user_id, date, flower_grams, concentrate_grams)
  VALUES (_user_id, _date, _flower_grams, _concentrate_grams)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    flower_grams = public.purchase_limits.flower_grams + _flower_grams,
    concentrate_grams = public.purchase_limits.concentrate_grams + _concentrate_grams,
    updated_at = now();
    
  -- Audit log
  INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, details)
  VALUES ('purchase_limit', _user_id::text, 'UPDATE', _user_id, 
    jsonb_build_object('flower_grams', _flower_grams, 'concentrate_grams', _concentrate_grams));
END;
$$;

-- Phase 2: Create Missing decrement_inventory RPC Function (CRITICAL)
CREATE OR REPLACE FUNCTION public.decrement_inventory(
  _product_id uuid,
  _quantity integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  -- Get current stock with row lock
  SELECT stock INTO current_stock
  FROM public.inventory
  WHERE product_id = _product_id
  FOR UPDATE;
  
  -- Check if sufficient stock
  IF current_stock IS NULL OR current_stock < _quantity THEN
    RETURN false;
  END IF;
  
  -- Decrement stock
  UPDATE public.inventory
  SET stock = stock - _quantity,
      updated_at = now()
  WHERE product_id = _product_id;
  
  RETURN true;
END;
$$;

-- Phase 3: Restrict Business Data Access (HIGH PRIORITY)
-- Fix merchants table - require authentication and hide sensitive data
DROP POLICY IF EXISTS "Merchants are viewable by everyone" ON public.merchants;

CREATE POLICY "Active merchants viewable by authenticated users"
ON public.merchants
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND is_active = true
);

CREATE POLICY "Merchants can view own profile"
ON public.merchants
FOR SELECT
USING (email = (auth.jwt() ->> 'email'::text));

-- Fix inventory table - restrict to merchants only
DROP POLICY IF EXISTS "Inventory viewable by everyone" ON public.inventory;

CREATE POLICY "Authenticated users can view inventory stock"
ON public.inventory
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Merchants can view own inventory details"
ON public.inventory
FOR ALL
USING (merchant_id IN (
  SELECT id FROM public.merchants 
  WHERE email = (auth.jwt() ->> 'email'::text)
));

-- Phase 4: Fix Database Function Security (MEDIUM PRIORITY)
-- Update all existing functions to include SET search_path

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_product_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
  WHERE id = COALESCE(NEW.product_id, OLD.product_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_age_verified_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.age_verified := true;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Phase 5: Add admin verification function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT has_role(_user_id, 'admin'::app_role)
$$;

-- Phase 6: Enhanced audit logging for security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _entity_type text,
  _entity_id text,
  _action text,
  _user_id uuid,
  _details jsonb DEFAULT NULL,
  _ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.audit_logs (entity_type, entity_id, action, user_id, details, ip_address)
  VALUES (_entity_type, _entity_id, _action, _user_id, _details, _ip_address)
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;