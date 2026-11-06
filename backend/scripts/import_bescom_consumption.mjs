import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../src/config/env.js';
import { supabase, supabaseAdmin } from '../src/config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const DEFAULT_CSV = path.resolve(projectRoot, 'database/seed/bescom_consumption_2010_2023.csv');
const DEFAULT_SQL = path.resolve(projectRoot, 'database/seed/import_bescom_consumption.sql');
const SOURCE = 'BESCOM_OPEN_DATA';
const INTERVAL = 'ANNUAL';

const args = process.argv.slice(2);
const getArg = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const hasFlag = (name) => args.includes(name);

const csvPath = path.resolve(getArg('--file') || DEFAULT_CSV);
const sqlPath = path.resolve(getArg('--sql-out') || DEFAULT_SQL);
const dryRun = hasFlag('--dry-run');

function fail(message) {
  console.error(`\nERROR: ${message}`);
  process.exit(1);
}

function parseCsv(filePath) {
  if (!fs.existsSync(filePath)) fail(`CSV not found: ${filePath}`);

  const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) fail('CSV has no data rows.');

  const header = lines[0].split(',').map((value) => value.trim());
  const expected = [
    'Year',
    'Demand (in Rs. Cr)',
    'Collection (in Rs. Cr)',
    'Consumers in Lakhs',
    'Consumption by Metered Category in MU',
    'Energy Input in MU',
  ];
  if (header.length !== expected.length || header.some((value, index) => value !== expected[index])) {
    fail(`Unexpected CSV header.\nExpected: ${expected.join(' | ')}\nFound:    ${header.join(' | ')}`);
  }

  const seen = new Set();
  return lines.slice(1).map((line, index) => {
    const cells = line.split(',').map((value) => value.trim());
    if (cells.length !== expected.length) {
      fail(`Row ${index + 2} has ${cells.length} columns, expected ${expected.length}.`);
    }

    const [year, demandCr, collectionCr, consumersLakhs, meteredMu, energyInputMu] = cells;
    const match = year.match(/^(\d{4})-(\d{2})$/);
    if (!match) fail(`Row ${index + 2}: invalid financial year "${year}".`);

    const startYear = Number(match[1]);
    const endYear = startYear + 1;
    if (Number(match[2]) !== endYear % 100) {
      fail(`Row ${index + 2}: financial year "${year}" does not end in ${String(endYear).slice(-2)}.`);
    }
    if (seen.has(startYear)) fail(`Duplicate financial year ${year}.`);
    seen.add(startYear);

    const numbers = { demandCr, collectionCr, consumersLakhs, meteredMu, energyInputMu };
    for (const [key, value] of Object.entries(numbers)) {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) {
        fail(`Row ${index + 2}: ${key} is not a valid non-negative number ("${value}").`);
      }
    }
    if (Number(meteredMu) <= 0) fail(`Row ${index + 2}: metered consumption must be greater than zero.`);
    if (Number(energyInputMu) < Number(meteredMu)) {
      fail(`Row ${index + 2}: energy input is lower than metered consumption.`);
    }

    return {
      year,
      startYear,
      demandCr: Number(demandCr),
      collectionCr: Number(collectionCr),
      consumersLakhs: Number(consumersLakhs),
      meteredMu: Number(meteredMu),
      energyInputMu: Number(energyInputMu),
      consumptionKwh: Math.round(Number(meteredMu) * 1_000_000),
      periodStart: `${startYear}-04-01T00:00:00+05:30`,
      periodEnd: `${endYear}-03-31T23:59:59+05:30`,
    };
  });
}

function toRow(row) {
  return {
    interval_type: INTERVAL,
    period_start: row.periodStart,
    period_end: row.periodEnd,
    consumption_kwh: row.consumptionKwh,
    cost_inr: 0,
    carbon_kg_co2: 0,
    data_classification: 'ACTUAL',
    source_provenance: SOURCE,
  };
}

function buildSql(rows) {
  const values = rows
    .map(
      (row) => `    ('${row.periodStart}', '${row.periodEnd}', ${row.consumptionKwh}.00)`
    )
    .join(',\n');

  return `-- ====================================================================
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
SELECT '${INTERVAL}', v.period_start::timestamptz, v.period_end::timestamptz, v.consumption_kwh,
       0.00, 0.00, 'ACTUAL', '${SOURCE}'
FROM (VALUES
${values}
) AS v(period_start, period_end, consumption_kwh)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.energy_consumption e
    WHERE e.source_provenance = '${SOURCE}'
      AND e.interval_type = '${INTERVAL}'
      AND e.period_start = v.period_start::timestamptz
      AND e.profile_id IS NULL
      AND e.organization_id IS NULL
      AND e.facility_id IS NULL
);

COMMIT;
`;
}

function printSummary(rows) {
  console.log(`Parsed ${rows.length} annual rows from ${path.relative(projectRoot, csvPath)}`);
  console.log('Year      Metered MU      Consumption kWh');
  for (const row of rows) {
    console.log(
      `${row.year}   ${row.meteredMu.toFixed(2).padStart(12)}   ${String(row.consumptionKwh).padStart(18)}`
    );
  }
  console.log('\nNot imported: demand/collection (₹ Cr), consumers (lakh), energy input (MU).');
  console.log('energy_consumption has no columns for those values; only metered consumption is mapped.');
}

async function importRows(rows) {
  const client = supabaseAdmin || supabase;
  const usingAdmin = Boolean(supabaseAdmin);

  console.log(
    usingAdmin
      ? '\nUsing SUPABASE_SECRET_KEY (service role) for the import.'
      : '\nSUPABASE_SECRET_KEY is not configured; trying the publishable key (RLS may reject the write).'
  );

  const { error: deleteError } = await client
    .from('energy_consumption')
    .delete()
    .eq('source_provenance', SOURCE)
    .eq('interval_type', INTERVAL)
    .is('profile_id', null)
    .is('organization_id', null)
    .is('facility_id', null);

  if (deleteError) {
    fail(
      `Could not clear previous BESCOM rows: ${deleteError.message}\n` +
        'Add SUPABASE_SECRET_KEY to backend/.env, or run the generated SQL in the Supabase SQL Editor.'
    );
  }

  const { error: insertError } = await client.from('energy_consumption').insert(rows.map(toRow));
  if (insertError) {
    fail(
      `Insert failed: ${insertError.message}\n` +
        'Add SUPABASE_SECRET_KEY to backend/.env, or run the generated SQL in the Supabase SQL Editor.'
    );
  }

  const { count, error: countError } = await client
    .from('energy_consumption')
    .select('id', { count: 'exact', head: true })
    .eq('source_provenance', SOURCE)
    .eq('interval_type', INTERVAL)
    .is('profile_id', null)
    .is('organization_id', null)
    .is('facility_id', null);

  if (countError) {
    console.log(`Inserted ${rows.length} rows, but verification query failed: ${countError.message}`);
    return;
  }
  console.log(`Inserted ${rows.length} rows. Verified BESCOM benchmark rows in table: ${count}.`);
  if (!usingAdmin && count === 0) {
    console.log('The write succeeded, but this key cannot read the rows back due to RLS.');
  }
}

const rows = parseCsv(csvPath);
printSummary(rows);

fs.writeFileSync(sqlPath, buildSql(rows), 'utf8');
console.log(`\nGenerated idempotent SQL: ${path.relative(projectRoot, sqlPath)}`);

if (dryRun) {
  console.log('\nDry run: no database changes were made.');
} else {
  await importRows(rows);
}
