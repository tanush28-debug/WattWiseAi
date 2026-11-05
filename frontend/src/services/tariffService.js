import apiClient from './api';
import { TARIFF_CATEGORIES } from '../config/constants';

export const tariffService = {
  /**
   * Fetch official tariff categories supported by the system
   */
  async getCategories() {
    try {
      const response = await apiClient.get('/tariffs/categories');
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      return { data: TARIFF_CATEGORIES, isDemo: true };
    }
  },

  /**
   * Run tariff simulation against backend tariff engine (India DISCOM / INR)
   */
  async simulate({ consumptionKWh, tariffId, peakUsagePercent = 25, comparisonTariffId = null }) {
    try {
      const response = await apiClient.post('/tariffs/simulate', {
        consumptionKWh,
        tariffId,
        peakUsagePercent,
        comparisonTariffId
      });
      return { data: response.data || response, isDemo: false };
    } catch (err) {
      // Isolated simulation engine (Clearly marked as demo calculation in INR)
      const selectedTariff = TARIFF_CATEGORIES.find(t => t.id === tariffId) || TARIFF_CATEGORIES[0];
      const compTariff = comparisonTariffId ? TARIFF_CATEGORIES.find(t => t.id === comparisonTariffId) : null;

      const baseKWh = consumptionKWh * (1 - peakUsagePercent / 100);
      const peakKWh = consumptionKWh * (peakUsagePercent / 100);

      const baseEnergyCharge = baseKWh * selectedTariff.baseRate;
      const peakEnergyCharge = peakKWh * selectedTariff.peakRate;
      const standing = selectedTariff.standingCharge;
      const regulatoryFee = (baseEnergyCharge + peakEnergyCharge) * 0.06; // Electricity duty / regulatory surcharge ~6%
      const estimatedTotal = baseEnergyCharge + peakEnergyCharge + standing + regulatoryFee;

      let comparisonResult = null;
      if (compTariff) {
        const compBase = baseKWh * compTariff.baseRate;
        const compPeak = peakKWh * compTariff.peakRate;
        const compStanding = compTariff.standingCharge;
        const compRegulatory = (compBase + compPeak) * 0.06;
        const compTotal = compBase + compPeak + compStanding + compRegulatory;

        comparisonResult = {
          tariffName: compTariff.name,
          totalINR: parseFloat(compTotal.toFixed(2)),
          differenceINR: parseFloat((compTotal - estimatedTotal).toFixed(2)),
          savingsPercentage: parseFloat((((estimatedTotal - compTotal) / estimatedTotal) * 100).toFixed(1))
        };
      }

      return {
        data: {
          tariffName: selectedTariff.name,
          consumptionKWh,
          breakdown: {
            baseEnergyCharge: parseFloat(baseEnergyCharge.toFixed(2)),
            peakEnergyCharge: parseFloat(peakEnergyCharge.toFixed(2)),
            standingCharge: standing,
            regulatoryFees: parseFloat(regulatoryFee.toFixed(2)),
          },
          totalEstimatedINR: parseFloat(estimatedTotal.toFixed(2)),
          effectiveRatePerKWh: parseFloat((estimatedTotal / consumptionKWh).toFixed(2)),
          comparison: comparisonResult,
          sourceEngine: 'WattWise India Tariff Simulation Engine (Demo Mock)'
        },
        isDemo: true
      };
    }
  }
};
