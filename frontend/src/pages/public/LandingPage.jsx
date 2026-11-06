import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  ArrowRight,
  TrendingDown,
  Sparkles,
  BarChart3,
  Receipt,
  TrendingUp,
  Calculator,
  Leaf,
  Award,
  Building2,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  MapPin,
  Globe,
  Send
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../config/constants';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      if (role === USER_ROLES.INDUSTRIAL) navigate('/industrial');
      else if (role === USER_ROLES.GOVERNMENT) navigate('/government');
      else navigate('/consumer');
    } else {
      navigate('/select-role');
    }
  };

  const features = [
    {
      icon: BarChart3,
      title: 'Smart Energy Analytics',
      desc: 'Multi-period consumption benchmarking, breakdown across heating, cooling and appliances, with trend detection.'
    },
    {
      icon: Receipt,
      title: 'Electricity Bill Intelligence',
      desc: 'Automated OCR extraction from utility PDFs and photos. Instantly parse billed units, due dates, and DISCOM tariff classifications.'
    },
    {
      icon: TrendingUp,
      title: 'AI Demand Forecasting',
      desc: 'Predictive 30-day demand curves with 95% confidence intervals influenced by climate degree days and consumption baseline.'
    },
    {
      icon: Calculator,
      title: 'Dynamic Tariff Simulator',
      desc: 'Evaluate Time-of-Day (ToD) vs standard slab rates. Model peak-shaving savings using verified DISCOM billing structures.'
    },
    {
      icon: Leaf,
      title: 'Carbon Footprint Tracking',
      desc: 'Compute real CO₂ equivalent emissions using official CEA grid emission factors (0.82 kg CO₂/kWh) and visualize green offsets.'
    },
    {
      icon: Award,
      title: 'Energy Conservation Rewards',
      desc: 'Gamified challenges, peak reduction badges, and community benchmarks to motivate sustainable consumption habits.'
    },
    {
      icon: Building2,
      title: 'Industrial Energy Monitoring',
      desc: 'Multi-facility telemetry, machine load estimation, anomaly alerting for induction furnaces, compressors, and chillers.'
    },
    {
      icon: ShieldCheck,
      title: 'Government Policy Dashboard',
      desc: 'Macro grid analytics, regional consumption comparison, sector breakdown, and simulation tools for energy regulators.'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload Bill or Enter Data',
      desc: 'Drag & drop your utility PDF bill or input power ratings from machinery. No hardware installation required.'
    },
    {
      step: '02',
      title: 'Analyze Energy Usage',
      desc: 'Our engine extracts billing line items, normalizes consumption, and calculates carbon emissions.'
    },
    {
      step: '03',
      title: 'Predict Future Demand',
      desc: 'Machine learning models forecast upcoming demand cycles, seasonal peaks, and projected bill amounts.'
    },
    {
      step: '04',
      title: 'Discover Cost Opportunities',
      desc: 'Simulate alternative tariff tiers, optimize operating schedules, and uncover phantom electrical loads.'
    },
    {
      step: '05',
      title: 'Track Environmental Impact',
      desc: 'Monitor abatement progress, earn eco-rewards, and contribute to national net-zero sustainability milestones.'
    }
  ];

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section id="home" className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cobalt-500/10 border border-cobalt-500/25 text-cobalt-700 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cobalt-600" />
              <span>Zero Hardware Required • Pure Software Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-midnight-900 tracking-tight leading-[1.08] font-sans">
              Take Control of Your Energy. Shape a Sustainable Tomorrow.
            </h1>

            <p className="text-base sm:text-lg text-midnight-700 leading-relaxed max-w-xl">
              An intelligent energy platform that helps households, industries, and governments understand consumption, predict demand, reduce costs, and build a cleaner future.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGetStarted}
                rightIcon={ArrowRight}
              >
                Get Started
              </Button>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore Platform
                </Button>
              </a>
            </div>

            {/* Quick Proof Badges */}
            <div className="pt-6 flex flex-wrap items-center gap-6 text-xs text-midnight-600 font-medium border-t border-ivory-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cobalt-600 shrink-0" />
                <span>Automated Bill OCR</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cobalt-600 shrink-0" />
                <span>3-Tier User Role Architecture</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cobalt-600 shrink-0" />
                <span>ML Demand Forecasting</span>
              </div>
            </div>
          </div>

          {/* Interactive Energy Analytics Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative bg-midnight-900 text-ivory-100 rounded-md p-6 sm:p-7 border border-midnight-700 space-y-6">
              {/* Product Card Header */}
              <div className="flex items-center justify-between border-b border-midnight-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-cobalt-500 text-white flex items-center justify-center font-bold shadow-cobalt-sm">
                    <Zap className="w-4 h-4 fill-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold tracking-tight text-ivory-100">WattWise Live Telemetry</h3>
                    <p className="text-[10px] font-mono text-midnight-400">Simulation Node • Active</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cobalt-500/20 text-cobalt-300 border border-cobalt-500/30">
                  REAL-TIME PREVIEW
                </span>
              </div>

              {/* Key Metrics Mini Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-midnight-850 p-3.5 rounded-2xl border border-midnight-800">
                  <p className="text-[10px] font-mono uppercase text-midnight-400">Est. Monthly Bill</p>
                  <p className="text-xl font-bold text-ivory-100 mt-1 font-mono">₹4,280</p>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 mt-1">
                    <TrendingDown className="w-3 h-3" /> -12.4% vs last cycle
                  </span>
                </div>
                <div className="bg-midnight-850 p-3.5 rounded-2xl border border-midnight-800">
                  <p className="text-[10px] font-mono uppercase text-midnight-400">Active Draw</p>
                  <p className="text-xl font-bold text-cobalt-400 mt-1 font-mono">420.5 kWh</p>
                  <span className="text-[10px] font-mono text-midnight-400 mt-1 block">
                    84/100 Efficiency
                  </span>
                </div>
              </div>

              {/* Simulated Wave Chart */}
              <div className="bg-midnight-850/80 p-4 rounded-2xl border border-midnight-800">
                <div className="flex items-center justify-between text-[11px] mb-3">
                  <span className="font-semibold text-ivory-200">Consumption Profile</span>
                  <span className="font-mono text-cobalt-400 text-[10px]">Optimal Load</span>
                </div>
                <div className="h-24 flex items-end gap-1.5 pt-2">
                  {[35, 48, 42, 60, 52, 68, 75, 70, 55, 48, 44, 40].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div
                        className="w-full rounded-t-sm transition-all duration-500"
                        style={{
                          height: `${val}%`,
                          backgroundColor: idx === 11 ? '#2457F5' : '#1E293B'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] font-mono text-midnight-500 mt-2">
                  <span>Jan</span>
                  <span>Jun</span>
                  <span>Oct (Current)</span>
                </div>
              </div>

              {/* AI Recommendation Pill */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-cobalt-500/10 border border-cobalt-500/20 text-xs">
                <Sparkles className="w-4 h-4 text-cobalt-400 shrink-0 mt-0.5" />
                <p className="text-ivory-200 text-[11px] leading-relaxed">
                  <strong className="text-cobalt-400">AI Advisor:</strong> Shifting washing machine and pump operations to off-peak slots (10 PM – 6 AM) will lower your ToD bill by ~₹1,150 this billing cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Metrics Section */}
      <section id="impact" className="bg-ivory-200/80 border-y border-ivory-300 py-16 px-4 sm:px-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt-600">
              Measurable Platform Impact
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-midnight-900 tracking-tight mt-1">
              Quantifiable Energy & Carbon Reductions
            </h2>
            <p className="text-xs text-midnight-600 mt-2 font-mono">
              [Illustrative Demonstration Metrics from Pilot Deployments]
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Energy Monitored"
              value="284.6 GWh"
              subtitle="Residential & Industrial telemetry"
              trend={-8.4}
              trendLabel="Grid peak relief"
              isDemo
            />
            <StatCard
              title="Estimated Cost Savings"
              value="₹34.8 Cr"
              subtitle="Avoided peak tariff penalties"
              trend={18.2}
              trendLabel="Year-over-year ROI"
              isNegativeGood={false}
              isDemo
            />
            <StatCard
              title="Carbon Abated"
              value="119.5k t"
              subtitle="Equivalent CO₂e eliminated"
              trend={-14.1}
              trendLabel="Direct emissions"
              isDemo
            />
            <StatCard
              title="Accounts Supported"
              value="18,450+"
              subtitle="Households & 142 Facilities"
              trend={32.0}
              trendLabel="Platform adoption"
              isNegativeGood={false}
              isDemo
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt-700 bg-cobalt-500/10 px-3 py-1 rounded-full border border-cobalt-500/25">
            Comprehensive Capabilities
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-midnight-900 tracking-tight mt-4">
            Engineered for Consumers, Industry & Public Policy
          </h2>
          <p className="text-sm text-midnight-600 mt-3 leading-relaxed">
            WattWise replaces slow, fragmented spreadsheets and expensive hardware sensors with instant software OCR and predictive ML intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-2xl border border-ivory-300 shadow-subtle hover:border-cobalt-400/40 hover:shadow-card transition-all duration-200 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-ivory-100 border border-ivory-200 flex items-center justify-center text-midnight-900 group-hover:bg-cobalt-500 group-hover:text-white transition-colors mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-midnight-900 mb-2">{feat.title}</h3>
                  <p className="text-xs text-midnight-600 leading-relaxed">{feat.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-midnight-900 text-ivory-100 py-20 md:py-28 px-4 sm:px-8 border-y border-midnight-800 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt-400">
              Operational Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-ivory-100 mt-2">
              How WattWise AI Operates
            </h2>
            <p className="text-xs text-midnight-400 mt-2">
              From raw utility billing to actionable energy reduction in 5 intuitive steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className="bg-midnight-850 p-6 rounded-2xl border border-midnight-800 flex flex-col justify-between relative hover:border-cobalt-500/40 transition-colors"
              >
                <div className="text-2xl font-black font-mono text-cobalt-400 mb-4">{s.step}</div>
                <div>
                  <h4 className="text-sm font-bold text-ivory-100 mb-2">{s.title}</h4>
                  <p className="text-xs text-midnight-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Call to action inside How it works */}
          <div className="mt-16 text-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
              rightIcon={ArrowRight}
            >
              Launch WattWise AI Now
            </Button>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 md:py-28 px-4 sm:px-8 max-w-7xl mx-auto scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt-700 bg-cobalt-500/10 px-3 py-1 rounded-full border border-cobalt-500/25">
              About The Platform
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-midnight-900 tracking-tight">
              Software-Driven Decarbonization for India's Clean Energy Future
            </h2>
            <p className="text-sm text-midnight-700 leading-relaxed">
              WattWise AI was founded on a simple principle: true sustainability should not depend on purchasing expensive IoT gadgets or smart-meter infrastructure. By combining advanced billing OCR algorithms, thermodynamic load modeling, and machine learning demand predictions, we deliver institutional-grade energy intelligence entirely through the web.
            </p>
            <p className="text-sm text-midnight-700 leading-relaxed">
              Whether you are a household consumer optimizing domestic appliances, an industrial facility manager controlling peak kilowatt surcharges, or a government regulator formulating tariff revisions, WattWise provides the exact decision support required to achieve economic savings and net-zero targets.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-white border border-ivory-300">
                <p className="text-2xl font-black text-cobalt-600 font-mono">100%</p>
                <p className="text-xs text-midnight-600 font-medium mt-1">Software-Based Workflow</p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-ivory-300">
                <p className="text-2xl font-black text-cobalt-600 font-mono">3 Roles</p>
                <p className="text-xs text-midnight-600 font-medium mt-1">Consumer, Industry & Gov</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="rounded-3xl overflow-hidden border border-ivory-300 shadow-xl bg-midnight-900 text-ivory-100 p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cobalt-500/20 border border-cobalt-500/40 flex items-center justify-center text-cobalt-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ivory-100">National Net-Zero Alignment</h3>
                  <p className="text-xs text-midnight-400">Aligned with Bureau of Energy Efficiency (BEE) guidelines</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-midnight-300 leading-relaxed border-t border-midnight-800 pt-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cobalt-400 shrink-0 mt-0.5" />
                  <span><strong>DISCOM Interoperability:</strong> Compatible with tariff formats across BESCOM, MSEDCL, Tata Power, and national distribution entities.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cobalt-400 shrink-0 mt-0.5" />
                  <span><strong>Carbon Accounting:</strong> Accurate statutory reporting conforming to Central Electricity Authority (CEA) emissions benchmarks.</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-cobalt-400 shrink-0 mt-0.5" />
                  <span><strong>Peak Shaving Engine:</strong> Dynamic load redistribution algorithms designed to relieve national grid congestion during peak hours.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-ivory-200/80 border-t border-ivory-300 py-20 px-4 sm:px-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt-600">
              Get in Touch
            </span>
            <h2 className="text-3xl font-black text-midnight-900 tracking-tight mt-1">
              Connect With the WattWise AI Team
            </h2>
            <p className="text-xs text-midnight-600 mt-2">
              Interested in an enterprise pilot, DISCOM partnership, or academic collaboration? Let's discuss.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl border border-ivory-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cobalt-500/10 text-cobalt-600 flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-midnight-900">Email Inquiries</h4>
              <p className="text-xs text-midnight-600">contact@wattwise.ai</p>
              <p className="text-[11px] text-midnight-400">Response within 24 business hours</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cobalt-500/10 text-cobalt-600 flex items-center justify-center mx-auto">
                <MapPin className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-midnight-900">Headquarters</h4>
              <p className="text-xs text-midnight-600">Bengaluru & New Delhi, India</p>
              <p className="text-[11px] text-midnight-400">Innovation & Cleantech Hub</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-ivory-300 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cobalt-500/10 text-cobalt-600 flex items-center justify-center mx-auto">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-midnight-900">Live Workspace</h4>
              <p className="text-xs text-midnight-600">Instant Demo Deployment</p>
              <button
                onClick={handleGetStarted}
                className="text-xs font-bold text-cobalt-600 hover:text-cobalt-700 underline"
              >
                Choose Workspace &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
