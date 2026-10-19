import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  PieChart,
  Target,
  Sliders,
  Play,
  Download,
  Copy,
  Check,
  Code,
  FileText,
  Sparkles,
  Zap,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Info,
  Layers,
  RefreshCw,
  FolderGit2,
  BookOpen,
  Cpu,
  Brain
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  fetchMomentumBacktest,
  fetchMonteCarloRisk,
  fetchPairsTrading,
  fetchEfficientFrontier,
  fetchPortfolioDocumentation,
  MomentumBacktestResult,
  MonteCarloRiskResult,
  PairsTradingResult,
  EfficientFrontierResult,
  PortfolioDocumentationResult
} from '../../services/api/quantPortfolioService';
import { soundEngine } from '../../utils/audioAlerts';
import { cn } from '../../utils/cn';

interface QuantPortfolioSuiteProps {
  initialTicker?: string;
  onSelectTicker?: (ticker: string) => void;
  onOpenRiskEngine?: () => void;
  onOpenFinviz?: () => void;
  onSendToQuantLab?: (ticker: string) => void;
}

export type QuantProjectTab = 'momentum' | 'monte_carlo' | 'pairs' | 'frontier' | 'defense';

export const QuantPortfolioSuite: React.FC<QuantPortfolioSuiteProps> = ({
  initialTicker = 'NVDA',
  onSelectTicker,
  onOpenRiskEngine,
  onOpenFinviz,
  onSendToQuantLab
}) => {
  const [activeTab, setActiveTab] = useState<QuantProjectTab>('momentum');
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  // 1. Momentum State
  const [lookbackDays, setLookbackDays] = useState<number>(20);
  const [stopLossPct, setStopLossPct] = useState<number>(4.0);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(12.0);
  const [momentumData, setMomentumData] = useState<MomentumBacktestResult | null>(null);

  // 2. Monte Carlo State
  const [horizonDays, setHorizonDays] = useState<number>(90);
  const [simsCount, setSimsCount] = useState<number>(1500);
  const [annualVol, setAnnualVol] = useState<number>(0.35);
  const [jumpIntensity, setJumpIntensity] = useState<number>(0.10);
  const [mcData, setMcData] = useState<MonteCarloRiskResult | null>(null);

  // 3. Pairs Trading State
  const [pairY, setPairY] = useState<string>('NVDA');
  const [pairX, setPairX] = useState<string>('AMD');
  const [entryZ, setEntryZ] = useState<number>(2.0);
  const [pairsData, setPairsData] = useState<PairsTradingResult | null>(null);

  // 4. Efficient Frontier State
  const [selectedBasket, setSelectedBasket] = useState<string[]>(['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL']);
  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.0425);
  const [maxWeight, setMaxWeight] = useState<number>(0.35);
  const [frontierData, setFrontierData] = useState<EfficientFrontierResult | null>(null);

  // 5. Defense Guide State
  const [docData, setDocData] = useState<PortfolioDocumentationResult | null>(null);

  // Fetch initial data on mount
  useEffect(() => {
    runMomentum();
    runMonteCarlo();
    runPairs();
    runFrontier();
    loadDocs();
  }, []);

  const runMomentum = async (t = selectedTicker, lb = lookbackDays, sl = stopLossPct, tp = takeProfitPct) => {
    setIsLoading(true);
    try {
      const res = await fetchMomentumBacktest({ ticker: t, lookback: lb, stopLoss: sl, takeProfit: tp });
      setMomentumData(res);
    } catch (e) {
      console.warn('Fallback local momentum execution:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const runMonteCarlo = async (t = selectedTicker, h = horizonDays, s = simsCount, v = annualVol, j = jumpIntensity) => {
    setIsLoading(true);
    try {
      const res = await fetchMonteCarloRisk({ ticker: t, horizon: h, sims: s, vol: v, jump: j });
      setMcData(res);
    } catch (e) {
      console.warn('Fallback local MC execution:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const runPairs = async (y = pairY, x = pairX, ez = entryZ) => {
    setIsLoading(true);
    try {
      const res = await fetchPairsTrading({ tickerY: y, tickerX: x, entryZ: ez });
      setPairsData(res);
    } catch (e) {
      console.warn('Fallback local pairs execution:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const runFrontier = async (basket = selectedBasket, rf = riskFreeRate, mw = maxWeight) => {
    setIsLoading(true);
    try {
      const res = await fetchEfficientFrontier({ tickers: basket, rf, maxWeight: mw });
      setFrontierData(res);
    } catch (e) {
      console.warn('Fallback local frontier execution:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocs = async () => {
    try {
      const res = await fetchPortfolioDocumentation();
      setDocData(res);
    } catch (e) {
      // Ignore
    }
  };

  const handleCopyCode = (codeText: string) => {
    navigator.clipboard.writeText(codeText);
    setCodeCopied(true);
    soundEngine.playNotificationTap();
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const currentPythonSnippet = useMemo(() => {
    if (activeTab === 'momentum') return momentumData?.pythonCode || '';
    if (activeTab === 'monte_carlo') return mcData?.pythonCode || '';
    if (activeTab === 'pairs') return pairsData?.pythonCode || '';
    if (activeTab === 'frontier') return frontierData?.pythonCode || '';
    return docData?.readme || '';
  }, [activeTab, momentumData, mcData, pairsData, frontierData, docData]);

  const handleDownloadAllScripts = () => {
    soundEngine.playNotificationTap();
    const fullBundle = `# =============================================================================
# QuantLab Institutional Quantitative Portfolio Suite
# 4 Complete Projects with Mathematics & Interview Defense Playbook
# =============================================================================

# PROJECT 1: MOMENTUM STRATEGY BACKTESTING
${momentumData?.pythonCode || '# (Momentum code)'}

# =============================================================================
# PROJECT 2: MONTE CARLO MERTON JUMP DIFFUSION & RISK
${mcData?.pythonCode || '# (Monte Carlo code)'}

# =============================================================================
# PROJECT 3: COINTEGRATION & MEAN REVERSION PAIRS TRADING
${pairsData?.pythonCode || '# (Pairs Trading code)'}

# =============================================================================
# PROJECT 4: EFFICIENT FRONTIER PORTFOLIO OPTIMIZATION (MPT)
${frontierData?.pythonCode || '# (Efficient Frontier code)'}
`;

    const blob = new Blob([fullBundle], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quant_portfolio_complete_suite.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* 1. Header Banner inspired by Quant Grad */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/95 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Institutional Quantitative Portfolio
              </span>
              <span className="text-zinc-500 text-xs">·</span>
              <span className="text-xs font-mono text-zinc-400">
                Python · Statistics · Probability · Risk Defense
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              The 5 Flagship Quant Portfolio Projects
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed">
              &quot;Don’t wait until you apply to start building your portfolio. Build projects that demonstrate your ability to work with Python, statistics, probability, backtesting, portfolio optimization, and quantitative models. The goal is to build something you can <strong className="text-zinc-200">explain, defend, and improve</strong>.&quot;
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadAllScripts}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Download size={14} />
              <span>Export Full Python Suite</span>
            </button>
            <button
              onClick={() => setShowCodeModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 transition-all"
            >
              <Code size={14} className="text-cyan-400" />
              <span>Inspect Python Code</span>
            </button>
          </div>
        </div>

        {/* 5 Project Pillar Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-6 pt-5 border-t border-zinc-800/80 text-xs font-mono">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="truncate">Momentum Backtest</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="truncate">Monte Carlo Risk</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
            <span className="truncate">Pairs Mean-Reversion</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold">4</span>
            <span className="truncate">Efficient Frontier</span>
          </div>
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">5</span>
            <span className="truncate">Defense Playbook</span>
          </div>
        </div>
      </div>

      {/* 2. Interactive Navigation Tabs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 shadow-lg flex items-center justify-between overflow-x-auto scrollbar-none">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {[
            { id: 'momentum', label: '1. Momentum Backtesting', icon: TrendingUp, color: 'text-cyan-400' },
            { id: 'monte_carlo', label: '2. Monte Carlo & VaR', icon: Zap, color: 'text-emerald-400' },
            { id: 'pairs', label: '3. Pairs Mean-Reversion', icon: Activity, color: 'text-amber-400' },
            { id: 'frontier', label: '4. Efficient Frontier (MPT)', icon: PieChart, color: 'text-purple-400' },
            { id: 'defense', label: '5. Interview Defense Guide', icon: FolderGit2, color: 'text-rose-400' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as QuantProjectTab);
                  soundEngine.playNotificationTap();
                }}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 whitespace-nowrap",
                  isActive
                    ? "bg-zinc-800 text-white shadow-md border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
                )}
              >
                <Icon size={14} className={isActive ? tab.color : "text-zinc-500"} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Tab Contents */}

      {/* ==================================================================== */}
      {/* TAB 1: MOMENTUM STRATEGY BACKTESTING */}
      {/* ==================================================================== */}
      {activeTab === 'momentum' && (
        <div className="space-y-5">
          {/* Controls Ribbon */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Ticker:</span>
                <div className="flex items-center gap-1">
                  {['NVDA', 'TSLA', 'AAPL', 'AMD', 'SPY'].map(t => (
                    <button
                      key={t}
                      onClick={() => {
                        setSelectedTicker(t);
                        runMomentum(t, lookbackDays, stopLossPct, takeProfitPct);
                        soundEngine.playNotificationTap();
                      }}
                      className={cn(
                        "px-2 py-1 rounded text-xs font-bold transition-all",
                        selectedTicker === t
                          ? "bg-cyan-500 text-black"
                          : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lookback Slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Lookback:</span>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={lookbackDays}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setLookbackDays(val);
                    runMomentum(selectedTicker, val, stopLossPct, takeProfitPct);
                  }}
                  className="w-24 accent-cyan-500 cursor-pointer"
                />
                <span className="text-cyan-400 font-bold">{lookbackDays}d (MA{lookbackDays*3})</span>
              </div>

              {/* Stop Loss & Take Profit */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Stop:</span>
                  <span className="text-rose-400 font-bold">-{stopLossPct}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Take Profit:</span>
                  <span className="text-emerald-400 font-bold">+{takeProfitPct}%</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => runMomentum()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-cyan-300 border border-zinc-700 transition-all"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Re-run Backtest</span>
            </button>
          </div>

          {/* Metric KPIs */}
          {momentumData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Strategy Return</div>
                <div className={cn("text-xl font-mono font-black mt-1", momentumData.totalReturnPct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {momentumData.totalReturnPct >= 0 ? '+' : ''}{momentumData.totalReturnPct}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">SPY: +{momentumData.benchmarkReturnPct}%</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Alpha vs SPY</div>
                <div className={cn("text-xl font-mono font-black mt-1", momentumData.alpha >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {momentumData.alpha >= 0 ? '+' : ''}{momentumData.alpha}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Net excess return</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Sharpe Ratio</div>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">
                  {momentumData.sharpeRatio}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Risk-adjusted return</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Sortino Ratio</div>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {momentumData.sortinoRatio}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Downside penalized</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Max Drawdown</div>
                <div className="text-xl font-mono font-black text-rose-400 mt-1">
                  -{momentumData.maxDrawdownPct}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Peak-to-trough drop</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Win Rate</div>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">
                  {momentumData.winRate}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{momentumData.totalTrades} closed trades</div>
              </div>
            </div>
          )}

          {/* Equity Curve Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <TrendingUp size={16} className="text-cyan-400" />
                  <span>Cumulative Equity Curve: Strategy vs Benchmark</span>
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Initial Capital: $100,000 · 5 bps transaction friction modeled per turn
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {momentumData && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={momentumData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} fontFamily="monospace" tickFormatter={d => d.slice(5)} />
                    <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" domain={['auto', 'auto']} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                      labelStyle={{ color: '#a1a1aa', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="portfolio" name="Momentum Strategy" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="benchmark" name="SPY Benchmark" stroke="#71717a" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: MONTE CARLO RISK SIMULATION & MERTON JUMP DIFFUSION */}
      {/* ==================================================================== */}
      {activeTab === 'monte_carlo' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Horizon:</span>
                {[30, 90, 180, 252].map(h => (
                  <button
                    key={h}
                    onClick={() => {
                      setHorizonDays(h);
                      runMonteCarlo(selectedTicker, h, simsCount, annualVol, jumpIntensity);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-bold transition-all",
                      horizonDays === h
                        ? "bg-emerald-500 text-black font-black"
                        : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                    )}
                  >
                    {h}d
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Simulations:</span>
                <span className="text-zinc-200 font-bold">{simsCount.toLocaleString()} paths</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Volatility ($\sigma$):</span>
                <input
                  type="range"
                  min="0.15"
                  max="0.65"
                  step="0.05"
                  value={annualVol}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setAnnualVol(val);
                    runMonteCarlo(selectedTicker, horizonDays, simsCount, val, jumpIntensity);
                  }}
                  className="w-24 accent-emerald-500 cursor-pointer"
                />
                <span className="text-emerald-400 font-bold">{Math.round(annualVol * 100)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Poisson Jump ($\lambda$):</span>
                <input
                  type="range"
                  min="0.0"
                  max="0.25"
                  step="0.05"
                  value={jumpIntensity}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setJumpIntensity(val);
                    runMonteCarlo(selectedTicker, horizonDays, simsCount, annualVol, val);
                  }}
                  className="w-20 accent-emerald-500 cursor-pointer"
                />
                <span className="text-amber-400 font-bold">{jumpIntensity.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => runMonteCarlo()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-emerald-300 border border-zinc-700 transition-all"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Simulate</span>
            </button>
          </div>

          {/* Risk Metrics KPI cards */}
          {mcData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">95% Value-at-Risk (VaR)</div>
                <div className="text-xl font-mono font-black text-rose-400 mt-1">
                  -{mcData.var95Pct}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Maximum 95% threshold loss</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">99% Value-at-Risk (VaR)</div>
                <div className="text-xl font-mono font-black text-rose-500 mt-1">
                  -{mcData.var99Pct}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Extreme tail risk bound</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">95% Expected Shortfall (CVaR)</div>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">
                  -{mcData.cvar95Pct}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Average loss beyond 95% VaR</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Probability of Profit</div>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {mcData.probProfit}%
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Paths ending &gt; ${mcData.initialPrice}</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Expected Median Price</div>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">
                  ${mcData.expectedMedian}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">50th percentile outcome</div>
              </div>
            </div>
          )}

          {/* Fan Chart Distribution */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Zap size={16} className="text-emerald-400" />
                  <span>Monte Carlo Fan Chart: Percentile Distribution Cones</span>
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  5th, 25th, 50th median, 75th, and 95th percentile projection bands with sample jump-diffusion paths
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {mcData && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={mcData.fanChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" domain={['auto', 'auto']} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                      labelStyle={{ color: '#a1a1aa', fontFamily: 'monospace' }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="p95" name="95th Percentile" stroke="#10b981" strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="p75" name="75th Percentile" stroke="#34d399" dot={false} />
                    <Line type="monotone" dataKey="median" name="50th Median Path" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="p25" name="25th Percentile" stroke="#fb7185" dot={false} />
                    <Line type="monotone" dataKey="p5" name="5th Percentile (VaR)" stroke="#f43f5e" strokeDasharray="3 3" dot={false} />
                    <Line type="monotone" dataKey="path1" name="Sample Path A" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: MEAN-REVERSION PAIRS TRADING (COINTEGRATION & ADF) */}
      {/* ==================================================================== */}
      {activeTab === 'pairs' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Pair Presets:</span>
                {[
                  { y: 'NVDA', x: 'AMD' },
                  { y: 'GOOGL', x: 'MSFT' },
                  { y: 'AAPL', x: 'TSLA' },
                  { y: 'SPY', x: 'QQQ' }
                ].map(p => (
                  <button
                    key={`${p.y}-${p.x}`}
                    onClick={() => {
                      setPairY(p.y);
                      setPairX(p.x);
                      runPairs(p.y, p.x, entryZ);
                      soundEngine.playNotificationTap();
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-bold transition-all",
                      pairY === p.y && pairX === p.x
                        ? "bg-amber-500 text-black font-black"
                        : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                    )}
                  >
                    {p.y} / {p.x}
                  </button>
                ))}
              </div>

              {/* Entry Z-score slider */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Entry Z-Score:</span>
                <input
                  type="range"
                  min="1.5"
                  max="3.0"
                  step="0.25"
                  value={entryZ}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setEntryZ(val);
                    runPairs(pairY, pairX, val);
                  }}
                  className="w-20 accent-amber-500 cursor-pointer"
                />
                <span className="text-amber-400 font-bold">±{entryZ.toFixed(2)}\sigma</span>
              </div>
            </div>

            <button
              onClick={() => runPairs()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-amber-300 border border-zinc-700 transition-all"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Test Cointegration</span>
            </button>
          </div>

          {/* Cointegration Diagnostics */}
          {pairsData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Hedge Ratio (\beta)</div>
                <div className="text-xl font-mono font-black text-amber-400 mt-1">
                  {pairsData.hedgeRatioBeta}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">OLS slope coefficient</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">ADF Test Statistic</div>
                <div className="text-xl font-mono font-black text-cyan-400 mt-1">
                  {pairsData.adfStatistic}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Critical 5%: -2.86</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Stationarity p-value</div>
                <div className={cn("text-xl font-mono font-black mt-1", pairsData.pValue < 0.05 ? "text-emerald-400" : "text-rose-400")}>
                  {pairsData.pValue}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {pairsData.pValue < 0.05 ? "Stationary (Cointegrated)" : "Unit root present"}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Ornstein-Uhlenbeck Half-Life</div>
                <div className="text-xl font-mono font-black text-purple-400 mt-1">
                  {pairsData.halfLifeDays} Days
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Mean-reversion velocity</div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl">
                <div className="text-[10px] font-mono text-zinc-400 uppercase">Strategy PnL</div>
                <div className="text-xl font-mono font-black text-emerald-400 mt-1">
                  +${pairsData.cumulativePnl.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{pairsData.totalTrades} arbitrage round-trips</div>
              </div>
            </div>
          )}

          {/* Spread & Z-Score Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Activity size={16} className="text-amber-400" />
                  <span>Spread Normalized Z-Score & Mean Reversion Bands (±{entryZ}\sigma)</span>
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Spread = {pairY} - ({pairsData?.hedgeRatioBeta} × {pairX}). Enter long when z &lt; -{entryZ}, short when z &gt; +{entryZ}.
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {pairsData && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pairsData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={10} fontFamily="monospace" />
                    <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" domain={[-4, 4]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                      labelStyle={{ color: '#a1a1aa', fontFamily: 'monospace' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <ReferenceLine y={entryZ} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: `Short Threshold (+${entryZ}\sigma)`, fill: '#f59e0b', fontSize: 10 }} />
                    <ReferenceLine y={0} stroke="#71717a" strokeWidth={1} />
                    <ReferenceLine y={-entryZ} stroke="#10b981" strokeDasharray="3 3" label={{ value: `Long Threshold (-${entryZ}\sigma)`, fill: '#10b981', fontSize: 10 }} />
                    <Line type="monotone" dataKey="zScore" name="Spread Z-Score" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: EFFICIENT FRONTIER PORTFOLIO OPTIMIZATION (MPT) */}
      {/* ==================================================================== */}
      {activeTab === 'frontier' && (
        <div className="space-y-5">
          {/* Controls */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-md flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Universe Baskets:</span>
                {[
                  { name: 'Mega Tech', tickers: ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'] },
                  { name: 'Balanced 60/40', tickers: ['SPY', 'TLT', 'GLD', 'NVDA'] },
                  { name: 'Semis & AI', tickers: ['NVDA', 'AMD', 'TSM', 'QCOM'] }
                ].map(b => (
                  <button
                    key={b.name}
                    onClick={() => {
                      setSelectedBasket(b.tickers);
                      runFrontier(b.tickers, riskFreeRate, maxWeight);
                      soundEngine.playNotificationTap();
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-bold transition-all",
                      selectedBasket.join(',') === b.tickers.join(',')
                        ? "bg-purple-500 text-white font-black"
                        : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                    )}
                  >
                    {b.name}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Risk-Free Rate ($r_f$):</span>
                <span className="text-purple-300 font-bold">{(riskFreeRate * 100).toFixed(2)}%</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-zinc-500 uppercase font-bold">Max Allocation Cap:</span>
                <span className="text-zinc-200 font-bold">{Math.round(maxWeight * 100)}%</span>
              </div>
            </div>

            <button
              onClick={() => runFrontier()}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-purple-300 border border-zinc-700 transition-all"
            >
              <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
              <span>Optimize Weights</span>
            </button>
          </div>

          {/* Frontier Optimal Weights Breakdown */}
          {frontierData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Max Sharpe Portfolio */}
              <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">
                      TANGENCY PORTFOLIO
                    </span>
                    <h4 className="font-bold text-white text-sm font-mono">Maximum Sharpe Ratio</h4>
                  </div>
                  <div className="text-xs font-mono font-black text-purple-400">
                    Sharpe: {frontierData.maxSharpePortfolio?.sharpe}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">Expected Return:</span>
                    <div className="text-lg font-bold text-emerald-400">+{frontierData.maxSharpePortfolio?.ret}%</div>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">Annualized Volatility:</span>
                    <div className="text-lg font-bold text-amber-400">{frontierData.maxSharpePortfolio?.vol}%</div>
                  </div>
                </div>

                {/* Weight bars */}
                <div className="space-y-1.5 pt-2 text-xs font-mono">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Asset Allocation Weights:</span>
                  {Object.entries(frontierData.maxSharpePortfolio?.weights || {}).map(([t, w]) => (
                    <div key={t} className="flex items-center gap-2">
                      <span className="w-12 font-bold text-zinc-300">{t}</span>
                      <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: `${w}%` }} />
                      </div>
                      <span className="w-10 text-right text-zinc-400 font-bold">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Minimum Volatility Portfolio */}
              <div className="bg-zinc-900 border border-cyan-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      MIN VOLATILITY
                    </span>
                    <h4 className="font-bold text-white text-sm font-mono">Minimum Variance Portfolio</h4>
                  </div>
                  <div className="text-xs font-mono font-black text-cyan-400">
                    Sharpe: {frontierData.minVolatilityPortfolio?.sharpe}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">Expected Return:</span>
                    <div className="text-lg font-bold text-emerald-400">+{frontierData.minVolatilityPortfolio?.ret}%</div>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <span className="text-zinc-500 text-[10px]">Annualized Volatility:</span>
                    <div className="text-lg font-bold text-cyan-400">{frontierData.minVolatilityPortfolio?.vol}%</div>
                  </div>
                </div>

                {/* Weight bars */}
                <div className="space-y-1.5 pt-2 text-xs font-mono">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Asset Allocation Weights:</span>
                  {Object.entries(frontierData.minVolatilityPortfolio?.weights || {}).map(([t, w]) => (
                    <div key={t} className="flex items-center gap-2">
                      <span className="w-12 font-bold text-zinc-300">{t}</span>
                      <div className="flex-1 bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
                        <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${w}%` }} />
                      </div>
                      <span className="w-10 text-right text-zinc-400 font-bold">{w}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Efficient Frontier Curve Chart */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <PieChart size={16} className="text-purple-400" />
                  <span>Markowitz Mean-Variance Efficient Frontier Cloud</span>
                </h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  1,200 simulated Monte Carlo allocations plotted with the optimal quadratic frontier hyperbola
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              {frontierData && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={frontierData.frontierCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="vol" stroke="#71717a" fontSize={10} fontFamily="monospace" unit="%" tickFormatter={v => `${v}%`} />
                    <YAxis stroke="#71717a" fontSize={10} fontFamily="monospace" unit="%" tickFormatter={v => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                      labelStyle={{ color: '#a1a1aa', fontFamily: 'monospace' }}
                      formatter={(val: any, name: string) => [`${val}%`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                    <Line type="monotone" dataKey="ret" name="Efficient Frontier Curve" stroke="#c084fc" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: GITHUB DOCUMENTATION & QUANT INTERVIEW DEFENSE GUIDE */}
      {/* ==================================================================== */}
      {activeTab === 'defense' && (
        <div className="space-y-5">
          {/* Defense Philosophy Banner */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                INTERVIEW DEFENSE PLAYBOOK
              </span>
              <h3 className="text-base font-bold text-white font-mono mt-1">
                How to Explain, Defend, and Improve Your Quant Portfolio
              </h3>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Top quantitative hedge funds (Citadel, Two Sigma, Millennium, Jane Street) care about your reasoning, risk awareness, and boundary conditions far more than raw lines of code.
              </p>
            </div>
            <button
              onClick={handleDownloadAllScripts}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 text-black hover:bg-cyan-400 transition-all flex items-center gap-1.5 shadow-md flex-shrink-0"
            >
              <Download size={13} />
              <span>Download GitHub Repo</span>
            </button>
          </div>

          {/* Defense Questions Accordion / Cards */}
          <div className="space-y-4">
            {[
              {
                model: 'Model 1: Momentum Strategy Backtesting',
                question: 'How do you defend against backtest overfitting (p-hacking) when selecting lookback windows?',
                defense: 'We implement Marcos Lopez de Prado’s Combinatorial Purged Cross-Validation (CPCV) and calculate the Deflated Sharpe Ratio (DSR), which penalizes the observed Sharpe ratio by the number of independent trials tested and the non-normality (skewness/kurtosis) of returns.',
                improvement: 'Add volatility targeting to scale position sizes inversely to rolling realized volatility, preventing momentum crashes during sudden market selloffs.'
              },
              {
                model: 'Model 2: Monte Carlo & Merton Jump Diffusion',
                question: 'Why use Merton Jump-Diffusion instead of standard Geometric Brownian Motion?',
                defense: 'Standard GBM assumes continuous log-normal returns with light tails, severely underestimating tail risk and market crashes. Merton Jump Diffusion introduces a Poisson jump component that accurately captures discrete shocks (earnings gaps, macro announcements, black swans) observed in real market returns.',
                improvement: 'Incorporate local or stochastic volatility (Heston model) to capture the volatility smile and skew across strikes.'
              },
              {
                model: 'Model 3: Mean-Reversion Pairs Trading',
                question: 'What is the key difference between correlation and cointegration?',
                defense: 'Correlation measures short-term co-movement of returns (stationary changes), which can easily break down over time. Cointegration measures a true long-term stationary equilibrium relationship between price levels (integrated series of order 1). Two non-stationary series can have zero correlation yet be cointegrated.',
                improvement: 'Use the Johansen test to expand beyond 2-asset pairs into multi-asset cointegrated baskets (eigenvector portfolios), and apply Kalman Filtering for dynamic time-varying hedge ratios.'
              },
              {
                model: 'Model 4: Modern Portfolio Theory (Efficient Frontier)',
                question: 'What is the primary flaw of naive Markowitz optimization in practice, and how do you resolve it?',
                defense: 'Markowitz mean-variance optimization is an "error maximizer"—small estimation errors in expected returns vector mu lead to extreme, unfeasible weights (Garbage In, Garbage Out). In production, we resolve this by applying Black-Litterman Bayesian blending of market equilibrium with investor views, or shrinkage estimators (Ledoit-Wolf) for the covariance matrix.',
                improvement: 'Implement Hierarchical Risk Parity (HRP) via machine learning tree clustering to bypass covariance matrix inversion entirely.'
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                    {item.model}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-zinc-800 text-zinc-400">
                    Interview Q#{idx + 1}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white font-mono">
                  &ldquo;{item.question}&rdquo;
                </h4>

                <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2 text-xs font-mono">
                  <div>
                    <span className="text-emerald-400 font-bold uppercase text-[10px] mr-1.5">[How To Defend]:</span>
                    <span className="text-zinc-300 font-sans leading-relaxed">{item.defense}</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-850">
                    <span className="text-purple-400 font-bold uppercase text-[10px] mr-1.5">[How To Improve]:</span>
                    <span className="text-zinc-400 font-sans leading-relaxed">{item.improvement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Full Python Code Inspector Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-2">
                <Code className="text-cyan-400" size={18} />
                <h3 className="font-bold text-white text-sm font-mono">
                  Python Quantitative Source Code ({activeTab.replace('_', ' ').toUpperCase()})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyCode(currentPythonSnippet)}
                  className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                >
                  {codeCopied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
                </button>
                <button
                  onClick={() => setShowCodeModal(false)}
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-zinc-300 bg-zinc-950">
              <pre className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 overflow-x-auto leading-relaxed text-[11px] text-cyan-200">
                {currentPythonSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
