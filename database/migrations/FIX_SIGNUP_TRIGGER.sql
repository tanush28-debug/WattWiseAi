-- ====================================================================
-- WATTWISE AI — FIX SUPABASE AUTH SIGNUP TRIGGER & PROFILES RLS
-- Run this script in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/vxvgrtyvnulgnpcaadry/sql/new
-- ====================================================================

-- 1. Ensure enum type exists in public schema
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('CONSUMER', 'INDUSTRIAL', 'GOVERNMENT_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Ensure schema permissions for supabase_auth_admin and service_role
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON TABLE public.profiles TO supabase_auth_admin, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- 3. Replace handle_new_user() function with:
--    - SECURITY DEFINER
--    - Explicit SET search_path = public, auth (CRITICAL: fixes "type user_role does not exist")
--    - Fully schema-qualified public.user_role and public.profiles
--    - Exception handler block (CRITICAL: prevents "Database error saving new user" rollback)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    assigned_role public.user_role;
    user_full_name text;
BEGIN
    -- Determine role safely: only INDUSTRIAL or CONSUMER can be assigned via self-signup
    -- Government Admin accounts cannot self-register under any circumstance
    IF (new.raw_user_meta_data->>'role') = 'INDUSTRIAL' THEN
        assigned_role := 'INDUSTRIAL'::public.user_role;
    ELSE
        assigned_role := 'CONSUMER'::public.user_role;
    END IF;

    -- Extract full name safely with fallback
    user_full_name := COALESCE(
        NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
        NULLIF(trim(split_part(new.email, '@', 1)), ''),
        'WattWise User'
    );

    -- Insert or update public.profiles
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        is_active,
        created_at,
        updated_at
    )
    VALUES (
        new.id,
        COALESCE(new.email, ''),
        user_full_name,
        assigned_role,
        true,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        updated_at = now();

    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Log warning to PostgreSQL log so auth.users insertion NEVER gets blocked
        RAISE WARNING 'handle_new_user warning for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$;

-- 4. Re-attach the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Add INSERT policy for public.profiles so RLS does not block trigger or service insertions
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated, service_role, anon
    WITH CHECK (true);

-- 6. Update SELECT and UPDATE policies on public.profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated, anon
    USING (id = auth.uid() OR public.is_government_admin() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

