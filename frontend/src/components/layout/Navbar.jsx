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
    <header className="sticky top-0 z-30 bg-ivory-100/90 backdrop-blur-md border-b border-ivory-300 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 -ml-2 rounded-xl text-midnight-800 hover:bg-ivory-200 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile quick logo - navigates home without logging out */}
        <Link to="/" className="lg:hidden flex items-center gap-1.5" title="WattWise Home">
          <div className="w-7 h-7 rounded-lg bg-cobalt-500 flex items-center justify-center text-white">
            <Zap className="w-4 h-4 fill-white" />
          </div>
        </Link>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-midnight-900 tracking-tight">{pageTitle}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Current Active Workspace Indicator (Static display only - no dropdown) */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm ${badge.styles}`}>
          <span className="w-2 h-2 rounded-full bg-cobalt-500" />
          <BadgeIcon className="w-3.5 h-3.5 text-cobalt-500" />
          <span>{badge.label}</span>
        </div>

        {/* User Identity pill */}
        {user?.fullName && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-midnight-600 font-medium px-2 py-1 bg-ivory-200/70 rounded-lg">
            <span className="truncate max-w-[150px]">{user.fullName}</span>
          </div>
        )}

        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-xl text-midnight-700 hover:text-midnight-900 hover:bg-ivory-200 transition-colors"
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
