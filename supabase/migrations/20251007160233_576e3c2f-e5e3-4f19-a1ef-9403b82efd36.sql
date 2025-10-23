-- Add stock_quantity field to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- Add low_stock_alert field
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER DEFAULT 5;

-- Add cost_per_unit for profit calculations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS cost_per_unit NUMERIC DEFAULT 0;

-- Add sale_price for promotions
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT NULL;

COMMENT ON COLUMN public.products.stock_quantity IS 'Current stock quantity available';
COMMENT ON COLUMN public.products.low_stock_alert IS 'Alert threshold for low stock notifications';
COMMENT ON COLUMN public.products.cost_per_unit IS 'Cost per unit for profit margin calculations';
COMMENT ON COLUMN public.products.sale_price IS 'Sale price when product is on promotion';