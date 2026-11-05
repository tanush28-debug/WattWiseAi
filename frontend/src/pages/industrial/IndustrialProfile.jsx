import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Building2, Mail, Shield, User } from 'lucide-react';

export const IndustrialProfile = () => {
  const { user, role } = useAuth();
  const toast = useToast();

  const [companyName, setCompanyName] = useState('Apex Industrial Manufacturing Corp');
  const [operatorName, setOperatorName] = useState(user?.fullName || 'Marcus Vance');
  const [email] = useState(user?.email || 'marcus.vance@apexindustrial.com');

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Industrial facility preferences saved.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Facility Administrator Profile</h2>
        <p className="text-xs text-midnight-600 mt-0.5">
          Enterprise account details, designated industrial plants, and security settings.
        </p>
      </div>

      <Card title="Industrial Entity Identity" subtitle="Authorized engineering signatory">
        <form onSubmit={handleSave} className="space-y-4 max-w-lg">
          <Input
            label="Enterprise Corporation"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            leftIcon={Building2}
          />
          <Input
            label="Plant Operations Director"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            leftIcon={User}
          />
          <Input
            label="Corporate Email"
            value={email}
            disabled
            leftIcon={Mail}
          />

          <Button type="submit" variant="primary" size="sm" className="mt-2">
            Save Profile
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default IndustrialProfile;

