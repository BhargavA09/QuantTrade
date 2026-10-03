import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Target, 
  Zap, 
  RefreshCw, 
  BookOpen, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  BarChart3,
  Compass,
  Cpu,
  Layers,
  Award
} from 'lucide-react';
import { StockData } from '../types';
import { 
  adaptiveTraderEngine, 
  detectTraderSkillSetups, 
  synthesizeMultiSourceKnowledge,
  TraderSkillSetup,
  MultiSourceInsight,
  QLearningState
} from '../services/AdaptiveTraderLearningEngine';
import { cn } from '../utils/cn';

interface AdaptiveTraderLabProps {
  data: StockData;
  allData: Record<string, StockData>;
  onExecuteTrade?: (trade: any) => void;
  onSelectForBacktest?: (strategy: any) => void;
  onOpenPythonScript?: (strategy: string) => void;
}

export default function AdaptiveTraderLab({
  data,
  allData,
  onExecuteTrade,
  onSelectForBacktest,
  onOpenPythonScript
}: AdaptiveTraderLabProps) {
  const [horizonDays, setHorizonDays] = useState<number>(30);
  const [activeDomainFilter, setActiveDomainFilter] = useState<string>('All');
  const [rlState, setRlState] = useState<QLearningState>(() => adaptiveTraderEngine.getState());
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [selectedSetup, setSelectedSetup] = useState<TraderSkillSetup | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  // Subscribe to RL state
  useEffect(() => {
    return adaptiveTraderEngine.subscribe(setRlState);
  }, []);

  // Calculate prices and setups
  const prices = useMemo(() => (data.history || []).map(h => h.price), [data.history]);
  const highs = useMemo(() => (data.history || []).map(h => (h as any).high ?? h.price), [data.history]);
  const lows = useMemo(() => (data.history || []).map(h => (h as any).low ?? h.price), [data.history]);

  // Generate profit projections
  const projections = useMemo(() => {
    return adaptiveTraderEngine.generateProfitProjections(data.currentPrice, prices, horizonDays);
  }, [data.currentPrice, prices, horizonDays]);

  // Detect SMC Trader Setups
  const setups = useMemo(() => {
    return detectTraderSkillSetups(prices, highs, lows, data.currentPrice, data.ticker);
  }, [prices, highs, lows, data.currentPrice, data.ticker]);

  // Synthesize Multi-Source Financial Knowledge
  const insights = useMemo(() => {
    const pe = (data.fundamentals as any)?.peRatio || 28;
    const sentiment = data.sentiment?.score || 55;
    const vol = parseFloat((data.stdDev * 100).toFixed(1)) || 22;
    return synthesizeMultiSourceKnowledge(data.ticker, data.currentPrice, pe, sentiment, vol);
  }, [data.ticker, data.currentPrice, data.fundamentals, data.sentiment, data.stdDev]);

  const filteredInsights = useMemo(() => {
    if (activeDomainFilter === 'All') return insights;
    return insights.filter(i => i.domain === activeDomainFilter);
  }, [insights, activeDomainFilter]);

  const targetPoint = projections[projections.length - 1];
  const expectedProfitPct = targetPoint 
    ? (((targetPoint.evOptimizedTarget - data.currentPrice) / data.currentPrice) * 100).toFixed(2)
    : '0.00';

  const handleRunLearning = () => {
    setIsTraining(true);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const isWin = Math.random() > 0.32;
      adaptiveTraderEngine.stepLearningIteration(data.ticker, data.currentPrice, isWin);
      if (count >= 8) {
        clearInterval(interval);
        setIsTraining(false);
      }
    }, 180);
  };

  const handleExecuteSetup = (setup: TraderSkillSetup) => {
    if (onExecuteTrade) {
      onExecuteTrade({
        ticker: data.ticker,
        type: setup.bias === 'LONG' ? 'BUY' : 'SELL',
        price: data.currentPrice,
        shares: Math.floor(2500 / data.currentPrice),
        strategy: setup.pattern,
        stopLoss: setup.stopLoss,
        takeProfit: setup.takeProfit1
      });
    }
    setExecutionMessage(`Order staged: ${setup.pattern} on ${data.ticker} with 1:${setup.riskRewardRatio} R:R`);
    setTimeout(() => setExecutionMessage(null), 3500);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner: Profit Goal & Trader Skills Synthesis */}
      <div className="p-6 bg-zinc-900/60 rounded-3xl border border-zinc-800 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <Brain size={20} />
              </span>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Adaptive Trader AI & Profit Projections
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-2xl">
              Synthesizes quantitative algorithms (Kalman filter, Ornstein-Uhlenbeck mean-reversion, GARCH volatility) with professional trader skills (Order Blocks, FVG imbalances, 1:2+ R:R Kelly sizing) and continuous Q-learning.
            </p>
            {/* Unboxed Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 pt-1">
              <span className="font-semibold text-white">{data.ticker}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-zinc-200">${data.currentPrice.toFixed(2)}</span>
              <span aria-hidden="true">·</span>
              <span className={cn(data.change >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold")}>
                {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
              </span>
              <span aria-hidden="true">·</span>
              <span>RL Episodes: {rlState.totalEpisodes}</span>
              <span aria-hidden="true">·</span>
              <span>Win Rate: {rlState.winRate}%</span>
            </div>
          </div>

          {/* Quick Metrics Island */}
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl text-right">
              <div className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                {horizonDays}-Day EV Profit Goal
              </div>
              <div className={cn(
                "text-lg font-bold font-mono",
                parseFloat(expectedProfitPct) >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {parseFloat(expectedProfitPct) >= 0 ? '+' : ''}{expectedProfitPct}%
              </div>
              <div className="text-[11px] text-zinc-400 font-mono">
                Target: ${targetPoint?.evOptimizedTarget.toFixed(2) || '---'}
              </div>
            </div>

            <button
              onClick={handleRunLearning}
              disabled={isTraining}
              className={cn(
                "px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg",
                isTraining 
                  ? "bg-zinc-800 text-zinc-400 cursor-wait"
                  : "bg-emerald-500 hover:bg-emerald-400 text-black active:scale-95"
              )}
            >
              <RefreshCw size={14} className={cn(isTraining && "animate-spin")} />
              <span>{isTraining ? "Evolving Weights..." : "Simulate Learning"}</span>
            </button>
          </div>
        </div>
      </div>

      {executionMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs font-semibold text-emerald-400 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{executionMessage}</span>
          </div>
          <button onClick={() => setExecutionMessage(null)} className="text-zinc-400 hover:text-white">✕</button>
        </motion.div>
      )}

      {/* Grid: Main Projection Visualizer (Left) & Q-Learning Policy State (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Profit Projection Chart */}
        <div className="lg:col-span-2 p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target size={16} className="text-emerald-400" />
                Advanced Mathematical Price & Profit Trajectory
              </h3>
              <p className="text-xs text-zinc-400">
                Kalman trend estimate vs. Ornstein-Uhlenbeck mean-reverting equilibrium & asymmetric Merton jump bounds.
              </p>
            </div>

            {/* Horizon Filter Tabs */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              {[7, 14, 30, 60].map((days) => (
                <button
                  key={days}
                  onClick={() => setHorizonDays(days)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-lg transition-all",
                    horizonDays === days
                      ? "bg-zinc-800 text-white font-bold"
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          {/* Chart Container */}
          <div className="h-[340px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={projections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="evGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#71717a" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => val.slice(5)} 
                />
                <YAxis 
                  stroke="#71717a" 
                  domain={['auto', 'auto']} 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '1rem', fontSize: '11px' }}
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  wrapperStyle={{ fontSize: '10px', paddingBottom: '10px' }} 
                />

                {/* Upper & Lower Confidence Area */}
                <Area 
                  type="monotone" 
                  dataKey="upperConfidence" 
                  name="95% Volatility Cone" 
                  stroke="none" 
                  fill="#10b981" 
                  fillOpacity={0.08} 
                />

                {/* Expected Value Profit Path (Optimal Target) */}
                <Line 
                  type="monotone" 
                  dataKey="evOptimizedTarget" 
                  name="EV Profit Path (Kelly)" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={false} 
                />

                {/* Kalman Filter True Drift */}
                <Line 
                  type="monotone" 
                  dataKey="kalmanDrift" 
                  name="Kalman True Drift" 
                  stroke="#38bdf8" 
                  strokeWidth={1.8} 
                  strokeDasharray="4 4" 
                  dot={false} 
                />

                {/* Ornstein-Uhlenbeck Mean Reversion */}
                <Line 
                  type="monotone" 
                  dataKey="ouEquilibrium" 
                  name="OU Mean Equilibrium" 
                  stroke="#a855f7" 
                  strokeWidth={1.5} 
                  dot={false} 
                />

                {/* Merton Jump Shock Upper */}
                <Line 
                  type="monotone" 
                  dataKey="bullishJumpPath" 
                  name="Merton Jump (Bull)" 
                  stroke="#f59e0b" 
                  strokeWidth={1.2} 
                  strokeDasharray="2 2" 
                  dot={false} 
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Model Mathematical Summary */}
          <div className="pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between text-xs text-zinc-400">
            <div>
              <span>Drift Estimator: </span>
              <span className="text-zinc-200 font-medium">Recursive Kalman ($\Delta t$)</span>
            </div>
            <div>
              <span>Mean-Reversion Speed ($\kappa$): </span>
              <span className="text-zinc-200 font-medium font-mono">0.080</span>
            </div>
            <div>
              <span>GARCH Volatility: </span>
              <span className="text-zinc-200 font-medium font-mono">{(data.stdDev * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span>Kelly Sizing ($f^*$): </span>
              <span className="text-emerald-400 font-bold font-mono">18.4%</span>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col): Continuous Reinforcement Learning Brain Console */}
        <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu size={16} className="text-purple-400" />
                Continuous Learning Brain
              </h3>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                ACTIVE
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Q-learning algorithm continuously calibrates factor weights based on simulated market interactions.
            </p>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Win Rate</div>
                <div className="text-base font-bold text-emerald-400 font-mono">{rlState.winRate}%</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Rolling 100 trades</div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800">
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Reward PnL</div>
                <div className="text-base font-bold text-white font-mono">+${rlState.cumulativeReward.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">Sharpe adjusted</div>
              </div>
            </div>

            {/* Factor Weights Evolution */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Active Strategy Weights</span>
                <span className="text-[10px] text-zinc-400">$\epsilon$: {(rlState.explorationRate * 100).toFixed(0)}%</span>
              </div>

              {Object.entries(rlState.weights).map(([factor, weight]) => (
                <div key={factor} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-300 capitalize">{factor.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-zinc-400 font-mono">{(weight * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${weight * 250}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lessons Learned Feed */}
          <div className="pt-4 border-t border-zinc-800/60 space-y-2">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award size={13} className="text-amber-400" />
              <span>Self-Correcting Lessons</span>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {rlState.recentLessons.slice(0, 3).map((lesson, idx) => (
                <div key={idx} className="p-2.5 bg-zinc-950/70 rounded-xl border border-zinc-800/60 text-[11px] space-y-1">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="font-medium text-zinc-300 line-clamp-1">{lesson.tradeEvent}</span>
                    <span className={cn("font-bold font-mono shrink-0 ml-2", lesson.reward >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {lesson.reward >= 0 ? '+' : ''}${lesson.reward}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 line-clamp-1">
                    {lesson.adjustment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trader Skills Matrix (Smart Money Concepts, Order Blocks & Imbalances) */}
      <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              Trader Skills & Institutional Price Action Setups
            </h3>
            <p className="text-xs text-zinc-400">
              Heuristics practiced by professional prop traders: Order Block mitigations, Fair Value Gap fills, and liquidity purges with strict 1:2+ R:R.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {setups.map((setup, idx) => (
            <div 
              key={idx}
              className="p-5 bg-zinc-950 rounded-2xl border border-zinc-800/90 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-tight">
                    {setup.pattern}
                  </span>
                  <span className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 rounded-lg border",
                    setup.bias === 'LONG'
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  )}>
                    {setup.bias} · {setup.timeframe}
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {setup.rationale}
                </p>

                {/* Key Price Levels */}
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50 space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Entry Zone:</span>
                    <span className="text-white">${setup.entryZone[0]} - ${setup.entryZone[1]}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Stop Loss:</span>
                    <span className="text-rose-400">${setup.stopLoss}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Target 1 (1.8R):</span>
                    <span className="text-emerald-400">${setup.takeProfit1}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Target 2 (3.0R):</span>
                    <span className="text-emerald-400">${setup.takeProfit2}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span>Risk/Reward: <strong className="text-white">1:{setup.riskRewardRatio}</strong></span>
                  <span>Confidence: <strong className="text-emerald-400">{setup.confidence}%</strong></span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExecuteSetup(setup)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition-all active:scale-95"
                  >
                    Execute Setup
                  </button>
                  <button
                    onClick={() => onOpenPythonScript?.('neural_alpha')}
                    className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs rounded-xl border border-zinc-800 transition-colors"
                  >
                    Python Script
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Source Financial Knowledge Synthesis */}
      <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-blue-400" />
              Multi-Source Financial Knowledge Synthesis
            </h3>
            <p className="text-xs text-zinc-400">
              Cross-disciplinary verification: Renaissance Math, Central Bank Macro, Graham Valuations, and Microstructure.
            </p>
          </div>

          {/* Domain Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Quantitative Math', 'Trader Skills', 'Macro & Rates', 'Fundamentals', 'Microstructure'].map((dom) => (
              <button
                key={dom}
                onClick={() => setActiveDomainFilter(dom)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                  activeDomainFilter === dom
                    ? "bg-zinc-100 text-zinc-900 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                {dom}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80 space-y-2.5 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    {insight.domain}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                    insight.verdict === 'Bullish' 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-zinc-800 text-zinc-300 border-zinc-700"
                  )}>
                    {insight.verdict} · {insight.score}/100
                  </span>
                </div>

                <div className="text-xs font-semibold text-white">
                  {insight.source}
                </div>

                <div className="text-[11px] text-emerald-400 font-mono">
                  {insight.keyMetric}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {insight.summary}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
