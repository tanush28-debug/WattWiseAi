-- ====================================================================
-- WATTWISE AI — FIX MISSING RLS POLICIES FOR BILL VERIFICATION & REWARDS
-- Run this script in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/vxvgrtyvnulgnpcaadry/sql/new
-- ====================================================================

-- 1. electricity_bills: Add UPDATE policy (was completely missing in 007)
DROP POLICY IF EXISTS "bills_update_policy" ON public.electricity_bills;
CREATE POLICY "bills_update_policy" ON public.electricity_bills
    FOR UPDATE TO authenticated
    USING (
        profile_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR public.is_government_admin()
    )
    WITH CHECK (
        profile_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR public.is_government_admin()
    );

-- 2. energy_consumption: Add INSERT policy (was completely missing in 007)
DROP POLICY IF EXISTS "consumption_insert_policy" ON public.energy_consumption;
CREATE POLICY "consumption_insert_policy" ON public.energy_consumption
    FOR INSERT TO authenticated
    WITH CHECK (
        profile_id = auth.uid() 
        OR (organization_id IS NOT NULL AND public.is_member_of_org(organization_id))
        OR public.is_government_admin()
    );

-- 3. reward_accounts: Add INSERT and UPDATE policies (were missing in 007)
DROP POLICY IF EXISTS "reward_accounts_insert_policy" ON public.reward_accounts;
CREATE POLICY "reward_accounts_insert_policy" ON public.reward_accounts
    FOR INSERT TO authenticated
    WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "reward_accounts_update_policy" ON public.reward_accounts;
CREATE POLICY "reward_accounts_update_policy" ON public.reward_accounts
    FOR UPDATE TO authenticated
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- 4. reward_transactions: Add INSERT policy (was missing in 007)
DROP POLICY IF EXISTS "reward_tx_insert_policy" ON public.reward_transactions;
CREATE POLICY "reward_tx_insert_policy" ON public.reward_transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.reward_accounts a WHERE a.id = account_id AND a.profile_id = auth.uid())
    );

-- 5. Storage bucket: Ensure electricity-bills bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'electricity-bills',
    'electricity-bills',
    false,
    15728640,
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 15728640,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

-- 6. Storage Policies for electricity-bills bucket
DROP POLICY IF EXISTS "storage_bills_select" ON storage.objects;
CREATE POLICY "storage_bills_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'electricity-bills');

DROP POLICY IF EXISTS "storage_bills_insert" ON storage.objects;
CREATE POLICY "storage_bills_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'electricity-bills');

-- Verification query
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename IN ('electricity_bills', 'energy_consumption', 'reward_accounts', 'reward_transactions')
ORDER BY tablename, cmd;

