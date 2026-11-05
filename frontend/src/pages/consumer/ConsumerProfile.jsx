import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, Shield, Bell, Key, LogOut } from 'lucide-react';

export const ConsumerProfile = () => {
  const { user, role, logout } = useAuth();
  const toast = useToast();

  const [fullName, setFullName] = useState(user?.fullName || 'Sarah Jenkins');
  const [email] = useState(user?.email || 'sarah.jenkins@wattwise.ai');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    toast.success('Profile preferences successfully updated.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Profile & Preferences</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Manage your account profile, utility linkage, and notification parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left User Identity Summary */}
        <div className="md:col-span-1 space-y-4">
          <Card className="text-center p-6">
            <div className="w-16 h-16 rounded-full bg-cobalt-500 text-white font-black text-2xl flex items-center justify-center mx-auto mb-3 shadow-cobalt-sm">
              {fullName.charAt(0)}
            </div>
            <h3 className="text-base font-bold text-midnight-900">{fullName}</h3>
            <p className="text-xs text-midnight-500 truncate">{email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ivory-200 text-midnight-800 text-[10px] font-mono font-semibold">
              <Shield className="w-3 h-3 text-cobalt-600" />
              <span>Verified {role}</span>
            </div>
          </Card>
        </div>

        {/* Right Form Settings */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Account Details" subtitle="Update basic contact identity">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                leftIcon={User}
              />
              <Input
                label="Email Address"
                value={email}
                disabled
                helperText="Account email cannot be modified directly"
                leftIcon={Mail}
              />

              <div className="pt-2">
                <Button type="submit" variant="primary" size="sm">
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>

          <Card title="Notification Preferences" subtitle="Configure automated alert threshold alerts">
            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="font-bold text-midnight-900">High Peak Consumption Alerts</p>
                  <p className="text-midnight-500 text-[11px]">Notify when estimated bill exceeds +15% of historical average</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 accent-cobalt-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-3 border-t border-ivory-200">
                <div>
                  <p className="font-bold text-midnight-900">Weekly Energy Efficiency Digest</p>
                  <p className="text-midnight-500 text-[11px]">Receive Monday morning summary of consumption trends</p>
                </div>
                <input
                  type="checkbox"
                  checked={weeklyDigest}
                  onChange={(e) => setWeeklyDigest(e.target.checked)}
                  className="w-4 h-4 accent-cobalt-600 rounded"
                />
              </label>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ConsumerProfile;

