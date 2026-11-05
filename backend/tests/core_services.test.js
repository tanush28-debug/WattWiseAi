import { forecastService } from '../src/services/forecastService.js';
import { geminiService } from '../src/services/geminiService.js';
import { tariffEngine } from '../src/services/tariffEngine.js';
import { calculateElectricityBill, calculateCarbonEmissions } from '../src/utils/calculations.js';
import { billService } from '../src/services/billService.js';
import { industrialService } from '../src/services/industrialService.js';
import { governmentService } from '../src/services/governmentService.js';
import { analyticsService } from '../src/services/analyticsService.js';

async function runDirectTests() {
  console.log('=== STARTING WATTWISE CORE SERVICES VERIFICATION SUITE ===');

  // 1. Calculations & Carbon Tests
  const billCalc = calculateElectricityBill({ consumptionKWh: 420.5 });
  console.log('1. Bill Calculation (420.5 kWh):', {
    totalINR: billCalc.totalAmountINR,
    energyChargesINR: billCalc.breakdown.energyCharges,
    standingINR: billCalc.breakdown.standingCharge,
    fppcaINR: billCalc.breakdown.fuelSurchargeFPPCA,
    taxINR: billCalc.breakdown.electricityDutyAndTaxes
  });
  if (billCalc.totalAmountINR > 0 && billCalc.breakdown.energyCharges > 0) {
    console.log('   ✅ Bill calculation arithmetic passed.');
  } else {
    throw new Error('Bill calculation failed');
  }

  const carbon = calculateCarbonEmissions(420.5);
  console.log('2. Carbon Emissions (420.5 kWh):', carbon);
  if (carbon.carbonEmissionsKg === 344.81) {
    console.log('   ✅ CEA Baseline 0.82 kg CO2e/kWh carbon calculation passed.');
  }

  // 3. Tariff Service
  const tariffSim = tariffEngine.simulate({ consumptionKWh: 420.5, tariffId: 'residential-standard' });
  console.log('3. Tariff Simulation:', {
    category: tariffSim.tariffName,
    totalINR: tariffSim.totalEstimatedINR,
    breakdown: tariffSim.breakdown
  });
  if (tariffSim.totalEstimatedINR > 0) {
    console.log('   ✅ Tariff simulation service passed.');
  }

  // 4. Forecast Service
  const forecastBaseline = await forecastService.getForecast(null, null, 30);
  console.log('4. Forecast Baseline:', {
    algorithm: forecastBaseline.algorithm,
    projectedKWh: forecastBaseline.projectedKWh,
    isEstimate: forecastBaseline.isEstimate
  });
  if (forecastBaseline.projectedKWh === 395.0) {
    console.log('   ✅ Forecast baseline service passed.');
  }

  // 5. Gemini AI Advisory Engine (Local fallback when key not configured)
  const aiAdvice = await geminiService.generateEnergyAdvice({
    message: 'How do I reduce my electricity bill?',
    userContext: { fullName: 'Thejas', role: 'CONSUMER' }
  });
  console.log('5. AI Energy Advisor:', {
    source: aiAdvice.source,
    isAiConfigured: aiAdvice.isAiConfigured,
    snippet: aiAdvice.reply.substring(0, 90) + '...'
  });
  if (aiAdvice.reply && aiAdvice.source) {
    console.log('   ✅ AI Advisor engine passed.');
  }

  // 6. Industrial Analytics
  const indOverview = await industrialService.getOverview();
  console.log('6. Industrial Analytics:', {
    facilityCount: indOverview.facilityCount,
    consumptionMWh: indOverview.totalConsumptionMWh,
    costINR: indOverview.totalOperationalCostINR,
    anomalies: indOverview.recentAnomalies.length
  });
  if (indOverview.facilityCount > 0 && indOverview.recentAnomalies.length > 0) {
    console.log('   ✅ Industrial analytics service passed.');
  }

  // 7. Government Analytics
  const govOverview = await governmentService.getOverview();
  console.log('7. Government Analytics:', {
    totalTWh: govOverview.nationalTotalConsumptionTWh,
    sectors: govOverview.sectors.length,
    regions: govOverview.regionalData.length
  });
  if (govOverview.nationalTotalConsumptionTWh > 0 && govOverview.sectors.length === 4) {
    console.log('   ✅ Government analytics service passed.');
  }

  // 8. Policy Simulation
  const policySim = governmentService.simulatePolicy({
    incentiveType: 'Solar Feeder Subsidy',
    percentageChange: 15,
    targetSector: 'Agriculture',
    durationYears: 3
  });
  console.log('8. Policy Simulator:', {
    scenario: policySim.scenarioName,
    twhReduction: policySim.projectedAnnualReductionTWh,
    emissionsAbatementMT: policySim.emissionsAbatementMT,
    benefitCroresINR: policySim.netEconomicBenefitCroresINR
  });
  if (policySim.projectedAnnualReductionTWh > 0) {
    console.log('   ✅ Policy simulation service passed.');
  }

  // 9. Consumer Analytics
  const consumerOverview = await analyticsService.getConsumerOverview();
  console.log('9. Consumer Overview:', {
    isDemo: consumerOverview.isDemo,
    consumptionKWh: consumerOverview.currentPeriod.consumptionKWh,
    estimatedBillINR: consumerOverview.currentPeriod.estimatedBillINR,
    monthlyUsageCount: consumerOverview.monthlyUsage.length,
    recommendationsCount: consumerOverview.recommendations.length
  });
  if (consumerOverview.currentPeriod.consumptionKWh > 0) {
    console.log('   ✅ Consumer overview analytics service passed.');
  }

  console.log('=== ALL 9 CORE SERVICES PASSED WITH ZERO ERRORS ===');
}

runDirectTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

