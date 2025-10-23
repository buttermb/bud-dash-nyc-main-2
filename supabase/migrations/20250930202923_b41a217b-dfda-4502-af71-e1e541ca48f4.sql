-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all admin users" ON admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can view own sessions" ON admin_sessions;

-- Create security definer function to check admin status
CREATE OR REPLACE FUNCTION public.check_is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = _user_id AND is_active = true
  );
$$;

-- Create security definer function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS admin_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM admin_users
  WHERE user_id = _user_id AND is_active = true
  LIMIT 1;
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Admins can view all admin users"
ON admin_users FOR SELECT
USING (public.check_is_admin(auth.uid()));

CREATE POLICY "Super admins can manage admin users"
ON admin_users FOR ALL
USING (
  public.check_is_admin(auth.uid()) 
  AND public.get_admin_role(auth.uid()) = 'super_admin'
);

CREATE POLICY "Admins can view own sessions"
ON admin_sessions FOR SELECT
USING (
  admin_id IN (
    SELECT id FROM admin_users WHERE user_id = auth.uid()
  )
);