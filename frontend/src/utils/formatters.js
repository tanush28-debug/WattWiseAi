/**
 * Formatting utilities for WattWise AI (India / INR Edition)
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const inrCompactFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 1
});

export const formatCurrency = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '₹0.00';
  }

  const num = Number(value);

  // Compact representation for macro government / high industrial scale
  if (options.compact) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `₹${(num / 100000).toFixed(2)} Lakh`;
    }
  }

  return inrFormatter.format(num);
};

export const formatKWh = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0 kWh';
  return `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })} kWh`;
};

export const formatCO2 = (kg) => {
  if (kg === null || kg === undefined || isNaN(kg)) return '0 kg CO₂e';
  const val = Number(kg);
  if (val >= 1000) {
    return `${(val / 1000).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t CO₂e`;
  }
  return `${val.toLocaleString('en-IN', { maximumFractionDigits: 1 })} kg CO₂e`;
};

export const formatPercentage = (value, showSign = false) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  const val = Number(value);
  const sign = showSign && val > 0 ? '+' : '';
  return `${sign}${val.toFixed(1)}%`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const maskAccountNumber = (acc) => {
  if (!acc) return '•••• ••••';
  const str = String(acc).trim();
  if (str.length <= 4) return `•••• ${str}`;
  return `•••• •••• ${str.slice(-4)}`;
};
