import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import { DEMO_REWARDS_DATA } from '../../services/mockData';
import { Award, Sparkles, CheckCircle2, ShieldCheck, Flame, Info } from 'lucide-react';

export const Rewards = () => {
  const [rewards, setRewards] = useState(DEMO_REWARDS_DATA);
  const toast = useToast();

  const handleJoinChallenge = (challengeId) => {
    toast.success('Challenge joined! Track your peak hours to earn points.');
  };

  const progressPercent = Math.min(
    100,
    Math.round((rewards.currentPoints / rewards.nextLevelPoints) * 100)
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Conservation Rewards & Recognition</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Earn recognition points and badges by participating in community energy shaving challenges.
        </p>
      </div>

      {/* Rewards Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-ivory-200/80 border border-ivory-300 flex items-start gap-3 text-xs text-midnight-800">
        <Info className="w-4 h-4 text-cobalt-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Sustainability Reward Program:</p>
          <p className="text-midnight-600 mt-0.5 text-[11px]">
            Points and tiers represent gamified environmental achievement metrics within the WattWise community and do not constitute direct cash redemption.
          </p>
        </div>
      </div>

      {/* Top Level & Points Banner */}
      <div className="bg-midnight-900 text-ivory-100 rounded-3xl p-6 sm:p-8 border border-midnight-700 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-cobalt-400 font-bold">
              Current Tier Status
            </span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-ivory-100 tracking-tight">
            {rewards.level}
          </h3>
          <p className="text-xs text-midnight-400">
            You are {rewards.nextLevelPoints - rewards.currentPoints} points away from unlocking Eco-Champion Tier III status.
          </p>
        </div>

        <div className="md:w-72 bg-midnight-850 p-5 rounded-2xl border border-midnight-800 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-midnight-400">Lifetime Points</span>
            <span className="font-mono font-bold text-cobalt-400 text-base">{rewards.currentPoints} pts</span>
          </div>
          <div className="w-full bg-midnight-700 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-cobalt-500 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[10px] font-mono text-midnight-400 text-right">
            {progressPercent}% towards next milestone
          </p>
        </div>
      </div>

      {/* Active Conservation Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card
            title="Available Conservation Challenges"
            subtitle="Complete tasks during high grid demand to earn achievement points"
          >
            <div className="space-y-4">
              {rewards.activeChallenges.map((ch) => (
                <div
                  key={ch.id}
                  className="p-4 rounded-2xl border border-ivory-200 bg-white hover:bg-ivory-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cobalt-500/15 text-cobalt-900 border border-cobalt-500/20">
                        {ch.category}
                      </span>
                      {ch.completed && (
                        <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-midnight-900 mt-1">{ch.title}</h4>
                    <p className="text-[11px] text-midnight-600 max-w-md">{ch.description}</p>
                    <div className="pt-2 flex items-center gap-2 text-xs font-mono text-midnight-500">
                      <span>Progress:</span>
                      <span className="font-bold text-midnight-900">
                        {ch.progress} / {ch.total}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col items-end gap-2 shrink-0">
                    <span className="font-mono text-xs font-bold text-cobalt-700 bg-cobalt-500/10 px-2 py-1 rounded">
                      +{ch.pointsReward} pts
                    </span>
                    {!ch.completed && (
                      <Button variant="outline" size="sm" onClick={() => handleJoinChallenge(ch.id)}>
                        Participate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Unlocked Badges */}
        <div className="lg:col-span-4">
          <Card title="Unlocked Achievements" subtitle="Badges earned through verified efficiency">
            <div className="space-y-3.5">
              {rewards.badges.map((b) => (
                <div key={b.id} className="p-3 rounded-xl border border-ivory-200 bg-ivory-50/50 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cobalt-500 text-white flex items-center justify-center shrink-0 shadow-cobalt-sm">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-midnight-900">{b.name}</h5>
                    <p className="text-[11px] text-midnight-600 leading-snug mt-0.5">{b.description}</p>
                    <span className="inline-block font-mono text-[9px] text-midnight-500 mt-1">
                      Unlocked {b.dateUnlocked}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Rewards;

