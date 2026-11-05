import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-midnight-900 border border-midnight-700 p-2.5 rounded-xl text-ivory-100 text-xs">
        <p className="font-semibold text-cobalt-400">{data.name}</p>
        <p className="font-mono mt-0.5">
          {data.percentage}% ({data.kwh ? `${data.kwh} kWh` : data.value})
        </p>
      </div>
    );
  }
  return null;
};

export const CostBreakdownChart = ({ data = [] }) => {
  const COLORS = ['#2457F5', '#5E89FA', '#91B0FD', '#4D5445', '#151713'];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
      <div className="w-48 h-48 relative shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="percentage"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-semibold text-midnight-500 uppercase tracking-wider">Total</span>
          <span className="text-base font-extrabold text-midnight-900">100%</span>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col gap-2.5">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              />
              <span className="font-medium text-midnight-800 truncate">{item.name}</span>
            </div>
            <span className="font-mono font-semibold text-midnight-900 ml-2">
              {item.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostBreakdownChart;
