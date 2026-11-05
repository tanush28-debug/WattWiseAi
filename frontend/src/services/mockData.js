/**
 * WattWise AI - Isolated Mock Services and High-Fidelity Demo Data (India / INR Edition)
 * Clearly labeled as DEMO / SIMULATION.
 * Follows enterprise domain models for Consumer, Industrial, and Government portals.
 */

export const DEMO_CONSUMER_OVERVIEW = {
  isDemo: true,
  currentPeriod: {
    label: 'October 2026',
    consumptionKWh: 420.5,
    estimatedBillINR: 3248.50,
    carbonEmissionsKg: 184.2,
    energySavingScore: 84, // out of 100
    comparisonPercentage: -12.4, // vs last month (-12.4% reduction)
    peakDemandKWh: 3.4,
    tariffTier: 'Domestic LT-1 Standard'
  },
  monthlyUsage: [
    { month: 'Jan', consumption: 480, bill: 3680, co2: 210, benchmark: 510 },
    { month: 'Feb', consumption: 460, bill: 3520, co2: 201, benchmark: 495 },
    { month: 'Mar', consumption: 440, bill: 3410, co2: 192, benchmark: 480 },
    { month: 'Apr', consumption: 410, bill: 3180, co2: 179, benchmark: 470 },
    { month: 'May', consumption: 520, bill: 4150, co2: 228, benchmark: 530 },
    { month: 'Jun', consumption: 580, bill: 4650, co2: 254, benchmark: 590 },
    { month: 'Jul', consumption: 610, bill: 4890, co2: 267, benchmark: 620 },
    { month: 'Aug', consumption: 590, bill: 4720, co2: 258, benchmark: 605 },
    { month: 'Sep', consumption: 475, bill: 3780, co2: 208, benchmark: 490 },
    { month: 'Oct', consumption: 420, bill: 3248.5, co2: 184, benchmark: 475 },
    { month: 'Nov (Est)', consumption: 395, bill: 3080, co2: 173, benchmark: 460 },
    { month: 'Dec (Est)', consumption: 430, bill: 3350, co2: 188, benchmark: 485 },
  ],
  applianceBreakdown: [
    { name: 'Air Conditioning & Cooling', percentage: 44, kwh: 185.0, color: '#2457F5' },
    { name: 'Geyser & Water Heating', percentage: 18, kwh: 75.7, color: '#5E89FA' },
    { name: 'Refrigeration', percentage: 14, kwh: 58.9, color: '#91B0FD' },
    { name: 'Lighting & Electronics', percentage: 12, kwh: 50.5, color: '#4D5445' },
    { name: 'Kitchen & Induction', percentage: 12, kwh: 50.4, color: '#151713' }
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: 'Thermostat Offset Optimization',
      category: 'HVAC',
      potentialSavingsINR: 680.00,
      impact: 'High',
      description: 'Setting your AC to 24°C instead of 20°C during 2:00 PM – 6:00 PM peak hours can lower monthly electricity expense by ~12% with zero comfort loss.'
    },
    {
      id: 'rec-2',
      title: 'Geyser Timer & Standby Scheduling',
      category: 'Water Heating',
      potentialSavingsINR: 420.00,
      impact: 'Medium',
      description: 'Switching off the 25L geyser 15 minutes before shower completion saves continuous standby reheating electricity.'
    },
    {
      id: 'rec-3',
      title: 'Phantom Load Idle Reduction',
      category: 'Electronics',
      potentialSavingsINR: 280.00,
      impact: 'Low',
      description: 'Smart power strip isolation for entertainment console and Wi-Fi equipment draws avoids continuous 35W phantom standby.'
    }
  ]
};

