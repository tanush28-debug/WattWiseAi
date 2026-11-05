-- ====================================================================
-- WATTWISE AI — DATABASE SEED DATA
-- Baseline Reference Data: Indian DISCOM Tariffs, Carbon Benchmarks,
-- Regional Telemetry & Conservation Challenges
-- ====================================================================

-- 1. Insert Statutory Data Sources
INSERT INTO public.data_sources (agency_code, agency_name, official_portal_url, dataset_category)
VALUES
    ('CEA', 'Central Electricity Authority, Ministry of Power', 'https://cea.nic.in', 'Grid Telemetry & CO2 Baseline Database'),
    ('KERC', 'Karnataka Electricity Regulatory Commission', 'https://kerc.karnataka.gov.in', 'Statutory Retail Tariff Schedules'),
    ('BESCOM', 'Bangalore Electricity Supply Company Limited', 'https://bescom.karnataka.gov.in', 'DISCOM Consumer Billing & Time-of-Day Slabs'),
    ('BEE', 'Bureau of Energy Efficiency, Ministry of Power', 'https://beeindia.gov.in', 'Appliance Standards & Specific Energy Consumption (SEC)')
ON CONFLICT (agency_code) DO NOTHING;

-- 2. Insert Official Carbon Emission Factors (India CEA Baseline)
INSERT INTO public.carbon_emission_factors (geography_region, grid_code, emission_factor_kg_per_kwh, source_agency, applicable_year, is_active)
VALUES
    ('India National Grid (NEWNE + SR Composite)', 'IN-CEA-AVERAGE', 0.8200, 'CEA CO2 Baseline Database v19', 2026, true),
    ('Southern Regional Grid (SR)', 'IN-CEA-SR', 0.7400, 'CEA Renewable Integration Study', 2026, true),
    ('Western Regional Grid (WR)', 'IN-CEA-WR', 0.8600, 'CEA Grid Dispatch Report', 2026, true)
ON CONFLICT DO NOTHING;

-- 3. Insert Official Tariff Configurations (KERC / BESCOM Schedules)
INSERT INTO public.tariff_configurations (id, code, name, discom_name, customer_category, voltage_tier, standing_charge_inr_per_month, regulatory_surcharge_percent, fppca_rate_per_kwh, is_time_of_day, effective_from)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'T-RES-LT1-STD', 'Domestic LT-1 Standard (Flat Rate)', 'BESCOM', 'DOMESTIC', 'LT', 120.00, 6.00, 0.4500, false, '2026-01-01'),
    ('a0000000-0000-0000-0000-000000000002', 'T-RES-LT1-TOD', 'Domestic Time-of-Day (Peak / Off-Peak ToD)', 'BESCOM', 'DOMESTIC', 'LT', 140.00, 6.00, 0.4500, true, '2026-01-01'),
    ('a0000000-0000-0000-0000-000000000003', 'T-COM-LT2-A', 'Commercial LT-2 Tier A', 'BESCOM', 'COMMERCIAL', 'LT', 380.00, 6.00, 0.5200, false, '2026-01-01'),
    ('a0000000-0000-0000-0000-000000000004', 'T-IND-HT2-A', 'Industrial High-Tension HT-2a (>11kV / 33kV)', 'BESCOM', 'INDUSTRIAL', 'HT_11KV', 2400.00, 6.00, 0.6500, true, '2026-01-01'),
    ('a0000000-0000-0000-0000-000000000005', 'T-AGR-KUSUM', 'Agricultural Feeder Subsidized (PM-KUSUM)', 'BESCOM', 'AGRICULTURAL', 'LT', 60.00, 2.00, 0.2000, false, '2026-01-01')
ON CONFLICT (code) DO NOTHING;

-- 4. Insert Tariff Slabs
INSERT INTO public.tariff_slabs (tariff_id, slab_order, min_units_kwh, max_units_kwh, rate_per_kwh_inr, tod_window)
VALUES
    -- LT-1 Standard Domestic: Flat Base
    ('a0000000-0000-0000-0000-000000000001', 1, 0.00, 100.00, 4.75, 'ALL_DAY'),
    ('a0000000-0000-0000-0000-000000000001', 2, 100.01, NULL, 7.00, 'ALL_DAY'),

    -- LT-1 Time-of-Day: Normal, Peak (6-10 PM), Off-Peak (10 PM - 6 AM)
    ('a0000000-0000-0000-0000-000000000002', 1, 0.00, NULL, 5.40, 'OFF_PEAK'),
    ('a0000000-0000-0000-0000-000000000002', 2, 0.00, NULL, 6.85, 'NORMAL'),
    ('a0000000-0000-0000-0000-000000000002', 3, 0.00, NULL, 9.60, 'PEAK'),

    -- Commercial LT-2
    ('a0000000-0000-0000-0000-000000000003', 1, 0.00, NULL, 9.80, 'ALL_DAY'),

    -- Industrial HT-2a
    ('a0000000-0000-0000-0000-000000000004', 1, 0.00, NULL, 5.80, 'OFF_PEAK'),
    ('a0000000-0000-0000-0000-000000000004', 2, 0.00, NULL, 7.40, 'NORMAL'),
    ('a0000000-0000-0000-0000-000000000004', 3, 0.00, NULL, 11.80, 'PEAK'),

    -- Agricultural Subsidized
    ('a0000000-0000-0000-0000-000000000005', 1, 0.00, NULL, 2.10, 'ALL_DAY')
ON CONFLICT DO NOTHING;

-- 5. Insert Regional Telemetry (National Grid Zones)
INSERT INTO public.regional_energy_data (region_code, region_name, reporting_period, total_consumption_gwh, per_capita_kwh, renewable_share_percent, grid_compliance_rate, source_provenance)
VALUES
    ('NR', 'Northern Regional Grid (NR)', '2026-YTD', 88400.00, 2420.00, 46.20, 94.50, 'CEA Monthly Power Supply Position'),
    ('WR', 'Western Industrial Grid (WR)', '2026-YTD', 104200.00, 3150.00, 34.80, 91.20, 'CEA Monthly Power Supply Position'),
    ('SR', 'Southern Renewable Grid (SR)', '2026-YTD', 61800.00, 2180.00, 52.10, 98.00, 'POSOCO Grid Reliability Digest'),
    ('ER', 'Eastern Hydro Grid (ER)', '2026-YTD', 30200.00, 1640.00, 38.00, 88.60, 'CEA Monthly Power Supply Position')
ON CONFLICT (region_code, reporting_period) DO NOTHING;

-- 6. Insert Conservation Challenges
INSERT INTO public.conservation_challenges (title, description, category, target_metric_type, target_goal_value, points_reward, is_active)
VALUES
    ('Peak Shaving Pioneer', 'Limit heavy appliance use during peak 5:00 PM – 8:00 PM window for 5 consecutive days.', 'Behavioral', 'PEAK_SHAVING', 5.00, 150, true),
    ('Phantom Load Buster', 'Keep average overnight standby consumption below 0.35 kWh for 1 full week.', 'Efficiency', 'STANDBY_REDUCTION', 7.00, 200, true),
    ('Bill Optimizer', 'Upload your consecutive monthly electricity bill on or before the due date.', 'Tracking', 'TIMELY_TRACKING', 1.00, 100, true)
ON CONFLICT DO NOTHING;

