import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Input } from '../../components/common/Input';
import { DataTable } from '../../components/common/DataTable';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { governmentService } from '../../services/governmentService';
import { DollarSign, Plus, Edit2, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const TariffManagement = () => {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ratePerKWh, setRatePerKWh] = useState('0.14');
  const [tierLimitKWh, setTierLimitKWh] = useState('250');

  const toast = useToast();

  const fetchPolicies = async () => {
    try {
      const res = await governmentService.getTariffPolicies();
      setPolicies(res.data);
    } catch (err) {
      toast.error('Unable to fetch tariff regimes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleOpenEdit = (policy) => {
    setEditingPolicy(policy);
    setCode(policy.code);
    setName(policy.name);
    setRatePerKWh(policy.ratePerKWh?.toString() || '0.14');
    setTierLimitKWh(policy.tierLimitKWh?.toString() || '200');
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setEditingPolicy(null);
    setCode(`T-REG-${Date.now().toString().slice(-4)}`);
    setName('');
    setRatePerKWh('0.15');
    setTierLimitKWh('300');
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tariff regime title is required');
      return;
    }
    // Open confirmation dialog for regulatory rate updates
    setPendingConfirm({
      id: editingPolicy?.id,
      code,
      name,
      ratePerKWh: parseFloat(ratePerKWh),
      tierLimitKWh: parseInt(tierLimitKWh, 10)
    });
  };

  const handleConfirmSave = async () => {
    if (!pendingConfirm) return;
    setIsSaving(true);
    try {
      await governmentService.saveTariffPolicy(pendingConfirm);
      toast.success(`Tariff policy ${pendingConfirm.code} successfully enacted.`);
      setIsModalOpen(false);
      setPendingConfirm(null);
      fetchPolicies();
    } catch (err) {
      toast.error('Failed to update tariff schedule');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      header: 'Tariff Code',
      key: 'code',
      render: (val) => <span className="font-mono font-bold text-midnight-900">{val}</span>
    },
    {
      header: 'Policy Title',
      key: 'name',
      render: (val) => <span className="font-bold text-midnight-900">{val}</span>
    },
    {
      header: 'Regulated Base Rate',
      key: 'ratePerKWh',
      render: (val) => (
        <span className="font-mono font-bold text-midnight-900">
          {val ? `₹${val} / kWh` : 'Variable ToD'}
        </span>
      )
    },
    {
      header: 'Threshold Limit',
      key: 'tierLimitKWh',
      render: (val) => <span className="font-mono text-midnight-700">{val ? `${val} kWh` : 'Uncapped'}</span>
    },
    {
      header: 'Regulatory Status',
      key: 'status',
      render: (val) => (
        <span
          className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded ${
            val === 'Active'
              ? 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
          }`}
        >
          {val}
        </span>
      )
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (_, row) => (
        <Button variant="outline" size="sm" onClick={() => handleOpenEdit(row)} leftIcon={Edit2}>
          Edit Rate
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Tariff Management & Enactment</h2>
          <p className="text-xs text-midnight-600 mt-0.5">
            Configure statutory electricity tariffs, subsidization tiers, and peak pricing brackets for regulated utilities.
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={Plus}>
          Enact New Tariff Regime
        </Button>
      </div>

      <Card title="Statutory Utility Tariff Regimes" subtitle="Active tariffs enforceable across public utilities">
        <DataTable columns={columns} data={policies} isLoading={loading} />
      </Card>

      {/* Edit / Enact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPolicy ? `Configure Tariff: ${editingPolicy.code}` : 'Enact New Tariff Schedule'}
        subtitle="Changes are recorded in the central legislative policy register"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Tariff Administrative Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={!!editingPolicy}
            required
          />
          <Input
            label="Tariff Name / Description"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Clean Energy Transition Tariff"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Base Rate (₹ / kWh)"
              type="number"
              step="0.01"
              value={ratePerKWh}
              onChange={(e) => setRatePerKWh(e.target.value)}
              required
            />
            <Input
              label="Tier Cutoff (kWh)"
              type="number"
              value={tierLimitKWh}
              onChange={(e) => setTierLimitKWh(e.target.value)}
              required
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Review & Enact
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Tariff Modification */}
      <ConfirmDialog
        isOpen={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirmSave}
        title="Enact Statutory Tariff Amendment?"
        description={`You are about to publish a legal rate adjustment for "${pendingConfirm?.name}". This change immediately recalibrates all downstream utility bill calculations.`}
        confirmLabel="Enact Amendment"
        isLoading={isSaving}
      />
    </div>
  );
};

export default TariffManagement;

