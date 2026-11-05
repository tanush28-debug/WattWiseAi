import React from 'react';
import { ResponsiveContainer } from 'recharts';

export const ChartWrapper = ({
  title,
  subtitle,
  children,
  action,
  height = 300,
  className = '',
  isDemo = false
}) => {
  return (
    <div className={`bg-white rounded-2xl border border-ivory-300 p-6 shadow-subtle ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-midnight-900 tracking-tight">{title}</h3>
            {isDemo && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 border border-amber-500/20">
                DEMO MODEL
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-midnight-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartWrapper;

