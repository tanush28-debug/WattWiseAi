import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  DollarSign,
  Leaf,
  Activity,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  FileText
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { DashboardSkeleton } from '../../components/common/DashboardSkeleton';
import { industrialService } from '../../services/industrialService';
import { formatCurrency, formatKWh, formatCO2 } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const IndustrialOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await industrialService.getOverview();
        setData(res.data);
      } catch (err) {
        console.error('Error fetching industrial overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton roleLabel="Industrial Operations" />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase text-midnight-500 tracking-wider">
            Operational Facilities: {data?.facilityCount} Active Plants
          </span>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight mt-0.5">
            Industrial Energy Command Center
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/industrial/anomalies')}
            leftIcon={AlertTriangle}
          >
            Review Anomalies ({data?.recentAnomalies?.length || 0})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/industrial/facilities')}
            leftIcon={Building2}
          >
            Manage Facilities
          </Button>
        </div>
      </div>

      {/* Top Industrial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Monthly Energy Draw"
          value={`${data?.totalConsumptionMWh} MWh`}
          subtitle="Consolidated across 4 facilities"
          trend={-4.8}
          trendLabel="vs last month"
          icon={Building2}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Operational Energy Cost"
          value={formatCurrency(data?.totalOperationalCostINR || data?.totalOperationalCostUSD)}
          subtitle="Average ₹8,800 / MWh"
          trend={-5.1}
          trendLabel="cost variance"
          icon={DollarSign}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Carbon Emissions"
          value={`${data?.carbonEmissionsTonnes} t CO₂e`}
          subtitle="Direct industrial emission load"
          trend={-4.2}
          trendLabel="abatement progress"
          icon={Leaf}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Plant Efficiency Index"
          value={`${data?.overallEfficiencyScore}%`}
          subtitle="Exceeds ISO 50001 standards"
          trend={2.4}
          trendLabel="efficiency gain"
          isNegativeGood={false}
          icon={Activity}
          isDemo={data?.isDemo}
        />
      </div>

      {/* Monthly Multi-Plant Consumption Trend */}
      <ChartWrapper
        title="Consolidated Monthly Consumption vs Baseline (MWh)"
        subtitle="Comparing total recorded MWh against facility operational benchmarks"
        height={320}
        isDemo={data?.isDemo}
      >
        <BarChart data={data?.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D3" />
          <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#626A59', fontSize: 11 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#151713',
              borderColor: '#2457F5',
              borderRadius: '12px',
              color: '#F4F0E6',
              fontSize: '11px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
            itemStyle={{ color: '#F4F0E6' }}
            cursor={{ fill: 'rgba(36, 87, 245, 0.06)' }}
          />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
          <Bar dataKey="consumptionMWh" name="Measured MWh" fill="#151713" radius={[4, 4, 0, 0]} />
          <Bar dataKey="baseline" name="Target Baseline" fill="#2457F5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartWrapper>

      {/* Grid: Facility Status & Recent Critical Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Facilities Breakdown List */}
        <div className="lg:col-span-7">
          <Card
            title="Facility Operational Performance"
            subtitle="Current active plant consumption and status"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/industrial/facilities')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                All Facilities
              </Button>
            }
          >
            <div className="space-y-3">
              {data?.facilities?.map((fac) => (
                <div
                  key={fac.id}
                  className="p-4 rounded-xl border border-ivory-200 bg-white hover:bg-ivory-50/50 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-midnight-900 truncate">{fac.name}</p>
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold ${
                          fac.status === 'Optimal'
                            ? 'bg-emerald-500/10 text-emerald-800'
                            : 'bg-amber-500/10 text-amber-800'
                        }`}
                      >
                        {fac.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-midnight-500 font-mono mt-0.5">
                      {fac.location} • {fac.activeMachines} connected machines
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold font-mono text-midnight-900">{fac.consumptionMWh} MWh</p>
                    <p className="text-[11px] text-midnight-500 font-mono">{formatCurrency(fac.costINR || fac.costUSD)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Anomaly Alerts */}
        <div className="lg:col-span-5">
          <Card
            title="Active Operational Anomalies"
            subtitle="Machine load spikes and unexpected variances"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/industrial/anomalies')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                View Engine
              </Button>
            }
          >
            <div className="space-y-3">
              {data?.recentAnomalies?.map((anom) => (
                <div
                  key={anom.id}
                  className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-800 flex items-center gap-1.5 font-mono text-[10px]">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {anom.severity} PRIORITY
                    </span>
                    <span className="font-mono text-[10px] text-midnight-500">{anom.detectedAt}</span>
                  </div>

                  <p className="font-bold text-midnight-900">{anom.equipment}</p>
                  <p className="text-[11px] text-midnight-600 leading-relaxed">{anom.explanation}</p>

                  <div className="pt-1.5 border-t border-rose-200/60 text-[10px] text-rose-900 font-medium">
                    Action: {anom.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IndustrialOverview;

