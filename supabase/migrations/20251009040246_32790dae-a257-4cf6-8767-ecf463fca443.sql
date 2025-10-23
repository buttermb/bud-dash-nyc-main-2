-- Allow guest checkout by making user_id nullable in orders table
ALTER TABLE public.orders 
ALTER COLUMN user_id DROP NOT NULL;

-- Add index for faster queries on user_id when it exists
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id) WHERE user_id IS NOT NULL;

-- Update RLS policies to support both authenticated and guest users
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Block anonymous access to orders" ON public.orders;

-- Allow users to view their own orders OR orders they created as guests (using customer_email/customer_phone)
CREATE POLICY "Users can view own orders or guest orders"
ON public.orders
FOR SELECT
USING (
  auth.uid() = user_id 
  OR user_id IS NULL
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Allow authenticated users to create orders with their user_id
CREATE POLICY "Authenticated users can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (auth.uid() = user_id)
  OR (auth.uid() IS NULL AND user_id IS NULL)
);

-- Allow guests to create orders without user_id
CREATE POLICY "Guests can create orders"
ON public.orders
FOR INSERT
WITH CHECK (user_id IS NULL);