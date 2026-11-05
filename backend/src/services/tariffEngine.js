import { calculateElectricityBill } from '../utils/calculations.js';

// Pre-configured official DISCOM tariffs (India / Karnataka BESCOM benchmark)
export const TARIFF_CATALOG = [
  {
    id: 'residential-standard',
    code: 'T-RES-LT1-STD',
    name: 'Domestic LT-1 Standard (Flat Rate)',
    category: 'DOMESTIC',
    baseRate: 6.85,
    peakRate: 7.20,
    standingCharge: 120.00,
    fppcaRate: 0.45,
    regulatoryDutyPercent: 6.00,
    slabs: [
      { minUnits: 0, maxUnits: 100, ratePerKWh: 4.75 },
      { minUnits: 100, maxUnits: null, ratePerKWh: 7.00 }
    ]
  },
  {
    id: 'residential-tou',
    code: 'T-RES-LT1-TOD',
    name: 'Domestic Time-of-Day (Peak / Off-Peak ToD)',
    category: 'DOMESTIC',
    baseRate: 5.40,
    peakRate: 9.60,
    standingCharge: 140.00,
    fppcaRate: 0.45,
    regulatoryDutyPercent: 6.00,
    isTimeOfDay: true,
    offPeakRate: 5.40,
    peakRateVal: 9.60
  },
  {
    id: 'commercial-standard',
    code: 'T-COM-LT2-A',
    name: 'Commercial LT-2 Tier A',
    category: 'COMMERCIAL',
    baseRate: 9.80,
    peakRate: 13.50,
    standingCharge: 380.00,
    fppcaRate: 0.52,
    regulatoryDutyPercent: 6.00,
    slabs: [
      { minUnits: 0, maxUnits: null, ratePerKWh: 9.80 }
    ]
  },
  {
    id: 'industrial-high-voltage',
    code: 'T-IND-HT2-A',
    name: 'Industrial HT-2a (>11kV / 33kV)',
    category: 'INDUSTRIAL',
    baseRate: 7.40,
    peakRate: 11.80,
    standingCharge: 2400.00,
    fppcaRate: 0.65,
    regulatoryDutyPercent: 6.00,
    isTimeOfDay: true,
    offPeakRate: 5.80,
    peakRateVal: 11.80
  },
  {
    id: 'agricultural-subsidized',
    code: 'T-AGR-KUSUM',
    name: 'Agricultural Feeder Subsidized (KUSUM)',
    category: 'AGRICULTURAL',
    baseRate: 2.10,
    peakRate: 3.40,
    standingCharge: 60.00,
    fppcaRate: 0.20,
    regulatoryDutyPercent: 2.00,
    slabs: [
      { minUnits: 0, maxUnits: null, ratePerKWh: 2.10 }
    ]
  }
];

export const tariffEngine = {
  /**
   * Get all official tariff categories
   */
  async getCategories(scopedClient = null) {
    if (scopedClient) {
      try {
        const { data, error } = await scopedClient
          .from('tariff_configurations')
          .select('*, tariff_slabs(*)');
        if (!error && data && data.length > 0) {
          return data.map(t => ({
            id: t.code.toLowerCase().replace(/_/g, '-'),
            name: t.name,
            code: t.code,
            baseRate: t.tariff_slabs?.[0]?.rate_per_kwh_inr || 6.85,
            peakRate: t.tariff_slabs?.find(s => s.tod_window === 'PEAK')?.rate_per_kwh_inr || 9.60,
            standingCharge: t.standing_charge_inr_per_month,
          }));
        }
      } catch (err) {
        // Fallback to static catalog if DB query fails
      }
    }
    return TARIFF_CATALOG;
  },

  /**
   * Run deterministic tariff simulation and optional comparison
   */
  simulate({ consumptionKWh, tariffId, peakUsagePercent = 25, comparisonTariffId = null }) {
    const units = Math.max(0, parseFloat(consumptionKWh) || 0);
    const selectedTariff = TARIFF_CATALOG.find(t => t.id === tariffId || t.code === tariffId) || TARIFF_CATALOG[0];

    const calculation = calculateElectricityBill({
      consumptionKWh: units,
      standingChargeINR: selectedTariff.standingCharge,
      fppcaRatePerKWh: selectedTariff.fppcaRate,
      regulatoryPercent: selectedTariff.regulatoryDutyPercent,
      slabs: selectedTariff.slabs || [],
      peakUsagePercent,
      peakRatePerKWh: selectedTariff.isTimeOfDay ? selectedTariff.peakRateVal : null,
      offPeakRatePerKWh: selectedTariff.isTimeOfDay ? selectedTariff.offPeakRate : null,
    });

    let comparisonResult = null;
    if (comparisonTariffId) {
      const compTariff = TARIFF_CATALOG.find(t => t.id === comparisonTariffId || t.code === comparisonTariffId);
      if (compTariff) {
        const compCalc = calculateElectricityBill({
          consumptionKWh: units,
          standingChargeINR: compTariff.standingCharge,
          fppcaRatePerKWh: compTariff.fppcaRate,
          regulatoryPercent: compTariff.regulatoryDutyPercent,
          slabs: compTariff.slabs || [],
          peakUsagePercent,
          peakRatePerKWh: compTariff.isTimeOfDay ? compTariff.peakRateVal : null,
          offPeakRatePerKWh: compTariff.isTimeOfDay ? compTariff.offPeakRate : null,
        });

        const diffINR = parseFloat((compCalc.totalAmountINR - calculation.totalAmountINR).toFixed(2));
        const savingsPercent = calculation.totalAmountINR > 0
          ? parseFloat((((calculation.totalAmountINR - compCalc.totalAmountINR) / calculation.totalAmountINR) * 100).toFixed(1))
          : 0;

        comparisonResult = {
          tariffName: compTariff.name,
          totalINR: compCalc.totalAmountINR,
          differenceINR: diffINR,
          savingsPercentage: savingsPercent,
        };
      }
    }

    return {
      tariffName: selectedTariff.name,
      consumptionKWh: units,
      breakdown: {
        baseEnergyCharge: calculation.breakdown.energyCharges,
        peakEnergyCharge: 0,
        standingCharge: calculation.breakdown.standingCharge,
        regulatoryFees: calculation.breakdown.electricityDutyAndTaxes,
      },
      totalEstimatedINR: calculation.totalAmountINR,
      effectiveRatePerKWh: calculation.effectiveRatePerKWh,
      comparison: comparisonResult,
      sourceEngine: 'WattWise Deterministic Tariff Simulation Engine (BESCOM / India)',
    };
  }
};

