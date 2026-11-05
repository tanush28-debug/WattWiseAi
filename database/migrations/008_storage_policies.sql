-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 008
-- Private Storage Bucket: electricity-bills & Access Policies
-- ====================================================================

-- 1. Create the private bucket 'electricity-bills' if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'electricity-bills',
    'electricity-bills',
    false, -- STRICTLY PRIVATE
    15728640, -- 15 MB threshold
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

-- 2. Storage RLS Policies
-- Storage paths convention:
-- Consumers: consumer/{auth.uid()}/{timestamp}_{filename}
-- Industrial: industrial/{org_id}/{facility_id}/{timestamp}_{filename}

-- Policy: Authenticated users can upload bills to their own path
DROP POLICY IF EXISTS "Users can upload their own electricity bills" ON storage.objects;
CREATE POLICY "Users can upload their own electricity bills"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'electricity-bills' AND
    (
        -- Consumer path check: first segment is consumer, second is user ID
        (storage.foldername(name))[1] = 'consumer' AND (storage.foldername(name))[2] = auth.uid()::text
        OR
        -- Industrial path check: user must belong to the organization in segment 2
        (
            (storage.foldername(name))[1] = 'industrial' AND
            public.is_member_of_org(((storage.foldername(name))[2])::uuid)
        )
    )
);

-- Policy: Authenticated users can read their own uploaded bills
DROP POLICY IF EXISTS "Users can read their own electricity bills" ON storage.objects;
CREATE POLICY "Users can read their own electricity bills"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'electricity-bills' AND
    (
        (storage.foldername(name))[1] = 'consumer' AND (storage.foldername(name))[2] = auth.uid()::text
        OR
        (
            (storage.foldername(name))[1] = 'industrial' AND
            public.is_member_of_org(((storage.foldername(name))[2])::uuid)
        )
        OR
        public.is_government_admin()
    )
);

-- Policy: Authenticated users can delete their own uploaded bills
DROP POLICY IF EXISTS "Users can delete their own electricity bills" ON storage.objects;
CREATE POLICY "Users can delete their own electricity bills"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'electricity-bills' AND
    (
        (storage.foldername(name))[1] = 'consumer' AND (storage.foldername(name))[2] = auth.uid()::text
        OR
        (
            (storage.foldername(name))[1] = 'industrial' AND
            public.is_member_of_org(((storage.foldername(name))[2])::uuid)
        )
    )
);

