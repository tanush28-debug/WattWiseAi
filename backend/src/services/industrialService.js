// Local in-memory store for industrial entities during session
let localFacilities = [
  { id: 'fac-1', name: 'Apex Manufacturing Hub — Plant A', location: 'Bengaluru / Hosur', consumptionMWh: 680.2, costINR: 5440000, status: 'Optimal', activeMachines: 28, alertCount: 0 },
  { id: 'fac-2', name: 'Foundry & Metallurgy Facility — Plant B', location: 'Pune / Chakan', consumptionMWh: 512.6, costINR: 4090000, status: 'Attention', activeMachines: 19, alertCount: 2 },
  { id: 'fac-3', name: 'Assembly & Packaging Hub — Plant C', location: 'Sri City / Chennai', consumptionMWh: 182.4, costINR: 1460000, status: 'Optimal', activeMachines: 14, alertCount: 0 },
  { id: 'fac-4', name: 'Central Cold Storage & Logistics', location: 'Gurugram / NCR', consumptionMWh: 110.2, costINR: 860000, status: 'Optimal', activeMachines: 9, alertCount: 0 }
];

let localMachines = [
  { id: 'm-1', name: 'CNC 5-Axis Milling Center #1', category: 'Machining', facility: 'Plant A', powerRatingKW: 45, operatingHoursPerDay: 16, reportingPeriod: 'Monthly', estimatedKWh: 21600, status: 'Active' },
  { id: 'm-2', name: 'Industrial Induction Furnace B-2', category: 'Thermal', facility: 'Plant B', powerRatingKW: 350, operatingHoursPerDay: 20, reportingPeriod: 'Monthly', estimatedKWh: 210000, status: 'Warning' },
  { id: 'm-3', name: 'Centrifugal Chiller 400TR', category: 'HVAC & Cooling', facility: 'Plant A', powerRatingKW: 180, operatingHoursPerDay: 24, reportingPeriod: 'Monthly', estimatedKWh: 129600, status: 'Active' },
  { id: 'm-4', name: 'Rotary Screw Air Compressor 150HP', category: 'Pneumatics', facility: 'Plant C', powerRatingKW: 110, operatingHoursPerDay: 18, reportingPeriod: 'Monthly', estimatedKWh: 59400, status: 'Active' },
  { id: 'm-5', name: 'Automated Conveyor & Sortation Loop', category: 'Material Handling', facility: 'Plant C', powerRatingKW: 30, operatingHoursPerDay: 14, reportingPeriod: 'Monthly', estimatedKWh: 12600, status: 'Active' },
];

