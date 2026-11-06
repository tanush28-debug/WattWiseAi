import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, Bell, Zap, Shield, Building2, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/constants';

export const Navbar = ({ onOpenSidebar, pageTitle = 'Dashboard' }) => {
  const { user, role } = useAuth();

  const getRoleBadge = () => {
    if (role === USER_ROLES.INDUSTRIAL) {
      return {
        label: 'Industrial Portal',
        icon: Building2,
        styles: 'bg-midnight-900 text-ivory-100 border border-midnight-700'
      };
    }
    if (role === USER_ROLES.GOVERNMENT) {
      return {
        label: 'Government Administration',
        icon: Shield,
        styles: 'bg-midnight-900 text-ivory-100 border border-midnight-700'
      };
    }
    return {
      label: 'Consumer Portal',
      icon: User,
      styles: 'bg-white text-midnight-900 border border-ivory-300'
    };
  };

  const badge = getRoleBadge();
  const BadgeIcon = badge.icon;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-300 bg-ivory-100 px-4 py-3.5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="-ml-2 rounded-md p-2 text-midnight-800 hover:bg-ivory-200 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile quick logo - navigates home without logging out */}
        <Link to="/" className="lg:hidden flex items-center gap-1.5" title="WattWise Home">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cobalt-600 text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        </Link>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-midnight-900 tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Current Active Workspace Indicator (Static display only - no dropdown) */}
        <div className={`hidden items-center gap-2 rounded-sm border px-3 py-1.5 text-xs font-semibold sm:flex ${badge.styles}`}>
          <span className="w-2 h-2 rounded-full bg-cobalt-500" />
          <BadgeIcon className="w-3.5 h-3.5 text-cobalt-500" />
          <span>{badge.label}</span>
        </div>

        {/* User Identity pill */}
        {user?.fullName && (
          <div className="hidden items-center gap-1.5 rounded-sm bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 md:flex">
            <span className="truncate max-w-[150px]">{user.fullName}</span>
          </div>
        )}

        {/* Notification Bell */}
        <button
          className="relative rounded-md p-2 text-midnight-700 transition-colors hover:bg-ivory-200 hover:text-midnight-900"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cobalt-500 ring-2 ring-ivory-100" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
