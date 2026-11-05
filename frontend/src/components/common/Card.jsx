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
    <div className={`relative bg-white rounded-2xl border border-ivory-300 shadow-subtle overflow-hidden flex flex-col ${className}`}>
      {isDemo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="badge-demo">DEMO DATA</span>
        </div>
      )}

      {(title || subtitle || action) && (
        <div className={`px-6 py-4 border-b border-ivory-200 flex items-center justify-between ${headerClassName}`}>
          <div>
            {title && <h3 className="text-sm font-bold text-midnight-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-midnight-600 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className={`p-6 flex-1 ${bodyClassName}`}>{children}</div>

      {footer && (
        <div className={`px-6 py-3.5 bg-ivory-50/70 border-t border-ivory-200 ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

