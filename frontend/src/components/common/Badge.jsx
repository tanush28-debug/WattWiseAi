import React from 'react';

export const Badge = ({
  children,
  variant = 'neutral', // 'cobalt' | 'emerald' | 'amber' | 'rose' | 'neutral' | 'dark'
  size = 'sm', // 'xs' | 'sm'
  className = ''
}) => {
  const base = 'inline-flex items-center font-mono font-medium rounded-full tracking-wide';

  const sizes = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-0.5 text-xs'
  };

  const variants = {
    cobalt: 'bg-cobalt-500/15 text-cobalt-700 border border-cobalt-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-800 border border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-800 border border-rose-500/30',
    neutral: 'bg-ivory-200 text-midnight-700 border border-ivory-300',
    dark: 'bg-midnight-900 text-ivory-100 border border-midnight-700'
  };

  return (
    <span className={`${base} ${sizes[size]} ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
