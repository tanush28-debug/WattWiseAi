/**
 * Navigation items for Consumer, Industrial, and Government dashboards
 */

export const CONSUMER_NAV_ITEMS = [
  { label: 'Overview', path: '/consumer', icon: 'LayoutDashboard' },
  { label: 'Energy Analytics', path: '/consumer/analytics', icon: 'BarChart3' },
  { label: 'Bill Management', path: '/consumer/bills', icon: 'Receipt' },
  { label: 'Demand Forecast', path: '/consumer/forecast', icon: 'TrendingUp' },
  { label: 'Tariff Simulator', path: '/consumer/tariffs', icon: 'Calculator' },
  { label: 'Carbon Footprint', path: '/consumer/carbon', icon: 'Leaf' },
  { label: 'AI Energy Advisor', path: '/consumer/advisor', icon: 'Sparkles', badge: 'AI' },
  { label: 'Rewards', path: '/consumer/rewards', icon: 'Award' },
  { label: 'Profile', path: '/consumer/profile', icon: 'User' },
];

export const INDUSTRIAL_NAV_ITEMS = [
  { label: 'Overview', path: '/industrial', icon: 'LayoutDashboard' },
  { label: 'Facilities', path: '/industrial/facilities', icon: 'Building2' },
  { label: 'Energy Analytics', path: '/industrial/analytics', icon: 'Activity' },
  { label: 'Machine Consumption', path: '/industrial/machines', icon: 'Cpu' },
  { label: 'Demand Forecast', path: '/industrial/forecast', icon: 'TrendingUp' },
  { label: 'Anomaly Detection', path: '/industrial/anomalies', icon: 'AlertTriangle', badge: 'Alerts' },
  { label: 'Cost Optimization', path: '/industrial/optimization', icon: 'LineChart' },
  { label: 'Carbon Emissions', path: '/industrial/carbon', icon: 'Leaf' },
  { label: 'Reports', path: '/industrial/reports', icon: 'FileText' },
  { label: 'Profile', path: '/industrial/profile', icon: 'User' },
];

export const GOVERNMENT_NAV_ITEMS = [
  { label: 'National Overview', path: '/government', icon: 'Globe' },
  { label: 'Regional Analytics', path: '/government/regional', icon: 'MapPin' },
  { label: 'Sector Analytics', path: '/government/sectors', icon: 'PieChart' },
  { label: 'Energy Trends', path: '/government/trends', icon: 'TrendingUp' },
  { label: 'Tariff Management', path: '/government/tariffs', icon: 'DollarSign' },
  { label: 'Policy Simulator', path: '/government/policy-simulator', icon: 'Sliders', badge: 'Sim' },
  { label: 'Carbon & Sustainability', path: '/government/carbon', icon: 'Leaf' },
  { label: 'Conservation Programs', path: '/government/conservation', icon: 'ShieldCheck' },
  { label: 'Reports', path: '/government/reports', icon: 'FileSpreadsheet' },
  { label: 'Administration', path: '/government/admin', icon: 'Settings' },
];

