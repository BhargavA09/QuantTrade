import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  TrendingUp, 
  Code, 
  ShieldCheck, 
  Activity, 
  Award, 
  Terminal, 
  Briefcase, 
  Mail, 
  ExternalLink, 
  Sparkles, 
  Edit3, 
  Save, 
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Layers,
  BarChart2,
  Compass
} from 'lucide-react';
import { cn } from '../utils/cn';

interface AboutMePageProps {
  onNavigateToTab: (tab: any) => void;
  onOpenContact: () => void;
}

interface CreatorProfile {
  name: string;
  title: string;
  tagline: string;
  location: string;
  specialty: string;
  experienceYears: number;
  bio: string;
  philosophy: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
}

const DEFAULT_PROFILE: CreatorProfile = {
  name: "Alexander Vance",
  title: "Quantitative Systems Engineer & Systematic Trader",
  tagline: "Architecting statistical edge through stochastic modeling, adaptive neural learning, and high-frequency risk controls.",
  location: "New York / Chicago / Global",
  specialty: "Algorithmic Market Making & Stochastic Volatility",
  experienceYears: 8,
  bio: "Senior Quantitative Developer and systematic futures & equity trader. Over eight years of experience transitioning discretionary price-action intuition into mathematically verifiable execution algorithms. Creator of QuantLab Terminal, bridging statistical machine learning, Monte Carlo path simulations, and real-time market microstructure analysis into a unified institutional-grade research workbench.",
  philosophy: "Markets are dynamic non-stationary systems. Discretionary emotion is a liability; mathematical expectancy, disciplined position sizing via fractional Kelly, and continuous model re-calibration are the only sustainable edge.",
  email: "alexander.vance@quantlab.internal",
  githubUrl: "https://github.com",
  linkedinUrl: "https://linkedin.com"
};

const SKILL_DOMAINS = [
  {
    id: 'stochastic',
    name: 'Stochastic Calculus & Modeling',
    level: 95,
    icon: Activity,
    metrics: 'GBM · Ito\'s Lemma · Monte Carlo Paths',
    description: 'Continuous-time mathematics, Black-Scholes-Merton PDE solvers, jump-diffusion modeling (Merton Jump), and high-iteration Monte Carlo path simulations for tail-risk analysis.',
    tags: ['Geometric Brownian Motion', 'Cholesky Decomposition', 'GARCH(1,1)', 'Heston Volatility Model']
  },
  {
    id: 'ai-ml',
    name: 'Adaptive AI & Reinforcement Learning',
    level: 92,
    icon: Brain,
    metrics: 'Q-Learning · Fuzzy Logic · Policy Gradients',
    description: 'Rule-based fuzzy inference engines for non-binary regime classification, Q-learning agents optimizing reward-to-drawdown ratios, and deep recurrent sequences for multi-step price projection.',
    tags: ['Mamdani Fuzzy Inference', 'Reinforcement Learning', 'Feature Engineering', 'Savitzky-Golay Filtering']
  },
  {
    id: 'signal',
    name: 'Digital Signal Processing (DSP)',
    level: 90,
    icon: Cpu,
    metrics: 'FFT · Fourier Cycles · Wavelets',
    description: 'Separating market microstructure noise from macro cyclical frequencies. Implementing Fast Fourier Transforms (FFT) to isolate dominant market harmonic periods for swing forecasts.',
    tags: ['Fast Fourier Transform', 'Spectral Density', 'Ehlers Filters', 'Phase Angle Tracking']
  },
  {
    id: 'risk',
    name: 'Risk Governance & Capital Preservation',
    level: 96,
    icon: ShieldCheck,
    metrics: 'Parametric VaR · CVaR · Kelly Criterion',
    description: 'Systematic drawdown prevention algorithms. Non-linear fractional Kelly position sizing, historical and parametric Value at Risk (VaR 99%), and automated circuit-breaker stop protocols.',
    tags: ['Value at Risk (99%)', 'Conditional VaR', 'Fractional Kelly', 'Stress Testing Scenarios']
  },
  {
    id: 'engineering',
    name: 'Full-Stack Quantitative Architecture',
    level: 94,
    icon: Code,
    metrics: 'TypeScript · Node.js · WebSocket · Vite',
    description: 'Low-latency frontend and backend data pipelines. Architecting resilient fallback hierarchies, real-time WebSocket multiplexing, and in-memory caches capable of streaming multi-ticker data.',
    tags: ['High-Throughput Node.js', 'Vite & React 19', 'WebSocket Streaming', 'Modular Quantitative APIs']
  }
];

