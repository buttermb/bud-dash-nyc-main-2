-- Add COA tracking fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS test_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS lab_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS batch_number TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.products.test_date IS 'Date the product was lab tested';
COMMENT ON COLUMN public.products.lab_name IS 'Name of the testing laboratory';
COMMENT ON COLUMN public.products.batch_number IS 'Batch or lot number for tracking';
COMMENT ON COLUMN public.products.images IS 'Array of additional product image URLs';