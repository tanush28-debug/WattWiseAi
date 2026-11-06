-- ====================================================================
-- WattWise AI — BESCOM annual consumption import (open data)
-- Source: https://data.opencity.in/dataset/bescom-consumption-data (public domain).
-- This is DISCOM-level annual metered consumption, NOT facility-level data.
-- Values are million units (MU) converted to kWh (1 MU = 1,000,000 kWh).
-- Idempotent: rows are inserted only if the same period does not exist.
-- Run in the Supabase SQL Editor or with psql.
-- ====================================================================

BEGIN;

INSERT INTO public.energy_consumption
    (interval_type, period_start, period_end, consumption_kwh, cost_inr, carbon_kg_co2,
     data_classification, source_provenance)
SELECT 'ANNUAL', v.period_start::timestamptz, v.period_end::timestamptz, v.consumption_kwh,
       0.00, 0.00, 'ACTUAL', 'BESCOM_OPEN_DATA'
FROM (VALUES
    ('2010-04-01T00:00:00+05:30', '2011-03-31T23:59:59+05:30', 14263200000.00),
    ('2011-04-01T00:00:00+05:30', '2012-03-31T23:59:59+05:30', 15675920000.00),
    ('2012-04-01T00:00:00+05:30', '2013-03-31T23:59:59+05:30', 17069130000.00),
    ('2013-04-01T00:00:00+05:30', '2014-03-31T23:59:59+05:30', 17827250000.00),
    ('2014-04-01T00:00:00+05:30', '2015-03-31T23:59:59+05:30', 18676960000.00),
    ('2015-04-01T00:00:00+05:30', '2016-03-31T23:59:59+05:30', 18348380000.00),
    ('2016-04-01T00:00:00+05:30', '2017-03-31T23:59:59+05:30', 18953780000.00),
    ('2017-04-01T00:00:00+05:30', '2018-03-31T23:59:59+05:30', 19678230000.00),
    ('2018-04-01T00:00:00+05:30', '2019-03-31T23:59:59+05:30', 20533710000.00),
    ('2019-04-01T00:00:00+05:30', '2020-03-31T23:59:59+05:30', 20884340000.00),
    ('2020-04-01T00:00:00+05:30', '2021-03-31T23:59:59+05:30', 18324010000.00),
    ('2021-04-01T00:00:00+05:30', '2022-03-31T23:59:59+05:30', 20333290000.00),
    ('2022-04-01T00:00:00+05:30', '2023-03-31T23:59:59+05:30', 23078160000.00)
) AS v(period_start, period_end, consumption_kwh)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.energy_consumption e
    WHERE e.source_provenance = 'BESCOM_OPEN_DATA'
      AND e.interval_type = 'ANNUAL'
      AND e.period_start = v.period_start::timestamptz
      AND e.profile_id IS NULL
      AND e.organization_id IS NULL
      AND e.facility_id IS NULL
);

COMMIT;
