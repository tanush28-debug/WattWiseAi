import React, { useEffect, useState } from 'react';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { industrialService } from '../../services/industrialService';
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
import { Activity, Zap, TrendingDown, Database, Info } from 'lucide-react';

const formatNumber = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(value);
};

const shortName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/\b(tps|stpp|hps|hydro|thermal|power station)\b/g, '')
    .trim()
    .replace(/\s+/g, ' ');

export const EnergyAnalyticsIndustrial = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await industrialService.getOverview();
        setData(res.data);
      } catch (err) {
        console.error('Error fetching industrial analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading facility analytics..." />;
  }

  const isBenchmark = data?.isBenchmark;
  const facilities = data?.facilities || [];
  const totalCapacityMW = facilities.reduce((sum, f) => sum + (f.capacityMW || 0), 0);
  const carbonIntensity =
    data?.totalConsumptionMWh > 0
      ? data.carbonEmissionsTonnes / data.totalConsumptionMWh
      : null;

  const plantComparison = facilities
    .filter((f) => f.consumptionMWh > 0)
    .sort((a, b) => b.consumptionMWh - a.consumptionMWh)
    .slice(0, 12)
    .map((f) => {
      const yoy = f.yoyChangePercent;
      const previous =
        yoy !== null && yoy !== undefined && yoy > -100
          ? Math.round(f.consumptionMWh / (1 + yoy / 100))
          : null;
      return {
        plant: shortName(f.name),
        currentMWh: f.consumptionMWh,
        previousMWh: previous,
      };
    });

  const monthlyTrend = data?.monthlyTrend || [];

  const kpis = isBenchmark
    ? [
        {
          title: 'Average Plant Load Factor',
          value: `${formatNumber(data?.overallEfficiencyScore)}%`,
          subtitle: `Net generation ÷ installed capacity · FY ${data?.dataSource?.fiscalYear}`,
          icon: Activity,
        },
        {
          title: 'Installed Capacity',
          value: `${formatNumber(totalCapacityMW, 0)} MW`,
          subtitle: `Across ${facilities.length} CEA/NPP Karnataka plants`,
          icon: Zap,
        },
        {
          title: 'Generation Carbon Intensity',
          value:
            carbonIntensity !== null
              ? `${carbonIntensity.toFixed(3)} kg CO₂/kWh`
              : '—',
          subtitle: 'Generation-weighted plant emissions',
          icon: TrendingDown,
        },
      ]
    : [
        {
          title: 'Capacity Utilization',
          value:
            data?.overallEfficiencyScore !== null && data?.overallEfficiencyScore !== undefined
              ? `${formatNumber(data.overallEfficiencyScore)}%`
              : '—',
          subtitle: 'Consumption ÷ sanctioned load',
          icon: Activity,
        },
        {
          title: 'Verified Consumption',
          value: `${formatNumber(data?.totalConsumptionMWh)} MWh`,
          subtitle: `Across ${facilities.length} linked facilities`,
          icon: Zap,
        },
        {
          title: 'Energy Carbon Intensity',
          value:
            carbonIntensity !== null
              ? `${carbonIntensity.toFixed(3)} kg CO₂/kWh`
              : '—',
          subtitle: 'Derived from verified bills and meter rows',
          icon: TrendingDown,
        },
      ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Industrial Energy Analytics</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          {isBenchmark
            ? 'Karnataka power plant benchmarking from CEA/NPP station-level generation data.'
            : 'Comparative benchmarking, load factor analysis, and emission intensity from your verified facilities.'}
        </p>
      </div>

      {isBenchmark && (
        <div className="rounded-xl border border-cobalt-200 bg-cobalt-50/60 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-cobalt-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-midnight-900 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cobalt-600" />
              {data?.dataSource?.label} · FY {data?.dataSource?.fiscalYear}
            </p>
            <p className="text-[11px] text-midnight-600 leading-relaxed">
              Metric: {data?.dataSource?.metric}. License: {data?.dataSource?.license}. These are Karnataka
              power plants, not your own factories.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            isDemo={false}
          />
        ))}
      </div>

      <ChartWrapper
        title={
          isBenchmark
            ? 'Plant Generation: Current vs Previous FY (MWh)'
            : 'Facility Consumption Trend (MWh)'
        }
        subtitle={
          isBenchmark
            ? 'Top plants by net generation; previous year derived from reported YoY change'
            : 'Recorded MWh from verified facility bills and meter data'
        }
        height={isBenchmark ? 420 : 340}
        isDemo={false}
      >
        {isBenchmark ? (
          plantComparison.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-midnight-500">
              No plant generation records available.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={plantComparison}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E0D3" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#626A59', fontSize: 11 }}
                  tickFormatter={(value) =>
                    value >= 1_000_000
                      ? `${Math.round(value / 1_000_000)}M`
                      : `${Math.round(value / 1_000)}k`
                  }
                />
                <YAxis
                  type="category"
                  dataKey="plant"
                  width={110}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#626A59', fontSize: 10 }}
                />
                <Tooltip
                  formatter={(value) => (value == null ? '—' : `${formatNumber(value, 0)} MWh`)}
                  contentStyle={{
                    backgroundColor: '#151713',
                    borderColor: '#2457F5',
                    borderRadius: '12px',
                    color: '#F4F0E6',
                    fontSize: '11px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  }}
                  itemStyle={{ color: '#F4F0E6' }}
                  cursor={{ fill: 'rgba(36, 87, 245, 0.06)' }}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
                <Bar dataKey="currentMWh" name="Current FY" fill="#151713" radius={[0, 4, 4, 0]} />
                <Bar dataKey="previousMWh" name="Previous FY" fill="#2457F5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        ) : monthlyTrend.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-midnight-500">
            No consumption rows linked to your organization yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D3" />
              <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#626A59', fontSize: 11 }}
                tickFormatter={(value) =>
                  value >= 1_000 ? `${Math.round(value / 1_000)}k` : value
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#151713',
                  borderColor: '#2457F5',
                  borderRadius: '12px',
                  color: '#F4F0E6',
                  fontSize: '11px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
                itemStyle={{ color: '#F4F0E6' }}
                cursor={{ fill: 'rgba(36, 87, 245, 0.06)' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
              <Bar dataKey="consumptionMWh" name="Measured MWh" fill="#151713" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartWrapper>

      {isBenchmark && (
        <Card
          title="Benchmark Methodology"
          subtitle="How these analytics are derived"
        >
          <ul className="space-y-2 text-[11px] text-midnight-600 leading-relaxed list-disc pl-4">
            <li>Load factor is net generation divided by installed capacity × 8,760 hours.</li>
            <li>Carbon intensity is reported plant CO₂ divided by net generation.</li>
            <li>Previous FY generation is derived from the reported year-over-year change, not estimated.</li>
            <li>Source: CEA/NPP station-wise generation compiled by CHETNA (Zenodo), CC BY 4.0.</li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default EnergyAnalyticsIndustrial;