export const DEMO_CONSUMER_BILLS = [
  {
    id: 'bill-101',
    fileName: 'OCT_2026_Electricity_Bill.pdf',
    accountNumber: '9204821948',
    consumerName: 'Sarah Jenkins',
    billingPeriod: 'Sep 25, 2026 – Oct 24, 2026',
    billingMonth: 'October 2026',
    unitsConsumed: 420.5,
    amount: 3248.50,
    dueDate: '2026-11-15',
    tariffCategory: 'Domestic LT-1 Standard',
    status: 'EXTRACTED',
    uploadDate: '2026-10-26T14:22:00Z',
    fileSize: '412 KB',
    breakdown: {
      energyCharges: 2480.00,
      standingCharge: 140.00,
      environmentalSurcharge: 188.50,
      taxes: 440.00
    }
  },
  {
    id: 'bill-100',
    fileName: 'SEP_2026_Electricity_Bill.pdf',
    accountNumber: '9204821948',
    consumerName: 'Sarah Jenkins',
    billingPeriod: 'Aug 25, 2026 – Sep 24, 2026',
    billingMonth: 'September 2026',
    unitsConsumed: 475.2,
    amount: 3780.00,
    dueDate: '2026-10-15',
    tariffCategory: 'Domestic LT-1 Standard',
    status: 'EXTRACTED',
    uploadDate: '2026-09-26T11:10:00Z',
    fileSize: '398 KB',
    breakdown: {
      energyCharges: 2950.00,
      standingCharge: 140.00,
      environmentalSurcharge: 210.00,
      taxes: 480.00
    }
  },
  {
    id: 'bill-099',
    fileName: 'AUG_2026_Electricity_Bill.pdf',
    accountNumber: '9204821948',
    consumerName: 'Sarah Jenkins',
    billingPeriod: 'Jul 25, 2026 – Aug 24, 2026',
    billingMonth: 'August 2026',
    unitsConsumed: 590.0,
    amount: 4720.00,
    dueDate: '2026-09-15',
    tariffCategory: 'Domestic LT-1 Standard',
    status: 'EXTRACTED',
    uploadDate: '2026-08-26T09:40:00Z',
    fileSize: '425 KB',
    breakdown: {
      energyCharges: 3840.00,
      standingCharge: 140.00,
      environmentalSurcharge: 260.00,
      taxes: 480.00
    }
  }
];

export const DEMO_DEMAND_FORECAST = {
  isDemo: true,
  algorithm: 'WattWise Temporal Transformer v2.4 (Simulated)',
  confidenceScore: 0.94,
  forecastPeriod: 'Next 30 Days (Nov 2026)',
  projectedKWh: 395.0,
  projectedCostINR: 3080.00,
  confidenceRange: { min: 372.0, max: 418.0 },
  influencingFactors: [
    { factor: 'Seasonal Climate Transition', impact: '-8.5%', detail: 'Lower ambient temperature reduces cooling degree days by 34%.' },
    { factor: 'Historical Behavioral Baseline', impact: '-3.1%', detail: 'Consecutive downward trend in baseline consumption over 90 days.' },
    { factor: 'Occupancy Pattern', impact: '+2.0%', detail: 'Standard residential occupancy pattern maintained on weekends.' }
  ],
  trendSeries: [
    { day: 'Day 1', actual: 13.8, predicted: 13.9, upperBand: 15.2, lowerBand: 12.6 },
    { day: 'Day 4', actual: 14.1, predicted: 13.7, upperBand: 15.0, lowerBand: 12.4 },
    { day: 'Day 7', actual: 15.6, predicted: 15.2, upperBand: 16.5, lowerBand: 13.9 },
    { day: 'Day 10', actual: 12.9, predicted: 13.0, upperBand: 14.4, lowerBand: 11.6 },
    { day: 'Day 13', actual: 13.4, predicted: 13.2, upperBand: 14.6, lowerBand: 11.8 },
    { day: 'Day 16', actual: null, predicted: 12.8, upperBand: 14.2, lowerBand: 11.4 },
    { day: 'Day 19', actual: null, predicted: 13.1, upperBand: 14.5, lowerBand: 11.7 },
    { day: 'Day 22', actual: null, predicted: 14.5, upperBand: 16.0, lowerBand: 13.0 },
    { day: 'Day 25', actual: null, predicted: 12.6, upperBand: 14.0, lowerBand: 11.2 },
    { day: 'Day 28', actual: null, predicted: 12.4, upperBand: 13.8, lowerBand: 11.0 },
    { day: 'Day 30', actual: null, predicted: 12.9, upperBand: 14.3, lowerBand: 11.5 }
  ]
};

