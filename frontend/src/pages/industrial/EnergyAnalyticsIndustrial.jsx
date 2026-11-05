import React, { useState } from 'react';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Activity, Zap, TrendingDown } from 'lucide-react';

const PLANT_COMPARISON = [
  { plant: 'Plant A (Chicago)', activeMWh: 680, baselineMWh: 710, efficiency: 94 },
  { plant: 'Plant B (Gary)', activeMWh: 512, baselineMWh: 490, efficiency: 86 },
  { plant: 'Plant C (Milwaukee)', activeMWh: 182, baselineMWh: 195, efficiency: 92 },
  { plant: 'Plant D (Peoria)', activeMWh: 110, baselineMWh: 115, efficiency: 95 },
];

export const EnergyAnalyticsIndustrial = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Industrial Energy Analytics</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Comparative multi-plant benchmarking, load factor analysis, and peak demand intensity.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Consolidated Load Factor"
          value="78.4%"
          subtitle="Continuous thermal and motor load"
          trend={2.1}
          trendLabel="operating efficiency"
          isNegativeGood={false}
          icon={Activity}
          isDemo
        />
        <StatCard
          title="Peak Active Power Demand"
          value="4.2 MW"
          subtitle="Observed across transmission ties"
          trend={-3.4}
          trendLabel="shaving progress"
          icon={Zap}
          isDemo
        />
        <StatCard
          title="Specific Energy Consumption"
          value="184 kWh / ton"
          subtitle="Per unit output product"
          trend={-5.8}
          trendLabel="intensity drop"
          icon={TrendingDown}
          isDemo
        />
      </div>

      <ChartWrapper
        title="Facility Energy Benchmark (Current MWh vs Baseline)"
        subtitle="Cross-plant performance comparison"
        height={340}
        isDemo
      >
        <BarChart data={PLANT_COMPARISON} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E0D3" />
          <XAxis dataKey="plant" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
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
          <Bar dataKey="activeMWh" name="Current Cycle MWh" fill="#151713" radius={[4, 4, 0, 0]} />
          <Bar dataKey="baselineMWh" name="Historical Engineering Baseline" fill="#2457F5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartWrapper>
    </div>
  );
};

export default EnergyAnalyticsIndustrial;

