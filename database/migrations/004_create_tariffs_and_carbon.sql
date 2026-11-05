-- ====================================================================
-- WATTWISE AI — DATABASE MIGRATION 004
-- Tariff Configurations, Tariff Slabs, and Carbon Emission Factors
-- ====================================================================

-- 1. Tariff Configurations (State DISCOM statutory frameworks)
CREATE TABLE IF NOT EXISTS public.tariff_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    discom_name TEXT NOT NULL DEFAULT 'BESCOM (Karnataka)',
    customer_category TEXT NOT NULL CHECK (customer_category IN ('DOMESTIC', 'COMMERCIAL', 'INDUSTRIAL', 'AGRICULTURAL', 'PUBLIC_LIGHTING')),
    voltage_tier TEXT NOT NULL DEFAULT 'LT' CHECK (voltage_tier IN ('LT', 'HT_11KV', 'HT_33KV', 'EHT_66KV_PLUS')),
    standing_charge_inr_per_month NUMERIC(10, 2) NOT NULL DEFAULT 120.00,
    regulatory_surcharge_percent NUMERIC(5, 2) NOT NULL DEFAULT 6.00,
    fppca_rate_per_kwh NUMERIC(6, 4) NOT NULL DEFAULT 0.4500,
    is_time_of_day BOOLEAN NOT NULL DEFAULT false,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tariffs_code ON public.tariff_configurations(code);
CREATE INDEX IF NOT EXISTS idx_tariffs_category ON public.tariff_configurations(customer_category);

-- 2. Tariff Slabs (Tiered rates per kWh)
CREATE TABLE IF NOT EXISTS public.tariff_slabs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tariff_id UUID NOT NULL REFERENCES public.tariff_configurations(id) ON DELETE CASCADE,
    slab_order INT NOT NULL DEFAULT 1,
    min_units_kwh NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    max_units_kwh NUMERIC(10, 2), -- NULL means infinity / open-ended tier
    rate_per_kwh_inr NUMERIC(10, 2) NOT NULL,
    tod_window TEXT DEFAULT 'ALL_DAY' CHECK (tod_window IN ('ALL_DAY', 'PEAK', 'OFF_PEAK', 'NORMAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(tariff_id, slab_order, tod_window)
);

CREATE INDEX IF NOT EXISTS idx_slabs_tariff ON public.tariff_slabs(tariff_id);

-- 3. Carbon Emission Factors (Regional & statutory grid emission metrics)
CREATE TABLE IF NOT EXISTS public.carbon_emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    geography_region TEXT NOT NULL DEFAULT 'India National Grid (NEWNE + SR)',
    grid_code TEXT NOT NULL DEFAULT 'IN-CEA-AVERAGE',
    emission_factor_kg_per_kwh NUMERIC(6, 4) NOT NULL DEFAULT 0.8200, -- Central Electricity Authority average ~0.82 kg CO2/kWh
    source_agency TEXT NOT NULL DEFAULT 'Central Electricity Authority (CEA) CO2 Baseline Database v19',
    applicable_year INT NOT NULL DEFAULT 2026,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_carbon_region ON public.carbon_emission_factors(geography_region);