export const DEMO_AI_RECOMMENDATIONS = [
  {
    role: 'assistant',
    text: "Namaste Sarah! I've analyzed your latest October electricity bill and consumption trend. You used 420.5 kWh, which is 11.6% lower than September, saving approximately ₹531.50. Would you like me to identify which times of day your usage spiked, or run an estimate on how much switching to Time-of-Day (ToD) tariff pricing would save your household?"
  }
];

export const DEMO_REWARDS_DATA = {
  isDemo: true,
  currentPoints: 1420,
  level: 'Eco-Champion Tier II',
  nextLevelPoints: 2000,
  co2SavedTotalKg: 462.8,
  activeChallenges: [
    {
      id: 'ch-1',
      title: 'Peak Shaving Pioneer',
      description: 'Limit heavy appliance use during peak 5 PM - 8 PM window for 5 consecutive days.',
      progress: 3,
      total: 5,
      pointsReward: 150,
      category: 'Behavioral'
    },
    {
      id: 'ch-2',
      title: 'Phantom Load Buster',
      description: 'Keep average overnight standby consumption below 0.35 kWh for 1 full week.',
      progress: 7,
      total: 7,
      completed: true,
      pointsReward: 200,
      category: 'Efficiency'
    },
    {
      id: 'ch-3',
      title: 'Bill Optimizer',
      description: 'Upload your consecutive monthly electricity bill on or before the due date.',
      progress: 1,
      total: 1,
      completed: true,
      pointsReward: 100,
      category: 'Tracking'
    }
  ],
  badges: [
    { id: 'b-1', name: 'Zero Waste Star', icon: 'Sparkles', dateUnlocked: 'Oct 2026', description: 'Maintained 10% below community consumption average.' },
    { id: 'b-2', name: 'Carbon Reducer', icon: 'Leaf', dateUnlocked: 'Sep 2026', description: 'Prevented 200kg of CO₂ emissions through conservation.' },
    { id: 'b-3', name: 'Bill Master', icon: 'Award', dateUnlocked: 'Aug 2026', description: '3 consecutive bills tracked and reconciled.' }
  ]
};

// ================= INDUSTRIAL DEMO DATA =================

