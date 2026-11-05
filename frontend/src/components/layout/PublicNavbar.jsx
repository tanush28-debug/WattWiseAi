import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Zap, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/constants';

export const PublicNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getDashboardPath = () => {
    if (role === USER_ROLES.INDUSTRIAL) return '/industrial';
    if (role === USER_ROLES.GOVERNMENT) return '/government';
    return '/consumer';
  };

  const scrollToSection = (sectionId) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        if (sectionId === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }, 150);
    } else {
      if (sectionId === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-ivory-100/90 backdrop-blur-md border-b border-ivory-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
        {/* Brand Logo - clickable, navigates home & scrolls to top */}
        <Link
          to="/"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2.5 group cursor-pointer"
          title="WattWise AI - Home"
        >
          <div className="w-9 h-9 rounded-xl bg-cobalt-500 flex items-center justify-center text-white shadow-cobalt-sm group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-white stroke-white" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-midnight-900 font-sans">
              WattWise <span className="text-cobalt-500">AI</span>
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-midnight-800">
          <button
            onClick={() => scrollToSection('home')}
            className="hover:text-cobalt-600 transition-colors font-medium cursor-pointer"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-cobalt-600 transition-colors font-medium cursor-pointer"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-cobalt-600 transition-colors font-medium cursor-pointer"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('impact')}
            className="hover:text-cobalt-600 transition-colors font-medium cursor-pointer"
          >
            Impact
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="hover:text-cobalt-600 transition-colors font-medium cursor-pointer"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="hover:text-cobalt-600 transition-colors font-medium cursor-pointer"
          >
            Contact
          </button>
        </nav>

        {/* CTA Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(getDashboardPath())}
              rightIcon={ArrowRight}
            >
              Open Dashboard
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/select-role')}
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/select-role')}
                rightIcon={ArrowRight}
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -mr-2 rounded-xl text-midnight-800 hover:bg-ivory-200 md:hidden"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-ivory-300 bg-ivory-50 px-4 py-5 flex flex-col gap-4 text-sm font-medium">
          <button
            onClick={() => scrollToSection('home')}
            className="text-left text-midnight-900 hover:text-cobalt-600 py-1"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="text-left text-midnight-900 hover:text-cobalt-600 py-1"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="text-left text-midnight-900 hover:text-cobalt-600 py-1"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('impact')}
            className="text-left text-midnight-900 hover:text-cobalt-600 py-1"
          >
            Impact
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-left text-midnight-900 hover:text-cobalt-600 py-1"
          >
            About
          </button>
          <button
            onClick={() => scrollToSection('contact')}
            className="text-left text-midnight-900 hover:text-cobalt-600 py-1"
          >
            Contact
          </button>

          <div className="pt-3 border-t border-ivory-300 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button
                variant="primary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate(getDashboardPath());
                }}
              >
                Open Dashboard
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/select-role');
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/select-role');
                  }}
                  rightIcon={ArrowRight}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default PublicNavbar;
