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
  FileText,
  Info,
  Database
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

const formatMWh = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
};

const isHealthyStatus = (status) => status === 'Optimal' || status === 'Operating';

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
            {data?.isBenchmark ? 'Karnataka Generation Plants' : 'Operational Facilities'}: {data?.facilityCount || 0} Active
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

      {/* Data provenance */}
      {data?.dataSource && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-cobalt-500/20 bg-cobalt-50/40 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Database className="w-4 h-4 text-cobalt-700 mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] font-bold text-midnight-900">
                {data.dataSource.label}
                {data.dataSource.fiscalYear ? ` · FY ${data.dataSource.fiscalYear}` : ''}
              </p>
              <p className="text-[10px] text-midnight-600 mt-0.5">
                Metric: {data.dataSource.metric}
                {data.dataSource.license ? ` · License: ${data.dataSource.license}` : ''}
              </p>
            </div>
          </div>
          {data.dataSource.sourceUrl && (
            <a
              href={data.dataSource.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[10px] font-mono font-semibold text-cobalt-700 hover:text-cobalt-900 underline underline-offset-2"
            >
              Source
            </a>
          )}
        </div>
      )}

      {data?.dataNotice && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/25 bg-amber-50/50 px-4 py-3">
          <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-900 leading-relaxed">{data.dataNotice}</p>
        </div>
      )}

      {/* Top Industrial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={data?.isBenchmark ? 'Total Generation' : 'Total Energy Consumption'}
          value={`${formatMWh(data?.totalConsumptionMWh)} MWh`}
          subtitle={
            data?.isBenchmark
              ? `FY ${data?.dataSource?.fiscalYear} · ${data?.facilityCount} Karnataka plants`
              : `Consolidated across ${data?.facilityCount || 0} facilities`
          }
          icon={Building2}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Energy Cost"
          value={
            data?.totalOperationalCostINR != null
              ? formatCurrency(data.totalOperationalCostINR)
              : '—'
          }
          subtitle={
            data?.totalOperationalCostINR != null
              ? 'Verified facility billing'
              : 'Not published in the CEA/NPP dataset'
          }
          trend={data?.costVariancePercent ?? undefined}
          trendLabel="vs previous period"
          icon={DollarSign}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Carbon Emissions"
          value={
            data?.carbonEmissionsTonnes != null
              ? `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(
                  data.carbonEmissionsTonnes
                )} t CO₂e`
              : '—'
          }
          subtitle={
            data?.isBenchmark
              ? 'Direct emissions from generation'
              : 'Direct industrial emission load'
          }
          icon={Leaf}
          isDemo={data?.isDemo}
        />
        <StatCard
          title={data?.isBenchmark ? 'Average Plant Load Factor' : 'Capacity Utilization'}
          value={
            data?.overallEfficiencyScore != null
              ? `${data.overallEfficiencyScore}%`
              : '—'
          }
          subtitle={
            data?.isBenchmark
              ? 'Generation ÷ installed capacity'
              : 'Consumption ÷ sanctioned load'
          }
          isNegativeGood={false}
          icon={Activity}
          isDemo={data?.isDemo}
        />
      </div>

      {/* Generation / Consumption Trend */}
      <ChartWrapper
        title={
          data?.isBenchmark
            ? 'Karnataka Plant Generation Trend (MWh)'
            : 'Facility Consumption Trend (MWh)'
        }
        subtitle={
          data?.isBenchmark
            ? 'Annual net generation against the previous financial year'
            : 'Recorded MWh from verified facility bills and meter data'
        }
        height={320}
        isDemo={data?.isDemo}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.monthlyTrend || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D3" />
            <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#626A59', fontSize: 11 }}
              tickFormatter={(value) =>
                value >= 1_000_000
                  ? `${Math.round(value / 1_000_000)}M`
                  : value >= 1_000
                  ? `${Math.round(value / 1_000)}k`
                  : value
              }
            />
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
            <Bar
              dataKey="consumptionMWh"
              name={data?.isBenchmark ? 'Net generation' : 'Measured MWh'}
              fill="#151713"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="baseline"
              name={data?.isBenchmark ? 'Previous FY' : 'Target Baseline'}
              fill="#2457F5"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartWrapper>

      {/* Grid: Facility Status & Recent Critical Anomalies */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Facilities Breakdown List */}
        <div className="lg:col-span-7">
          <Card
            title={data?.isBenchmark ? 'Karnataka Plant Performance' : 'Facility Operational Performance'}
            subtitle={
              data?.isBenchmark
                ? `Net generation by plant · FY ${data?.dataSource?.fiscalYear}`
                : 'Consumption and status by facility'
            }
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
              {data?.facilities?.length ? (
                data.facilities.map((fac) => (
                  <div
                    key={fac.id}
                    className="p-4 rounded-xl border border-ivory-200 bg-white hover:bg-ivory-50/50 transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-midnight-900 truncate">{fac.name}</p>
                        <span
                          className={`text-[9px] font-mono px-2 py-0.5 rounded font-semibold ${
                            isHealthyStatus(fac.status)
                              ? 'bg-emerald-500/10 text-emerald-800'
                              : 'bg-amber-500/10 text-amber-800'
                          }`}
                        >
                          {fac.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-midnight-500 font-mono mt-0.5">
                        {fac.location} • {fac.activeMachines}{' '}
                        {data?.isBenchmark ? 'generating units' : 'connected machines'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-bold font-mono text-midnight-900">
                        {formatMWh(fac.consumptionMWh)} MWh
                      </p>
                      {fac.costINR != null ? (
                        <p className="text-[11px] text-midnight-500 font-mono">
                          {formatCurrency(fac.costINR)}
                        </p>
                      ) : fac.capacityMW ? (
                        <p className="text-[11px] text-midnight-500 font-mono">
                          {formatMWh(fac.capacityMW)} MW
                        </p>
                      ) : (
                        <p className="text-[11px] text-midnight-500 font-mono">Cost unavailable</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-midnight-500 py-8 text-center">
                  No facility-level consumption is linked to this organization yet.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Anomaly Alerts */}
        <div className="lg:col-span-5">
          <Card
            title={data?.isBenchmark ? 'Plant Generation Deviations' : 'Active Operational Anomalies'}
            subtitle={
              data?.isBenchmark
                ? 'Plants with a year-over-year generation change of 20% or more'
                : 'Machine load spikes and unexpected variances'
            }
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
              {data?.recentAnomalies?.length ? (
                data.recentAnomalies.map((anom) => (
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

                    <p className="font-bold text-midnight-900">
                      {anom.facilityName} · {anom.equipment}
                    </p>
                    <p className="text-[11px] text-midnight-600 leading-relaxed">{anom.explanation}</p>

                    <div className="pt-1.5 border-t border-rose-200/60 text-[10px] text-rose-900 font-medium">
                      {anom.deviation} — Action: {anom.recommendedAction}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-midnight-500 py-8 text-center">
                  No material generation deviations were detected in the latest period.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default IndustrialOverview;

