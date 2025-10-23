-- Add missing flagged order columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS flagged_reason TEXT,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id);

-- Create index for faster flagged order queries
CREATE INDEX IF NOT EXISTS idx_orders_flagged_reason ON public.orders(flagged_reason) WHERE flagged_reason IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.flagged_reason IS 'Reason why order was flagged by admin';
COMMENT ON COLUMN public.orders.flagged_at IS 'Timestamp when order was flagged';
COMMENT ON COLUMN public.orders.flagged_by IS 'Admin user ID who flagged the order';