import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { industrialService } from '../../services/industrialService';
import { formatCurrency } from '../../utils/formatters';
import { LineChart, DollarSign, ArrowRight, CheckCircle2, TrendingDown, Clock } from 'lucide-react';

export const CostOptimization = () => {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchOptimization = async () => {
      try {
        const res = await industrialService.getOptimizationScenarios();
        setScenarios(res.data);
      } catch (err) {
        console.error('Error fetching cost optimization:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOptimization();
  }, []);

  const handleApplyScenario = (area) => {
    toast.success(`Optimization plan "${area}" flagged for engineering implementation.`);
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Computing industrial cost optimization matrix..." />;
  }

  const totalMonthlySavings = scenarios.reduce(
    (acc, curr) => acc + (curr.potentialMonthlySavingsINR || curr.potentialMonthlySavingsUSD || 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Cost Optimization & Peak Shaving</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Actionable engineering interventions to eliminate high-demand surcharges and improve mechanical COP.
        </p>
      </div>

      {/* Aggregate Savings Summary */}
      <div className="p-6 rounded-3xl bg-midnight-900 text-ivory-100 border border-midnight-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-cobalt-400 font-bold">Consolidated Opportunity</span>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-ivory-100 mt-0.5 font-sans">
            {formatCurrency(totalMonthlySavings)} / Month
          </h3>
          <p className="text-xs text-midnight-400 mt-1">
            Total potential operational electricity savings across all active manufacturing plants.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-cobalt-500/20 text-cobalt-300 text-xs font-mono font-bold border border-cobalt-500/30">
            {scenarios.length} Actionable Workflows
          </span>
        </div>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scenarios.map((scen) => (
          <div
            key={scen.id}
            className="p-6 rounded-3xl border border-ivory-300 bg-white shadow-subtle hover:border-ivory-400 hover:shadow-card transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cobalt-500/15 text-cobalt-900 border border-cobalt-500/20">
                {scen.status}
              </span>
              <h4 className="text-base font-bold text-midnight-900">{scen.area}</h4>
              <p className="text-xs text-midnight-600 leading-relaxed">{scen.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-ivory-200 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-midnight-500">Monthly Savings:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {formatCurrency(scen.potentialMonthlySavingsINR || scen.potentialMonthlySavingsUSD)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-midnight-500">CAPEX Investment:</span>
                <span className="font-mono font-semibold text-midnight-900">
                  {formatCurrency(scen.implementationCostINR || scen.implementationCostUSD)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-midnight-500">Payback Period:</span>
                <span className="font-mono font-semibold text-midnight-900">{scen.paybackPeriod}</span>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full mt-3"
                onClick={() => handleApplyScenario(scen.area)}
              >
                Schedule Work Order
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostOptimization;

