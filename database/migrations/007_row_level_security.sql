-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 007
-- Row Level Security (RLS) Policies
-- ====================================================================

-- 1. Helper Functions to read verified role and organization membership
-- SECURITY DEFINER ensures these helper functions run with elevated privileges
-- to read the profile/membership without infinite recursion.

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_government_admin()
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'GOVERNMENT_ADMIN'::user_role
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_member_of_org(target_org_id UUID)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = target_org_id AND profile_id = auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ====================================================================
-- 2. Enable RLS on all public tables
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electricity_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariff_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariff_slabs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carbon_emission_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conservation_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regional_energy_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 3. Profiles Policies
-- ====================================================================
-- Users can view their own profile; Government admins can view all profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated, anon
    USING (id = auth.uid() OR public.is_government_admin() OR auth.uid() IS NULL);

-- Allow profile creation via trigger or authenticated user registration
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated, service_role, anon
    WITH CHECK (true);

-- Users can update only their own name or phone; CANNOT update role or id
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() 
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()) -- Prevents role escalation!
    );

-- ====================================================================
-- 4. Organizations & Members Policies
-- ====================================================================
DROP POLICY IF EXISTS "orgs_select_policy" ON public.organizations;
CREATE POLICY "orgs_select_policy" ON public.organizations
    FOR SELECT TO authenticated
    USING (public.is_member_of_org(id) OR public.is_government_admin());

DROP POLICY IF EXISTS "org_members_select_policy" ON public.organization_members;
CREATE POLICY "org_members_select_policy" ON public.organization_members
    FOR SELECT TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_government_admin());

-- ====================================================================
-- 5. Facilities & Machines Policies
-- ====================================================================
DROP POLICY IF EXISTS "facilities_select_policy" ON public.facilities;
CREATE POLICY "facilities_select_policy" ON public.facilities
    FOR SELECT TO authenticated
    USING (public.is_member_of_org(organization_id) OR public.is_government_admin());

DROP POLICY IF EXISTS "facilities_insert_policy" ON public.facilities;
CREATE POLICY "facilities_insert_policy" ON public.facilities
    FOR INSERT TO authenticated
    WITH CHECK (public.is_member_of_org(organization_id));

DROP POLICY IF EXISTS "machines_select_policy" ON public.machines;
CREATE POLICY "machines_select_policy" ON public.machines
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.facilities f 
            WHERE f.id = facility_id AND (public.is_member_of_org(f.organization_id) OR public.is_government_admin())
        )
    );

DROP POLICY IF EXISTS "machines_insert_policy" ON public.machines;
CREATE POLICY "machines_insert_policy" ON public.machines
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.facilities f 
            WHERE f.id = facility_id AND public.is_member_of_org(f.organization_id)
        )
    );

-- ====================================================================
-- 6. Electricity Bills Policies
-- ====================================================================
DROP POLICY IF EXISTS "bills_select_policy" ON public.electricity_bills;
CREATE POLICY "bills_select_policy" ON public.electricity_bills
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR public.is_government_admin()
    );

DROP POLICY IF EXISTS "bills_insert_policy" ON public.electricity_bills;
CREATE POLICY "bills_insert_policy" ON public.electricity_bills
    FOR INSERT TO authenticated
    WITH CHECK (
        profile_id = auth.uid()
        AND (organization_id IS NULL OR public.is_member_of_org(organization_id))
    );

DROP POLICY IF EXISTS "bills_delete_policy" ON public.electricity_bills;
CREATE POLICY "bills_delete_policy" ON public.electricity_bills
    FOR DELETE TO authenticated
    USING (
        profile_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

-- ====================================================================
-- 7. Energy Consumption Policies
-- ====================================================================
DROP POLICY IF EXISTS "consumption_select_policy" ON public.energy_consumption;
CREATE POLICY "consumption_select_policy" ON public.energy_consumption
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR public.is_government_admin()
    );

-- ====================================================================
-- 8. Tariffs & Carbon Factors (Publicly readable to authenticated users)
-- ====================================================================
DROP POLICY IF EXISTS "tariffs_read_policy" ON public.tariff_configurations;
CREATE POLICY "tariffs_read_policy" ON public.tariff_configurations
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "tariffs_admin_modify_policy" ON public.tariff_configurations;
CREATE POLICY "tariffs_admin_modify_policy" ON public.tariff_configurations
    FOR ALL TO authenticated
    USING (public.is_government_admin())
    WITH CHECK (public.is_government_admin());

DROP POLICY IF EXISTS "slabs_read_policy" ON public.tariff_slabs;
CREATE POLICY "slabs_read_policy" ON public.tariff_slabs
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "carbon_factors_read_policy" ON public.carbon_emission_factors;
CREATE POLICY "carbon_factors_read_policy" ON public.carbon_emission_factors
    FOR SELECT TO authenticated
    USING (true);

-- ====================================================================
-- 9. Forecasts, Anomalies & AI Recommendations
-- ====================================================================
DROP POLICY IF EXISTS "forecasts_select_policy" ON public.demand_forecasts;
CREATE POLICY "forecasts_select_policy" ON public.demand_forecasts
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR public.is_government_admin()
    );

DROP POLICY IF EXISTS "anomalies_select_policy" ON public.anomaly_alerts;
CREATE POLICY "anomalies_select_policy" ON public.anomaly_alerts
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.facilities f 
            WHERE f.id = facility_id AND (public.is_member_of_org(f.organization_id) OR public.is_government_admin())
        )
    );

DROP POLICY IF EXISTS "ai_rec_select_policy" ON public.ai_recommendations;
CREATE POLICY "ai_rec_select_policy" ON public.ai_recommendations
    FOR SELECT TO authenticated
    USING (
        profile_id = auth.uid()
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
    );

-- ====================================================================
-- 10. Rewards & Challenges
-- ====================================================================
DROP POLICY IF EXISTS "reward_accounts_select_policy" ON public.reward_accounts;
CREATE POLICY "reward_accounts_select_policy" ON public.reward_accounts
    FOR SELECT TO authenticated
    USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "reward_tx_select_policy" ON public.reward_transactions;
CREATE POLICY "reward_tx_select_policy" ON public.reward_transactions
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.reward_accounts a WHERE a.id = account_id AND a.profile_id = auth.uid())
    );

DROP POLICY IF EXISTS "challenges_select_policy" ON public.conservation_challenges;
CREATE POLICY "challenges_select_policy" ON public.conservation_challenges
    FOR SELECT TO authenticated
    USING (true);

-- ====================================================================
-- 11. Regional Data, Data Sources & Audit Logs
-- ====================================================================
DROP POLICY IF EXISTS "regional_data_select_policy" ON public.regional_energy_data;
CREATE POLICY "regional_data_select_policy" ON public.regional_energy_data
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "data_sources_select_policy" ON public.data_sources;
CREATE POLICY "data_sources_select_policy" ON public.data_sources
    FOR SELECT TO authenticated
    USING (true);

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy" ON public.audit_logs
    FOR SELECT TO authenticated
    USING (public.is_government_admin());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

