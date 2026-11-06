import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine section title from pathname
  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes('/analytics')) return 'Energy Analytics';
    if (p.includes('/bills')) return 'Bill Management & OCR';
    if (p.includes('/forecast')) return 'AI Demand Forecasting';
    if (p.includes('/tariffs')) return 'Tariff Simulator & Comparison';
    if (p.includes('/carbon')) return 'Carbon Footprint & Emissions';
    if (p.includes('/advisor')) return 'AI Energy Advisor';
    if (p.includes('/rewards')) return 'Conservation Rewards & Badges';
    if (p.includes('/profile')) return 'Account Profile & Preferences';
    if (p.includes('/facilities')) return 'Industrial Facilities';
    if (p.includes('/machines')) return 'Machine Consumption Registry';
    if (p.includes('/anomalies')) return 'Anomaly Detection Engine';
    if (p.includes('/optimization')) return 'Operational Cost Optimization';
    if (p.includes('/regional')) return 'Regional Grid Analytics';
    if (p.includes('/sectors')) return 'Sector-wise Consumption';
    if (p.includes('/trends')) return 'Macro Energy Trends';
    if (p.includes('/policy-simulator')) return 'Policy & Tariff Simulator';
    if (p.includes('/conservation')) return 'Conservation Programs';
    if (p.includes('/reports')) return 'Intelligence Reports';
    if (p.includes('/admin')) return 'Administrative Governance';
    return 'Dashboard Overview';
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex">
      {/* Sidebar (Midnight Black) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Workspace (Soft Ivory) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
        <Navbar onOpenSidebar={() => setSidebarOpen(true)} pageTitle={getPageTitle()} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

