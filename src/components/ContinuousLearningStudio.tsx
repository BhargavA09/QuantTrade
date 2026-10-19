import React, { useState, useEffect, useMemo } from 'react';
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RotateCw, 
  FastForward, 
  Newspaper, 
  ShieldCheck, 
  Sliders, 
  History, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  RefreshCw,
  Cpu,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  continuousLearningService, 
  ContinuousLearningState, 
  LearningEpoch 
} from '../services/continuousLearningService';

interface ContinuousLearningStudioProps {
  onNavigateToNews?: () => void;
  onNavigateToScreener?: () => void;
}

export const ContinuousLearningStudio: React.FC<ContinuousLearningStudioProps> = ({
  onNavigateToNews,
  onNavigateToScreener
}) => {
  const [state, setState] = useState<ContinuousLearningState | null>(continuousLearningService.getState());
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'epochs' | 'news' | 'weights'>('overview');
  const [activeRegimeFilter, setActiveRegimeFilter] = useState<string>('ALL');

  useEffect(() => {
    return continuousLearningService.subscribe(newState => {
      setState(newState);
      setLoadingAction(null);
    });
  }, []);

  const handleStepDay = async () => {
    setLoadingAction('step');
    await continuousLearningService.stepLearningDay();
  };

  const handleIngestNews = async () => {
    setLoadingAction('news');
    await continuousLearningService.ingestNewsStream();
  };

  const handleSimulate7Days = async () => {
    setLoadingAction('simulate');
    await continuousLearningService.simulateEpochs(7);
  };

  const handleToggleAuto = async () => {
    if (!state) return;
    const next = !state.auto_learning_enabled;
    await continuousLearningService.toggleAutoLearning(next);
  };

  const handleReset = async () => {
    if (window.confirm("Reset continuous learning engine back to baseline prior seed?")) {
      setLoadingAction('reset');
      await continuousLearningService.resetState();
    }
  };

  // Epoch data for charts
  const chartData = useMemo(() => {
    if (!state?.epochs) return [];
    return state.epochs.map(ep => ({
      day: `Day ${ep.day_number}`,
      date: ep.date,
      loss: Number(ep.prediction_error_pct.toFixed(2)),
      accuracy: Number(ep.directional_accuracy_pct.toFixed(1)),
      regime: ep.regime,
      spyReturn: Number((ep.market_spy_return * 100).toFixed(2))
    }));
  }, [state?.epochs]);

  // Filtered epochs table
  const filteredEpochs = useMemo(() => {
    if (!state?.epochs) return [];
    const reversed = [...state.epochs].reverse();
    if (activeRegimeFilter === 'ALL') return reversed;
    return reversed.filter(e => e.regime === activeRegimeFilter);
  }, [state?.epochs, activeRegimeFilter]);

  if (!state) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center bg-zinc-950 rounded-2xl border border-zinc-800">
        <Brain className="w-12 h-12 text-emerald-400 animate-pulse mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Initializing Autonomous Continuous Learning Engine</h3>
        <p className="text-zinc-400 text-sm max-w-md mb-6">
          Synchronizing daily market close reconciliation records, news sentiment feedback matrices, and adaptive factor weights...
        </p>
        <button
          onClick={() => continuousLearningService.fetchState()}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-emerald-950/40"
        >
          <RefreshCw className="w-4 h-4 animate-spin" /> Synchronize Neural State
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Institutional Hero Control Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 lg:p-8 shadow-2xl">
        {/* Glow ambient background accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                {state.engine_status}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Cpu className="w-3 h-3 text-indigo-400" />
                v{state.version}
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Last updated: {new Date(state.last_learning_time).toLocaleTimeString()}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Brain className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>Continuous Daily & News Learning Core</span>
            </h1>

            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Self-adapting quantitative intelligence that reconciles daily market close against forecasts, ingests breaking macroeconomic and company news catalysts, updates strategy weights online, and filters noise.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleStepDay}
              disabled={loadingAction !== null}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
              title="Reconcile today's market close vs forecast and perform one online learning gradient step"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingAction === 'step' ? 'animate-spin' : ''}`} />
              Learn Today's Close
            </button>

            <button
              onClick={handleIngestNews}
              disabled={loadingAction !== null}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50"
              title="Ingest breaking global headlines and adjust category reliability multipliers"
            >
              <Newspaper className={`w-3.5 h-3.5 ${loadingAction === 'news' ? 'animate-pulse' : ''}`} />
              Ingest News Stream
            </button>

            <button
              onClick={handleSimulate7Days}
              disabled={loadingAction !== null}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2 transition-all disabled:opacity-50"
              title="Fast-forward 7 trading sessions of continuous training with stochastic price action and news shocks"
            >
              <FastForward className={`w-3.5 h-3.5 ${loadingAction === 'simulate' ? 'animate-bounce' : ''}`} />
              Simulate 7 Days
            </button>

            <button
              onClick={handleToggleAuto}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                state.auto_learning_enabled 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20' 
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${state.auto_learning_enabled ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
              Auto-Learn: {state.auto_learning_enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* 2. Top Metric Cards Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Active Trading Session
            </span>
            <div className="text-xl font-black text-white font-mono flex items-baseline gap-1">
              Day {state.current_day}
              <span className="text-xs text-zinc-500 font-sans font-normal">({state.total_epochs_trained} Epochs)</span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingUp className="w-2.5 h-2.5" /> +1 Daily Increment
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Directional Accuracy
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {state.cumulative_accuracy.toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Historical convergence
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Prediction Error / Loss
            </span>
            <div className="text-xl font-black text-indigo-400 font-mono">
              {(state.current_loss * 100).toFixed(2)}%
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
              <TrendingDown className="w-2.5 h-2.5" /> Decaying MSE Loss
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Daily Learning Rate (η)
            </span>
            <div className="text-xl font-black text-amber-400 font-mono">
              {state.learning_rate.toFixed(3)}
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Decay factor: {state.momentum_decay}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              News Reliability
            </span>
            <div className="text-xl font-black text-cyan-400 font-mono">
              {Object.keys(state.news_categories).length} Sectors
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Continuous NLP validation
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Noise Rejection Filter
            </span>
            <div className="text-sm font-bold text-rose-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-rose-400" />
              Active
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 text-left underline underline-offset-2 mt-1"
            >
              Reset Seed State
            </button>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              selectedTab === 'overview'
                ? 'bg-zinc-800 text-emerald-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            Learning Curve & Factor Weights
          </button>

          <button
            onClick={() => setSelectedTab('news')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              selectedTab === 'news'
                ? 'bg-zinc-800 text-indigo-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            News Catalyst Learning Matrix ({state.recent_news_learnings.length})
          </button>

          <button
            onClick={() => setSelectedTab('epochs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${
              selectedTab === 'epochs'
                ? 'bg-zinc-800 text-amber-400 border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-4 h-4" />
            Daily Epoch History ({state.epochs.length})
          </button>
        </div>
      </div>

      {/* 4. Tab 1: Overview (Learning Curve + Adaptive Weights) */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Interactive Learning Curve Chart */}
            <div className="lg:col-span-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-400" />
                    Continuous Training Progression: Loss Decay vs Accuracy
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Online stochastic gradient descent updating daily across 14+ market regimes
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-indigo-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    Accuracy (%)
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Error Loss (%)
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 95]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#3f3f46',
                        borderRadius: '0.75rem',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === 'accuracy') return [`${val}%`, 'Directional Accuracy'];
                        if (name === 'loss') return [`${val}%`, 'Prediction Error (Loss)'];
                        return [val, name];
                      }}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${label} (${item.date}) • Regime: ${item.regime}` : label;
                      }}
                    />
                    <Area type="monotone" dataKey="accuracy" stroke="#818cf8" strokeWidth={2.5} fillOpacity={1} fill="url(#accuracyGrad)" />
                    <Area type="monotone" dataKey="loss" stroke="#fb7185" strokeWidth={2} fillOpacity={1} fill="url(#lossGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs text-zinc-400 border-t border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Initial Loss</span>
                  <span className="font-mono text-zinc-300 font-bold">3.92%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Current Loss</span>
                  <span className="font-mono text-emerald-400 font-bold">{(state.current_loss * 100).toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Improvement</span>
                  <span className="font-mono text-emerald-400 font-bold">+59.7% Precision</span>
                </div>
              </div>
            </div>

            {/* Right 5 cols: Adaptive Model Factor Weights */}
            <div className="lg:col-span-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    Adaptive Quant Factor Weights (W_t)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Dynamically updated daily based on regime confirmation
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                  Σ = 100%
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {Object.entries(state.current_weights).map(([factor, weight]) => {
                  const pct = Math.round(weight * 1000) / 10;
                  const perf = state.factor_performance[factor];
                  const factorLabels: Record<string, { name: string; color: string; desc: string }> = {
                    momentum: { name: 'Cross-Asset Momentum (ω_mom)', color: 'bg-emerald-500', desc: 'Trend persistence on tech leaders' },
                    mean_reversion: { name: 'Statistical Mean Reversion (ω_mr)', color: 'bg-purple-500', desc: 'Ornstein-Uhlenbeck z-score pairs' },
                    pattern_breakout: { name: 'Technical Pattern Breakouts (ω_pat)', color: 'bg-blue-500', desc: 'Ascending triangle & double bottom targets' },
                    news_catalyst: { name: 'News & Macro Sentiment (ω_news)', color: 'bg-indigo-500', desc: 'NLP catalyst score mapped to tickers' },
                    volatility_penalty: { name: 'Volatility Risk Penalty (λ_vol)', color: 'bg-rose-500', desc: 'Downside CVaR gamma dampener' },
                    order_flow: { name: 'Whale Order Flow & Imbalance (ω_flow)', color: 'bg-amber-500', desc: 'Dark pool & tape block prints' }
                  };
                  const meta = factorLabels[factor] || { name: factor, color: 'bg-zinc-500', desc: '' };

                  return (
                    <div key={factor} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-200">{meta.name}</span>
                        <div className="flex items-center gap-2">
                          {perf && (
                            <span className="text-[10px] text-emerald-400 font-mono">
                              Sharpe {perf.sharpe}
                            </span>
                          )}
                          <span className="font-mono font-black text-white">{pct.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${meta.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="truncate">{meta.desc}</span>
                        {perf && <span className="text-zinc-500 shrink-0">Win {perf.win_rate}%</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Live Self-Correction & Reflection Terminal */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Active Model Self-Correction Log & Noise Filtering Terminal
              </h3>
              <span className="text-xs text-zinc-500 font-mono">Real-time Bayesian Calibration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Latest Algorithmic Adjustments
                </span>
                <ul className="text-xs text-zinc-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>Down-weighted pre-market retail hype on TSLA due to morning gap-fill mean-reversion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>Reinforced semiconductor breakout signal on NVDA after institutional volume confirmation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>Elevated Central Bank Macro weight post-FOMC press conference wording analysis</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Noise Filters & False Signal Rejections
                </span>
                <ul className="text-xs text-zinc-300 space-y-1.5">
                  {state.noise_rejections.map((nr, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{nr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: News Catalyst Learning Matrix */}
      {selectedTab === 'news' && (
        <div className="space-y-6">
          {/* Category Reliability Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(state.news_categories).map(([catKey, cat]) => {
              const isHighReliability = cat.reliability >= 1.05;
              return (
                <div 
                  key={catKey}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                        {catKey.replace(/_/g, ' ')}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        {cat.sample_tickers.map(sym => (
                          <span key={sym} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-black font-mono ${isHighReliability ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {cat.reliability.toFixed(2)}x
                      </span>
                      <span className="text-[10px] text-zinc-500 block">Reliability</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs pt-2 border-t border-zinc-800/80">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Confirmed</span>
                      <span className="font-mono text-emerald-400 font-bold">{cat.confirmed_count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Faded</span>
                      <span className="font-mono text-rose-400 font-bold">{cat.faded_count}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Fade Rate</span>
                      <span className="font-mono text-zinc-300 font-bold">{Math.round(cat.fade_rate * 100)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent News Learnings Feed */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-indigo-400" />
                Live News Ingestion & Sentiment Feedback History
              </h3>
              <button
                onClick={handleIngestNews}
                disabled={loadingAction !== null}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1.5"
              >
                <RotateCw className={`w-3.5 h-3.5 ${loadingAction === 'news' ? 'animate-spin' : ''}`} />
                Scan Real-Time Wires
              </button>
            </div>

            <div className="divide-y divide-zinc-800/60">
              {state.recent_news_learnings.map(nl => {
                const isConfirmed = nl.outcome.includes('CONFIRMED');
                return (
                  <div key={nl.id} className="p-4 hover:bg-zinc-800/20 transition-colors space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {nl.category.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isConfirmed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {nl.outcome}
                        </span>
                        <span className="text-xs text-zinc-500 font-mono">
                          {new Date(nl.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-zinc-400">
                          Sentiment: <span className={`font-mono font-bold ${nl.sentiment > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {nl.sentiment > 0 ? '+' : ''}{nl.sentiment.toFixed(2)}
                          </span>
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {nl.market_reaction}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-semibold text-zinc-100">
                      {nl.headline}
                    </h4>

                    <div className="text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Learned Model Adaptation: {nl.weight_adjustment}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Daily Epoch History Table */}
      {selectedTab === 'epochs' && (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-amber-400" />
                Historical Continuous Learning Epoch Ledger
              </h3>
              <p className="text-xs text-zinc-400">
                Audit trail of daily session reconciliations, prediction loss, and weights adjustments
              </p>
            </div>

            {/* Regime Filters */}
            <div className="flex items-center gap-1.5">
              {['ALL', 'Bullish', 'Bearish', 'Volatile', 'Sideways'].map(reg => (
                <button
                  key={reg}
                  onClick={() => setActiveRegimeFilter(reg)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                    activeRegimeFilter === reg
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {reg}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-y border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Epoch</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Regime</th>
                  <th className="py-2.5 px-3">Market Return</th>
                  <th className="py-2.5 px-3">Predicted</th>
                  <th className="py-2.5 px-3">Error (Loss)</th>
                  <th className="py-2.5 px-3">Accuracy</th>
                  <th className="py-2.5 px-3">News</th>
                  <th className="py-2.5 px-3">Core Algorithmic Adaptation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono">
                {filteredEpochs.map(ep => {
                  const isBullish = ep.regime === 'Bullish';
                  const isBearish = ep.regime === 'Bearish';
                  const isVolatile = ep.regime === 'Volatile';
                  return (
                    <tr key={ep.epoch_id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-white">{ep.epoch_id}</td>
                      <td className="py-2.5 px-3 text-zinc-400">{ep.date}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isBullish 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : isBearish 
                            ? 'bg-rose-500/20 text-rose-300' 
                            : isVolatile 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-purple-500/20 text-purple-300'
                        }`}>
                          {ep.regime}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={ep.market_spy_return >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {ep.market_spy_return >= 0 ? '+' : ''}{(ep.market_spy_return * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {(ep.predicted_drift * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-indigo-400 font-bold">
                        {ep.prediction_error_pct.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 font-bold">
                        {ep.directional_accuracy_pct.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {ep.news_catalysts_processed} items
                      </td>
                      <td className="py-2.5 px-3 font-sans text-zinc-300 text-[11px] max-w-xs truncate" title={ep.top_corrective_adjustment}>
                        {ep.top_corrective_adjustment}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
