import apiClient from './api';
import { DEMO_DEMAND_FORECAST } from './mockData';

export const forecastService = {
  /**
   * Fetch demand forecast data from backend ML model
   */
  async getForecast(horizonDays = 30) {
    try {
      const response = await apiClient.get(`/forecast/demand?horizon=${horizonDays}`);
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: DEMO_DEMAND_FORECAST, isDemo: true };
    }
  }
};

