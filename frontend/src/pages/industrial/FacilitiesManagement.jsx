import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { industrialService } from '../../services/industrialService';
import { formatCurrency } from '../../utils/formatters';
import { Building2, Plus, MapPin, Cpu, CheckCircle2, Database, Info } from 'lucide-react';

const formatMWh = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value);
};

const isHealthyStatus = (status) => status === 'Optimal' || status === 'Operating';

export const FacilitiesManagement = () => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New facility form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [estimatedMonthlyMWh, setEstimatedMonthlyMWh] = useState('150');
  const [machineCount, setMachineCount] = useState('8');

  const toast = useToast();

  const fetchFacilities = async () => {
    try {
      const res = await industrialService.getFacilities();
      setFacilities(res.data);
    } catch (err) {
      toast.error('Unable to retrieve facilities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const handleAddFacility = async (e) => {
    e.preventDefault();
    if (!name.trim() || !location.trim()) {
      toast.error('Please specify facility name and geographic location');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await industrialService.addFacility({
        name,
        location,
        estimatedMonthlyMWh,
        machineCount
      });
      if (res.success) {
        toast.success(`Facility added: ${name}`);
        setIsAddModalOpen(false);
        setName('');
        setLocation('');
        fetchFacilities();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to register facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBenchmark = facilities[0]?.source === 'CEA_NPP_GENERATION';
  const benchmarkFiscalYear = facilities[0]?.sourceFiscalYear;

  const columns = [
    {
      header: 'Facility Name',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ivory-100 border border-ivory-200 flex items-center justify-center text-midnight-800 shrink-0">
            <Building2 className="w-4 h-4 text-cobalt-600" />
          </div>
          <div>
            <p className="font-bold text-midnight-900">{val}</p>
            <p className="text-[10px] text-midnight-500 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {row.location}
            </p>
          </div>
        </div>
      )
    },
    {
      header: isBenchmark ? 'Net Generation (MWh)' : 'Monthly MWh',
      key: 'consumptionMWh',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{formatMWh(val)} MWh</span>
    },
    isBenchmark
      ? {
          header: 'Fuel / Capacity',
          key: 'fuel',
          render: (val, row) => (
            <div>
              <p className="font-semibold text-midnight-900">{val || '—'}</p>
              <p className="text-[10px] text-midnight-500 font-mono">
                {row.capacityMW ? `${formatMWh(row.capacityMW)} MW` : 'Capacity unavailable'}
              </p>
            </div>
          )
        }
      : {
          header: 'Monthly Energy Cost',
          key: 'costINR',
          render: (val, row) => (
            <span className="font-mono font-semibold text-midnight-950">
              {val || row?.costUSD ? formatCurrency(val || row?.costUSD) : '—'}
            </span>
          )
        },
    {
      header: isBenchmark ? 'Generating Units' : 'Active Equipment',
      key: 'activeMachines',
      render: (val) => (
        <span className="font-mono text-xs text-midnight-700 flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5 text-midnight-500" /> {val ?? 0} units
        </span>
      )
    },
    {
      header: 'Operational Status',
      key: 'status',
      render: (val) => (
        <span
          className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
            isHealthyStatus(val)
              ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
          }`}
        >
          {val}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Industrial Facilities</h2>
          <p className="text-xs text-midnight-600 mt-0.5">
            {isBenchmark
              ? 'Karnataka power plant generation benchmark from CEA/NPP station-level data.'
              : 'Monitor and benchmark electrical power usage across enterprise manufacturing plants.'}
          </p>
        </div>
        {isBenchmark ? (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-midnight-600 bg-ivory-100 border border-ivory-200 px-2.5 py-1.5 rounded-lg">
            <Database className="w-3.5 h-3.5 text-cobalt-600" /> Benchmark dataset · read-only
          </span>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            leftIcon={Plus}
          >
            Register New Facility
          </Button>
        )}
      </div>

      {isBenchmark && (
        <div className="rounded-xl border border-cobalt-200 bg-cobalt-50/60 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-cobalt-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-midnight-900">
              Source: CEA / NPP station-wise generation data
              {benchmarkFiscalYear ? ` · FY ${benchmarkFiscalYear}` : ''}
            </p>
            <p className="text-[11px] text-midnight-600 leading-relaxed">
              These are Karnataka power plants, not your own factories. Values are net generation in MWh and
              plant CO₂ estimates. Register facilities and import your own bills or meter data to replace this
              benchmark view.
            </p>
          </div>
        </div>
      )}

      <Card
        title={isBenchmark ? 'Karnataka Generating Plants' : 'Registered Manufacturing Plants'}
        subtitle={
          isBenchmark
            ? 'Station-level generation, capacity, and operational status'
            : 'Consolidated facility list and telemetry status'
        }
      >
        <DataTable columns={columns} data={facilities} isLoading={loading} />
      </Card>

      {/* Add Facility Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Manufacturing Facility"
        subtitle="Add a new plant or operational facility to WattWise"
      >
        <form onSubmit={handleAddFacility} className="space-y-4">
          <Input
            label="Facility / Plant Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Delta Fabrication Facility"
            required
          />
          <Input
            label="Geographic Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Austin, TX"
            leftIcon={MapPin}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Estimated Monthly MWh"
              type="number"
              value={estimatedMonthlyMWh}
              onChange={(e) => setEstimatedMonthlyMWh(e.target.value)}
              required
            />
            <Input
              label="Connected Machinery"
              type="number"
              value={machineCount}
              onChange={(e) => setMachineCount(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Register Plant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FacilitiesManagement;