export const industrialService = {
  async getOverview(user, scopedClient) {
    return {
      facilityCount: localFacilities.length,
      totalConsumptionMWh: 1485.4,
      totalOperationalCostINR: 11850000.00, // ₹1.185 Crore
      carbonEmissionsTonnes: 653.5,
      overallEfficiencyScore: 91.2,
      costVariancePercent: -4.8,
      facilities: localFacilities,
      monthlyTrend: [
        { month: 'May', consumptionMWh: 1540, costINR: 12300000, baseline: 1580 },
        { month: 'Jun', consumptionMWh: 1620, costINR: 12900000, baseline: 1600 },
        { month: 'Jul', consumptionMWh: 1680, costINR: 13400000, baseline: 1620 },
        { month: 'Aug', consumptionMWh: 1590, costINR: 12700000, baseline: 1610 },
        { month: 'Sep', consumptionMWh: 1510, costINR: 12050000, baseline: 1590 },
        { month: 'Oct', consumptionMWh: 1485, costINR: 11850000, baseline: 1580 },
      ],
      recentAnomalies: [
        {
          id: 'anom-1',
          facilityName: 'Foundry & Metallurgy Facility — Plant B',
          equipment: 'Induction Arc Furnace #3',
          detectedAt: '2026-11-04 18:24',
          severity: 'HIGH',
          deviation: '+38% above load curve',
          explanation: 'Continuous active power draw during planned cool-down cycle; potential valve leak or thermocouple miscalibration.',
          recommendedAction: 'Dispatch maintenance to inspect refractory lining and heat exchanger valve.'
        },
        {
          id: 'anom-2',
          facilityName: 'Apex Manufacturing Hub — Plant A',
          equipment: 'Compressed Air Line Delta',
          detectedAt: '2026-11-03 04:12',
          severity: 'MEDIUM',
          deviation: '+14% baseline leakage',
          explanation: 'Unscheduled off-shift pressure drop causing auxiliary compressor cycling.',
          recommendedAction: 'Perform ultrasonic leak audit on section 4-D distribution manifold.'
        }
      ]
    };
  },

  async getFacilities(user, scopedClient) {
    if (user && !user.isDemo && scopedClient) {
      try {
        const { data, error } = await scopedClient
          .from('facilities')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(f => ({
            id: f.id,
            name: f.name,
            location: f.location,
            consumptionMWh: parseFloat((Number(f.sanctioned_load_kw) * 0.4).toFixed(1)),
            costINR: Math.round(Number(f.sanctioned_load_kw) * 0.4 * 8000),
            status: f.operational_status || 'Optimal',
            activeMachines: 5,
            alertCount: 0
          }));
        }
      } catch (e) {
        console.warn('Database query for facilities notice:', e.message);
      }
    }
    return localFacilities;
  },

  async addFacility(facilityData, user, scopedClient) {
    const mwh = parseFloat(facilityData.estimatedMonthlyMWh || 120);
    const newFacility = {
      id: 'fac-' + Date.now(),
      name: facilityData.name,
      location: facilityData.location,
      consumptionMWh: mwh,
      costINR: Math.round(mwh * 8000), // Industrial HT tariff ~₹8,000 / MWh
      status: 'Optimal',
      activeMachines: parseInt(facilityData.machineCount || 5, 10),
      alertCount: 0
    };

    if (user && !user.isDemo && scopedClient && user.organizationId) {
      try {
        const { data, error } = await scopedClient
          .from('facilities')
          .insert({
            organization_id: user.organizationId,
            name: facilityData.name,
            location: facilityData.location,
            sanctioned_load_kw: mwh * 2.5,
            operational_status: 'Optimal',
          })
          .select('id')
          .single();

        if (data?.id) {
          newFacility.id = data.id;
        }
      } catch (e) {
        console.warn('Failed to insert facility into database:', e.message);
      }
    }

    localFacilities = [newFacility, ...localFacilities];
    return newFacility;
  },

  async getMachines(user, scopedClient) {
    if (user && !user.isDemo && scopedClient) {
      try {
        const { data, error } = await scopedClient
          .from('machines')
          .select('*, facilities(name)')
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map(m => ({
            id: m.id,
            name: m.name,
            category: m.category,
            facility: m.facilities?.name || 'Plant Facility',
            powerRatingKW: Number(m.power_rating_kw),
            operatingHoursPerDay: Number(m.operating_hours_per_day),
            reportingPeriod: m.reporting_period,
            estimatedKWh: Number(m.estimated_kwh_per_period),
            status: m.operational_status || 'Active',
            isUserEstimate: m.is_user_estimate
          }));
        }
      } catch (e) {
        console.warn('Database query for machines notice:', e.message);
      }
    }
    return localMachines;
  },

  async addMachineEntry(entry, user, scopedClient) {
    const powerKW = parseFloat(entry.powerRatingKW);
    const hoursPerDay = parseFloat(entry.operatingHoursPerDay);
    const days = entry.reportingPeriod === 'Monthly' ? 30 : entry.reportingPeriod === 'Weekly' ? 7 : 1;
    const estimatedKWh = Math.round(powerKW * hoursPerDay * days);

    const newMachine = {
      id: 'm-' + Date.now(),
      name: entry.name,
      category: entry.category,
      facility: entry.facility || 'Plant A',
      powerRatingKW: powerKW,
      operatingHoursPerDay: hoursPerDay,
      reportingPeriod: entry.reportingPeriod,
      estimatedKWh: estimatedKWh,
      isUserEstimate: true,
      status: 'Active'
    };

    if (user && !user.isDemo && scopedClient && entry.facilityId) {
      try {
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
            is_user_estimate: true
          })
          .select('id')
          .single();

        if (data?.id) {
          newMachine.id = data.id;
        }
      } catch (e) {
        console.warn('Failed to insert machine into database:', e.message);
      }
    }

    localMachines = [newMachine, ...localMachines];
    return newMachine;
  },

  async getAnomalies(user, scopedClient) {
    const overview = await this.getOverview(user, scopedClient);
    return overview.recentAnomalies;
  },

  async getOptimizationScenarios(user, scopedClient) {
    return [
      {
        id: 'opt-1',
        area: 'Furnace Load Shifting',
        description: 'Reschedule induction furnace batch smelting cycle to off-peak tariff window (10:00 PM – 6:00 AM).',
        potentialMonthlySavingsINR: 1140000,
        implementationCostINR: 120000,
        paybackPeriod: '0.1 Months',
        status: 'Recommended'
      },
      {
        id: 'opt-2',
        area: 'Variable Speed Drive Retrofit on Chiller Pumps',
        description: 'Install VFD controllers on 400TR cooling loop to match dynamic partial thermal loads.',
        potentialMonthlySavingsINR: 385000,
        implementationCostINR: 1450000,
        paybackPeriod: '3.7 Months',
        status: 'In Evaluation'
      },
      {
        id: 'opt-3',
        area: 'Compressed Air Leak Remediation',
        description: 'Repair 12 detected manifold leaks in Distribution Line Delta.',
        potentialMonthlySavingsINR: 245000,
        implementationCostINR: 65000,
        paybackPeriod: '0.3 Months',
        status: 'Action Scheduled'
      }
    ];
  },

  async generateReport(options) {
    return {
      reportId: 'REP-IND-' + Date.now().toString().slice(-6),
      downloadUrl: '#',
      fileName: `WattWise_Industrial_Energy_Audit_${options.period || '2026'}.pdf`,
    };
  }
};

