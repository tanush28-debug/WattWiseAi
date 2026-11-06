import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { industrialService } from '../../services/industrialService';
import { formatKWh } from '../../utils/formatters';
import { Cpu, Plus, Info, Clock, Zap, Database } from 'lucide-react';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MachineConsumption = () => {
  const [machines, setMachines] = useState([]);
  const [overview, setOverview] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Machining');
  const [facilityId, setFacilityId] = useState('');
  const [powerRatingKW, setPowerRatingKW] = useState('50');
  const [operatingHoursPerDay, setOperatingHoursPerDay] = useState('16');
  const [reportingPeriod, setReportingPeriod] = useState('Monthly');

  const toast = useToast();

  const fetchMachines = async () => {
    try {
      const [machinesRes, overviewRes] = await Promise.all([
        industrialService.getMachines(),
        industrialService.getOverview(),
      ]);
      setMachines(machinesRes.data || []);
      setOverview(overviewRes.data);

      const registeredFacilities = (overviewRes.data?.isBenchmark
        ? []
        : overviewRes.data?.facilities || []
      ).filter((facility) => UUID_RE.test(String(facility.id)));

      setFacilities(registeredFacilities);
      setFacilityId((current) => current || registeredFacilities[0]?.id || '');
    } catch (err) {
      toast.error(err.message || 'Unable to fetch machine entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleAddMachine = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please provide a machine name');
      return;
    }

    if (!facilityId) {
      toast.error('Select a registered facility before saving equipment');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await industrialService.addMachineEntry({
        facilityId,
        name,
        category,
        powerRatingKW,
        operatingHoursPerDay,
        reportingPeriod
      });

      if (res.success) {
        toast.success(`Registered machine: ${name}`);
        setIsModalOpen(false);
        setName('');
        fetchMachines();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save machine record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Machine & Classification',
      key: 'name',
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-ivory-100 border border-ivory-200 flex items-center justify-center text-midnight-800 shrink-0">
            <Cpu className="w-4 h-4 text-cobalt-600" />
          </div>
          <div>
            <p className="font-bold text-midnight-900">{val}</p>
            <p className="text-[10px] text-midnight-500 font-mono">
              {row.category} • {row.facility}
            </p>
          </div>
        </div>
      )
    },
    {
      header: 'Power Rating (kW)',
      key: 'powerRatingKW',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{val} kW</span>
    },
    {
      header: 'Duty Hours / Day',
      key: 'operatingHoursPerDay',
      render: (val) => (
        <span className="font-mono text-xs text-midnight-700 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-midnight-500" /> {val} hrs/day
        </span>
      )
    },
    {
      header: 'Calculated Draw (kWh)',
      key: 'estimatedKWh',
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-midnight-950">{formatKWh(val)}</span>
          <span className="block text-[9px] font-mono text-midnight-500">
            {row.reportingPeriod} cycle
          </span>
        </div>
      )
    },
    {
      header: 'Data Mode',
      key: 'isUserEstimate',
      render: (val) => (
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-cobalt-500/15 text-cobalt-900 border border-cobalt-500/25">
          {val ? 'SOFTWARE ESTIMATE' : 'ENGINEERING MODEL'}
        </span>
      )
    }
  ];

  const isBenchmark = overview?.isBenchmark;
  const formatMW = (value) =>
    value === null || value === undefined
      ? '—'
      : new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value);

  const unitColumns = [
    { header: 'Plant', key: 'name' },
    { header: 'Fuel', key: 'fuel' },
    {
      header: 'Generating Units',
      key: 'activeMachines',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{val ?? 0}</span>
    },
    {
      header: 'Installed Capacity',
      key: 'capacityMW',
      render: (val) => <span className="font-mono">{formatMW(val)} MW</span>
    },
    {
      header: 'Avg MW / Unit',
      key: 'avgMW',
      render: (val) => <span className="font-mono">{formatMW(val)} MW</span>
    }
  ];

  const benchmarkUnits = (overview?.facilities || [])
    .filter((facility) => facility.activeMachines > 0)
    .sort((a, b) => (b.capacityMW || 0) - (a.capacityMW || 0))
    .map((facility) => ({
      id: facility.id,
      name: facility.name,
      fuel: facility.fuel,
      activeMachines: facility.activeMachines,
      capacityMW: facility.capacityMW,
      avgMW:
        facility.capacityMW && facility.activeMachines
          ? facility.capacityMW / facility.activeMachines
          : null
    }));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Machine Consumption Registry</h2>
          <p className="text-xs text-midnight-600 mt-0.5">
            Software-modeled machinery power calculations. Track heavy industrial loads without IoT sensor attachment.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          leftIcon={Plus}
          disabled={facilities.length === 0}
          title={
            facilities.length === 0
              ? 'Register a facility in your organization before adding equipment'
              : undefined
          }
        >
          Add Machine Entry
        </Button>
      </div>

      {/* Software Architecture Disclaimer */}
      <div className="p-4 rounded-2xl bg-ivory-200/80 border border-ivory-300 flex items-start gap-3 text-xs text-midnight-800">
        <Info className="w-4 h-4 text-cobalt-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Zero IoT Hardware Architecture:</p>
          <p className="text-midnight-600 mt-0.5 text-[11px]">
            WattWise calculates machine consumption through mathematical run-hour schedules and nameplate kilowatt ratings. Hardware telemetry devices and current clamps are completely optional.
          </p>
        </div>
      </div>

      {isBenchmark && (
        <div className="rounded-xl border border-cobalt-200 bg-cobalt-50/60 p-4 flex items-start gap-3">
          <Database className="w-4 h-4 text-cobalt-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-midnight-900">
              CEA/NPP benchmark · generating units only
            </p>
            <p className="text-[11px] text-midnight-600 leading-relaxed">
              The public dataset reports plant capacity and unit counts, not machine-level power draw or duty
              hours. Add your own equipment below to calculate consumption from nameplate ratings.
            </p>
          </div>
        </div>
      )}

      {!isBenchmark && !loading && facilities.length === 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-xs font-bold text-midnight-900">No registered facility available</p>
            <p className="text-[11px] text-midnight-700 leading-relaxed">
              Equipment must be linked to a facility in your organization. Register a facility first,
              then return here to add machine duty cycles.
            </p>
          </div>
        </div>
      )}

      <Card title="Machinery Energy Consumption Register" subtitle="Configured production equipment and periodic loads">
        <DataTable
          columns={columns}
          data={machines}
          isLoading={loading}
          emptyMessage={
            isBenchmark
              ? 'No machine records yet. Add your own equipment to calculate consumption; the benchmark below lists state generating units.'
              : 'No machine records yet. Add equipment to calculate consumption from power rating and duty hours.'
          }
        />
      </Card>

      {isBenchmark && (
        <Card
          title="Karnataka Generating Units (CEA/NPP Benchmark)"
          subtitle="Installed capacity and unit counts by plant · FY 2023-24"
        >
          <DataTable columns={unitColumns} data={benchmarkUnits} isLoading={loading} />
        </Card>
      )}

      {/* Modal: Add Machine */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Machinery Duty Cycle"
        subtitle="Compute energy consumption from operating hours and nameplate power"
      >
        <form onSubmit={handleAddMachine} className="space-y-4">
          <Input
            label="Machine Name / Asset Identifier"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. 5-Axis CNC Milling Center #2"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Equipment Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={['Machining', 'Thermal', 'HVAC & Cooling', 'Pneumatics', 'Material Handling', 'Other']}
            />
            <Select
              label="Assigned Facility"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              options={facilities.map((registered) => ({
                value: registered.id,
                label: registered.name
              }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nameplate Power (kW)"
              type="number"
              value={powerRatingKW}
              onChange={(e) => setPowerRatingKW(e.target.value)}
              helperText="Kilowatt electrical rating"
              required
            />
            <Input
              label="Operating Hours / Day"
              type="number"
              min="0"
              max="24"
              value={operatingHoursPerDay}
              onChange={(e) => setOperatingHoursPerDay(e.target.value)}
              helperText="Average duty cycle"
              required
            />
          </div>

          <Select
            label="Reporting Interval"
            value={reportingPeriod}
            onChange={(e) => setReportingPeriod(e.target.value)}
            options={['Monthly', 'Weekly', 'Daily']}
          />

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Machine Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MachineConsumption;

