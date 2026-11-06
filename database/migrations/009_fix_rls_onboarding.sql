-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 009
-- Onboarding INSERT policies + strict storage path isolation
-- ====================================================================
-- Fixes:
--   1. Organizations and organization_members had no INSERT policy, so a
--      new industrial account could not create its own tenant.
--   2. Storage policies from migration 008 keyed industrial uploads by
--      organization, which allowed any member to write anywhere in the
--      org prefix. Every object must now live under the uploader's uid.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. Organization ownership
-- --------------------------------------------------------------------
-- The creator must be recorded so the first membership row can be
-- inserted before any membership exists (is_member_of_org() is false at
-- that point, which is why the original onboarding insert always failed).
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Backfill legacy organizations from their earliest member.
UPDATE public.organizations o
SET created_by = member.profile_id
FROM (
    SELECT DISTINCT ON (organization_id)
        organization_id,
        profile_id
    FROM public.organization_members
    ORDER BY organization_id, created_at ASC
) AS member
WHERE o.id = member.organization_id
  AND o.created_by IS NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_created_by
    ON public.organizations(created_by);

-- Force the creator column to the authenticated caller, regardless of
-- what the client sends.
CREATE OR REPLACE FUNCTION public.set_organization_creator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        NEW.created_by := auth.uid();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_organization_creator ON public.organizations;
CREATE TRIGGER trg_set_organization_creator
    BEFORE INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_organization_creator();

-- Helpers for membership onboarding. SECURITY DEFINER avoids RLS
-- recursion when the policy on organization_members reads the same table.
CREATE OR REPLACE FUNCTION public.is_org_manager(target_org_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = target_org_id
          AND profile_id = auth.uid()
          AND member_role IN ('OWNER', 'MANAGER')
    );
$$;

-- Safe UUID cast for storage paths. A malformed path segment must not
-- raise an error inside an RLS policy.
CREATE OR REPLACE FUNCTION public.try_uuid(value TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN value::uuid;
EXCEPTION
    WHEN others THEN
        RETURN NULL;
END;
$$;

-- --------------------------------------------------------------------
-- 2. Organizations & organization members INSERT policies
-- --------------------------------------------------------------------
-- Creators can read the organization row they just inserted (needed for
-- INSERT ... RETURNING during onboarding).
DROP POLICY IF EXISTS "orgs_select_policy" ON public.organizations;
CREATE POLICY "orgs_select_policy" ON public.organizations
    FOR SELECT TO authenticated
    USING (
        public.is_member_of_org(id)
        OR public.is_government_admin()
        OR created_by = auth.uid()
    );

DROP POLICY IF EXISTS "orgs_insert_policy" ON public.organizations;
CREATE POLICY "orgs_insert_policy" ON public.organizations
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

-- The creator may add themselves as OWNER. Existing OWNER/MANAGER rows
-- may invite or add further members.
DROP POLICY IF EXISTS "org_members_insert_policy" ON public.organization_members;
CREATE POLICY "org_members_insert_policy" ON public.organization_members
    FOR INSERT TO authenticated
    WITH CHECK (
        (
            profile_id = auth.uid()
            AND member_role = 'OWNER'
            AND EXISTS (
                SELECT 1
                FROM public.organizations o
                WHERE o.id = organization_id
                  AND o.created_by = auth.uid()
            )
        )
        OR public.is_org_manager(organization_id)
    );

-- --------------------------------------------------------------------
-- 3. Storage: per-user path isolation
-- --------------------------------------------------------------------
-- New object key convention (enforced by the policies below):
--   {auth.uid()}/consumer/{timestamp}_{filename}
--   {auth.uid()}/industrial/{organization_id}/{timestamp}_{filename}
--
-- The first path segment must always equal the uploader's uid, so one
-- user can never read or overwrite another user's bill even inside the
-- same organization.
DROP POLICY IF EXISTS "Users can upload their own electricity bills" ON storage.objects;
CREATE POLICY "Users can upload their own electricity bills"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'electricity-bills'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
        (storage.foldername(name))[2] = 'consumer'
        OR (
            (storage.foldername(name))[2] = 'industrial'
            AND public.is_member_of_org(
                public.try_uuid((storage.foldername(name))[3])
            )
        )
    )
);

DROP POLICY IF EXISTS "Users can read their own electricity bills" ON storage.objects;
CREATE POLICY "Users can read their own electricity bills"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'electricity-bills'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
        (storage.foldername(name))[2] = 'consumer'
        OR (
            (storage.foldername(name))[2] = 'industrial'
            AND public.is_member_of_org(
                public.try_uuid((storage.foldername(name))[3])
            )
        )
    )
);

DROP POLICY IF EXISTS "Users can delete their own electricity bills" ON storage.objects;
CREATE POLICY "Users can delete their own electricity bills"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'electricity-bills'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (
        (storage.foldername(name))[2] = 'consumer'
        OR (
            (storage.foldername(name))[2] = 'industrial'
            AND public.is_member_of_org(
                public.try_uuid((storage.foldername(name))[3])
            )
        )
    )
);

-- --------------------------------------------------------------------
-- 4. Verification queries (run manually after applying)
-- --------------------------------------------------------------------
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'storage' AND tablename = 'objects';
--
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND tablename IN ('organizations', 'organization_members');
