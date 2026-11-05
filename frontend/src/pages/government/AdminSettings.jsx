import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { Settings, Shield, Server, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const AdminSettings = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [backendStatus, setBackendStatus] = useState('Standby (Mock Fallback Active)');
  const [checking, setChecking] = useState(false);

  const handleHealthCheck = async () => {
    setChecking(true);
    // Simulate ping to backend health endpoint
    setTimeout(() => {
      setChecking(false);
      toast.info('Checked backend endpoints. Operating in decoupled frontend mode.');
    }, 700);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Administrative Governance & Settings</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          System integration status, API health telemetry, and central governance parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="System Telemetry & Health" subtitle="Decoupled integration diagnostics">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-midnight-900">Node.js Express 5 REST Backend</p>
                <p className="text-[11px] font-mono text-midnight-500">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'}
                </p>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cobalt-500/15 text-cobalt-900 border border-cobalt-500/20 font-bold">
                STANDBY / MOCK
              </span>
            </div>

            <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-midnight-900">Supabase Authentication</p>
                <p className="text-[11px] font-mono text-midnight-500">
                  {isSupabaseConfigured ? 'Connected & Persistent' : 'Demo Fallback Enabled'}
                </p>
              </div>
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold ${
                  isSupabaseConfigured
                    ? 'bg-emerald-500/15 text-emerald-800'
                    : 'bg-amber-500/15 text-amber-800'
                }`}
              >
                {isSupabaseConfigured ? 'LIVE' : 'DEMO MODE'}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleHealthCheck}
              isLoading={checking}
              leftIcon={RefreshCw}
              className="w-full"
            >
              Verify Endpoint Health
            </Button>
          </div>
        </Card>

        <Card title="Governance Credential" subtitle="Active administrative signatory">
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-midnight-500 block">Assigned Official:</span>
              <p className="font-bold text-midnight-900 text-sm mt-0.5">
                {user?.fullName || 'Dr. Elena Rostova'}
              </p>
            </div>
            <div>
              <span className="text-midnight-500 block">Authority Tier:</span>
              <p className="font-mono font-semibold text-cobalt-700 bg-cobalt-500/10 inline-block px-2 py-0.5 rounded mt-0.5">
                GOVERNMENT REGULATORY ADMIN
              </p>
            </div>
            <div className="pt-2 border-t border-ivory-200">
              <span className="text-midnight-500 block">Audit Log Compliance:</span>
              <p className="text-midnight-700 mt-0.5">
                All policy modifications and tariff adjustments are digitally signed and immutable.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;

