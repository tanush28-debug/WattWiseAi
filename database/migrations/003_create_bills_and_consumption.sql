-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 003
-- Electricity Bills and Energy Consumption
-- ====================================================================

-- 1. Electricity Bills (Uploaded by consumers and industrial facilities)
CREATE TABLE IF NOT EXISTS public.electricity_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT NOT NULL DEFAULT 'application/pdf',
    utility_provider TEXT NOT NULL DEFAULT 'BESCOM',
    account_number TEXT,
    consumer_name TEXT,
    billing_month TEXT,
    billing_period_start DATE,
    billing_period_end DATE,
    due_date DATE,
    tariff_category TEXT DEFAULT 'Domestic LT-1 Standard',
    units_consumed_kwh NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    recorded_peak_demand_kw NUMERIC(10, 2),
    energy_charges_inr NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    fixed_standing_charge_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    fuel_surcharge_fppca_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    electricity_duty_taxes_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount_inr NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status bill_status NOT NULL DEFAULT 'PENDING',
    ocr_confidence NUMERIC(5, 2),
    raw_ocr_metadata JSONB DEFAULT '{}'::jsonb,
    is_demo BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_bills_profile ON public.electricity_bills(profile_id);
CREATE INDEX IF NOT EXISTS idx_bills_org ON public.electricity_bills(organization_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.electricity_bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_billing_month ON public.electricity_bills(billing_month);

-- 2. Energy Consumption Records (Normalized actual, estimated & interval readings)
CREATE TABLE IF NOT EXISTS public.energy_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
    bill_id UUID REFERENCES public.electricity_bills(id) ON DELETE SET NULL,
    interval_type TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (interval_type IN ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL')),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    consumption_kwh NUMERIC(14, 2) NOT NULL,
    consumption_mwh NUMERIC(14, 4) GENERATED ALWAYS AS (consumption_kwh / 1000.0) STORED,
    peak_demand_kw NUMERIC(10, 2),
    cost_inr NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    carbon_kg_co2 NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    data_classification TEXT NOT NULL DEFAULT 'ACTUAL' CHECK (data_classification IN ('ACTUAL', 'ESTIMATED', 'DEMO')),
    source_provenance TEXT NOT NULL DEFAULT 'USER_BILL_OCR',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_consumption_profile ON public.energy_consumption(profile_id);
CREATE INDEX IF NOT EXISTS idx_consumption_facility ON public.energy_consumption(facility_id);
CREATE INDEX IF NOT EXISTS idx_consumption_period ON public.energy_consumption(period_start, period_end);

