-- Add SELECT policy to courier_applications to restrict viewing to admins only
-- This prevents public access to applicant personal information

CREATE POLICY "Only admins can view applications"
ON public.courier_applications
FOR SELECT
USING (check_is_admin(auth.uid()));