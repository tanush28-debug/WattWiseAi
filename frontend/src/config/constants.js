/**
 * Application Constants — India / INR Edition
 */

export const USER_ROLES = {
  CONSUMER: 'CONSUMER',
  INDUSTRIAL: 'INDUSTRIAL',
  GOVERNMENT: 'GOVERNMENT'
};

export const ROLE_LABELS = {
  CONSUMER: 'Consumer / Household',
  INDUSTRIAL: 'Industrial Facility',
  GOVERNMENT: 'Government Administrator'
};

export const BILL_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  EXTRACTED: 'EXTRACTED',
  FAILED: 'FAILED'
};

export const TARIFF_CATEGORIES = [
  { id: 'residential-standard', name: 'Domestic LT-1 Standard (Flat Rate)', baseRate: 6.85, peakRate: 7.20, standingCharge: 120.00 },
  { id: 'residential-tou', name: 'Domestic Time-of-Day (Peak / Off-Peak ToD)', baseRate: 5.40, peakRate: 9.60, standingCharge: 140.00 },
  { id: 'commercial-standard', name: 'Commercial LT-2 Tier A', baseRate: 9.80, peakRate: 13.50, standingCharge: 380.00 },
  { id: 'industrial-high-voltage', name: 'Industrial HT-2a (>11kV / 33kV)', baseRate: 7.40, peakRate: 11.80, standingCharge: 2400.00 },
  { id: 'agricultural-subsidized', name: 'Agricultural Feeder Subsidized (KUSUM)', baseRate: 2.10, peakRate: 3.40, standingCharge: 60.00 }
];

// Role-specific imagery for distinct visual atmospheres
export const PORTAL_ASSETS = {
  CONSUMER: {
    title: 'Consumer Portal',
    badge: 'Household & Residential',
    description: 'Monitor your household electricity consumption, understand your bills, forecast energy usage, and discover ways to save money.',
    bgImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1400&q=85', // Rooftop solar panels on modern home
    fallbackGradient: 'from-blue-900/90 via-midnight-900/95 to-midnight-950',
    atmosphere: 'Clean, comfortable, modern, and environmentally conscious'
  },
  INDUSTRIAL: {
    title: 'Industrial Portal',
    badge: 'Factory & Enterprise',
    description: 'Monitor industrial energy consumption, analyze operational efficiency, identify unusual usage, and optimize energy costs.',
    bgImage: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=1400&q=85', // Modern industrial factory interior
    fallbackGradient: 'from-slate-900/90 via-midnight-900/95 to-midnight-950',
    atmosphere: 'Professional, technical, powerful, and enterprise-focused'
  },
  GOVERNMENT: {
    title: 'Government Administration',
    badge: 'State & Central Policy',
    description: 'Monitor regional energy trends, analyze sector-wise consumption, evaluate tariff scenarios, and support sustainable energy policies.',
    bgImage: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=85', // Urban smart-city skyline at dusk
    fallbackGradient: 'from-indigo-950/90 via-midnight-900/95 to-midnight-950',
    atmosphere: 'Trustworthy, authoritative, modern, and institutional'
  }
};
