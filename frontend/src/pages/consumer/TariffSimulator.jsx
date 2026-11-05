import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { tariffService } from '../../services/tariffService';
import { formatCurrency, formatKWh } from '../../utils/formatters';
import { Calculator, ArrowRight, CheckCircle2, Sliders, AlertCircle } from 'lucide-react';

export const TariffSimulator = () => {
  const [categories, setCategories] = useState([]);
  const [consumptionKWh, setConsumptionKWh] = useState(420);
  const [selectedTariffId, setSelectedTariffId] = useState('residential-standard');
  const [comparisonTariffId, setComparisonTariffId] = useState('residential-tou');
  const [peakHoursPercent, setPeakHoursPercent] = useState(25);
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await tariffService.getCategories();
        setCategories(catRes.data);
        // Run initial simulation
        const simRes = await tariffService.simulate({
          consumptionKWh: 420,
          tariffId: 'residential-standard',
          comparisonTariffId: 'residential-tou',
          peakUsagePercent: 25
        });
        setSimulationResult(simRes.data);
      } catch (err) {
        console.error('Error loading tariffs:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await tariffService.simulate({
        consumptionKWh: parseFloat(consumptionKWh) || 100,
        tariffId: selectedTariffId,
        comparisonTariffId: comparisonTariffId,
        peakUsagePercent: parseFloat(peakHoursPercent) || 0
      });
      setSimulationResult(res.data);
    } finally {
      setIsSimulating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading tariff simulation engine..." />;
  }

  const sim = simulationResult || {};
  const breakdown = sim.breakdown || {};
  const comparison = sim.comparison || null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Tariff Simulator & Comparison</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Model electricity costs across different utility structures. Compare flat residential pricing with Time-of-Use rates.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Simulation Parameter Controls */}
        <div className="lg:col-span-5">
          <Card title="Simulation Parameters" subtitle="Adjust consumption volume and rate schedules">
            <form onSubmit={handleSimulate} className="space-y-5">
              <Input
                label="Monthly Consumption Volume (kWh)"
                type="number"
                min="1"
                max="50000"
                value={consumptionKWh}
                onChange={(e) => setConsumptionKWh(e.target.value)}
                helperText="Enter your estimated or actual monthly usage"
                required
              />

              <Select
                label="Primary Tariff Category"
                value={selectedTariffId}
                onChange={(e) => setSelectedTariffId(e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />

              <Select
                label="Comparison Tariff Category"
                value={comparisonTariffId}
                onChange={(e) => setComparisonTariffId(e.target.value)}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
              />

              {/* Slider for Peak-hours consumption percentage */}
              <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-semibold text-midnight-800">Peak Hours Consumption Ratio</span>
                  <span className="font-mono font-bold text-midnight-900">{peakHoursPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={peakHoursPercent}
                  onChange={(e) => setPeakHoursPercent(e.target.value)}
                  className="w-full accent-cobalt-600 cursor-pointer"
                />
                <p className="text-[11px] text-midnight-500 mt-1">
                  Percentage of energy consumed between 2 PM and 8 PM
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-3"
                isLoading={isSimulating}
                leftIcon={Calculator}
              >
                Compute Scenario
              </Button>
            </form>
          </Card>
        </div>

        {/* Simulation Results Display */}
        <div className="lg:col-span-7 space-y-6">
          <Card
            title="Calculated Scenario Bill"
            subtitle={`Engine: ${sim.sourceEngine || 'Backend Tariff Service'}`}
            isDemo
          >
            <div className="p-5 bg-midnight-900 text-ivory-100 rounded-2xl border border-midnight-800 flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-mono uppercase text-midnight-400">Total Estimated Monthly Charge</p>
                <p className="text-3xl font-black text-cobalt-400 mt-1 font-sans">
                  {formatCurrency(sim.totalEstimatedINR || sim.totalEstimatedUSD)}
                </p>
                <p className="text-[11px] text-midnight-400 font-mono mt-0.5">
                  Effective rate: ₹{sim.effectiveRatePerKWh} / kWh
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-midnight-800 border border-midnight-700 flex items-center justify-center text-cobalt-400">
                <Calculator className="w-6 h-6" />
              </div>
            </div>

            {/* Charge Component Breakdown */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-midnight-900 mb-2">Itemized Component Charges</h4>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Off-Peak / Base Energy Charge</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {formatCurrency(breakdown.baseEnergyCharge)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">On-Peak Surcharge</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {formatCurrency(breakdown.peakEnergyCharge)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Fixed Monthly Standing Service Charge</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {formatCurrency(breakdown.standingCharge)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-ivory-200">
                <span className="text-midnight-600">Mandated Regulatory & Grid Resilience Fees</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {formatCurrency(breakdown.regulatoryFees)}
                </span>
              </div>
            </div>

            {/* Comparison Scenario Card */}
            {comparison && (
              <div className="mt-6 p-4 rounded-xl border border-ivory-300 bg-ivory-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-midnight-900">
                    Comparison Plan: {comparison.tariffName}
                  </span>
                  <span className="text-xs font-mono font-bold text-midnight-900">
                    {formatCurrency(comparison.totalINR || comparison.totalUSD)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-ivory-200">
                  <span className="text-midnight-600">Potential Monthly Difference:</span>
                  {(() => {
                    const diff = comparison.differenceINR !== undefined ? comparison.differenceINR : comparison.differenceUSD;
                    return (
                      <span
                        className={`font-mono font-bold ${
                          diff > 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {diff > 0
                          ? `Save ${formatCurrency(diff)}/mo (${comparison.savingsPercentage}%)`
                          : `Costs +${formatCurrency(Math.abs(diff))}/mo`}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TariffSimulator;

