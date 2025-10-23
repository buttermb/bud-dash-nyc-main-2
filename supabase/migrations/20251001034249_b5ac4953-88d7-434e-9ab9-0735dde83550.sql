-- Fix foreign key constraint for orders.courier_id
-- It should reference couriers.id, not users table

-- Drop the incorrect foreign key constraint
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS orders_courier_id_fkey;

-- Add the correct foreign key constraint
ALTER TABLE public.orders
ADD CONSTRAINT orders_courier_id_fkey 
FOREIGN KEY (courier_id) 
REFERENCES public.couriers(id)
ON DELETE SET NULL;