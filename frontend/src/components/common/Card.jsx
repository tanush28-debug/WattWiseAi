import React from 'react';

export const Card = ({
  children,
  className = '',
  title,
  subtitle,
  action,
  headerClassName = '',
  bodyClassName = '',
  footer,
  footerClassName = '',
  isDemo = false
}) => {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-md border border-slate-200 bg-white ${className}`}
    >
      {isDemo && (
        <div className="absolute right-3 top-3 z-10">
          <span className="badge-demo">DEMO DATA</span>
        </div>
      )}

      {(title || subtitle || action) && (
        <div
          className={`flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-3.5 ${headerClassName}`}
        >
          <div className="min-w-0">
            {title && (
              <h3 className="truncate text-sm font-semibold tracking-tight text-slate-900">
                {title}
              </h3>
            )}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div className={`flex-1 p-5 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className={`border-t border-slate-200 bg-slate-50 px-5 py-3 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
