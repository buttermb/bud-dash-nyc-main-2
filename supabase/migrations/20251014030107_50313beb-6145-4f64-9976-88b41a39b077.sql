-- Enable realtime for fraud_flags table
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_flags;

-- Add replica identity for fraud_flags
ALTER TABLE public.fraud_flags REPLICA IDENTITY FULL;