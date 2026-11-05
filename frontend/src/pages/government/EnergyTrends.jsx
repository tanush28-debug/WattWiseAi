import React from 'react';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { StatCard } from '../../components/common/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, Globe, Zap } from 'lucide-react';

const MACRO_TRENDS = [
  { year: '2022', totalTWh: 298.4, cleanShare: 32.1, peakMW: 58200 },
  { year: '2023', totalTWh: 294.0, cleanShare: 35.0, peakMW: 57400 },
  { year: '2024', totalTWh: 291.2, cleanShare: 38.4, peakMW: 56800 },
  { year: '2025', totalTWh: 288.0, cleanShare: 40.2, peakMW: 56100 },
  { year: '2026', totalTWh: 284.6, cleanShare: 41.5, peakMW: 55400 },
];

export const EnergyTrends = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Macro Energy Trends</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Multi-year trajectory of national electricity consumption, clean energy penetration, and grid peak demand.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="5-Year Efficiency Progress"
          value="-4.6% TWh"
          subtitle="Cumulative demand abatement"
          trend={-4.6}
          trendLabel="total decoupling"
          icon={TrendingUp}
          isDemo
        />
        <StatCard
          title="Renewable Penetration"
          value="41.5%"
          subtitle="Target: 50% by 2030"
          trend={9.4}
          trendLabel="5-year increase"
          isNegativeGood={false}
          icon={Globe}
          isDemo
        />
        <StatCard
          title="Coincident Peak Reduction"
          value="-2.8 GW"
          subtitle="Peaker capacity avoided"
          trend={-4.8}
          trendLabel="reserve margin relief"
          icon={Zap}
          isDemo
        />
      </div>

      <ChartWrapper
        title="5-Year National Demand & Renewable Share Trajectory"
        subtitle="Tracking electricity demand (TWh) alongside clean energy ratio (%)"
        height={340}
        isDemo
      >
        <LineChart data={MACRO_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4D5" />
          <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#626A59', fontSize: 11 }} />
          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#626A59', fontSize: 11 }} />
          <Tooltip />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
          <Line yAxisId="left" type="monotone" dataKey="totalTWh" name="Total Demand (TWh)" stroke="#151713" strokeWidth={2.5} dot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="cleanShare" name="Clean Energy Mix (%)" stroke="#7AA61C" strokeWidth={2.5} dot={{ r: 4 }} />
        </LineChart>
      </ChartWrapper>
    </div>
  );
};

export default EnergyTrends;

