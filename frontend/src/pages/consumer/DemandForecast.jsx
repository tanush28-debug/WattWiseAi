import React, { useState, useEffect } from 'react';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { ForecastChart } from '../../components/charts/ForecastChart';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { forecastService } from '../../services/forecastService';
import { formatCurrency, formatKWh } from '../../utils/formatters';
import { TrendingUp, Cpu, Calendar, ShieldCheck, Info, Clock, CheckCircle2, Calculator, Layers, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemandForecast = () => {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const res = await forecastService.getForecast(30);
        setForecast(res.data);
      } catch (err) {
        console.error('Error fetching demand forecast:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Computing demand prediction models..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">AI Demand Forecasting</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Predictive machine learning consumption curve for the next 30 days based on weather degree days and historical behavioral patterns.
        </p>
      </div>

      {/* Insufficient Data Calibration Banner */}
      {!forecast?.hasSufficientData && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Awaiting Sufficient Billing History:</strong>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                {forecast?.dataNotice || 'Predictive 30-day demand curves require at least 2 consecutive verified monthly bills to compute statistical momentum and confidence bounds.'}
              </p>
            </div>
          </div>
          <a
            href="/consumer/bills"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl whitespace-nowrap text-[11px] transition-colors shrink-0"
          >
            Upload Bills &rarr;
          </a>
        </div>
      )}

      {/* Top Prediction KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Projected Next 30-Day Draw"
          value={forecast?.projectedKWh ? formatKWh(forecast.projectedKWh) : '—'}
          subtitle={forecast?.confidenceRange ? `Range: ${forecast.confidenceRange.min} – ${forecast.confidenceRange.max} kWh` : 'Requires 2 verified bills'}
          icon={TrendingUp}
          isDemo={forecast?.isDemo}
        />
        <StatCard
          title="Expected Cost"
          value={forecast?.projectedCostINR ? formatCurrency(forecast.projectedCostINR) : '—'}
          subtitle="Based on statutory tariff schedule"
          icon={TrendingUp}
          isDemo={forecast?.isDemo}
        />
        <StatCard
          title="Model Confidence"
          value={forecast?.confidenceScore ? `${(forecast.confidenceScore * 100).toFixed(0)}%` : 'Pending'}
          subtitle={forecast?.algorithm || 'WattWise ML'}
          isNegativeGood={false}
          icon={Cpu}
          isDemo={forecast?.isDemo}
        />
      </div>

      {/* Main Forecast Trajectory Chart */}
      <ChartWrapper
        title="30-Day Demand Projection with 95% Confidence Band"
        subtitle={forecast?.hasSufficientData ? 'Machine learning demand projection calibrated on your verified consumption' : 'Awaiting calibration data from verified statements'}
        height={360}
        isDemo={forecast?.isDemo}
      >
        <ForecastChart data={forecast?.trendSeries || []} />
      </ChartWrapper>

      {/* Grid: Sufficiency Meter & Cost Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sufficiency Indicator */}
        <Card
          title="Data Sufficiency & Calibration Indicator"
          subtitle="Minimum 2 consecutive verified monthly statements required for statistical extrapolation"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-midnight-900">Calibration Progress</span>
              <span className="font-mono font-bold text-cobalt-600">
                {forecast?.totalBillsCount >= 2 ? '100% Calibrated' : (forecast?.totalBillsCount === 1 ? '50% Calibrated (1 of 2 Cycles)' : '0% (Awaiting Bills)')}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 w-full bg-ivory-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  forecast?.totalBillsCount >= 2 ? 'bg-emerald-600 w-full' : (forecast?.totalBillsCount === 1 ? 'bg-cobalt-600 w-1/2' : 'bg-midnight-300 w-0')
                }`}
              />
            </div>

            <div className="p-3.5 rounded-xl bg-ivory-100/70 border border-ivory-200 text-xs text-midnight-700 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${forecast?.totalBillsCount >= 1 ? 'text-emerald-600' : 'text-midnight-400'}`} />
                <div>
                  <strong className="text-midnight-900">Baseline Cycle:</strong> {forecast?.totalBillsCount >= 1 ? 'Established from verified statement' : 'Upload your first electricity bill'}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${forecast?.totalBillsCount >= 2 ? 'text-emerald-600' : 'text-midnight-400'}`} />
                <div>
                  <strong className="text-midnight-900">Bilateral Drift & 95% Confidence:</strong> {forecast?.totalBillsCount >= 2 ? 'Calibrated on 2 consecutive statements' : 'Requires 2nd consecutive monthly statement'}
                </div>
              </div>
            </div>

            {!forecast?.hasSufficientData && (
              <button
                onClick={() => navigate('/consumer/bills')}
                className="w-full py-2.5 px-4 bg-cobalt-600 hover:bg-cobalt-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <span>Upload Statement to Calibrate Model</span>
                <span className="font-mono">&rarr;</span>
              </button>
            )}
          </div>
        </Card>

        {/* Projected Electricity Cost Breakdown */}
        <Card
          title="Projected 30-Day Cost & Tariff Slab Decomposition"
          subtitle="Estimated outlay under state DISCOM LT-1 Domestic Tariff schedule"
        >
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <span className="text-midnight-600">Base Energy Charges</span>
              <span className="font-mono font-bold text-midnight-900">
                {forecast?.projectedCostINR ? formatCurrency(forecast.projectedCostINR * 0.76) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <span className="text-midnight-600">Fixed Standing Demand Charge</span>
              <span className="font-mono font-bold text-midnight-900">₹120.00</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <span className="text-midnight-600">Fuel Surcharge Adjustment (FPPCA @ ₹0.45/unit)</span>
              <span className="font-mono font-bold text-midnight-900">
                {forecast?.projectedKWh ? `₹${(forecast.projectedKWh * 0.45).toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-ivory-200">
              <span className="text-midnight-600">State Electricity Duty (6% Statutory Tax)</span>
              <span className="font-mono font-bold text-midnight-900">
                {forecast?.projectedCostINR ? `₹${(forecast.projectedCostINR * 0.06).toFixed(2)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 text-sm">
              <span className="font-bold text-midnight-900">Total Projected Outlay</span>
              <span className="font-mono font-black text-cobalt-600">
                {forecast?.projectedCostINR ? formatCurrency(forecast.projectedCostINR) : '—'}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Grid: Influencing Factors & Time-of-Day ToD Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Influencing Factors Table */}
        <Card
          title="Factors Influencing Current Prediction"
          subtitle="Decomposition of macroeconomic, weather, and behavioral drivers"
          isDemo={forecast?.isDemo}
        >
          <div className="divide-y divide-ivory-200">
            {forecast?.influencingFactors?.map((f, i) => (
              <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex-1">
                  <p className="font-bold text-midnight-900">{f.factor}</p>
                  <p className="text-midnight-600 text-[11px] mt-0.5">{f.detail}</p>
                </div>
                <span
                  className={`font-mono font-bold px-2.5 py-1 rounded-md text-xs self-start sm:self-auto ${
                    f.impact.startsWith('-')
                      ? 'bg-emerald-500/10 text-emerald-800'
                      : 'bg-amber-500/10 text-amber-800'
                  }`}
                >
                  {f.impact}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Time-of-Day (ToD) Load Optimization Strategy */}
        <Card
          title="Time-of-Day (ToD) Peak Demand Avoidance Strategy"
          subtitle="Align household consumption with regional DISCOM load curves to minimize bills"
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
              <Clock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-900 font-bold">Off-Peak Incentive Window (22:00 – 06:00):</strong>
                <p className="text-emerald-800 text-[11px] mt-0.5">
                  15% tariff reduction window. Schedule heavy appliance cycles (washing machines, EV chargers, water pumps) during overnight hours.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-ivory-100 border border-ivory-200 flex items-start gap-3">
              <Clock className="w-4 h-4 text-midnight-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-midnight-900 font-bold">Standard Day Window (06:00 – 18:00):</strong>
                <p className="text-midnight-700 text-[11px] mt-0.5">
                  Standard DISCOM slab rates apply. Solar rooftop generation offsets baseline residential loads.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-rose-900 font-bold">Super-Peak Grid Stress (18:00 – 22:00):</strong>
                <p className="text-rose-800 text-[11px] mt-0.5">
                  Highest grid stress window. Keep split AC setpoints at 24°C and minimize simultaneous geyser and heating appliance operation.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DemandForecast;