const TIMELINE_MILESTONES = [
  {
    year: '2018 - 2020',
    title: 'Discretionary Trading & Statistical Analysis',
    subtitle: 'Prop Trading & Market Microstructure Foundations',
    description: 'Traded US equity index futures and equity options. Developed empirical understanding of order book dynamics, liquidity imbalances, and psychological failure modes.'
  },
  {
    year: '2020 - 2022',
    title: 'Systematic Algorithm Design',
    subtitle: 'Transition to Quantitative Rule-Based Engines',
    description: 'Engineered Python backtesting engines for mean-reversion and momentum breakout strategies. Integrated historical tick data, slippage modeling, and multi-factor ranking pipelines.'
  },
  {
    year: '2022 - 2024',
    title: 'Machine Learning & Non-Linear Regimes',
    subtitle: 'Deep Predictive Networks & Fuzzy Logic Models',
    description: 'Integrated neural network projections, continuous learning feedback loops, and fuzzy logic rule engines to replace rigid linear threshold strategies with adaptive probabilistic agents.'
  },
  {
    year: '2025 - 2026',
    title: 'QuantLab Terminal Architecture',
    subtitle: 'Institutional-Grade Research & Simulation Suite',
    description: 'Unified Finviz-style screener treemaps, Monte Carlo probabilistic clouds, Fourier harmonic cycles, and autonomous AI trading agents into the complete QuantLab platform.'
  }
];

const TRADING_TENETS = [
  {
    number: '01',
    title: 'Edge Precedes Execution',
    text: 'A trade without quantifiable positive mathematical expectancy is merely gambling. Every signal must be grounded in statistical validity across hundreds of out-of-sample market cycles.'
  },
  {
    number: '02',
    title: 'Survival Over Optimization',
    text: 'Maximal theoretical profit means nothing if a 3-sigma event triggers account ruin. Position sizing through fractional Kelly safeguards capital to participate in long-term compound growth.'
  },
  {
    number: '03',
    title: 'Continuous Calibration',
    text: 'Financial markets are non-stationary and adversarial. Static parameters decay. Adaptive agents must constantly assess prediction error, adjust priors, and adapt to volatility shifts.'
  },
  {
    number: '04',
    title: 'Emotion Decoupling',
    text: 'Human cognitive biases (loss aversion, sunk-cost fallacy, revenge trading) destroy accounts. Automated code enforces entry, sizing, profit targets, and stop-losses with unyielding precision.'
  }
];

