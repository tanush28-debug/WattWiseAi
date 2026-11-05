-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 001
-- Enums, Custom Types, and Profiles Table
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create User Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CONSUMER', 'INDUSTRIAL', 'GOVERNMENT_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Create Bill Status Enum
DO $$ BEGIN
    CREATE TYPE bill_status AS ENUM ('PENDING', 'PROCESSING', 'EXTRACTED', 'VERIFIED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Create Anomaly Severity Enum
DO $$ BEGIN
    CREATE TYPE anomaly_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 5. Create Profiles Table (Linked to Supabase auth.users)
-- This table is the TRUSTED source of truth for user roles.
-- Users CANNOT modify their own role.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'CONSUMER',
    phone_number TEXT,
    organization_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 6. Function and Trigger to automatically create profile on auth.users signup
-- Notice: Government Admin role CANNOT be created via signup trigger.
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
    -- Read role from raw_user_meta_data if passed, but strictly disallow GOVERNMENT_ADMIN
    IF (new.raw_user_meta_data->>'role') = 'INDUSTRIAL' THEN
        assigned_role := 'INDUSTRIAL'::public.user_role;
    ELSE
        -- Default to CONSUMER (even if someone tries to supply GOVERNMENT_ADMIN via metadata)
        assigned_role := 'CONSUMER'::public.user_role;
    END IF;

    -- Extract full name safely with fallback
    user_full_name := COALESCE(
        NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
        NULLIF(trim(split_part(new.email, '@', 1)), ''),
        'WattWise User'
    );

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
        RAISE WARNING 'handle_new_user warning for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$;

-- Trigger attached to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

