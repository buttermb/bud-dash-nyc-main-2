-- Add lab results URL to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS lab_results_url text;

COMMENT ON COLUMN public.products.lab_results_url IS 'URL to the lab results PDF or document for this product';