import apiClient from './api';
import { DEMO_INDUSTRIAL_OVERVIEW, DEMO_INDUSTRIAL_MACHINES } from './mockData';

let localFacilities = [...DEMO_INDUSTRIAL_OVERVIEW.facilities];
let localMachines = [...DEMO_INDUSTRIAL_MACHINES];

export const industrialService = {
  /**
   * Get overall industrial facility metrics
   */
  async getOverview() {
    try {
      const response = await apiClient.get('/industrial/overview');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return {
        data: {
          ...DEMO_INDUSTRIAL_OVERVIEW,
          facilities: localFacilities
        },
        isDemo: true
      };
    }
  },

  /**
   * Get all registered industrial facilities
   */
  async getFacilities() {
    try {
      const response = await apiClient.get('/industrial/facilities');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: localFacilities, isDemo: true };
    }
  },

  /**
   * Add a new industrial facility
   */
  async addFacility(facilityData) {
    try {
      const response = await apiClient.post('/industrial/facilities', facilityData);
      return { success: true, data: response.data || response, isDemo: false };
    } catch (err) {
      const mwh = parseFloat(facilityData.estimatedMonthlyMWh || 120);
      const newFacility = {
        id: 'fac-' + Date.now(),
        name: facilityData.name,
        location: facilityData.location,
        consumptionMWh: mwh,
        costINR: Math.round(mwh * 8000), // Industrial HT tariff ~₹8,000 / MWh
        status: 'Optimal',
        activeMachines: parseInt(facilityData.machineCount || 5),
        alertCount: 0
      };
      localFacilities = [newFacility, ...localFacilities];
      return { success: true, data: newFacility, isDemo: true };
    }
  },

  /**
   * Get machine consumption entries
   */
  async getMachines() {
    try {
      const response = await apiClient.get('/industrial/machines');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: localMachines, isDemo: true };
    }
  },

  /**
   * Add a software-based machine consumption entry
   */
  async addMachineEntry(entry) {
    try {
      const response = await apiClient.post('/industrial/machines', entry);
      return { success: true, data: response.data || response, isDemo: false };
    } catch (err) {
      const powerKW = parseFloat(entry.powerRatingKW);
      const hoursPerDay = parseFloat(entry.operatingHoursPerDay);
      const days = entry.reportingPeriod === 'Monthly' ? 30 : entry.reportingPeriod === 'Weekly' ? 7 : 1;
      const estimatedKWh = Math.round(powerKW * hoursPerDay * days);

      const newEntry = {
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

      localMachines = [newEntry, ...localMachines];
      return { success: true, data: newEntry, isDemo: true };
    }
  },

  /**
   * Get anomaly alerts
   */
  async getAnomalies() {
    try {
      const response = await apiClient.get('/industrial/anomalies');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: DEMO_INDUSTRIAL_OVERVIEW.recentAnomalies, isDemo: true };
    }
  },

  /**
   * Get cost optimization opportunities
   */
  async getOptimizationScenarios() {
    try {
      const response = await apiClient.get('/industrial/optimization');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return {
        data: [
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
        ],
        isDemo: true
      };
    }
  },

  /**
   * Request industrial audit report export
   */
  async generateReport(options) {
    try {
      const response = await apiClient.post('/industrial/reports/generate', options);
      return { success: true, data: response.data || response, isDemo: false };
    } catch (err) {
      // Mock generation delay
      await new Promise(r => setTimeout(r, 800));
      return {
        success: true,
        reportId: 'REP-IND-' + Date.now().toString().slice(-6),
        downloadUrl: '#',
        fileName: `WattWise_Industrial_Energy_Audit_${options.period || '2026'}.pdf`,
        isDemo: true
      };
    }
  }
};
