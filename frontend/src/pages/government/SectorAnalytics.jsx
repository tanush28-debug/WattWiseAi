import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { governmentService } from '../../services/governmentService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Factory, Home, Building2, Wheat } from 'lucide-react';

export const SectorAnalytics = () => {
  const [sectors, setSectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const res = await governmentService.getSectorAnalytics();
        setSectors(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchSectors();
  }, []);

  const COLORS = ['#2457F5', '#151713', '#3F4857', '#64748B'];

  const columns = [
    {
      header: 'Economic Sector',
      key: 'name',
      render: (val) => <span className="font-bold text-midnight-900">{val}</span>
    },
    {
      header: 'National Share (%)',
      key: 'sharePercent',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{val}%</span>
    },
    {
      header: 'Total Consumption (TWh)',
      key: 'twh',
      render: (val) => <span className="font-mono font-semibold text-midnight-950">{val} TWh</span>
    },
    {
      header: 'Carbon Footprint (MT CO₂e)',
      key: 'emissionsMT',
      render: (val) => <span className="font-mono font-semibold text-rose-800">{val} MT</span>
    },
    {
      header: 'YoY Growth Rate',
      key: 'growthRate',
      render: (val) => (
        <span
          className={`font-mono font-bold text-xs ${
            val.startsWith('+') ? 'text-amber-700' : 'text-emerald-700'
          }`}
        >
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Sector-wise Consumption & Emissions</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Macro decomposition of national electricity demand across Industrial, Commercial, Residential, and Agricultural categories.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card title="Sector Breakdown Register" subtitle="Comparative analysis of demand and greenhouse footprint">
            <DataTable columns={columns} data={sectors} isLoading={loading} />
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card title="Consumption Share Distribution" subtitle="Percentage share of national TWh load">
            <div className="h-60 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectors}
                    dataKey="sharePercent"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {sectors.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#151713',
                      borderColor: '#2457F5',
                      borderRadius: '12px',
                      color: '#F4F0E6',
                      fontSize: '11px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                    }}
                    itemStyle={{ color: '#F4F0E6' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4 text-xs">
              {sectors.map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-midnight-800 truncate max-w-[160px]">{s.name}</span>
                  </div>
                  <span className="font-mono font-bold text-midnight-900">{s.sharePercent}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SectorAnalytics;

