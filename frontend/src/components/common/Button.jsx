import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-xl active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-5 py-3 gap-2.5 font-semibold'
  };

  const variantStyles = {
    // Primary: Electric Cobalt Blue with White text
    primary: 'bg-cobalt-500 hover:bg-cobalt-600 text-white shadow-cobalt-sm focus:ring-cobalt-500 font-semibold',
    // Secondary: Midnight Black with Ivory text
    secondary: 'bg-midnight-900 hover:bg-midnight-800 text-ivory-100 border border-midnight-700/60 shadow-sm focus:ring-midnight-900',
    // Outline: Soft borders with hover contrast
    outline: 'border border-midnight-700/30 text-midnight-900 hover:bg-ivory-200/60 focus:ring-midnight-900',
    // Ghost: Transparent with subtle hover
    ghost: 'text-midnight-800 hover:bg-midnight-900/5 focus:ring-midnight-900',
    // Danger: Crimson Red for destructive actions
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus:ring-rose-500'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : LeftIcon ? (
        <LeftIcon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
};

export default Button;