export const AboutMePage: React.FC<AboutMePageProps> = ({ onNavigateToTab, onOpenContact }) => {
  const [activeDomain, setActiveDomain] = useState<string>(SKILL_DOMAINS[0].id);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [profile, setProfile] = useState<CreatorProfile>(() => {
    try {
      const saved = localStorage.getItem('quant_creator_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [editForm, setEditForm] = useState<CreatorProfile>(profile);
  const [saveToast, setSaveToast] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(editForm);
    localStorage.setItem('quant_creator_profile', JSON.stringify(editForm));
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleResetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    setEditForm(DEFAULT_PROFILE);
    localStorage.removeItem('quant_creator_profile');
    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const currentDomain = SKILL_DOMAINS.find(d => d.id === activeDomain) || SKILL_DOMAINS[0];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-12 pb-16 px-4 sm:px-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 rounded-xl shadow-2xl backdrop-blur-md text-xs font-semibold"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Profile successfully updated</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-10 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-blue-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
          {/* Creator Portrait Frame */}
          <div className="relative shrink-0 group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-zinc-950 shadow-2xl relative">
              <img
                src="/src/assets/images/quant_creator_portrait_1791050190330.jpg"
                alt={profile.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                onError={(e) => {
                  // Fallback styled avatar if asset is missing
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Fallback avatar placeholder in case image is blocked */}
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-emerald-400 p-2 text-center">
                <Brain size={36} className="mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Quant Systems</span>
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Active</span>
            </div>
          </div>

          {/* Profile Identity & Pitch */}
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  {profile.name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-zinc-400 font-medium">
                  <span className="text-emerald-400 font-semibold">{profile.title}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{profile.location}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span>{profile.experienceYears}+ Years in Quant Development</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditForm(profile);
                    setIsEditing(!isEditing);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Edit3 size={13} />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
                <button
                  onClick={onOpenContact}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5"
                >
                  <Mail size={13} />
                  <span>Get in Touch</span>
                </button>
              </div>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
              {profile.tagline}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-zinc-500">Core Stack:</span>
                <span className="text-zinc-200">TypeScript · Python · Node.js · PyTorch</span>
              </div>
              <span aria-hidden="true" className="text-zinc-700">|</span>
              <div className="flex items-center gap-1.5">
                <BarChart2 size={14} className="text-blue-400" />
                <span className="text-zinc-500">Specialty:</span>
                <span className="text-zinc-200">{profile.specialty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Edit Panel (Collapsible) */}
        <AnimatePresence>
          {isEditing && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
              className="mt-8 pt-6 border-t border-zinc-800/80 space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Personalize Creator Information</span>
                <button
                  type="button"
                  onClick={handleResetProfile}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Restore Defaults</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Professional Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">Location / Base</label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Tagline & Core Objective</label>
                <input
                  type="text"
                  value={editForm.tagline}
                  onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">Detailed Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg"
                >
                  <Save size={13} />
                  <span>Save Changes</span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </section>

      {/* Bio Narrative & Philosophy */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <Briefcase size={16} />
            <span>Background & Mission</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Bridging High-Level Mathematics with Live Order Flow
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {profile.bio}
          </p>
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Primary Focus:</span>
            <span className="font-semibold text-white">Systematic Alpha Generation & Capital Preservation</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
            <Compass size={16} />
            <span>Quantitative Philosophy</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Probabilistic Rigor Over Market Intuition
          </h2>
          <p className="text-sm text-zinc-300 leading-relaxed italic">
            "{profile.philosophy}"
          </p>
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
            <span>Guiding Metric:</span>
            <span className="font-mono text-emerald-400 font-semibold">Sharpe Ratio &gt; 1.8 · Max DD &lt; 8.5%</span>
          </div>
        </div>
      </section>

      {/* Interactive Quantitative Competencies */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Algorithmic & Quantitative Skills
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explore the mathematical architectures implemented inside the QuantLab engine.
            </p>
          </div>
          <div className="text-xs font-mono text-zinc-500">
            Click domain for technical specifications
          </div>
        </div>

        {/* Skill domain selector buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {SKILL_DOMAINS.map((domain) => {
            const Icon = domain.icon;
            const isSelected = activeDomain === domain.id;
            return (
              <button
                key={domain.id}
                onClick={() => setActiveDomain(domain.id)}
                className={cn(
                  "p-3.5 rounded-2xl border text-left transition-all group flex flex-col justify-between",
                  isSelected
                    ? "bg-zinc-800/90 border-emerald-500 text-white shadow-lg shadow-emerald-950/20"
                    : "bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon size={18} className={isSelected ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"} />
                  <span className="text-[11px] font-mono font-bold text-emerald-400">{domain.level}%</span>
                </div>
                <div>
                  <span className="text-xs font-bold block truncate">{domain.name}</span>
                  <span className="text-[10px] text-zinc-500 truncate block mt-0.5 font-mono">{domain.metrics}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Skill Detail Showcase */}
        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <currentDomain.icon size={20} className="text-emerald-400" />
                <h3 className="text-lg font-bold text-white tracking-tight">{currentDomain.name}</h3>
              </div>
              <p className="text-xs text-zinc-400 font-mono">{currentDomain.metrics}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-36 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  style={{ width: `${currentDomain.level}%` }}
                />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">{currentDomain.level}/100</span>
            </div>
          </div>

          <p className="text-sm text-zinc-300 leading-relaxed">
            {currentDomain.description}
          </p>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Implemented Algorithms & Methods</span>
            <div className="flex flex-wrap gap-2 text-xs">
              {currentDomain.tags.map((tag, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 font-mono text-[11px]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trading Tenets / Core Rules */}
      <section className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Four Cardinal Rules of Systematic Trading
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Non-negotiable heuristics governing the algorithm development lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TRADING_TENETS.map((tenet) => (
            <div 
              key={tenet.number}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2.5 relative group hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black font-mono text-zinc-700 group-hover:text-emerald-500/40 transition-colors">
                  {tenet.number}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500/40" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{tenet.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{tenet.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Milestones Timeline */}
      <section className="space-y-6">
        <div className="border-b border-zinc-800/80 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Quant Journey & Evolutionary Milestones
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Evolution from discretionary price action to multi-asset autonomous intelligence.
          </p>
        </div>

        <div className="space-y-4">
          {TIMELINE_MILESTONES.map((milestone, idx) => (
            <div 
              key={idx}
              className="p-5 sm:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">{milestone.year}</span>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="text-xs font-medium text-zinc-400">{milestone.subtitle}</span>
                </div>
                <h3 className="text-sm font-bold text-white tracking-tight">{milestone.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{milestone.description}</p>
              </div>

              <div className="shrink-0 text-right">
                <span className="px-3 py-1 rounded-lg bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700/50">
                  Verified
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-950 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-lg font-bold text-white tracking-tight">Ready to test the algorithms?</h3>
          <p className="text-xs text-zinc-400">
            Simulate trades, backtest strategies, and inspect the Finviz heatmap screener right now.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onNavigateToTab('finviz')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-2"
          >
            <Sparkles size={14} />
            <span>Launch Finviz Quant</span>
          </button>
          <button
            onClick={() => onNavigateToTab('quantlab')}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all border border-zinc-700 flex items-center gap-2"
          >
            <Terminal size={14} />
            <span>Strategy Lab</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default AboutMePage;
