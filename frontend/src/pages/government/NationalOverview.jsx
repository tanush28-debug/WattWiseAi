import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Leaf,
  Activity,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  PieChart as PieIcon,
  Sliders,
  DollarSign
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { DashboardSkeleton } from '../../components/common/DashboardSkeleton';
import { governmentService } from '../../services/governmentService';
import { formatCurrency, formatKWh } from '../../utils/formatters';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export const NationalOverview = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGov = async () => {
      try {
        const res = await governmentService.getOverview();
        setData(res.data);
      } catch (err) {
        console.error('Error fetching government overview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGov();
  }, []);

  if (loading) {
    return <DashboardSkeleton roleLabel="Government Administration" />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-semibold uppercase text-midnight-500 tracking-wider">
            National Energy Registry • {data?.reportingPeriod}
          </span>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight mt-0.5">
            National Grid Decision & Policy Hub
          </h2>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/government/tariffs')}
            leftIcon={DollarSign}
          >
            Manage Tariffs
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/government/policy-simulator')}
            leftIcon={Sliders}
          >
            Policy Simulator
          </Button>
        </div>
      </div>

      {/* Top National Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="National Monitored Energy"
          value={`${data?.nationalTotalConsumptionTWh} TWh`}
          subtitle="Annualized recorded load"
          trend={-1.8}
          trendLabel="grid relief progress"
          icon={Globe}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="National GHG Emissions"
          value={`${data?.totalCarbonEmissionsMT} MT CO₂e`}
          subtitle="Million metric tonnes"
          trend={-3.4}
          trendLabel="net-zero trajectory"
          icon={Leaf}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Grid Reliability Index"
          value={`${data?.gridReliabilityIndex}%`}
          subtitle="SAIDI / SAIFI compliance"
          trend={0.15}
          trendLabel="stability improvement"
          isNegativeGood={false}
          icon={Activity}
          isDemo={data?.isDemo}
        />
        <StatCard
          title="Clean Renewable Mix"
          value={`${data?.cleanEnergyRatioPercent}%`}
          subtitle="Hydro, solar, and wind"
          trend={4.2}
          trendLabel="renewable expansion"
          isNegativeGood={false}
          icon={ShieldCheck}
          isDemo={data?.isDemo}
        />
      </div>

      {/* Sector Usage Bar Chart */}
      <ChartWrapper
        title="Sector-wise Electricity Consumption (TWh)"
        subtitle="Distribution across Industrial, Commercial, Residential, and Agricultural segments"
        height={320}
        isDemo={data?.isDemo}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/government/sectors')}
            rightIcon={ArrowUpRight}
            className="text-xs"
          >
            Sector Details
          </Button>
        }
      >
        <BarChart data={data?.sectors} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D3" />
          <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
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
          <Bar dataKey="twh" name="Annual Consumption (TWh)" radius={[6, 6, 0, 0]}>
            {data?.sectors?.map((entry, index) => (
              <Cell
                key={`sector-${index}`}
                fill={index === 0 ? '#2457F5' : '#151713'}
                className="transition-opacity duration-200 hover:opacity-85"
              />
            ))}
          </Bar>
        </BarChart>
      </ChartWrapper>

      {/* Regional Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card
            title="Regional Grid Operating Zones"
            subtitle="Transmission telemetry, compliance, and clean energy share"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/government/regional')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                Explore Map & Districts
              </Button>
            }
          >
            <div className="space-y-3">
              {data?.regionalData?.map((r, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-ivory-200 bg-white hover:bg-ivory-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-midnight-900">{r.region}</h4>
                    <p className="text-[11px] text-midnight-500 font-mono mt-0.5">
                      Per Capita: {r.perCapitaKWh} kWh • Clean Share: {r.renewableShare}%
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs font-mono font-bold text-midnight-900">{r.totalGWh} GWh</p>
                      <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {r.complianceRate}% Compliance
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Active Policies Quick Overview */}
        <div className="lg:col-span-4">
          <Card
            title="Active Tariff Regimes"
            subtitle="Regulated utility tariff schedules"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/government/tariffs')}
                rightIcon={ArrowUpRight}
                className="text-xs"
              >
                Manage
              </Button>
            }
          >
            <div className="space-y-3">
              {data?.activeTariffPolicies?.map((pol) => (
                <div key={pol.id} className="p-3 rounded-xl border border-ivory-200 bg-ivory-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-midnight-500">{pol.code}</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {pol.status}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-midnight-900">{pol.name}</h5>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NationalOverview;

