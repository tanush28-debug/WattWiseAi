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
import { Cpu, Plus, Info, Clock, Zap } from 'lucide-react';

export const MachineConsumption = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Machining');
  const [facility, setFacility] = useState('Plant A');
  const [powerRatingKW, setPowerRatingKW] = useState('50');
  const [operatingHoursPerDay, setOperatingHoursPerDay] = useState('16');
  const [reportingPeriod, setReportingPeriod] = useState('Monthly');

  const toast = useToast();

  const fetchMachines = async () => {
    try {
      const res = await industrialService.getMachines();
      setMachines(res.data);
    } catch (err) {
      toast.error('Unable to fetch machine entries');
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

    setIsSubmitting(true);
    try {
      const res = await industrialService.addMachineEntry({
        name,
        category,
        facility,
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
      toast.error('Failed to log machine consumption');
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

      <Card title="Machinery Energy Consumption Register" subtitle="Configured production equipment and periodic loads">
        <DataTable columns={columns} data={machines} isLoading={loading} />
      </Card>

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
            <Input
              label="Assigned Plant"
              value={facility}
              onChange={(e) => setFacility(e.target.value)}
              placeholder="e.g. Plant A"
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

