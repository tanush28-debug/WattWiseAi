import React from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ShieldCheck, CheckCircle2, Users, ArrowUpRight } from 'lucide-react';

const PROGRAMS = [
  {
    id: 'prog-1',
    title: 'National Smart Building Efficiency Mandate',
    budget: '₹370 Cr',
    targetReduction: '12 TWh over 3 Years',
    status: 'Active Enactment',
    participants: '1,420 Commercial Facilities'
  },
  {
    id: 'prog-2',
    title: 'Agricultural Solar Feeder Solarization Initiative (PM-KUSUM)',
    budget: '₹650 Cr',
    targetReduction: '6 TWh Agricultural Grid Relief',
    status: 'In Rollout',
    participants: '38,000 Farmlands'
  },
  {
    id: 'prog-3',
    title: 'Consumer Peak-Shaving Voluntary Incentive',
    budget: '₹165 Cr',
    targetReduction: '4 TWh Peaker Avoidance',
    status: 'Active Enactment',
    participants: '240,000 Households'
  }
];

export const ConservationPrograms = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Conservation Programs & Subsidies</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Government-funded demand-side management (DSM) initiatives and public energy conservation incentive programs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PROGRAMS.map((p) => (
          <div
            key={p.id}
            className="p-6 rounded-3xl border border-ivory-300 bg-white shadow-subtle hover:border-ivory-400 transition-all flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cobalt-500/15 text-cobalt-900 border border-cobalt-500/20">
                {p.status}
              </span>
              <h4 className="text-base font-bold text-midnight-900 mt-3">{p.title}</h4>
              <p className="text-xs text-midnight-600 font-mono mt-1">Authorized Budget: {p.budget}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-ivory-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-midnight-500">Target Abatement:</span>
                <span className="font-mono font-bold text-emerald-700">{p.targetReduction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-midnight-500">Active Participants:</span>
                <span className="font-mono font-semibold text-midnight-900">{p.participants}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConservationPrograms;

