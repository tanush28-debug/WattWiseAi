BEGIN;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active;
$$;

CREATE OR REPLACE FUNCTION public.is_government_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_active
          AND role = 'GOVERNMENT_ADMIN'::public.user_role
    );
$$;

CREATE OR REPLACE FUNCTION public.is_member_of_org(target_org_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members m
        JOIN public.profiles p ON p.id = m.profile_id
        WHERE m.organization_id = target_org_id
          AND m.profile_id = auth.uid() AND p.is_active
    );
$$;

CREATE OR REPLACE FUNCTION public.is_org_manager(target_org_id UUID)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members m
        JOIN public.profiles p ON p.id = m.profile_id
        WHERE m.organization_id = target_org_id
          AND m.profile_id = auth.uid() AND p.is_active
          AND m.member_role IN ('OWNER', 'MANAGER')
    );
$$;

ALTER FUNCTION public.current_user_role() OWNER TO postgres;
ALTER FUNCTION public.is_government_admin() OWNER TO postgres;
ALTER FUNCTION public.is_member_of_org(UUID) OWNER TO postgres;
ALTER FUNCTION public.is_org_manager(UUID) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.current_user_role(), public.is_government_admin(),
    public.is_member_of_org(UUID), public.is_org_manager(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role(), public.is_government_admin(),
    public.is_member_of_org(UUID), public.is_org_manager(UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.email, ''),
        COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
                 NULLIF(split_part(NEW.email, '@', 1), ''), 'WattWise User'),
        CASE WHEN NEW.raw_user_meta_data->>'role' = 'INDUSTRIAL'
             THEN 'INDUSTRIAL'::public.user_role ELSE 'CONSUMER'::public.user_role END,
        true
    );
    RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;

REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL (id, email, full_name, role, phone_number, organization_id,
            is_active, created_at, updated_at)
ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT UPDATE (full_name, phone_number, organization_id, updated_at)
ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role, supabase_auth_admin;

CREATE POLICY "profiles_select_policy"
ON public.profiles FOR SELECT TO authenticated
USING ((id = auth.uid() AND is_active) OR public.is_government_admin());

CREATE POLICY "profiles_update_policy"
ON public.profiles FOR UPDATE TO authenticated
USING (id = auth.uid() AND is_active)
WITH CHECK (
    id = auth.uid() AND is_active
    AND (organization_id IS NULL OR public.is_member_of_org(organization_id))
);

DROP POLICY IF EXISTS "storage_bills_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_bills_insert" ON storage.objects;

NOTIFY pgrst, 'reload schema';

COMMIT;
