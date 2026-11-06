import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  helperText,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  surface = 'light', // 'light' (on ivory) or 'dark' (on midnight)
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || name || Math.random().toString(36).substring(2, 9);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const surfaceStyles = surface === 'dark'
    ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-cobalt-500 focus:ring-cobalt-500/20'
    : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cobalt-500 focus:ring-cobalt-500/20';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className={`text-xs font-semibold tracking-wide ${
            surface === 'dark' ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {label} {required && <span className="text-cobalt-600 dark:text-cobalt-400">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 pointer-events-none text-midnight-500">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition-colors focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
            LeftIcon ? 'pl-10' : ''
          } ${isPassword || RightIcon ? 'pr-10' : ''} ${
            error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
          } ${surfaceStyles}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-midnight-500 hover:text-midnight-800 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {!isPassword && RightIcon && (
          <div className="absolute right-3.5 pointer-events-none text-midnight-500">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;
