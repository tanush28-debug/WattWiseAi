import React from 'react';
import { ResponsiveContainer } from 'recharts';

const isResponsiveContainer = (node) => {
  const type = node?.type;
  return (
    type === ResponsiveContainer ||
    type?.displayName === 'ResponsiveContainer' ||
    type?.name === 'ResponsiveContainer'
  );
};

export const ChartWrapper = ({
  title,
  subtitle,
  children,
  action,
  height = 300,
  className = '',
  isDemo = false
}) => {
  const childArray = React.Children.toArray(children);
  const chart =
    childArray.length === 1 && isResponsiveContainer(childArray[0]) ? (
      childArray[0]
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    );

  return (
    <div className={`flex flex-col rounded-md border border-slate-200 bg-white ${className}`}>
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-3.5 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </h3>
            {isDemo && <span className="badge-demo">DEMO MODEL</span>}
          </div>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      <div className="min-w-0 p-4" style={{ height }}>
        {chart}
      </div>
    </div>
  );
};

export default ChartWrapper;
