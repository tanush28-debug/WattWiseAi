let localPolicies = [
  { id: 'pol-1', code: 'T-RES-LIFELINE-26', name: 'National Lifeline Domestic Tariff (<100 kWh)', tierLimitKWh: 100, ratePerKWh: 3.50, status: 'Active' },
  { id: 'pol-2', code: 'T-IND-TOD-HT', name: 'Industrial High-Tension ToD Incentive', peakSurcharge: '+20%', offPeakDiscount: '-15%', status: 'Active' },
  { id: 'pol-3', code: 'T-AGRO-KUSUM-SOLAR', name: 'PM-KUSUM Solar Ag-Feeder Scheme', flatSubsidyPercent: 30, status: 'In Review' }
];

export const governmentService = {
  async getOverview(user, scopedClient) {
    let regionalData = [
      { region: 'Northern Regional Grid (NR)', totalGWh: 88400, perCapitaKWh: 2420, renewableShare: 46.2, complianceRate: 94.5 },
      { region: 'Western Industrial Grid (WR)', totalGWh: 104200, perCapitaKWh: 3150, renewableShare: 34.8, complianceRate: 91.2 },
      { region: 'Southern Renewable Grid (SR)', totalGWh: 61800, perCapitaKWh: 2180, renewableShare: 52.1, complianceRate: 98.0 },
      { region: 'Eastern Hydro Grid (ER)', totalGWh: 30200, perCapitaKWh: 1640, renewableShare: 38.0, complianceRate: 88.6 },
    ];

    if (scopedClient) {
      try {
        const { data: dbData } = await scopedClient
          .from('regional_energy_data')
          .select('*')
          .order('total_consumption_gwh', { ascending: false });

        if (dbData && dbData.length > 0) {
          regionalData = dbData.map(r => ({
            region: `${r.region_name} (${r.region_code})`,
            totalGWh: Number(r.total_consumption_gwh),
            perCapitaKWh: Number(r.per_capita_kwh),
            renewableShare: Number(r.renewable_share_percent),
            complianceRate: Number(r.grid_compliance_rate),
          }));
        }
      } catch (e) {
        console.warn('Government regional query fallback:', e.message);
      }
    }

    return {
      reportingPeriod: 'Year-to-Date 2026',
      nationalTotalConsumptionTWh: 284.6,
      totalCarbonEmissionsMT: 119.5,
      gridReliabilityIndex: 99.82,
      cleanEnergyRatioPercent: 41.5,
      sectors: [
        { name: 'Industrial & Heavy Manufacturing', sharePercent: 38.4, twh: 109.3, emissionsMT: 48.2, growthRate: '+1.8%' },
        { name: 'Commercial & Services', sharePercent: 24.2, twh: 68.9, emissionsMT: 27.8, growthRate: '+0.9%' },
        { name: 'Residential & Households', sharePercent: 26.1, twh: 74.3, emissionsMT: 31.1, growthRate: '-1.4%' },
        { name: 'Agriculture & Irrigation (Ag-Feeder)', sharePercent: 11.3, twh: 32.1, emissionsMT: 12.4, growthRate: '+0.2%' },
      ],
      regionalData,
      activeTariffPolicies: localPolicies,
    };
  },

  async getRegionalAnalytics(regionFilter = 'ALL', scopedClient = null) {
    const overview = await this.getOverview(null, scopedClient);
    if (!regionFilter || regionFilter === 'ALL') {
      return overview.regionalData;
    }
    return overview.regionalData.filter(r => r.region.toLowerCase().includes(regionFilter.toLowerCase()));
  },

  async getSectorAnalytics() {
    const overview = await this.getOverview();
    return overview.sectors;
  },

  async getTariffPolicies() {
    return localPolicies;
  },

  async saveTariffPolicy(policy) {
    const existingIdx = localPolicies.findIndex(p => p.id === policy.id);
    if (existingIdx >= 0) {
      localPolicies[existingIdx] = { ...localPolicies[existingIdx], ...policy };
      return localPolicies[existingIdx];
    } else {
      const newPolicy = {
        id: 'pol-' + Date.now(),
        code: policy.code || 'T-CUSTOM-' + Math.floor(100 + Math.random() * 900),
        name: policy.name,
        tierLimitKWh: policy.tierLimitKWh,
        ratePerKWh: policy.ratePerKWh,
        status: 'Active'
      };
      localPolicies.push(newPolicy);
      return newPolicy;
    }
  },

  simulatePolicy({ incentiveType, percentageChange, targetSector, durationYears }) {
    const delta = parseFloat(percentageChange) || 10;
    const factor = delta / 100;
    const baseConsumptionTWh = 284.6;
    const estimatedTWhReduction = parseFloat((baseConsumptionTWh * factor * 0.45).toFixed(2));
    const emissionsAbatementMT = parseFloat((estimatedTWhReduction * 0.42).toFixed(2));
    const economicSavingsCrores = parseFloat((estimatedTWhReduction * 760).toFixed(1)); // ~₹760 Cr per TWh saved

    return {
      scenarioName: `${incentiveType} (${delta}% target in ${targetSector})`,
      projectedAnnualReductionTWh: estimatedTWhReduction,
      percentageGridRelief: parseFloat((factor * 4.5).toFixed(1)),
      emissionsAbatementMT: emissionsAbatementMT,
      netEconomicBenefitCroresINR: economicSavingsCrores,
      assumptions: [
        `Elasticity coefficient applied: -0.32 for ${targetSector}`,
        `Marginal emission factor: 0.42 MT CO₂e per TWh`,
        `Simulated horizon: ${durationYears} Year(s)`,
        `Avoided peaking power generation benchmark: ₹7.60 / kWh`
      ]
    };
  },

  async generateReport(params) {
    return {
      reportId: 'GOV-DOC-' + Math.floor(100000 + Math.random() * 900000),
      fileName: `National_Energy_Strategy_Synthesis_${params.year || '2026'}.pdf`,
    };
  }
};

