import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const ForecastTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-midnight-900 border border-midnight-700 p-3 rounded-xl shadow-xl text-ivory-100 text-xs">
        <p className="font-bold border-b border-midnight-700 pb-1 mb-2 text-cobalt-400">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-midnight-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill }} />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-ivory-100">
              {entry.value !== null ? `${entry.value} kWh/day` : '—'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const ForecastChart = ({ data = [], width, height, ...rest }) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ width: width || '100%', height: height || 320 }}
        className="flex flex-col items-center justify-center p-6 text-center"
      >
        <div className="w-12 h-12 rounded-2xl bg-cobalt-50 text-cobalt-600 flex items-center justify-center mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm font-bold text-midnight-900">Awaiting Historical Baseline Calibration</p>
        <p className="text-xs text-midnight-500 max-w-sm mt-1">
          Predictive demand projections and 95% confidence intervals activate once at least 2 consecutive monthly bills have been verified.
        </p>
      </div>
    );
  }

  const chart = (
    <ComposedChart
      width={width}
      height={height}
      data={data}
      margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
      {...rest}
    >
      <defs>
        <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2457F5" stopOpacity={0.25} />
          <stop offset="95%" stopColor="#2457F5" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4D5" />
      <XAxis
        dataKey="day"
        tickLine={false}
        axisLine={{ stroke: '#DDD5C1' }}
        tick={{ fill: '#626A59', fontSize: 11 }}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        domain={[
          (dataMin) => Math.max(0, Math.floor(dataMin * 0.85)),
          (dataMax) => Math.ceil(dataMax * 1.15)
        ]}
        tick={{ fill: '#626A59', fontSize: 11 }}
        tickFormatter={(val) => `${val} kWh`}
      />
      <Tooltip content={<ForecastTooltip />} />
      <Legend
        verticalAlign="top"
        align="right"
        wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
      />
      {/* 95% Confidence Upper Band */}
      <Area
        type="monotone"
        dataKey="upperBand"
        name="95% Confidence Upper"
        stroke="#7BA4FD"
        strokeWidth={1}
        strokeDasharray="3 3"
        fill="url(#confidenceBand)"
        dot={false}
      />
      {/* 95% Confidence Lower Band Mask */}
      <Area
        type="monotone"
        dataKey="lowerBand"
        name="95% Confidence Lower"
        stroke="#7BA4FD"
        strokeWidth={1}
        strokeDasharray="3 3"
        fill="#FFFFFF"
        dot={false}
      />
      {/* Actual Data (if historical daily telemetry is recorded) */}
      <Line
        type="monotone"
        dataKey="actual"
        name="Actual History"
        stroke="#151713"
        strokeWidth={2.5}
        dot={{ r: 4, fill: '#151713' }}
        connectNulls={false}
      />
      {/* ML Prediction */}
      <Line
        type="monotone"
        dataKey="predicted"
        name="WattWise AI Forecast (kWh/day)"
        stroke="#2457F5"
        strokeWidth={3}
        dot={{ r: 4, fill: '#2457F5', stroke: '#FFFFFF', strokeWidth: 2 }}
        activeDot={{ r: 6, fill: '#2457F5', stroke: '#FFFFFF', strokeWidth: 2 }}
      />
    </ComposedChart>
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

export default ForecastChart;
