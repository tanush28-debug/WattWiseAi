import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';

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
  
  // Is this trend good?
  const isGood = isNegativeGood ? !isPositive : isPositive;

  return (
    <div className={`relative bg-white rounded-2xl border border-ivory-300 p-5 shadow-subtle hover:border-ivory-400 transition-all duration-200 flex flex-col justify-between ${className}`}>
      {isDemo && (
        <span className="absolute top-3 right-3 text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
          DEMO
        </span>
      )}

      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-midnight-600 uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-ivory-100 border border-ivory-200 flex items-center justify-center text-midnight-800">
            <Icon className="w-4 h-4 text-midnight-800" />
          </div>
        )}
      </div>

      <div className="my-2.5">
        <h4 className="text-2xl font-extrabold text-midnight-900 tracking-tight font-sans">{value}</h4>
        {subtitle && <p className="text-xs text-midnight-500 mt-0.5">{subtitle}</p>}
      </div>

      {!isTrendZero && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-mono text-[11px] ${
              isGood
                ? 'bg-emerald-500/10 text-emerald-700'
                : 'bg-rose-500/10 text-rose-700'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? `+${trend}%` : `${trend}%`}
          </span>
          <span className="text-midnight-500 text-[11px]">{trendLabel}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;

