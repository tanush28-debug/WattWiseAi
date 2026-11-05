-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 002
-- Organizations, Organization Members, Facilities, and Machines
-- ====================================================================

-- 1. Organizations (Companies, Plants, Industrial Groups)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT,
    industry_sector TEXT NOT NULL DEFAULT 'Manufacturing',
    state TEXT NOT NULL DEFAULT 'Karnataka',
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Organization Members (Links profiles to organizations with RBAC)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    member_role TEXT NOT NULL DEFAULT 'OPERATOR' CHECK (member_role IN ('OWNER', 'MANAGER', 'OPERATOR', 'AUDITOR')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(organization_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_profile ON public.organization_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- Update profiles table foreign key to organizations
DO $$ BEGIN
    ALTER TABLE public.profiles
        ADD CONSTRAINT fk_profiles_organization
        FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Facilities (Physical industrial plants, warehouses, factories)
CREATE TABLE IF NOT EXISTS public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    utility_account_number TEXT,
    sanctioned_load_kw NUMERIC(12, 2) NOT NULL DEFAULT 500.00,
    contract_demand_kva NUMERIC(12, 2) NOT NULL DEFAULT 625.00,
    supply_voltage_kv NUMERIC(8, 2) NOT NULL DEFAULT 11.00,
    operational_status TEXT NOT NULL DEFAULT 'Optimal' CHECK (operational_status IN ('Optimal', 'Attention', 'Warning', 'Maintenance')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_facilities_org ON public.facilities(organization_id);

-- 4. Machines (Equipment, motors, furnaces, chillers, compressors)
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Machining',
    power_rating_kw NUMERIC(10, 2) NOT NULL,
    operating_hours_per_day NUMERIC(5, 2) NOT NULL DEFAULT 16.00,
    reporting_period TEXT NOT NULL DEFAULT 'Monthly' CHECK (reporting_period IN ('Daily', 'Weekly', 'Monthly')),
    estimated_kwh_per_period NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    operational_status TEXT NOT NULL DEFAULT 'Active' CHECK (operational_status IN ('Active', 'Warning', 'Idle', 'Maintenance')),
    is_user_estimate BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_machines_facility ON public.machines(facility_id);

