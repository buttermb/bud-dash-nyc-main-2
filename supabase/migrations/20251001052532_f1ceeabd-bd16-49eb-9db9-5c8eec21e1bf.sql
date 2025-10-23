-- Create courier applications table
CREATE TABLE public.courier_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  borough TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  experience TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'needs_info')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courier_applications ENABLE ROW LEVEL SECURITY;

-- Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON public.courier_applications
FOR SELECT
USING (check_is_admin(auth.uid()));

-- Admins can update applications
CREATE POLICY "Admins can update applications"
ON public.courier_applications
FOR UPDATE
USING (check_is_admin(auth.uid()));

-- Anyone can insert applications (public form)
CREATE POLICY "Anyone can submit applications"
ON public.courier_applications
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_courier_applications_updated_at
BEFORE UPDATE ON public.courier_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();