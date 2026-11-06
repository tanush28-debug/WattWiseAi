import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toCsv } from '../utils/csv.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BENCHMARK_FILE = path.resolve(__dirname, '../data/karnataka_generation.json');
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let benchmarkCache = null;

class IndustrialDataError extends Error {
  constructor(message, statusCode = 400, code = 'INDUSTRIAL_DATA_ERROR') {
    super(message);
    this.name = 'IndustrialDataError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const round = (value, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

function loadBenchmark() {
  if (!benchmarkCache) {
    benchmarkCache = JSON.parse(fs.readFileSync(BENCHMARK_FILE, 'utf8'));
  }
  return benchmarkCache;
}

function buildBenchmarkOverview() {
  const benchmark = loadBenchmark();

  const facilities = benchmark.facilities.map((facility) => ({
    id: `cea-${slugify(facility.name)}`,
    name: facility.name,
    location: `Karnataka · ${facility.fuel}`,
    consumptionMWh: Math.round(toNumber(facility.generationMWh)),
    costINR: null,
    status: facility.status || 'Operating',
    activeMachines: toNumber(facility.unitCount),
    capacityMW: toNumber(facility.capacityMW),
    fuel: facility.fuel,
    co2Tonnes: toNumber(facility.co2Tonnes),
    loadFactorPercent: facility.loadFactorPercent ?? null,
    yoyChangePercent: facility.yoyChangePercent ?? null,
    source: 'CEA_NPP_GENERATION',
    sourceFiscalYear: benchmark.latestFiscalYear,
  }));

  const totalGenerationMWh = facilities.reduce((sum, facility) => sum + facility.consumptionMWh, 0);
  const totalCapacityMW = facilities.reduce((sum, facility) => sum + facility.capacityMW, 0);
  const totalCo2Tonnes = facilities.reduce((sum, facility) => sum + facility.co2Tonnes, 0);

  const monthlyTrend = benchmark.annualTrend.map((item, index, list) => ({
    month: item.fiscalYear,
    consumptionMWh: Math.round(toNumber(item.generationMWh)),
    baseline: index > 0 ? Math.round(toNumber(list[index - 1].generationMWh)) : null,
  }));

  return {
    facilityCount: facilities.length,
    totalConsumptionMWh: Math.round(totalGenerationMWh),
    totalOperationalCostINR: null,
    carbonEmissionsTonnes: round(totalCo2Tonnes, 1),
    overallEfficiencyScore: totalCapacityMW
      ? round((totalGenerationMWh / (totalCapacityMW * 8760)) * 100, 1)
      : null,
    costVariancePercent: null,
    facilities,
    monthlyTrend,
    recentAnomalies: benchmark.recentAnomalies || [],
    isBenchmark: true,
    isDemo: false,
    hasConsumptionData: facilities.length > 0,
    dataSource: {
      label: benchmark.source,
      state: benchmark.state,
      fiscalYear: benchmark.latestFiscalYear,
      metric: 'Net generation (MWh)',
      license: benchmark.license,
      sourceUrl: benchmark.sourceUrl,
    },
    dataNotice:
      'Facility-level generation benchmark for Karnataka. These are power plants, not your own facilities. Import your facility meter or bill data to replace this view.',
  };
}

async function buildDatabaseOverview(user, scopedClient) {
  if (!user || user.isDemo || !scopedClient || !user.organizationId) return null;

  try {
    const [facilitiesRes, consumptionRes, machinesRes, anomaliesRes] = await Promise.all([
      scopedClient
        .from('facilities')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('created_at', { ascending: false }),
      scopedClient
        .from('energy_consumption')
        .select('*')
        .eq('organization_id', user.organizationId)
        .order('period_start', { ascending: false })
        .limit(5000),
      scopedClient.from('machines').select('facility_id'),
      scopedClient
        .from('anomaly_alerts')
        .select('*, facilities(name)')
        .eq('resolution_status', 'OPEN')
        .order('detected_at', { ascending: false })
        .limit(5),
    ]);

    if (facilitiesRes.error) throw facilitiesRes.error;
    if (consumptionRes.error) throw consumptionRes.error;

    const facilities = facilitiesRes.data || [];
    const consumption = consumptionRes.data || [];
    if (facilities.length === 0 && consumption.length === 0) return null;

    const startTimes = consumption
      .map((row) => new Date(row.period_start).getTime())
      .filter(Number.isFinite);
    const endTimes = consumption
      .map((row) => new Date(row.period_end).getTime())
      .filter(Number.isFinite);

    const latestStart = startTimes.length ? Math.max(...startTimes) : null;
    const windowStart = latestStart ? new Date(latestStart) : null;
    if (windowStart) windowStart.setFullYear(windowStart.getFullYear() - 1);

    const recent = windowStart
      ? consumption.filter((row) => {
          const start = new Date(row.period_start).getTime();
          return Number.isFinite(start) && start >= windowStart.getTime() && start <= latestStart;
        })
      : [];

    const buckets = new Map(
      facilities.map((facility) => [facility.id, { kwh: 0, cost: 0, carbonKg: 0, rows: 0 }])
    );
    const unassigned = { kwh: 0, cost: 0, carbonKg: 0, rows: 0 };

    for (const row of recent) {
      const bucket = row.facility_id ? buckets.get(row.facility_id) : unassigned;
      if (!bucket) continue;
      bucket.kwh += toNumber(row.consumption_kwh);
      bucket.cost += toNumber(row.cost_inr);
      bucket.carbonKg += toNumber(row.carbon_kg_co2);
      bucket.rows += 1;
    }

    const machineCounts = new Map();
    for (const machine of machinesRes.data || []) {
      machineCounts.set(machine.facility_id, (machineCounts.get(machine.facility_id) || 0) + 1);
    }

    const facilityList = facilities.map((facility) => {
      const bucket = buckets.get(facility.id) || { kwh: 0, cost: 0, carbonKg: 0, rows: 0 };
      return {
        id: facility.id,
        name: facility.name,
        location: facility.location,
        consumptionMWh: round(bucket.kwh / 1000, 1),
        costINR: bucket.cost > 0 ? round(bucket.cost, 0) : null,
        status: facility.operational_status || 'Optimal',
        activeMachines: machineCounts.get(facility.id) || 0,
        capacityMW: round(toNumber(facility.sanctioned_load_kw) / 1000, 2),
        source: 'FACILITY_DATA',
        intervalCount: bucket.rows,
      };
    });

    if (unassigned.rows > 0) {
      facilityList.push({
        id: 'unassigned',
        name: 'Unassigned consumption',
        location: 'Bills or meter rows without a facility link',
        consumptionMWh: round(unassigned.kwh / 1000, 1),
        costINR: unassigned.cost > 0 ? round(unassigned.cost, 0) : null,
        status: 'Attention',
        activeMachines: 0,
        capacityMW: null,
        source: 'UNASSIGNED',
        intervalCount: unassigned.rows,
      });
    }

    const byMonth = new Map();
    for (const row of recent) {
      const date = new Date(row.period_start);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!byMonth.has(key)) {
        byMonth.set(key, {
          time: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
          month: `${MONTH_NAMES[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}`,
          consumptionMWh: 0,
          costINR: 0,
        });
      }
      const month = byMonth.get(key);
      month.consumptionMWh += toNumber(row.consumption_kwh) / 1000;
      month.costINR += toNumber(row.cost_inr);
    }

    const monthlyTrend = [...byMonth.values()]
      .sort((a, b) => a.time - b.time)
      .slice(-6)
      .map((month) => ({
        month: month.month,
        consumptionMWh: round(month.consumptionMWh, 1),
        costINR: round(month.costINR, 0),
        baseline: null,
      }));

    const totalKwh = recent.reduce((sum, row) => sum + toNumber(row.consumption_kwh), 0);
    const totalCost = recent.reduce((sum, row) => sum + toNumber(row.cost_inr), 0);
    const totalCarbonKg = recent.reduce((sum, row) => sum + toNumber(row.carbon_kg_co2), 0);

    const sanctionedKw = facilities.reduce(
      (sum, facility) => sum + toNumber(facility.sanctioned_load_kw),
      0
    );
    const earliestStart = startTimes.length ? Math.min(...startTimes) : null;
    const latestEnd = endTimes.length ? Math.max(...endTimes) : null;
    const spanHours =
      earliestStart !== null && latestEnd !== null
        ? Math.max((latestEnd - earliestStart) / 3600000, 24)
        : 8760;
    const utilization =
      sanctionedKw > 0 && totalKwh > 0
        ? round((totalKwh / (sanctionedKw * spanHours)) * 100, 1)
        : null;

    const costMonths = [...byMonth.values()].filter((month) => month.costINR > 0);
    let costVariancePercent = null;
    if (costMonths.length >= 2) {
      const last = costMonths[costMonths.length - 1].costINR;
      const previous = costMonths[costMonths.length - 2].costINR;
      if (previous > 0) costVariancePercent = round(((last - previous) / previous) * 100, 1);
    }

    const recentAnomalies = (anomaliesRes.data || []).map((alert) => ({
      id: alert.id,
      facilityName: alert.facilities?.name || 'Facility',
      equipment: alert.equipment_name,
      detectedAt: new Date(alert.detected_at).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      severity: alert.severity,
      deviation: `${toNumber(alert.deviation_percentage) > 0 ? '+' : ''}${toNumber(
        alert.deviation_percentage
      )}%`,
      explanation: alert.explanation,
      recommendedAction: alert.recommended_action,
    }));

    return {
      facilityCount: facilityList.length,
      totalConsumptionMWh: round(totalKwh / 1000, 1),
      totalOperationalCostINR: totalCost > 0 ? round(totalCost, 0) : null,
      carbonEmissionsTonnes: round(totalCarbonKg / 1000, 1),
      overallEfficiencyScore: utilization,
      costVariancePercent,
      facilities: facilityList,
      monthlyTrend,
      recentAnomalies,
      isBenchmark: false,
      isDemo: false,
      hasConsumptionData: recent.length > 0,
      dataSource: {
        label: 'Your verified facility bills and meter data',
        metric: 'Consumption (MWh)',
      },
      dataNotice:
        recent.length > 0
          ? null
          : 'No consumption rows are linked to this organization yet. Upload bills with a facility selected or import meter data to populate this view.',
    };
  } catch (error) {
    console.warn('Industrial overview database read failed:', error.message);
    return null;
  }
}

function requireIndustrialOrganization(user, scopedClient) {
  if (!user || user.isDemo || !scopedClient) {
    throw new IndustrialDataError(
      'Sign in with a verified industrial account to modify facilities or equipment.',
      403,
      'AUTH_REQUIRED'
    );
  }

  if (!user.organizationId) {
    throw new IndustrialDataError(
      'Your account is not linked to an industrial organization. Complete organization onboarding before adding facilities or equipment.',
      409,
      'ORGANIZATION_REQUIRED'
    );
  }
}

export const industrialService = {
  async getOverview(user, scopedClient) {
    const databaseOverview = await buildDatabaseOverview(user, scopedClient);
    return databaseOverview || buildBenchmarkOverview();
  },

  async getFacilities(user, scopedClient) {
    const overview = await this.getOverview(user, scopedClient);
    return overview.facilities;
  },

  async addFacility(facilityData, user, scopedClient) {
    requireIndustrialOrganization(user, scopedClient);

    const mwh = parseFloat(facilityData.estimatedMonthlyMWh ?? 120);
    const sanctionedLoadKw = Math.round((mwh * 1000) / 730);

    const { data, error } = await scopedClient
      .from('facilities')
      .insert({
        organization_id: user.organizationId,
        name: facilityData.name,
        location: facilityData.location,
        sanctioned_load_kw: sanctionedLoadKw,
        operational_status: 'Optimal',
      })
      .select('*')
      .single();

    if (error) {
      throw new IndustrialDataError(
        `Could not save facility: ${error.message}`,
        500,
        'FACILITY_SAVE_FAILED'
      );
    }

    return {
      id: data.id,
      name: data.name,
      location: data.location,
      consumptionMWh: 0,
      costINR: null,
      status: data.operational_status || 'Optimal',
      activeMachines: 0,
      capacityMW: round(sanctionedLoadKw / 1000, 2),
      source: 'FACILITY_DATA',
    };
  },

  async getMachines(user, scopedClient) {
    if (!user || user.isDemo || !scopedClient) return [];

    const { data, error } = await scopedClient
      .from('machines')
      .select('*, facilities(name)')
      .order('created_at', { ascending: false });

    if (error) {
      throw new IndustrialDataError(
        `Could not load machines: ${error.message}`,
        500,
        'MACHINE_LIST_FAILED'
      );
    }

    return (data || []).map((machine) => ({
      id: machine.id,
      name: machine.name,
      category: machine.category,
      facility: machine.facilities?.name || 'Facility',
      facilityId: machine.facility_id,
      powerRatingKW: Number(machine.power_rating_kw),
      operatingHoursPerDay: Number(machine.operating_hours_per_day),
      reportingPeriod: machine.reporting_period,
      estimatedKWh: Number(machine.estimated_kwh_per_period),
      status: machine.operational_status || 'Active',
      isUserEstimate: machine.is_user_estimate,
    }));
  },

  async addMachineEntry(entry, user, scopedClient) {
    requireIndustrialOrganization(user, scopedClient);

    const powerKW = parseFloat(entry.powerRatingKW);
    const hoursPerDay = parseFloat(entry.operatingHoursPerDay);
    const days =
      entry.reportingPeriod === 'Monthly' ? 30 : entry.reportingPeriod === 'Weekly' ? 7 : 1;
    const estimatedKWh = Math.round(powerKW * hoursPerDay * days);

    const { data, error } = await scopedClient
      .from('machines')
      .insert({
        facility_id: entry.facilityId,
        name: entry.name,
        category: entry.category,
        power_rating_kw: powerKW,
        operating_hours_per_day: hoursPerDay,
        reporting_period: entry.reportingPeriod,
        estimated_kwh_per_period: estimatedKWh,
        operational_status: 'Active',
        is_user_estimate: true,
      })
      .select('*, facilities(name)')
      .single();

    if (error) {
      throw new IndustrialDataError(
        `Could not save machine: ${error.message}`,
        500,
        'MACHINE_SAVE_FAILED'
      );
    }

    return {
      id: data.id,
      name: data.name,
      category: data.category,
      facility: data.facilities?.name || 'Facility',
      facilityId: data.facility_id,
      powerRatingKW: Number(data.power_rating_kw),
      operatingHoursPerDay: Number(data.operating_hours_per_day),
      reportingPeriod: data.reporting_period,
      estimatedKWh: Number(data.estimated_kwh_per_period),
      isUserEstimate: data.is_user_estimate,
      status: data.operational_status || 'Active',
    };
  },

  async getAnomalies(user, scopedClient) {
    const overview = await this.getOverview(user, scopedClient);
    return overview.recentAnomalies;
  },

  async getOptimizationScenarios() {
    return [
      {
        id: 'opt-1',
        area: 'Furnace Load Shifting',
        description:
          'Reschedule induction furnace batch smelting cycle to off-peak tariff window (10:00 PM – 6:00 AM).',
        potentialMonthlySavingsINR: 1140000,
        implementationCostINR: 120000,
        paybackPeriod: '0.1 Months',
        status: 'Recommended',
      },
      {
        id: 'opt-2',
        area: 'Variable Speed Drive Retrofit on Chiller Pumps',
        description:
          'Install VFD controllers on 400TR cooling loop to match dynamic partial thermal loads.',
        potentialMonthlySavingsINR: 385000,
        implementationCostINR: 1450000,
        paybackPeriod: '3.7 Months',
        status: 'In Evaluation',
      },
      {
        id: 'opt-3',
        area: 'Compressed Air Leak Remediation',
        description: 'Repair 12 detected manifold leaks in Distribution Line Delta.',
        potentialMonthlySavingsINR: 245000,
        implementationCostINR: 65000,
        paybackPeriod: '0.3 Months',
        status: 'Action Scheduled',
      },
    ];
  },

  async generateReport(options = {}, user = null, scopedClient = null) {
    const overview = await this.getOverview(user, scopedClient);
    const generatedAt = new Date().toISOString();
    const reportType = options.reportType || 'Facility Energy Summary';
    const period = options.period || generatedAt.slice(0, 10);

    const rows = [
      ['WattWise Industrial Energy Report'],
      ['Report Type', reportType],
      ['Reporting Period', period],
      ['Generated At', generatedAt],
      ['Data Source', overview.dataSource?.label || 'Facility data'],
      ['Fiscal Year', overview.dataSource?.fiscalYear || ''],
      ['Dataset Mode', overview.isBenchmark ? 'KARNATAKA GENERATION BENCHMARK' : 'VERIFIED FACILITY DATA'],
      [],
      [
        'Facility',
        'Location',
        'Consumption (MWh)',
        'Cost (INR)',
        'Carbon (tCO2e)',
        'Capacity (MW)',
        'Status',
        'Source',
      ],
      ...overview.facilities.map((facility) => [
        facility.name,
        facility.location,
        facility.consumptionMWh,
        facility.costINR,
        facility.co2Tonnes ?? null,
        facility.capacityMW ?? null,
        facility.status,
        facility.source || '',
      ]),
      [],
      ['Total Consumption (MWh)', overview.totalConsumptionMWh],
      ['Total Operational Cost (INR)', overview.totalOperationalCostINR],
      ['Total Carbon Emissions (tCO2e)', overview.carbonEmissionsTonnes],
      ['Facility Count', overview.facilityCount],
      [],
      ['Notice', overview.dataNotice || ''],
    ];

    return {
      reportId: `REP-IND-${Date.now()}`,
      fileName: `WattWise_Industrial_${slugify(reportType)}_${slugify(period)}.csv`,
      mimeType: 'text/csv',
      rowCount: overview.facilities.length,
      generatedAt,
      isBenchmark: overview.isBenchmark === true,
      dataSource: overview.dataSource || null,
      csvContent: toCsv(rows),
    };
  },
};
