-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 006
-- Rewards, Challenges, Regional Energy Data, Data Sources & Audit Logs
-- ====================================================================

-- 1. Reward Accounts (Consumer gamification & eco-points)
CREATE TABLE IF NOT EXISTS public.reward_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_points INT NOT NULL DEFAULT 100,
    current_tier TEXT NOT NULL DEFAULT 'Eco-Explorer Tier I',
    lifetime_points_earned INT NOT NULL DEFAULT 100,
    co2_saved_total_kg NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rewards_profile ON public.reward_accounts(profile_id);

-- 2. Reward Transactions
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES public.reward_accounts(id) ON DELETE CASCADE,
    points_delta INT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('EARNED_CHALLENGE', 'EARNED_CONSERVATION', 'EARNED_BILL_UPLOAD', 'REDEEMED_DISCOUNT')),
    reference_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_reward_tx_account ON public.reward_transactions(account_id);

-- 3. Conservation Challenges
CREATE TABLE IF NOT EXISTS public.conservation_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Behavioral',
    target_metric_type TEXT NOT NULL DEFAULT 'PEAK_SHAVING',
    target_goal_value NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    points_reward INT NOT NULL DEFAULT 150,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Regional Energy Data (Macro grid telemetry for Government portal)
CREATE TABLE IF NOT EXISTS public.regional_energy_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_code TEXT NOT NULL, -- 'NR', 'WR', 'SR', 'ER', 'NER'
    region_name TEXT NOT NULL,
    reporting_period TEXT NOT NULL, -- e.g. '2026-Q3' or '2026-YTD'
    total_consumption_gwh NUMERIC(12, 2) NOT NULL,
    total_consumption_twh NUMERIC(10, 4) GENERATED ALWAYS AS (total_consumption_gwh / 1000.0) STORED,
    per_capita_kwh NUMERIC(10, 2) NOT NULL,
    renewable_share_percent NUMERIC(5, 2) NOT NULL,
    grid_compliance_rate NUMERIC(5, 2) NOT NULL DEFAULT 95.00,
    source_provenance TEXT NOT NULL DEFAULT 'CEA National Grid Telemetry',
    is_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(region_code, reporting_period)
);

CREATE INDEX IF NOT EXISTS idx_regional_code ON public.regional_energy_data(region_code);

-- 5. Data Sources (Transparency & provenance tracking)
CREATE TABLE IF NOT EXISTS public.data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_code TEXT NOT NULL UNIQUE,
    agency_name TEXT NOT NULL,
    official_portal_url TEXT,
    dataset_category TEXT NOT NULL,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reliability_rating TEXT NOT NULL DEFAULT 'STATUTORY_BENCHMARK'
);

-- 6. Audit Logs (Statutory & administrative traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL, -- e.g., 'POLICY_SIMULATION', 'TARIFF_UPDATE', 'FACILITY_REGISTRATION'
    target_table TEXT,
    record_id UUID,
    payload_snapshot JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at);

