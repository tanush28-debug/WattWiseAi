import apiClient from './api';
import { DEMO_GOVERNMENT_OVERVIEW } from './mockData';

let localPolicies = [...DEMO_GOVERNMENT_OVERVIEW.activeTariffPolicies];

export const governmentService = {
  /**
   * Get national overview metrics
   */
  async getOverview() {
    try {
      const response = await apiClient.get('/government/overview');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: DEMO_GOVERNMENT_OVERVIEW, isDemo: true };
    }
  },

  /**
   * Get regional consumption analytics
   */
  async getRegionalAnalytics(regionFilter = 'ALL') {
    try {
      const response = await apiClient.get(`/government/regional?filter=${regionFilter}`);
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      const list = DEMO_GOVERNMENT_OVERVIEW.regionalData;
      const filtered = regionFilter === 'ALL' ? list : list.filter(r => r.region.toLowerCase().includes(regionFilter.toLowerCase()));
      return { data: filtered, isDemo: true };
    }
  },

  /**
   * Get sector analytics (Residential, Commercial, Industrial, Agricultural)
   */
  async getSectorAnalytics() {
    try {
      const response = await apiClient.get('/government/sectors');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: DEMO_GOVERNMENT_OVERVIEW.sectors, isDemo: true };
    }
  },

  /**
   * Get active government tariff policies
   */
  async getTariffPolicies() {
    try {
      const response = await apiClient.get('/government/tariffs');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: localPolicies, isDemo: true };
    }
  },

  /**
   * Update or create a tariff policy (requires authorization)
   */
  async saveTariffPolicy(policy) {
    try {
      const response = await apiClient.post('/government/tariffs', policy);
      return { success: true, data: response.data || response, isDemo: false };
    } catch (err) {
      const existingIdx = localPolicies.findIndex(p => p.id === policy.id);
      if (existingIdx >= 0) {
        localPolicies[existingIdx] = { ...localPolicies[existingIdx], ...policy };
      } else {
        localPolicies.push({
          id: 'pol-' + Date.now(),
          code: policy.code || 'T-CUSTOM-' + Math.floor(100 + Math.random() * 900),
          name: policy.name,
          tierLimitKWh: policy.tierLimitKWh,
          ratePerKWh: policy.ratePerKWh,
          status: 'Active'
        });
      }
      return { success: true, isDemo: true };
    }
  },

  /**
   * Run policy macro-simulation
   */
  async simulatePolicy({ incentiveType, percentageChange, targetSector, durationYears }) {
    try {
      const response = await apiClient.post('/government/policy-simulator', {
        incentiveType,
        percentageChange,
        targetSector,
        durationYears
      });
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      await new Promise(r => setTimeout(r, 600));

      const delta = parseFloat(percentageChange) || 10;
      const factor = delta / 100;
      const baseConsumptionTWh = 284.6;
      const estimatedTWhReduction = parseFloat((baseConsumptionTWh * factor * 0.45).toFixed(2));
      const emissionsAbatementMT = parseFloat((estimatedTWhReduction * 0.42).toFixed(2));
      const economicSavingsCrores = parseFloat((estimatedTWhReduction * 760).toFixed(1)); // ~₹760 Cr per TWh saved

      return {
        data: {
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
        },
        isDemo: true
      };
    }
  },

  /**
   * Generate policy report
   */
  async generateGovernmentReport(params) {
    try {
      const response = await apiClient.post('/government/reports', params);
      return { success: true, data: response.data || response, isDemo: false };
    } catch (err) {
      await new Promise(r => setTimeout(r, 800));
      return {
        success: true,
        reportId: 'GOV-DOC-' + Math.floor(100000 + Math.random() * 900000),
        fileName: `National_Energy_Strategy_Synthesis_${params.year || '2026'}.pdf`,
        isDemo: true
      };
    }
  }
};
