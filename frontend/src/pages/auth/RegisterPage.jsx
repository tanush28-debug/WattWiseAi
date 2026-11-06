import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { USER_ROLES } from '../../config/constants';
import { ArrowRight, Mail, Lock, User, Building2, Info, Home } from 'lucide-react';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const initialRole = roleParam === USER_ROLES.INDUSTRIAL ? USER_ROLES.INDUSTRIAL : USER_ROLES.CONSUMER;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState(initialRole);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (roleParam === USER_ROLES.INDUSTRIAL) {
      setAccountType(USER_ROLES.INDUSTRIAL);
    } else {
      setAccountType(USER_ROLES.CONSUMER);
    }
  }, [roleParam]);

  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await register({
        fullName,
        email,
        password,
        accountType
      });

      if (result.needsVerification) {
        toast.info('Verification link dispatched. Please check your email to activate your account.');
        navigate(`/login?role=${accountType}`);
      } else {
        toast.success(`Account registered! Welcome to WattWise AI, ${fullName}.`);
        if (result.user.role === USER_ROLES.INDUSTRIAL) {
          navigate('/industrial');
        } else {
          navigate('/consumer');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 sm:p-9 rounded-3xl border border-ivory-300 shadow-card">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-midnight-900 tracking-tight">Create an Account</h2>
        <p className="text-xs text-midnight-600 mt-1">
          Select your organization profile and start optimizing energy with WattWise AI.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Type Selector */}
        <div>
          <label className="text-xs font-semibold tracking-wide text-midnight-800 block mb-2">
            Select Account Type <span className="text-cobalt-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAccountType(USER_ROLES.CONSUMER)}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                accountType === USER_ROLES.CONSUMER
                  ? 'border-cobalt-500 bg-cobalt-50/50 ring-2 ring-cobalt-500/20'
                  : 'border-ivory-300 hover:border-ivory-400 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                accountType === USER_ROLES.CONSUMER ? 'bg-cobalt-500 text-white' : 'bg-ivory-200 text-midnight-700'
              }`}>
                <Home className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-midnight-900">Consumer</p>
                <p className="text-[10px] text-midnight-500">Household</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setAccountType(USER_ROLES.INDUSTRIAL)}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${
                accountType === USER_ROLES.INDUSTRIAL
                  ? 'border-cobalt-500 bg-cobalt-50/50 ring-2 ring-cobalt-500/20'
                  : 'border-ivory-300 hover:border-ivory-400 bg-white'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                accountType === USER_ROLES.INDUSTRIAL ? 'bg-cobalt-500 text-white' : 'bg-ivory-200 text-midnight-700'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-midnight-900">Industrial</p>
                <p className="text-[10px] text-midnight-500">Facility</p>
              </div>
            </button>
          </div>
        </div>

        {/* Government Provisioning Notice */}
        <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-200 text-[11px] text-midnight-700 flex items-start gap-2">
          <Info className="w-4 h-4 text-cobalt-600 shrink-0 mt-0.5" />
          <span>
            <strong>Government Officials:</strong> Administrative access is protected and provisioned directly by the central energy authority. Public self-registration is restricted.
          </span>
        </div>

        <Input
          label="Full Name"
          name="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Sarah Jenkins / Rajesh Sharma"
          error={errors.fullName}
          leftIcon={User}
          required
        />

        <Input
          label="Email Address"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@organization.com"
          error={errors.email}
          leftIcon={Mail}
          required
        />

        <Input
          label="Create Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimum 8 characters"
          error={errors.password}
          helperText="Include letters and numbers for enhanced security"
          leftIcon={Lock}
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={ArrowRight}
        >
          Create {accountType === USER_ROLES.INDUSTRIAL ? 'Industrial' : 'Consumer'} Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-midnight-600">
        Already have an account?{' '}
        <Link to={`/login?role=${accountType}`} className="font-bold text-cobalt-600 hover:text-cobalt-700 underline">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
