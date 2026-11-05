import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { ChartWrapper } from '../../components/charts/ChartWrapper';
import { DataTable } from '../../components/common/DataTable';
import { Select } from '../../components/common/Select';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { governmentService } from '../../services/governmentService';
import { MapPin, BarChart2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export const RegionalAnalytics = () => {
  const [filter, setFilter] = useState('ALL');
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRegional = async () => {
      setLoading(true);
      try {
        const res = await governmentService.getRegionalAnalytics(filter);
        setRegions(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchRegional();
  }, [filter]);

  const columns = [
    {
      header: 'Grid Zone / Region',
      key: 'region',
      render: (val) => (
        <span className="font-bold text-midnight-900 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-cobalt-600" /> {val}
        </span>
      )
    },
    {
      header: 'Total Consumption (GWh)',
      key: 'totalGWh',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{val} GWh</span>
    },
    {
      header: 'Per Capita (kWh)',
      key: 'perCapitaKWh',
      render: (val) => <span className="font-mono text-midnight-700">{val} kWh</span>
    },
    {
      header: 'Clean Energy %',
      key: 'renewableShare',
      render: (val) => <span className="font-mono font-semibold text-emerald-800">{val}%</span>
    },
    {
      header: 'Statutory Compliance',
      key: 'complianceRate',
      render: (val) => (
        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800">
          {val}%
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Regional Grid Analytics</h2>
          <p className="text-xs text-midnight-600 mt-0.5">
            Geographic transmission zones, per-capita energy usage, and renewable adoption rates.
          </p>
        </div>

        <div className="w-48">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Regions' },
              { value: 'Northern', label: 'Northern Zone' },
              { value: 'Western', label: 'Western Belt' },
              { value: 'Southern', label: 'Southern Corridor' },
              { value: 'Eastern', label: 'Eastern Zone' }
            ]}
          />
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-ivory-200/80 border border-ivory-300 flex items-start gap-3 text-xs text-midnight-800">
        <Info className="w-4 h-4 text-cobalt-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Regional Telemetry Notice:</p>
          <p className="text-midnight-600 mt-0.5 text-[11px]">
            Statistical aggregates represent simulated pilot transmission utility interconnects for demonstration purposes.
          </p>
        </div>
      </div>

      <ChartWrapper
        title="Regional Total Electrical Load (GWh)"
        subtitle="Comparative transmission load by region"
        height={320}
        isDemo
      >
        <BarChart data={regions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EAE4D5" />
          <XAxis dataKey="region" tickLine={false} axisLine={{ stroke: '#DDD5C1' }} tick={{ fill: '#626A59', fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: '#626A59', fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="totalGWh" name="Total Load (GWh)" fill="#151713" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartWrapper>

      <Card title="Regional Transmission Zone Details" subtitle="Detailed breakdown of active monitoring zones">
        <DataTable columns={columns} data={regions} isLoading={loading} />
      </Card>
    </div>
  );
};

export default RegionalAnalytics;

