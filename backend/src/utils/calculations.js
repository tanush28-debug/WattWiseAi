/**
 * Deterministic Energy & Tariff Calculation Engine (India / INR)
 * The backend is the single source of truth for bill calculations,
 * tariff slab processing, and statutory carbon emissions.
 */

// Default Central Electricity Authority (CEA) Emission Factor (kg CO2 / kWh)
export const DEFAULT_GRID_EMISSION_FACTOR = 0.8200;

/**
 * Calculate carbon emissions in kg and metric tonnes from electricity consumption.
 * Formula: emissions_kg_co2 = consumption_kwh * configured_emission_factor
 * @param {number} consumptionKWh 
 * @param {number} emissionFactor 
 */
export function calculateCarbonEmissions(consumptionKWh, emissionFactor = DEFAULT_GRID_EMISSION_FACTOR) {
  const kwh = Math.max(0, parseFloat(consumptionKWh) || 0);
  const factor = parseFloat(emissionFactor) || DEFAULT_GRID_EMISSION_FACTOR;
  const kgCO2 = parseFloat((kwh * factor).toFixed(2));
  const tonnesCO2 = parseFloat((kgCO2 / 1000.0).toFixed(4));
  return {
    consumptionKWh: kwh,
    emissionFactorKgPerKWh: factor,
    carbonEmissionsKg: kgCO2,
    carbonEmissionsTonnes: tonnesCO2,
  };
}

/**
 * Calculate electricity bill using official multi-tier tariff slabs and DISCOM charges.
 * @param {Object} params
 * @param {number} params.consumptionKWh
 * @param {number} params.standingChargeINR
 * @param {number} params.fppcaRatePerKWh
 * @param {number} params.regulatoryPercent
 * @param {Array<{minUnits: number, maxUnits: number|null, ratePerKWh: number}>} params.slabs
 * @param {number} params.peakUsagePercent
 * @param {number} [params.peakRatePerKWh]
 * @param {number} [params.offPeakRatePerKWh]
 */
export function calculateElectricityBill({
  consumptionKWh,
  standingChargeINR = 120.00,
  fppcaRatePerKWh = 0.45,
  regulatoryPercent = 6.00,
  slabs = [],
  peakUsagePercent = 25.00,
  peakRatePerKWh = null,
  offPeakRatePerKWh = null
}) {
  const units = Math.max(0, parseFloat(consumptionKWh) || 0);
  let energyCharge = 0;
  const slabBreakdown = [];

  // If ToD specific rates provided
  if (peakRatePerKWh !== null && offPeakRatePerKWh !== null) {
    const peakUnits = units * (peakUsagePercent / 100.0);
    const offPeakUnits = units * (1 - peakUsagePercent / 100.0);
    const peakCharge = peakUnits * peakRatePerKWh;
    const offPeakCharge = offPeakUnits * offPeakRatePerKWh;
    energyCharge = peakCharge + offPeakCharge;

    slabBreakdown.push({
      tier: 'Off-Peak Window',
      units: parseFloat(offPeakUnits.toFixed(2)),
      rate: offPeakRatePerKWh,
      amount: parseFloat(offPeakCharge.toFixed(2))
    });
    slabBreakdown.push({
      tier: 'Peak Window',
      units: parseFloat(peakUnits.toFixed(2)),
      rate: peakRatePerKWh,
      amount: parseFloat(peakCharge.toFixed(2))
    });
  } else if (slabs.length > 0) {
    // Tiered slab calculation
    let remainingUnits = units;
    for (const slab of slabs) {
      if (remainingUnits <= 0) break;
      const slabMin = slab.minUnits || 0;
      const slabMax = slab.maxUnits;
      const slabSpan = slabMax !== null ? (slabMax - slabMin) : remainingUnits;
      const unitsInSlab = Math.min(remainingUnits, slabSpan);

      const slabCharge = unitsInSlab * slab.ratePerKWh;
      energyCharge += slabCharge;
      remainingUnits -= unitsInSlab;

      slabBreakdown.push({
        tier: slabMax ? `${slabMin} - ${slabMax} kWh` : `Above ${slabMin} kWh`,
        units: parseFloat(unitsInSlab.toFixed(2)),
        rate: slab.ratePerKWh,
        amount: parseFloat(slabCharge.toFixed(2))
      });
    }
  } else {
    // Default flat rate
    const flatRate = 6.85;
    energyCharge = units * flatRate;
    slabBreakdown.push({
      tier: 'Standard Flat Rate',
      units,
      rate: flatRate,
      amount: parseFloat(energyCharge.toFixed(2))
    });
  }

  const standing = parseFloat(standingChargeINR) || 0;
  const fppca = parseFloat((units * fppcaRatePerKWh).toFixed(2));
  const taxesAndDuty = parseFloat(((energyCharge + standing) * (regulatoryPercent / 100.0)).toFixed(2));
  const totalAmount = parseFloat((energyCharge + standing + fppca + taxesAndDuty).toFixed(2));
  const effectiveRate = units > 0 ? parseFloat((totalAmount / units).toFixed(2)) : 0;

  return {
    consumptionKWh: units,
    breakdown: {
      energyCharges: parseFloat(energyCharge.toFixed(2)),
      standingCharge: standing,
      fuelSurchargeFPPCA: fppca,
      electricityDutyAndTaxes: taxesAndDuty,
      slabBreakdown
    },
    totalAmountINR: totalAmount,
    effectiveRatePerKWh: effectiveRate,
  };
}

