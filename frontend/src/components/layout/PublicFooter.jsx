import React from 'react';
import { Zap, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicFooter = () => {
  return (
    <footer className="bg-midnight-950 text-ivory-100 border-t border-midnight-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group cursor-pointer inline-flex">
              <div className="w-8 h-8 rounded-xl bg-cobalt-500 flex items-center justify-center text-white shadow-cobalt-sm group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-white stroke-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-ivory-100 font-sans">
                WattWise <span className="text-cobalt-400">AI</span>
              </span>
            </Link>
            <p className="text-xs text-midnight-400 max-w-sm leading-relaxed">
              Understand Energy. Reduce Waste. Build a Sustainable Future.
              An enterprise-grade decision support platform engineered for consumers, industrial facilities, and government energy policymakers.
            </p>
            <div className="pt-2 text-xs text-midnight-500 font-mono">
              Zero IoT dependencies. 100% Software-driven intelligence.
            </div>
          </div>

          {/* Platform Columns */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ivory-200 mb-4">Portals</h4>
            <ul className="space-y-2.5 text-xs text-midnight-400">
              <li><Link to="/consumer" className="hover:text-cobalt-400 transition-colors">Consumer Portal</Link></li>
              <li><Link to="/industrial" className="hover:text-cobalt-400 transition-colors">Industrial Analytics</Link></li>
              <li><Link to="/government" className="hover:text-cobalt-400 transition-colors">Government Hub</Link></li>
              <li><Link to="/select-role" className="hover:text-cobalt-400 transition-colors font-semibold text-cobalt-400">Choose Workspace &rarr;</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ivory-200 mb-4">Features</h4>
            <ul className="space-y-2.5 text-xs text-midnight-400">
              <li><a href="#how-it-works" className="hover:text-cobalt-400 transition-colors">Automated Bill OCR</a></li>
              <li><a href="#features" className="hover:text-cobalt-400 transition-colors">Tariff Simulator</a></li>
              <li><a href="#features" className="hover:text-cobalt-400 transition-colors">Demand Forecasting</a></li>
              <li><a href="#impact" className="hover:text-cobalt-400 transition-colors">Carbon Benchmarks</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-ivory-200 mb-4">About & Legal</h4>
            <ul className="space-y-2.5 text-xs text-midnight-400">
              <li><a href="#about" className="hover:text-cobalt-400 transition-colors">About Platform</a></li>
              <li><a href="#contact" className="hover:text-cobalt-400 transition-colors">Contact Team</a></li>
              <li><a href="#compliance" className="hover:text-cobalt-400 transition-colors">BEE & CEA Standards</a></li>
              <li><span className="text-midnight-600">Privacy & Terms</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-midnight-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-midnight-500">
          <p>© {new Date().getFullYear()} WattWise AI. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-cobalt-400 fill-cobalt-400 inline" /> for national cleantech excellence.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
