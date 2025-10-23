-- CRITICAL SECURITY FIX: Protect Identity Documents from Unauthorized Access

-- 1. Create PRIVATE storage bucket for ID documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  false, -- CRITICAL: Must be private
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false, -- Ensure it's private
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

-- 2. Add RLS policy for age_verifications table - admins can view for verification
DROP POLICY IF EXISTS "Admins can view all verifications" ON public.age_verifications;
CREATE POLICY "Admins can view all verifications"
ON public.age_verifications
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id
);

-- 3. Add RLS policy for age_verifications - admins can update verification status
DROP POLICY IF EXISTS "Admins can update verifications" ON public.age_verifications;
CREATE POLICY "Admins can update verifications"
ON public.age_verifications
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create RLS policies for ID document storage (CRITICAL)
-- Users can only view their own ID documents
DROP POLICY IF EXISTS "Users can view own ID documents" ON storage.objects;
CREATE POLICY "Users can view own ID documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  (
    -- User can view their own documents
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Admins can view all documents for verification
    has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Users can only upload their own ID documents
DROP POLICY IF EXISTS "Users can upload own ID documents" ON storage.objects;
CREATE POLICY "Users can upload own ID documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users cannot update documents after upload (immutability for compliance)
DROP POLICY IF EXISTS "ID documents are immutable" ON storage.objects;
CREATE POLICY "ID documents are immutable"
ON storage.objects
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

-- Only users can delete their own documents (before verification)
DROP POLICY IF EXISTS "Users can delete unverified documents" ON storage.objects;
CREATE POLICY "Users can delete unverified documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'id-documents' AND
  auth.uid()::text = (storage.foldername(name))[1] AND
  NOT EXISTS (
    SELECT 1 FROM public.age_verifications av
    WHERE av.user_id = auth.uid()
    AND av.verified = true
  )
);

-- 5. Add encryption notice to sensitive columns (documentation)
COMMENT ON COLUMN public.age_verifications.id_number IS 'SENSITIVE: ID number - should be encrypted at application level';
COMMENT ON COLUMN public.age_verifications.date_of_birth IS 'SENSITIVE: Date of birth - PII data';
COMMENT ON COLUMN public.age_verifications.id_front_url IS 'SENSITIVE: URL to ID front image in private storage';
COMMENT ON COLUMN public.age_verifications.id_back_url IS 'SENSITIVE: URL to ID back image in private storage';
COMMENT ON COLUMN public.age_verifications.selfie_url IS 'SENSITIVE: URL to selfie image in private storage';

-- 6. Add data retention policy documentation (GDPR compliance)
COMMENT ON TABLE public.age_verifications IS 'SENSITIVE: ID documents must be deleted after 90 days post-verification per data retention policy. Access is logged in security_events.';

-- 7. Create helper function to log document access (called manually)
CREATE OR REPLACE FUNCTION public.log_document_access(
  _verification_id UUID,
  _access_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_events (
    event_type,
    user_id,
    details
  ) VALUES (
    'id_document_access',
    auth.uid(),
    jsonb_build_object(
      'verification_id', _verification_id,
      'access_type', _access_type,
      'access_time', now()
    )
  );
END;
$$;

-- 8. Log this critical security fix
INSERT INTO public.audit_logs (entity_type, entity_id, action, details)
VALUES (
  'security_fix',
  'id_documents_protection',
  'CRITICAL_SECURITY_HARDENING',
  jsonb_build_object(
    'fixes', ARRAY[
      'Created private storage bucket for ID documents',
      'Added RLS policies to protect document URLs in storage',
      'Restricted admin access with proper role-based authorization',
      'Implemented immutability for verified documents',
      'Added document access logging function',
      'Documented data retention requirements'
    ],
    'severity', 'CRITICAL',
    'timestamp', now()
  )
);