import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  BarChart3,
  Receipt,
  TrendingUp,
  Calculator,
  Leaf,
  Sparkles,
  Award,
  User,
  Building2,
  Activity,
  Cpu,
  AlertTriangle,
  LineChart,
  FileText,
  Globe,
  MapPin,
  PieChart,
  DollarSign,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/constants';
import {
  CONSUMER_NAV_ITEMS,
  INDUSTRIAL_NAV_ITEMS,
  GOVERNMENT_NAV_ITEMS
} from '../../config/navigation';

const iconMap = {
  LayoutDashboard,
  BarChart3,
  Receipt,
  TrendingUp,
  Calculator,
  Leaf,
  Sparkles,
  Award,
  User,
  Building2,
  Activity,
  Cpu,
  AlertTriangle,
  LineChart,
  FileText,
  Globe,
  MapPin,
  PieChart,
  DollarSign,
  Sliders,
  ShieldCheck,
  FileSpreadsheet,
  Settings
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const getNavItems = () => {
    switch (role) {
      case USER_ROLES.INDUSTRIAL:
        return INDUSTRIAL_NAV_ITEMS;
      case USER_ROLES.GOVERNMENT:
        return GOVERNMENT_NAV_ITEMS;
      case USER_ROLES.CONSUMER:
      default:
        return CONSUMER_NAV_ITEMS;
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-midnight-950/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Container: Midnight Black */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-midnight-900 border-r border-midnight-800 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Clickable Logo Brand Header: Clicking navigates to public homepage */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-midnight-800">
            <Link
              to="/"
              onClick={() => onClose && onClose()}
              className="flex items-center gap-2.5 group cursor-pointer"
              title="Return to WattWise Homepage"
            >
              <div className="w-8 h-8 rounded-xl bg-cobalt-500 flex items-center justify-center text-white shadow-cobalt-sm group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-white stroke-white" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-ivory-100 font-sans group-hover:text-white transition-colors">
                  WattWise <span className="text-cobalt-400">AI</span>
                </span>
                <span className="block text-[10px] font-mono text-midnight-500 tracking-wider uppercase">
                  {role === USER_ROLES.INDUSTRIAL
                    ? 'Industrial Portal'
                    : role === USER_ROLES.GOVERNMENT
                    ? 'Gov Policy Hub'
                    : 'Consumer Portal'}
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-midnight-500 hover:text-ivory-100 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav List with Electric Cobalt Blue Active State */}
          <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
            {navItems.map((item) => {
              const IconComponent = iconMap[item.icon] || LayoutDashboard;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/consumer' || item.path === '/industrial' || item.path === '/government'}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
                      isActive
                        ? 'bg-cobalt-500 text-white font-bold shadow-cobalt-sm'
                        : 'text-ivory-300 hover:bg-midnight-800/80 hover:text-ivory-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <IconComponent
                          className={`w-4 h-4 transition-colors ${
                            isActive
                              ? 'text-white stroke-[2.2]'
                              : 'text-midnight-500 group-hover:text-cobalt-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-midnight-800 text-cobalt-300 border border-cobalt-500/30'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Bottom */}
        <div className="p-4 border-t border-midnight-800 bg-midnight-950/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-midnight-800 border border-midnight-700 flex items-center justify-center text-xs font-bold text-cobalt-400">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-ivory-100 truncate">{user?.fullName || 'Active User'}</p>
              <p className="text-[11px] text-midnight-500 truncate">{user?.email || 'user@wattwise.ai'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-ivory-400 hover:text-ivory-100 hover:bg-midnight-800/70 border border-midnight-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
