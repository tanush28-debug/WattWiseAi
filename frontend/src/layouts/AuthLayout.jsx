import React from 'react';
import { Outlet, Link, useSearchParams } from 'react-router-dom';
import { Zap, ShieldCheck, Sparkles, ArrowLeft, Building2, Home, Shield } from 'lucide-react';
import { PORTAL_ASSETS, USER_ROLES } from '../config/constants';

export const AuthLayout = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const activeRole = roleParam === USER_ROLES.INDUSTRIAL
    ? USER_ROLES.INDUSTRIAL
    : roleParam === USER_ROLES.GOVERNMENT
    ? USER_ROLES.GOVERNMENT
    : USER_ROLES.CONSUMER;

  const currentAsset = PORTAL_ASSETS[activeRole];

  const roleIcons = {
    [USER_ROLES.CONSUMER]: Home,
    [USER_ROLES.INDUSTRIAL]: Building2,
    [USER_ROLES.GOVERNMENT]: Shield
  };

  const Icon = roleIcons[activeRole] || Home;

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col md:flex-row">
      {/* Brand & Showcase Panel (Midnight Black with Role-Specific Imagery) */}
      <div className="hidden lg:flex lg:w-1/2 bg-midnight-950 p-12 flex-col justify-between relative overflow-hidden border-r border-midnight-800">
        {/* Dynamic Role Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={currentAsset.bgImage}
            alt={currentAsset.title}
            className="w-full h-full object-cover opacity-30 scale-105 transition-all duration-700"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-midnight-950/80" />
        </div>

        {/* Clickable WattWise AI Logo -> Home */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 group cursor-pointer" title="Return to WattWise Homepage">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cobalt-600 text-white">
              <Zap className="w-5 h-5 fill-white stroke-white" />
            </div>
            <span className="text-xl font-black tracking-tight text-ivory-100 font-sans">
              WattWise <span className="text-cobalt-500">AI</span>
            </span>
          </Link>
        </div>

        {/* Center Panel Hero Information */}
        <div className="relative z-10 max-w-md my-auto">
          <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-cobalt-700 bg-midnight-900 px-3 py-1 font-mono text-xs uppercase tracking-wider text-cobalt-300">
            <Icon className="w-3.5 h-3.5" />
            <span>{currentAsset.title} Authorization</span>
          </div>

          <h2 className="text-3xl font-extrabold text-ivory-100 tracking-tight leading-tight mb-4">
            Understand Energy. Reduce Waste. Build a Sustainable Future.
          </h2>

          <p className="text-xs text-ivory-300 leading-relaxed mb-6">
            {currentAsset.description}
          </p>

          <div className="space-y-3 border-t border-midnight-800/90 pt-6">
            <div className="flex items-center gap-3 text-xs text-ivory-200">
              <ShieldCheck className="w-4 h-4 text-cobalt-400 shrink-0" />
              <span>Zero IoT Hardware • 100% Software OCR & Analytics</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-ivory-200">
              <ShieldCheck className="w-4 h-4 text-cobalt-400 shrink-0" />
              <span>Secured with Supabase Auth & Verified RBAC</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-midnight-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} WattWise AI Decision Platform</span>
          <span className="font-mono text-[10px] uppercase text-ivory-400">INR / India Edition</span>
        </div>
      </div>

      {/* Auth Form Workspace (Soft Ivory) */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 lg:px-16 py-12 relative">
        <div className="absolute top-6 left-6 flex items-center gap-4">
          <Link
            to="/select-role"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-midnight-700 hover:text-cobalt-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Change Portal
          </Link>
          <span className="text-midnight-300">|</span>
          <Link
            to="/"
            className="text-xs font-medium text-midnight-600 hover:text-midnight-900 transition-colors"
          >
            Homepage
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
