-- Update RLS policy to allow couriers to accept unassigned orders
DROP POLICY IF EXISTS "Couriers can update assigned orders" ON public.orders;

CREATE POLICY "Couriers can update assigned orders"
ON public.orders
FOR UPDATE
USING (
  -- Courier can update if already assigned to them
  (auth.uid() = courier_id)
  OR 
  -- Courier can accept unassigned orders (courier_id is null and user is a courier)
  (courier_id IS NULL AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'courier'
  ))
  OR
  -- Admins can update any order
  has_role(auth.uid(), 'admin'::app_role)
);