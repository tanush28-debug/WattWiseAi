import React from 'react';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Leaf, ShieldCheck, TreePine } from 'lucide-react';

const CARBON_NATIONAL = [
  { year: '2022', emissionsMT: 131.2, targetMT: 135.0 },
  { year: '2023', emissionsMT: 127.8, targetMT: 130.0 },
  { year: '2024', emissionsMT: 124.5, targetMT: 125.0 },
  { year: '2025', emissionsMT: 122.0, targetMT: 120.0 },
  { year: '2026', emissionsMT: 119.5, targetMT: 115.0 },
];

export const CarbonSustainability = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">National Carbon & Sustainability</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Macro greenhouse gas monitoring, statutory emissions reduction glide paths, and Paris Agreement milestones.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="National GHG Output"
          value="119.5 MT"
          subtitle="Million Tonnes CO₂e"
          trend={-8.9}
          trendLabel="cumulative reduction"
          icon={Leaf}
          isDemo
        />
        <StatCard
          title="Grid Carbon Intensity"
          value="420 g / kWh"
          subtitle="Average operational intensity"
          trend={-12.1}
          trendLabel="cleaner generation"
          icon={ShieldCheck}
          isDemo
        />
        <StatCard
          title="Statutory Target Alignment"
          value="98.2%"
          subtitle="Annual compliance rating"
          trend={1.4}
          trendLabel="target progress"
          isNegativeGood={false}
          icon={TreePine}
          isDemo
        />
      </div>

      <ChartWrapper
        title="National Power Sector Carbon Glide Path (MT CO₂e)"
        subtitle="Historical emission output versus mandated net-zero reduction trajectory"
        height={340}
        isDemo
      >
        <AreaChart data={CARBON_NATIONAL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4D5" />
          <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#626A59', fontSize: 11 }} />
          <Tooltip />
          <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }} />
          <Area type="monotone" dataKey="emissionsMT" name="Recorded GHG (MT CO₂e)" stroke="#151713" fill="#151713" fillOpacity={0.15} />
          <Area type="monotone" dataKey="targetMT" name="Policy Target (MT CO₂e)" stroke="#2457F5" strokeWidth={2.5} strokeDasharray="5 5" fill="none" />
        </AreaChart>
      </ChartWrapper>
    </div>
  );
};

export default CarbonSustainability;

