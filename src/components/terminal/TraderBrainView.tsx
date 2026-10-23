import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  FastForward, 
  Newspaper, 
  ShieldCheck, 
  ShieldAlert,
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Award,
  Zap,
  Activity,
  History,
  XCircle,
  Radio,
  BookOpen,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  quantTraderBrain, 
  TraderBrainState, 
  TradeMistake, 
  TradeSuccess 
} from '../../services/QuantTraderBrain';
import { continuousLearningService } from '../../services/continuousLearningService';
import { TraderBrainRiskManagement } from './TraderBrainRiskManagement';
import { TraderBrainCorrelationMatrix } from './TraderBrainCorrelationMatrix';

interface TraderBrainViewProps {
  selectedTicker?: string;
  onSelectTicker?: (ticker: string) => void;
  onNavigateToTerminal?: () => void;
  onNavigateToNews?: () => void;
}

export const TraderBrainView: React.FC<TraderBrainViewProps> = ({
  selectedTicker = 'NVDA',
  onSelectTicker,
  onNavigateToTerminal,
  onNavigateToNews
}) => {
  const [brainState, setBrainState] = useState<TraderBrainState>(() => quantTraderBrain.getState());
  const [activeLedgerTab, setActiveLedgerTab] = useState<'mistakes' | 'successes'>('mistakes');
  const [activeSection, setActiveSection] = useState<'all' | 'correlation' | 'risk' | 'ledger' | 'factors'>('all');
  const [isSimulating, setIsSimulating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    return quantTraderBrain.subscribe(setBrainState);
  }, []);

  const handleSimulateTrade = () => {
    setIsSimulating(true);
    const result = quantTraderBrain.simulateDailyLearningStep();
    if (result.isWin) {
      setNotification(`🎉 Simulated Trade SUCCESS! PnL +$${result.pnl.toFixed(2)}. Alpha reinforced in brain.`);
    } else {
      setNotification(`⚠️ Simulated Trade MISTAKE! Loss -$${Math.abs(result.pnl).toFixed(2)}. Root cause analyzed & algorithmic remedy applied.`);
    }
    setIsSimulating(false);
    setTimeout(() => setNotification(null), 6000);
  };

  const handleFastForward7Days = async () => {
    setIsSimulating(true);
    for (let i = 0; i < 7; i++) {
      quantTraderBrain.simulateDailyLearningStep();
    }
    // Also step the backend daily continuous learner
    await continuousLearningService.simulateEpochs(7);
    setIsSimulating(false);
    setNotification("⏩ Fast-forwarded 7 trading sessions. Factor weights, win-rate, and mistake ledger updated.");
    setTimeout(() => setNotification(null), 6000);
  };

  const handleToggleAuto = () => {
    const next = !brainState.stats.autoTradingActive;
    quantTraderBrain.toggleAutoTrading(next);
  };

  const handleReset = () => {
    if (window.confirm("Reset trader learning brain back to baseline seed?")) {
      quantTraderBrain.resetToBaseline();
      setNotification("Reset trader brain to baseline initial state.");
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const factorMeta: Record<string, { label: string; desc: string; color: string }> = {
    momentum: { label: 'Cross-Asset Momentum (ω_mom)', desc: 'Trend persistence on tech leaders', color: 'bg-emerald-500' },
    mean_reversion: { label: 'Statistical Mean Reversion (ω_mr)', desc: 'Ornstein-Uhlenbeck z-score equilibrium', color: 'bg-purple-500' },
    pattern_breakout: { label: 'Technical Pattern Breakout (ω_pat)', desc: 'Ascending triangles & double bottoms', color: 'bg-blue-500' },
    news_catalyst: { label: 'Macro & News Sentiment (ω_news)', desc: 'NLP news correlation & reaction tracking', color: 'bg-indigo-500' },
    volatility_penalty: { label: 'Volatility Risk Penalty (λ_vol)', desc: 'GARCH dynamic downside variance brake', color: 'bg-rose-500' },
    smc_structure: { label: 'Smart Money Structure (ω_smc)', desc: 'Order blocks & Fair Value Gaps (FVG)', color: 'bg-amber-500' }
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Performance Strip */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Continuous Learning Active
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                Trading Session Day {brainState.stats.learningDay} · Total Epochs: {brainState.stats.totalEpochs}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Brain className="w-8 h-8 text-emerald-400 shrink-0" />
              <span>Trader Learning Core: Mistakes & Successes Engine</span>
            </h1>

            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Acts like a live quantitative prop trader that reviews every winning and losing trade, identifies the root cause of errors, adapts its factor weights online, and prevents repeating costly mistakes.
            </p>
          </div>

          {/* Interactive Training Controls */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleSimulateTrade}
              disabled={isSimulating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50"
              title="Simulate a trade outcome, trigger post-mortem error analysis, and adapt factor weights"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              Simulate & Learn Next Trade
            </button>

            <button
              onClick={handleFastForward7Days}
              disabled={isSimulating}
              className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-2 transition-all disabled:opacity-50"
              title="Simulate 7 days of active market sessions to observe rule adaptation"
            >
              <FastForward className="w-3.5 h-3.5" />
              Fast-Forward 7 Days
            </button>

            <button
              onClick={handleToggleAuto}
              className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all flex items-center gap-2 ${
                brainState.stats.autoTradingActive 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${brainState.stats.autoTradingActive ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
              Auto-Adapt: {brainState.stats.autoTradingActive ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-zinc-800/80">
          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Cumulative Win Rate
            </span>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {brainState.stats.winRate.toFixed(1)}%
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              {brainState.stats.winningTrades} wins / {brainState.stats.losingTrades} mistakes
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Profit Factor
            </span>
            <div className="text-xl font-black text-white font-mono">
              {brainState.stats.profitFactor.toFixed(2)}x
            </div>
            <span className="text-[10px] text-emerald-400 mt-1 block">
              Gross Win / Gross Loss
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Sharpe Ratio
            </span>
            <div className="text-xl font-black text-indigo-400 font-mono">
              {brainState.stats.sharpeRatio.toFixed(2)}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Risk-adjusted alpha
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Net PnL
            </span>
            <div className={`text-xl font-black font-mono ${brainState.stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {brainState.stats.netPnl >= 0 ? '+' : ''}${brainState.stats.netPnl.toLocaleString()}
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              ({brainState.stats.netPnlPct >= 0 ? '+' : ''}{brainState.stats.netPnlPct.toFixed(2)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Consecutive Wins
            </span>
            <div className="text-xl font-black text-amber-400 font-mono">
              {brainState.stats.consecutiveWins} in a row
            </div>
            <span className="text-[10px] text-zinc-500 mt-1 block">
              Streak active
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mb-1">
              Portfolio Drawdown
            </span>
            <div className="text-sm font-bold text-rose-400 font-mono">
              -{brainState.stats.maxDrawdown.toFixed(1)}% Max
            </div>
            <button
              onClick={handleReset}
              className="text-[10px] text-zinc-500 hover:text-zinc-300 text-left underline underline-offset-2 mt-1"
            >
              Reset Brain Seed
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center gap-2 animate-fade-in shadow-lg">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Trader Brain Section Selector */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl text-xs font-bold font-mono">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-xl transition-all ${
            activeSection === 'all'
              ? 'bg-zinc-800 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          All Modules
        </button>
        <button
          onClick={() => setActiveSection('correlation')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSection === 'correlation'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
              : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>Dynamic Correlation Matrix (D3 Heatmap)</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200">D3.JS</span>
        </button>
        <button
          onClick={() => setActiveSection('risk')}
          className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSection === 'risk'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-950/40'
              : 'text-rose-400 hover:text-rose-300'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Risk Management (D3 VaR & Drawdown)</span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-200">D3.JS</span>
        </button>
        <button
          onClick={() => setActiveSection('ledger')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSection === 'ledger'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Experience Ledger ({brainState.mistakes.length + brainState.successes.length})</span>
        </button>
        <button
          onClick={() => setActiveSection('factors')}
          className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
            activeSection === 'factors'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Quant Factors (W_t)</span>
        </button>
      </div>

      {/* 2. D3.js Dynamic Correlation Matrix Heatmap & Factor Exposure */}
      {(activeSection === 'all' || activeSection === 'correlation') && (
        <TraderBrainCorrelationMatrix
          selectedTicker={selectedTicker}
          onSelectTicker={onSelectTicker}
        />
      )}

      {/* 3. D3.js Portfolio Risk Management & Maximum Drawdown Scenarios */}
      {(activeSection === 'all' || activeSection === 'risk') && (
        <TraderBrainRiskManagement brainState={brainState} />
      )}

      {/* 3. Dynamic Factor Weights (W_t) */}
      {(activeSection === 'all' || activeSection === 'factors') && (
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Dynamic Quant Factor Weights (W_t)
            </h3>
            <p className="text-xs text-zinc-400">
              Continuously calibrated online: Factor weights increase when confirmed by alpha and decrease upon mistakes
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
            Simplex Sum = 100%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(brainState.weights).map(([factor, weight]) => {
            const meta = factorMeta[factor] || { label: factor, desc: '', color: 'bg-zinc-500' };
            const pct = (weight * 100).toFixed(1);
            return (
              <div key={factor} className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-200">{meta.label}</span>
                  <span className="font-mono font-black text-white">{pct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${meta.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                <span className="text-[10px] text-zinc-400 block truncate">{meta.desc}</span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* 4. Mistakes Ledger vs Successes Ledger (The Heart of Continuous Learning) */}
      {(activeSection === 'all' || activeSection === 'ledger') && (
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Trader Experience & Continuous Learning Ledger
            </h3>
            <p className="text-xs text-zinc-400">
              Direct audit of post-mortem mistake evaluations and winning alpha confirmations
            </p>
          </div>

          {/* Toggle between Mistakes and Successes */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <button
              onClick={() => setActiveLedgerTab('mistakes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLedgerTab === 'mistakes'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Mistakes & Post-Mortem ({brainState.mistakes.length})
            </button>
            <button
              onClick={() => setActiveLedgerTab('successes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeLedgerTab === 'successes'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Successes & Alpha Edge ({brainState.successes.length})
            </button>
          </div>
        </div>

        {/* Mistakes Ledger Content */}
        {activeLedgerTab === 'mistakes' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              When trades fail, the trader performs a root-cause autopsy and applies an immediate mathematical correction to prevent recurrence.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brainState.mistakes.map(m => (
                <div 
                  key={m.id}
                  className="p-4 rounded-xl bg-zinc-950/80 border border-rose-500/20 hover:border-rose-500/40 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white">{m.ticker}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                        {m.tradeType}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{m.timestamp}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-rose-400">
                      ${m.lossAmount.toFixed(2)} ({m.lossPct.toFixed(2)}%)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Root Cause: {m.rootCause.replace(/_/g, ' ')}
                    </span>
                    <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                      {m.rootCauseDetail}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Correction Applied:</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      {m.selfCorrectionApplied}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Successes Ledger Content */}
        {activeLedgerTab === 'successes' && (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              When trades succeed, the trader attributes the alpha to specific confluence factors and reinforces those weights.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {brainState.successes.map(s => (
                <div 
                  key={s.id}
                  className="p-4 rounded-xl bg-zinc-950/80 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white">{s.ticker}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {s.tradeType}
                      </span>
                      <span className="text-xs text-zinc-500 font-mono">{s.timestamp}</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +${s.profitAmount.toFixed(2)} (+{s.profitPct.toFixed(2)}%)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      Captured: {s.riskRewardCaptured}
                    </span>
                    <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
                      {s.alphaDriver}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-300">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Edge Reinforced:</span>
                    </div>
                    <p className="text-[11px] text-zinc-300">
                      {s.edgeReinforced}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      )}

      {/* 5. Active Algorithmic Guardrail Rules (Learned from Mistakes) */}
      {(activeSection === 'all' || activeSection === 'ledger') && (
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Active Algorithmic Guardrails (Synthesized from Past Mistakes)
          </h3>
          <span className="text-xs text-zinc-500 font-mono">Real-time Rule Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
          {brainState.activeRules.map((rule, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-zinc-300">{rule}</span>
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
};
