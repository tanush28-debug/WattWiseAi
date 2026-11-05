import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { industrialService } from '../../services/industrialService';
import { AlertTriangle, ShieldCheck, CheckCircle2, Clock, Wrench, RefreshCw } from 'lucide-react';

export const AnomalyDetection = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await industrialService.getAnomalies();
      setAnomalies(res.data);
    } catch (err) {
      toast.error('Unable to retrieve anomaly feeds');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleAcknowledge = (id) => {
    toast.success(`Anomaly ${id} flagged as acknowledged for maintenance dispatch.`);
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Scanning equipment consumption anomalies..." />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Anomaly Detection Engine</h2>
          <p className="text-xs text-midnight-600 mt-0.5">
            Statistical deviation tracking identifying sudden equipment spikes, continuous standby leakage, and phase imbalances.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAnomalies} leftIcon={RefreshCw}>
          Scan Anomalies
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {anomalies.map((anom) => {
          const isHigh = anom.severity === 'HIGH';
          return (
            <div
              key={anom.id}
              className={`p-6 rounded-3xl border bg-white shadow-card flex flex-col md:flex-row items-start justify-between gap-6 ${
                isHigh ? 'border-rose-300 ring-1 ring-rose-200' : 'border-amber-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-6 h-6" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                        isHigh ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
                      }`}
                    >
                      {anom.severity} SEVERITY
                    </span>
                    <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {anom.deviation}
                    </span>
                    <span className="text-[11px] font-mono text-midnight-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {anom.detectedAt}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-midnight-900">{anom.equipment}</h3>
                  <p className="text-xs font-semibold text-midnight-700">{anom.facilityName}</p>
                  <p className="text-xs text-midnight-600 leading-relaxed max-w-2xl mt-2">
                    {anom.explanation}
                  </p>

                  <div className="mt-3 p-3 bg-ivory-100 rounded-xl border border-ivory-300 text-xs text-midnight-900 flex items-start gap-2">
                    <Wrench className="w-4 h-4 text-midnight-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Recommended Mitigation:</strong>{' '}
                      <span>{anom.recommendedAction}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 self-end md:self-center">
                <Button variant="secondary" size="sm" onClick={() => handleAcknowledge(anom.id)}>
                  Acknowledge Alert
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnomalyDetection;

