import apiClient from './api';
import { DEMO_INDUSTRIAL_OVERVIEW } from './mockData';

const isAccessDenied = (err) => [401, 403].includes(err?.status);

const toApiError = (err, fallback) => new Error(err?.message || fallback);

export const industrialService = {
  /**
   * Get overall industrial facility metrics
   */
  async getOverview() {
    try {
      const response = await apiClient.get('/industrial/overview');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      if (isAccessDenied(err)) {
        return { data: DEMO_INDUSTRIAL_OVERVIEW, isDemo: true };
      }
      throw toApiError(err, 'Unable to load industrial overview.');
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
      if (isAccessDenied(err)) {
        return { data: DEMO_INDUSTRIAL_OVERVIEW.facilities, isDemo: true };
      }
      throw toApiError(err, 'Unable to load facilities.');
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
      throw toApiError(err, 'Failed to register facility.');
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
      if (isAccessDenied(err)) {
        return { data: [], isDemo: true };
      }
      throw toApiError(err, 'Unable to load machine records.');
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
      throw toApiError(err, 'Failed to save machine record.');
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
      throw toApiError(err, 'Failed to compile report.');
    }
  }
};
