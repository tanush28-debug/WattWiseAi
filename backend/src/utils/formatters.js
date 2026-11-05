/**
 * Backend Data Formatters
 */

export function formatCurrencyINR(amount) {
  const val = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

export function formatKWh(units) {
  const val = Number(units) || 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 1,
  }).format(val) + ' kWh';
}

export function formatMWh(units) {
  const val = Number(units) || 0;
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
  }).format(val) + ' MWh';
}