export const DEMO_INDUSTRIAL_OVERVIEW = {
  isDemo: true,
  facilityCount: 4,
  totalConsumptionMWh: 1485.4,
  totalOperationalCostINR: 11850000.00, // ₹1.185 Crore
  carbonEmissionsTonnes: 653.5,
  overallEfficiencyScore: 91.2,
  costVariancePercent: -4.8, // -4.8% cost improvement
  facilities: [
    { id: 'fac-1', name: 'Apex Manufacturing Hub — Plant A', location: 'Bengaluru / Hosur', consumptionMWh: 680.2, costINR: 5440000, status: 'Optimal', activeMachines: 28, alertCount: 0 },
    { id: 'fac-2', name: 'Foundry & Metallurgy Facility — Plant B', location: 'Pune / Chakan', consumptionMWh: 512.6, costINR: 4090000, status: 'Attention', activeMachines: 19, alertCount: 2 },
    { id: 'fac-3', name: 'Assembly & Packaging Hub — Plant C', location: 'Sri City / Chennai', consumptionMWh: 182.4, costINR: 1460000, status: 'Optimal', activeMachines: 14, alertCount: 0 },
    { id: 'fac-4', name: 'Central Cold Storage & Logistics', location: 'Gurugram / NCR', consumptionMWh: 110.2, costINR: 860000, status: 'Optimal', activeMachines: 9, alertCount: 0 }
  ],
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

export const DEMO_INDUSTRIAL_MACHINES = [
  { id: 'm-1', name: 'CNC 5-Axis Milling Center #1', category: 'Machining', facility: 'Plant A', powerRatingKW: 45, operatingHoursPerDay: 16, reportingPeriod: 'Monthly', estimatedKWh: 21600, status: 'Active' },
  { id: 'm-2', name: 'Industrial Induction Furnace B-2', category: 'Thermal', facility: 'Plant B', powerRatingKW: 350, operatingHoursPerDay: 20, reportingPeriod: 'Monthly', estimatedKWh: 210000, status: 'Warning' },
  { id: 'm-3', name: 'Centrifugal Chiller 400TR', category: 'HVAC & Cooling', facility: 'Plant A', powerRatingKW: 180, operatingHoursPerDay: 24, reportingPeriod: 'Monthly', estimatedKWh: 129600, status: 'Active' },
  { id: 'm-4', name: 'Rotary Screw Air Compressor 150HP', category: 'Pneumatics', facility: 'Plant C', powerRatingKW: 110, operatingHoursPerDay: 18, reportingPeriod: 'Monthly', estimatedKWh: 59400, status: 'Active' },
  { id: 'm-5', name: 'Automated Conveyor & Sortation Loop', category: 'Material Handling', facility: 'Plant C', powerRatingKW: 30, operatingHoursPerDay: 14, reportingPeriod: 'Monthly', estimatedKWh: 12600, status: 'Active' },
];

// ================= GOVERNMENT DEMO DATA =================

export const DEMO_GOVERNMENT_OVERVIEW = {
  isDemo: true,
  reportingPeriod: 'Year-to-Date 2026',
  nationalTotalConsumptionTWh: 284.6,
  totalCarbonEmissionsMT: 119.5, // Million Tonnes
  gridReliabilityIndex: 99.82,
  cleanEnergyRatioPercent: 41.5,
  sectors: [
    { name: 'Industrial & Heavy Manufacturing', sharePercent: 38.4, twh: 109.3, emissionsMT: 48.2, growthRate: '+1.8%' },
    { name: 'Commercial & Services', sharePercent: 24.2, twh: 68.9, emissionsMT: 27.8, growthRate: '+0.9%' },
    { name: 'Residential & Households', sharePercent: 26.1, twh: 74.3, emissionsMT: 31.1, growthRate: '-1.4%' },
    { name: 'Agriculture & Irrigation (Ag-Feeder)', sharePercent: 11.3, twh: 32.1, emissionsMT: 12.4, growthRate: '+0.2%' },
  ],
  regionalData: [
    { region: 'Northern Regional Grid (NR)', totalGWh: 88400, perCapitaKWh: 2420, renewableShare: 46.2, complianceRate: 94.5 },
    { region: 'Western Industrial Grid (WR)', totalGWh: 104200, perCapitaKWh: 3150, renewableShare: 34.8, complianceRate: 91.2 },
    { region: 'Southern Renewable Grid (SR)', totalGWh: 61800, perCapitaKWh: 2180, renewableShare: 52.1, complianceRate: 98.0 },
    { region: 'Eastern Hydro Grid (ER)', totalGWh: 30200, perCapitaKWh: 1640, renewableShare: 38.0, complianceRate: 88.6 },
  ],
  activeTariffPolicies: [
    { id: 'pol-1', code: 'T-RES-LIFELINE-26', name: 'National Lifeline Domestic Tariff (<100 kWh)', tierLimitKWh: 100, ratePerKWh: 3.50, status: 'Active' },
    { id: 'pol-2', code: 'T-IND-TOD-HT', name: 'Industrial High-Tension ToD Incentive', peakSurcharge: '+20%', offPeakDiscount: '-15%', status: 'Active' },
    { id: 'pol-3', code: 'T-AGRO-KUSUM-SOLAR', name: 'PM-KUSUM Solar Ag-Feeder Scheme', flatSubsidyPercent: 30, status: 'In Review' }
  ]
};
