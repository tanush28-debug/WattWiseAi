import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend, // number: positive or negative percentage
  trendLabel = 'vs last period',
  isNegativeGood = true, // for energy/emissions, negative change is great
  isDemo = false,
  className = ''
}) => {
  const isTrendZero = trend === 0 || trend === null || trend === undefined;
  const isPositive = trend > 0;

  const isGood = isNegativeGood ? !isPositive : isPositive;

  return (
    <div
      className={`relative flex flex-col justify-between rounded-md border border-slate-200 bg-white p-5 ${className}`}
    >
      {isDemo && (
        <span className="absolute right-3 top-3 rounded-sm border border-amber-300 bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-800">
          DEMO
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-sm border border-slate-200 bg-slate-50 text-slate-700">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="my-3">
        <h4 className="font-mono text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
          {value}
        </h4>
        {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
      </div>

      {!isTrendZero && (
        <div className="flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
              isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? `+${trend}%` : `${trend}%`}
          </span>
          <span className="text-[11px] text-slate-500">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
