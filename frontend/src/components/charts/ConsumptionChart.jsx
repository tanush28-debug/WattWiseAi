import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-midnight-900 border border-midnight-700 p-3 rounded-xl shadow-xl text-ivory-100 text-xs">
        <p className="font-bold border-b border-midnight-700 pb-1 mb-2 text-cobalt-400">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-midnight-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-ivory-100">
              {entry.value} {entry.unit || 'kWh'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ConsumptionChart = ({ data = [], showBenchmark = true, width, height, ...rest }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ width: width || '100%', height: height || 320 }}
        className="flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-cobalt-50 text-cobalt-600 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-midnight-900">No Verified Consumption Trajectory Yet</p>
        <p className="text-xs text-midnight-500 max-w-sm mt-1">
          Upload and confirm your monthly electricity bills in Bill Management to generate your actual historical consumption curve.
        </p>
      </div>
    );
  }

  const chart = (
    <AreaChart
      width={width}
      height={height}
      data={data}
      margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
      {...rest}
    >
      <defs>
        <linearGradient id="consumptionGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2457F5" stopOpacity={0.35} />
          <stop offset="95%" stopColor="#2457F5" stopOpacity={0.0} />
        </linearGradient>
        <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#888C80" stopOpacity={0.15} />
          <stop offset="95%" stopColor="#888C80" stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4D5" />
      <XAxis
        dataKey="month"
        tickLine={false}
        axisLine={{ stroke: '#DDD5C1' }}
        tick={{ fill: '#626A59', fontSize: 11 }}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        domain={[0, (dataMax) => Math.ceil(dataMax * 1.15)]}
        tick={{ fill: '#626A59', fontSize: 11 }}
        tickFormatter={(val) => `${val} kWh`}
      />
      <Tooltip content={<CustomTooltip />} />
      <Legend
        verticalAlign="top"
        align="right"
        wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
      />
      <Area
        type="monotone"
        dataKey="consumption"
        name="Your Consumption"
        stroke="#2457F5"
        strokeWidth={2.5}
        dot={{ r: 4, fill: '#2457F5', stroke: '#FFFFFF', strokeWidth: 2 }}
        activeDot={{ r: 6, fill: '#2457F5', stroke: '#FFFFFF', strokeWidth: 2 }}
        fillOpacity={1}
        fill="url(#consumptionGradient)"
        unit="kWh"
      />
      {showBenchmark && (
        <Area
          type="monotone"
          dataKey="benchmark"
          name="Regional Baseline"
          stroke="#A0A597"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: '#A0A597', stroke: '#FFFFFF', strokeWidth: 1 }}
          fillOpacity={1}
          fill="url(#benchmarkGradient)"
          unit="kWh"
        />
      )}
    </AreaChart>
  );

  if (width && height) {
    return chart;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {chart}
    </ResponsiveContainer>
  );
};

export default ConsumptionChart;
