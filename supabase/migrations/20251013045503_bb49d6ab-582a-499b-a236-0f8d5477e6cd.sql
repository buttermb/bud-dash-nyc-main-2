-- Enable realtime for couriers table to sync PIN changes
ALTER TABLE public.couriers REPLICA IDENTITY FULL;

-- Add couriers table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.couriers;