import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Home, Building2, Shield, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { PORTAL_ASSETS, USER_ROLES } from '../../config/constants';
import { Button } from '../../components/common/Button';

export const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState(USER_ROLES.CONSUMER);
  const [transitioningRole, setTransitioningRole] = useState(null);
  const navigate = useNavigate();

  const roleCards = [
    {
      id: USER_ROLES.CONSUMER,
      title: 'Consumer Portal',
      badge: 'Residential & Households',
      icon: Home,
      description: 'Monitor your household electricity consumption, understand your bills, forecast energy usage, and discover ways to save money.',
      visualBullets: [
        'Modern residential households',
        'Rooftop solar telemetry',
        'Electricity bill OCR intelligence',
        'AI personalized conservation'
      ],
      image: PORTAL_ASSETS.CONSUMER.bgImage,
      imagePosition: 'center right',
      buttonText: 'Continue as Consumer'
    },
    {
      id: USER_ROLES.INDUSTRIAL,
      title: 'Industrial Portal',
      badge: 'Enterprises & Facilities',
      icon: Building2,
      description: 'Monitor industrial energy consumption, analyze operational efficiency, identify unusual usage, and optimize energy costs.',
      visualBullets: [
        'Multi-facility plant telemetry',
        'Machine duty cycle modeling',
        'Real-time anomaly detection',
        'Peak shaving & cost optimization'
      ],
      image: PORTAL_ASSETS.INDUSTRIAL.bgImage,
      imagePosition: 'right center',
      buttonText: 'Continue as Industry'
    },
    {
      id: USER_ROLES.GOVERNMENT,
      title: 'Government Administration',
      badge: 'Regulatory & Policy Hub',
      icon: Shield,
      description: 'Monitor regional energy trends, analyze sector-wise consumption, evaluate tariff scenarios, and support sustainable energy policies.',
      visualBullets: [
        'National grid analytics & TWh metrics',
        'Regional & sector demand share',
        'Statutory tariff management',
        'Macro policy impact simulation'
      ],
      image: PORTAL_ASSETS.GOVERNMENT.bgImage,
      imagePosition: 'center right',
      buttonText: 'Continue as Government'
    }
  ];

  const handleProceed = (roleId) => {
    setSelectedRole(roleId);
    setTransitioningRole(roleId);
    // Smooth, short transition animation (320ms) before opening login
    setTimeout(() => {
      navigate(`/login?role=${roleId}`);
    }, 320);
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Header with Clickable Logo */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between pb-6 border-b border-ivory-300">
        <Link to="/" className="flex items-center gap-2.5 group cursor-pointer" title="Return to WattWise Homepage">
          <div className="w-9 h-9 rounded-xl bg-cobalt-500 flex items-center justify-center text-white shadow-cobalt-sm group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 fill-white stroke-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-midnight-900 font-sans">
              WattWise <span className="text-cobalt-500">AI</span>
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-midnight-700 hover:text-cobalt-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full py-10">
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-cobalt-600 bg-cobalt-500/10 px-3 py-1 rounded-full border border-cobalt-500/20 mb-3 font-bold">
            ⚡ Intelligent Energy Management Platform
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-midnight-900 tracking-tight leading-tight">
            Welcome to WattWise AI
          </h1>
          <p className="text-sm sm:text-base text-midnight-600 mt-3 leading-relaxed">
            Choose your workspace to access intelligent energy insights and management tools.
          </p>
        </div>

        {/* 3 Role Selection Cards with Smooth Transition Animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roleCards.map((card) => {
            const Icon = card.icon;
            const isSelected = selectedRole === card.id;
            const isTransitioning = transitioningRole === card.id;
            const isOtherTransitioning = transitioningRole && transitioningRole !== card.id;

            return (
              <motion.div
                key={card.id}
                onClick={() => {
                  if (!transitioningRole) setSelectedRole(card.id);
                }}
                animate={{
                  scale: isTransitioning ? 1.03 : isOtherTransitioning ? 0.96 : isSelected ? 1.02 : 1,
                  opacity: isOtherTransitioning ? 0.35 : 1
                }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between border-2 bg-midnight-900 ${
                  isTransitioning
                    ? 'border-cobalt-500 ring-4 ring-cobalt-500/30 shadow-cobalt-glow'
                    : isSelected
                    ? 'border-cobalt-500 shadow-2xl ring-4 ring-cobalt-500/20'
                    : 'border-midnight-800 hover:border-cobalt-400/60 shadow-card hover:scale-[1.01]'
                }`}
                style={{ minHeight: '520px' }}
              >
                {/* Background Image with Left-to-Right Gradient Overlay */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                  {/* The actual photo — higher opacity so it's recognizable */}
                  <img
                    src={card.image}
                    alt=""
                    role="presentation"
                    className="w-full h-full object-cover opacity-55 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
                    style={{ objectPosition: card.imagePosition }}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />

                  {/* Base dark layer for overall contrast */}
                  <div className="absolute inset-0 bg-midnight-950/55" style={{ zIndex: 1 }} />

                  {/* Left-to-right gradient: opaque dark left (text readable) → lighter right (image shows) */}
                  <div
                    className="absolute inset-0"
                    style={{
                      zIndex: 2,
                      background: 'linear-gradient(90deg, rgba(21,23,19,0.97) 0%, rgba(21,23,19,0.88) 42%, rgba(21,23,19,0.62) 72%, rgba(21,23,19,0.30) 100%)'
                    }}
                  />

                  {/* Bottom fade so the button area stays readable */}
                  <div
                    className="absolute inset-0"
                    style={{
                      zIndex: 3,
                      background: 'linear-gradient(to top, rgba(21,23,19,0.90) 0%, transparent 40%)'
                    }}
                  />
                </div>

                {/* Card Top Content */}
                <div className="relative z-10 p-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected || isTransitioning
                          ? 'bg-cobalt-500 text-white shadow-cobalt-sm'
                          : 'bg-midnight-800 border border-midnight-700 text-ivory-200 group-hover:bg-cobalt-500/20 group-hover:text-cobalt-400'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full font-bold transition-all ${
                        isSelected || isTransitioning
                          ? 'bg-cobalt-500 text-white'
                          : 'bg-midnight-800/80 text-ivory-300 border border-midnight-700'
                      }`}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-ivory-100 tracking-tight group-hover:text-white transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-ivory-300 mt-2 leading-relaxed font-normal">
                      {card.description}
                    </p>
                  </div>

                  {/* Visual Capability Bullets */}
                  <div className="pt-2 space-y-2 border-t border-midnight-800/80">
                    {card.visualBullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-ivory-200">
                        <CheckCircle2
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected || isTransitioning
                              ? 'text-cobalt-400'
                              : 'text-midnight-500 group-hover:text-cobalt-400'
                          }`}
                        />
                        <span className="text-[11px]">{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Bottom Button */}
                <div className="relative z-10 p-7 pt-0">
                  <Button
                    variant={isSelected || isTransitioning ? 'primary' : 'secondary'}
                    size="md"
                    className="w-full text-xs font-bold"
                    rightIcon={ArrowRight}
                    disabled={!!transitioningRole}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProceed(card.id);
                    }}
                  >
                    {isTransitioning ? 'Opening Workspace...' : card.buttonText}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div className="max-w-7xl mx-auto w-full pt-6 border-t border-ivory-300 text-center text-xs text-midnight-500">
        © {new Date().getFullYear()} WattWise AI Decision Platform. All rights reserved. Zero IoT hardware required.
      </div>
    </div>
  );
};

export default RoleSelectionPage;
