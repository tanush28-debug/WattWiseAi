import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Input } from '../../components/common/Input';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { governmentService } from '../../services/governmentService';
import { formatCurrency } from '../../utils/formatters';
import { Sliders, Sparkles, TrendingDown, Leaf, DollarSign, Info } from 'lucide-react';

export const PolicySimulatorGovernment = () => {
  const [incentiveType, setIncentiveType] = useState('Industrial Peak Demand Shaving Surcharge');
  const [targetSector, setTargetSector] = useState('Industrial');
  const [percentageChange, setPercentageChange] = useState('15');
  const [durationYears, setDurationYears] = useState('3');
  const [simulationResult, setSimulationResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async (e) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const res = await governmentService.simulatePolicy({
        incentiveType,
        targetSector,
        percentageChange,
        durationYears
      });
      setSimulationResult(res.data);
    } finally {
      setIsSimulating(false);
    }
  };

  const sim = simulationResult;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Macro Energy Policy Simulator</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Simulate national regulatory interventions, dynamic peak tariffs, and clean energy subsidy outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Policy Configuration Controls */}
        <div className="lg:col-span-5">
          <Card title="Policy Parameter Formulation" subtitle="Define regulatory scenario attributes">
            <form onSubmit={handleSimulate} className="space-y-4">
              <Select
                label="Policy Mechanism"
                value={incentiveType}
                onChange={(e) => setIncentiveType(e.target.value)}
                options={[
                  'Industrial Peak Demand Shaving Surcharge',
                  'Residential Lifeline Tier Expansion',
                  'Solar Ag-Feeder Direct Incentive',
                  'Commercial Efficiency Building Standard Mandate'
                ]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Target Sector"
                  value={targetSector}
                  onChange={(e) => setTargetSector(e.target.value)}
                  options={['Industrial', 'Commercial', 'Residential', 'Agricultural']}
                />
                <Input
                  label="Incentive / Tax Delta (%)"
                  type="number"
                  value={percentageChange}
                  onChange={(e) => setPercentageChange(e.target.value)}
                  required
                />
              </div>

              <Select
                label="Simulation Horizon"
                value={durationYears}
                onChange={(e) => setDurationYears(e.target.value)}
                options={[
                  { value: '1', label: '1 Year Immediate' },
                  { value: '3', label: '3 Years Medium-Term' },
                  { value: '5', label: '5 Years Long-Term' }
                ]}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-3"
                isLoading={isSimulating}
                leftIcon={Sliders}
              >
                Run Macro Simulation
              </Button>
            </form>
          </Card>
        </div>

        {/* Results Screen */}
        <div className="lg:col-span-7 space-y-6">
          {sim ? (
            <Card title="Simulated National Impact Outcome" subtitle={sim.scenarioName} isDemo>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-midnight-900 text-ivory-100 rounded-2xl border border-midnight-800">
                  <p className="text-[10px] font-mono text-midnight-400 uppercase">Annual Grid Relief</p>
                  <p className="text-xl font-black text-cobalt-400 mt-1 font-mono">
                    -{sim.projectedAnnualReductionTWh} TWh
                  </p>
                  <span className="text-[10px] font-mono text-emerald-400 mt-0.5 block">
                    {sim.percentageGridRelief}% Peak Capacity Relieved
                  </span>
                </div>

                <div className="p-4 bg-midnight-900 text-ivory-100 rounded-2xl border border-midnight-800">
                  <p className="text-[10px] font-mono text-midnight-400 uppercase">GHG Abated</p>
                  <p className="text-xl font-black text-emerald-400 mt-1 font-mono">
                    -{sim.emissionsAbatementMT} MT
                  </p>
                  <span className="text-[10px] font-mono text-midnight-400 mt-0.5 block">
                    Direct CO₂e eliminated
                  </span>
                </div>

                <div className="p-4 bg-midnight-900 text-ivory-100 rounded-2xl border border-midnight-800">
                  <p className="text-[10px] font-mono text-midnight-400 uppercase">Economic Benefit</p>
                  <p className="text-xl font-black text-ivory-100 mt-1 font-mono">
                    ₹{sim.netEconomicBenefitCroresINR || 760} Cr
                  </p>
                  <span className="text-[10px] font-mono text-midnight-400 mt-0.5 block">
                    Avoided peaker-plant spend
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-ivory-200">
                <h4 className="text-xs font-bold text-midnight-900">Econometric Assumptions Applied:</h4>
                <ul className="space-y-1.5 text-xs text-midnight-700">
                  {sim.assumptions.map((a, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cobalt-500" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : (
            <div className="h-full border border-dashed border-ivory-300 rounded-3xl p-12 flex flex-col items-center justify-center text-center text-midnight-500">
              <Sliders className="w-10 h-10 text-midnight-400 mb-2" />
              <p className="text-sm font-bold text-midnight-800">No simulation scenario executed</p>
              <p className="text-xs text-midnight-500 max-w-sm mt-1">
                Configure policy levers on the left and click "Run Macro Simulation" to compute econometric projections.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicySimulatorGovernment;

