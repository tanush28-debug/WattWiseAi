import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { USER_ROLES, ROLE_LABELS, PORTAL_ASSETS } from '../../config/constants';
import { ArrowRight, Mail, Lock, Shield, User, Building2, Home, AlertCircle, Info, Sparkles } from 'lucide-react';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const activeRole = roleParam === USER_ROLES.INDUSTRIAL
    ? USER_ROLES.INDUSTRIAL
    : roleParam === USER_ROLES.GOVERNMENT
    ? USER_ROLES.GOVERNMENT
    : USER_ROLES.CONSUMER;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Set default demo emails based on active portal
  useEffect(() => {
    if (activeRole === USER_ROLES.INDUSTRIAL) {
      setEmail('marcus.industrial@wattwise.ai');
    } else if (activeRole === USER_ROLES.GOVERNMENT) {
      setEmail('admin.gov@wattwise.ai');
    } else {
      setEmail('sarah.consumer@wattwise.ai');
    }
    setPassword('DemoPassword123!');
  }, [activeRole]);

  const redirectUserByRole = (userRole) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (userRole === USER_ROLES.INDUSTRIAL) {
      navigate('/industrial', { replace: true });
    } else if (userRole === USER_ROLES.GOVERNMENT) {
      navigate('/government', { replace: true });
    } else {
      navigate('/consumer', { replace: true });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login({ email, password });
      
      // Role-based portal authorization check
      if (result.user.role !== activeRole) {
        toast.warning(
          `Your verified profile is registered as ${result.user.role}. Redirecting to your authorized workspace.`
        );
      } else {
        toast.success(`Welcome to ${PORTAL_ASSETS[result.user.role]?.title}, ${result.user.fullName}!`);
      }

      // Display brief dashboard initialization skeleton transition (450ms)
      setIsInitializing(true);
      setTimeout(() => {
        redirectUserByRole(result.user.role);
      }, 450);
    } catch (err) {
      toast.error(err.message || 'Invalid credentials. Please verify your email and password.');
      setIsLoading(false);
    }
  };

  const roleMeta = {
    [USER_ROLES.CONSUMER]: {
      title: 'Consumer Portal Sign In',
      subtitle: 'Manage household billing, solar metrics, and AI energy savings',
      icon: Home
    },
    [USER_ROLES.INDUSTRIAL]: {
      title: 'Industrial Operations Sign In',
      subtitle: 'Monitor manufacturing plants, machine duty cycles, and peak load tariffs',
      icon: Building2
    },
    [USER_ROLES.GOVERNMENT]: {
      title: 'Government Administration Sign In',
      subtitle: 'Access state & national grid analytics, statutory tariffs, and policy tools',
      icon: Shield
    }
  };

  const currentMeta = roleMeta[activeRole];
  const Icon = currentMeta.icon;

  if (isInitializing) {
    return (
      <div className="bg-white p-8 sm:p-9 rounded-3xl border border-ivory-300 shadow-card animate-pulse space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cobalt-500/10 text-cobalt-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="h-4 w-44 bg-ivory-300 rounded mb-1.5" />
            <div className="h-3 w-56 bg-ivory-200 rounded" />
          </div>
        </div>

        {/* Shimmer Placeholder Grid */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-20 bg-ivory-100 rounded-2xl border border-ivory-200 p-3 space-y-2">
            <div className="h-2 w-16 bg-ivory-300 rounded" />
            <div className="h-5 w-24 bg-ivory-300 rounded" />
          </div>
          <div className="h-20 bg-ivory-100 rounded-2xl border border-ivory-200 p-3 space-y-2">
            <div className="h-2 w-16 bg-ivory-300 rounded" />
            <div className="h-5 w-24 bg-ivory-300 rounded" />
          </div>
        </div>

        {/* Skeleton Chart Bars */}
        <div className="h-24 bg-ivory-50 rounded-2xl border border-ivory-200 p-3 flex items-end gap-2">
          {[30, 55, 45, 75, 60, 85, 65, 40].map((h, i) => (
            <div key={i} className="flex-1 bg-ivory-200 rounded-t" style={{ height: `${h}%` }} />
          ))}
        </div>

        <p className="text-[11px] font-mono text-center text-midnight-500">
          Loading {currentMeta.title}... Preparing real-time metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 sm:p-9 rounded-3xl border border-ivory-300 shadow-card">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-xl bg-cobalt-500 text-white flex items-center justify-center font-bold shadow-cobalt-sm">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt-600 bg-cobalt-500/10 px-2.5 py-0.5 rounded-full border border-cobalt-500/20">
            {activeRole}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-midnight-900 tracking-tight">
          {currentMeta.title}
        </h2>
        <p className="text-xs text-midnight-600 mt-1 leading-relaxed">
          {currentMeta.subtitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={Mail}
          disabled={isLoading}
          required
        />

        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            leftIcon={Lock}
            disabled={isLoading}
            required
          />
          <div className="flex justify-end mt-1.5">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-cobalt-600 hover:text-cobalt-700 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={ArrowRight}
        >
          Sign In to {activeRole === USER_ROLES.CONSUMER ? 'Consumer' : activeRole === USER_ROLES.INDUSTRIAL ? 'Industrial' : 'Government'} Portal
        </Button>
      </form>

      {/* Role-Specific Registration Guidance */}
      {activeRole === USER_ROLES.GOVERNMENT ? (
        <div className="mt-5 p-3.5 bg-ivory-100 rounded-2xl border border-ivory-200 text-[11px] text-midnight-700 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cobalt-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Restricted Access:</strong> Government administration accounts cannot be publicly registered. Access credentials must be provisioned through your designated energy regulatory authority.
          </p>
        </div>
      ) : (
        <div className="mt-5 text-center text-xs text-midnight-600">
          Need a new {activeRole.toLowerCase()} account?{' '}
          <Link
            to={`/register?role=${activeRole}`}
            className="font-bold text-cobalt-600 hover:text-cobalt-700 underline"
          >
            Create {activeRole === USER_ROLES.CONSUMER ? 'Consumer' : 'Industrial'} Account
          </Link>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
