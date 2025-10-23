-- Fix admin_users table RLS to prevent public access
-- The issue is that check_is_admin() queries admin_users, creating infinite recursion
-- We'll use has_role() instead which queries user_roles table

DROP POLICY IF EXISTS "Admins can view all admin users" ON public.admin_users;
DROP POLICY IF EXISTS "Super admins can manage admin users" ON public.admin_users;

-- Only authenticated users with 'admin' role can view admin_users
CREATE POLICY "Admins can view all admin users"
ON public.admin_users
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Only super admins can manage (INSERT, UPDATE, DELETE) admin_users
CREATE POLICY "Super admins can manage admin users"
ON public.admin_users
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  get_admin_role(auth.uid()) = 'super_admin'::admin_role
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  get_admin_role(auth.uid()) = 'super_admin'::admin_role
);