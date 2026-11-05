-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 005
-- Demand Forecasts, Anomaly Alerts, and AI Recommendations
-- ====================================================================

-- 1. Demand Forecasts (Machine Learning load curve estimates)
CREATE TABLE IF NOT EXISTS public.demand_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    forecast_horizon_days INT NOT NULL DEFAULT 30,
    forecast_start_date DATE NOT NULL,
    forecast_end_date DATE NOT NULL,
    projected_total_kwh NUMERIC(14, 2) NOT NULL,
    projected_total_inr NUMERIC(14, 2) NOT NULL,
    confidence_score NUMERIC(5, 4) NOT NULL DEFAULT 0.9400,
    lower_bound_kwh NUMERIC(14, 2),
    upper_bound_kwh NUMERIC(14, 2),
    algorithm_name TEXT NOT NULL DEFAULT 'WattWise Temporal Transformer v2.4',
    series_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    influencing_factors JSONB DEFAULT '[]'::jsonb,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_forecasts_profile ON public.demand_forecasts(profile_id);
CREATE INDEX IF NOT EXISTS idx_forecasts_facility ON public.demand_forecasts(facility_id);

-- 2. Anomaly Alerts (Industrial equipment and facility deviation events)
CREATE TABLE IF NOT EXISTS public.anomaly_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES public.machines(id) ON DELETE SET NULL,
    equipment_name TEXT NOT NULL,
    severity anomaly_severity NOT NULL DEFAULT 'MEDIUM',
    deviation_percentage NUMERIC(6, 2) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    explanation TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    resolution_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (resolution_status IN ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED')),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_anomalies_facility ON public.anomaly_alerts(facility_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON public.anomaly_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON public.anomaly_alerts(resolution_status);

-- 3. AI Recommendations (Context-aware conservation insights)
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'HVAC',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    potential_savings_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    impact_level TEXT NOT NULL DEFAULT 'Medium' CHECK (impact_level IN ('Low', 'Medium', 'High')),
    payback_period TEXT,
    implementation_status TEXT NOT NULL DEFAULT 'RECOMMENDED' CHECK (implementation_status IN ('RECOMMENDED', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED')),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_ai_rec_profile ON public.ai_recommendations(profile_id);
CREATE INDEX IF NOT EXISTS idx_ai_rec_org ON public.ai_recommendations(organization_id);

