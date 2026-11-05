import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({
  label,
  options = [],
  value,
  onChange,
  id,
  name,
  error,
  disabled = false,
  required = false,
  className = '',
  surface = 'light',
  ...props
}) => {
  const selectId = id || name || Math.random().toString(36).substring(2, 9);

  const surfaceStyles = surface === 'dark'
    ? 'bg-midnight-850 border-midnight-700 text-ivory-100 focus:border-cobalt-500 focus:ring-cobalt-500/20'
    : 'bg-white border-ivory-300 text-midnight-900 focus:border-cobalt-500 focus:ring-cobalt-500/10';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`text-xs font-semibold tracking-wide ${
            surface === 'dark' ? 'text-ivory-300' : 'text-midnight-800'
          }`}
        >
          {label} {required && <span className="text-cobalt-600">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none rounded-xl border px-3.5 py-2.5 pr-10 text-sm transition-all duration-150 outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
            error ? 'border-rose-500' : ''
          } ${surfaceStyles}`}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value ?? opt.id ?? opt}
              value={opt.value ?? opt.id ?? opt}
              className={surface === 'dark' ? 'bg-midnight-900 text-ivory-100' : 'bg-white text-midnight-900'}
            >
              {opt.label ?? opt.name ?? opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3.5 text-midnight-500">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export default Select;
