import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, ReferenceLine
} from 'recharts';
import { 
  Zap, 
  Play, 
  RefreshCw, 
  Settings, 
  Sliders, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  BarChart3, 
  Download, 
  Calendar, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Cpu, 
  Gauge, 
  FileSpreadsheet,
  Check,
  FileCheck,
  FileText,
  Flame,
  Award,
  AlertCircle,
  Radio,
  Globe
} from 'lucide-react';
import { cn } from '../utils/cn';
import { StockData } from '../types';
import { portfolioManager, StrategyConfig } from '../services/PortfolioManager';
import { EXPANDED_STOCK_DATABASE } from '../data/expandedStockDatabase';
import DataValidityAndMicroCalibration from './DataValidityAndMicroCalibration';
import GlobalNewsScan3D from './GlobalNewsScan3D';
import {
  HFTStrategyType,
  HFTParameters,
  HFTTradeRecord,
  HFTEquityPoint,
  HFTBacktestSummary,
  RawCandle,
  HFT_STRATEGIES,
  TIMEFRAME_PRESETS,
  TimeframePreset,
  executeHFTBacktestSimulation,
  runFullHFTAutomatedTestSuite,
  generateSynthesizedCandles,
  MasterAutomationReport
} from '../utils/hftEngine';

export interface HFTBacktestEngineProps {
  initialTicker?: string;
  allData?: Record<string, StockData>;
  onDeployStrategy?: (strategy: StrategyConfig) => void;
  className?: string;
}

// Preset liquid HFT tickers for quick access
const POPULAR_HFT_TICKERS = [
  { symbol: 'SPY', label: 'SPY', name: 'S&P 500 ETF', vol: '14.2%' },
  { symbol: 'QQQ', label: 'QQQ', name: 'Invesco QQQ (Nasdaq 100)', vol: '18.9%' },
  { symbol: 'NVDA', label: 'NVDA', name: 'NVIDIA Corp.', vol: '42.1%' },
  { symbol: 'TSLA', label: 'TSLA', name: 'Tesla Inc.', vol: '48.5%' },
  { symbol: 'AAPL', label: 'AAPL', name: 'Apple Inc.', vol: '17.4%' },
  { symbol: 'MSFT', label: 'MSFT', name: 'Microsoft Corp.', vol: '16.8%' },
  { symbol: 'AMD', label: 'AMD', name: 'Advanced Micro Devices', vol: '38.2%' },
  { symbol: 'AMZN', label: 'AMZN', name: 'Amazon.com Inc.', vol: '24.1%' },
  { symbol: 'META', label: 'META', name: 'Meta Platforms', vol: '29.3%' },
  { symbol: 'BTC-USD', label: 'BTC', name: 'Bitcoin / USD', vol: '54.6%' }
];

export default function HFTBacktestEngine({
  initialTicker = 'NVDA',
  allData,
  onDeployStrategy,
  className
}: HFTBacktestEngineProps) {
  // 1. Navigation Sub-Tab: Manual Backtest vs Automated Testing Suite vs Live Stream Calibration vs 3D News
  const [activeEngineTab, setActiveEngineTab] = useState<'backtest' | 'automation_testing' | 'micro_calibration' | 'newsscan3d'>('backtest');

  // 2. Ticker Selection State
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [tickerSearchQuery, setTickerSearchQuery] = useState<string>('');
  const [isTickerDropdownOpen, setIsTickerDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (initialTicker && initialTicker !== selectedTicker) {
      setSelectedTicker(initialTicker);
    }
  }, [initialTicker]);

  // 3. Timeframe Selection State
  const [timeframePreset, setTimeframePreset] = useState<TimeframePreset>('1Y');
  const [customStartDate, setCustomStartDate] = useState<string>('2023-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-08');
  const [customBarCount, setCustomBarCount] = useState<number>(252);
  const [isCustomDateActive, setIsCustomDateActive] = useState<boolean>(false);

  // 4. Strategy Selection State
  const [selectedStrategyType, setSelectedStrategyType] = useState<HFTStrategyType>('hft_obi_scalper');

  // 5. Strategy Parameters State
  const [hftParams, setHftParams] = useState<HFTParameters>({
    fastPeriod: 5,
    slowPeriod: 14,
    stopLossPct: 0.008,
    takeProfitPct: 0.016,
    trailingStopEnabled: true,
    trailingStopDistPct: 0.005,
    kellySizing: true,
    latencyUs: 250,
    slippageBps: 1.5,
    feeBps: 1.0,
    initialCapital: 100000,
    leverage: 1.0,
    thresholdAggressiveness: 3
  });

  const handleStrategyChange = (newStrategy: HFTStrategyType) => {
    setSelectedStrategyType(newStrategy);
    const profile = HFT_STRATEGIES.find(s => s.id === newStrategy);
    if (profile && profile.defaultParams) {
      setHftParams(prev => ({
        ...prev,
        ...profile.defaultParams
      }));
    }
  };

  // 6. Execution State & UI controls
  const [isRunningBacktest, setIsRunningBacktest] = useState<boolean>(false);
  const [activeChartTab, setActiveChartTab] = useState<'equity' | 'drawdown' | 'price_markers'>('equity');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'WINNERS' | 'LOSERS'>('ALL');
  const [tradeSearch, setTradeSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAdvancedParamsExpanded, setIsAdvancedParamsExpanded] = useState<boolean>(false);

  // 7. Automation Testing Suite State
  const [isAutomationTestingRunning, setIsAutomationTestingRunning] = useState<boolean>(false);
  const [automationProgress, setAutomationProgress] = useState<number>(0);
  const [automationReport, setAutomationReport] = useState<MasterAutomationReport | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 8. Gather raw historical candles for the selected ticker
  const rawCandles = useMemo<RawCandle[]>(() => {
    if (allData && allData[selectedTicker] && allData[selectedTicker].history && allData[selectedTicker].history.length > 0) {
      return allData[selectedTicker].history.map(h => ({
        date: h.date,
        price: typeof h === 'number' ? h : h.price || (h as any).close || 0,
        high: typeof h === 'object' && (h as any).high ? (h as any).high : ((h as any).price || 100) * 1.01,
        low: typeof h === 'object' && (h as any).low ? (h as any).low : ((h as any).price || 100) * 0.99,
        volume: typeof h === 'object' && (h as any).volume ? (h as any).volume : 2500000
      }));
    }

    const stockMeta = EXPANDED_STOCK_DATABASE.find(s => s.ticker === selectedTicker);
    const basePrice = stockMeta ? stockMeta.price : (selectedTicker === 'SPY' ? 580 : (selectedTicker === 'QQQ' ? 490 : 150));
    return generateSynthesizedCandles(selectedTicker, basePrice, 800);
  }, [selectedTicker, allData]);

  useEffect(() => {
    if (rawCandles.length > 0) {
      setCustomStartDate(rawCandles[0].date);
      setCustomEndDate(rawCandles[rawCandles.length - 1].date);
      setCustomBarCount(Math.min(252, rawCandles.length));
    }
  }, [rawCandles]);

  // 9. Filter candles by User-Defined Timeframe
  const slicedCandles = useMemo(() => {
    if (rawCandles.length === 0) return [];
    if (isCustomDateActive) {
      const filtered = rawCandles.filter(c => c.date >= customStartDate && c.date <= customEndDate);
      return filtered.length > 5 ? filtered : rawCandles.slice(-customBarCount);
    }
    const preset = TIMEFRAME_PRESETS.find(p => p.id === timeframePreset);
    const days = preset ? preset.days : 252;
    return rawCandles.slice(-days);
  }, [rawCandles, timeframePreset, isCustomDateActive, customStartDate, customEndDate, customBarCount]);

  // 10. Run High-Frequency Backtest Simulation
  const backtestResult = useMemo(() => {
    return executeHFTBacktestSimulation(slicedCandles, selectedStrategyType, hftParams);
  }, [slicedCandles, selectedStrategyType, hftParams]);

  // Re-run manual animation trigger
  const handleRunBacktest = () => {
    setIsRunningBacktest(true);
    setTimeout(() => {
      setIsRunningBacktest(false);
      showToast(`HFT Backtest executed successfully for ${selectedTicker} over ${slicedCandles.length} candles.`);
    }, 450);
  };

  // Automated Testing Suite Trigger
  const handleRunAutomationSuite = () => {
    setIsAutomationTestingRunning(true);
    setAutomationProgress(15);

    setTimeout(() => {
      setAutomationProgress(45);
      setTimeout(() => {
        setAutomationProgress(75);
        setTimeout(() => {
          // Prepare multi-asset universe from allData where available
          const multiAssetMap: Record<string, RawCandle[]> = {};
          if (allData) {
            for (const [tick, d] of Object.entries(allData)) {
              if (d.history && d.history.length > 20) {
                multiAssetMap[tick] = d.history.map(h => ({
                  date: h.date,
                  price: typeof h === 'number' ? h : h.price || 0
                }));
              }
            }
          }

          const report = runFullHFTAutomatedTestSuite(
            slicedCandles,
            selectedStrategyType,
            hftParams,
            Object.keys(multiAssetMap).length >= 3 ? multiAssetMap : undefined
          );

          setAutomationReport(report);
          setAutomationProgress(100);
          setIsAutomationTestingRunning(false);
          showToast(`Automated Testing Suite complete! Composite Score: ${report.overallScore}/100.`);
        }, 350);
      }, 350);
    }, 350);
  };

  // Deploy to Live Portfolio Bot
  const handleDeployToLive = () => {
    const currentStrat = HFT_STRATEGIES.find(s => s.id === selectedStrategyType);
    const stratConfig: StrategyConfig = {
      id: `deployed_hft_${Date.now()}`,
      name: `${selectedTicker} ${currentStrat?.name || 'HFT Engine'}`,
      type: 'hft_scalper',
      parameters: {
        fastPeriod: hftParams.fastPeriod,
        slowPeriod: hftParams.slowPeriod,
        stopLossPct: hftParams.stopLossPct,
        takeProfitPct: hftParams.takeProfitPct,
        kellySizing: hftParams.kellySizing,
        spreadBps: hftParams.slippageBps,
        orderBookBias: hftParams.thresholdAggressiveness * 0.1
      }
    };

    portfolioManager.deployStrategy(stratConfig);
    if (onDeployStrategy) {
      onDeployStrategy(stratConfig);
    }
    showToast(`"${stratConfig.name}" deployed to Live HFT Execution Core!`);
  };

  // Synchronize parameters from live microsecond calibration stream
  const handleApplyCalibratedParams = (params: {
    fastPeriod: number;
    slowPeriod: number;
    stopLossPct: number;
    takeProfitPct: number;
    latencyUs: number;
    slippageBps: number;
  }) => {
    setHftParams(prev => ({
      ...prev,
      fastPeriod: params.fastPeriod,
      slowPeriod: params.slowPeriod,
      stopLossPct: params.stopLossPct,
      takeProfitPct: params.takeProfitPct,
      latencyUs: params.latencyUs,
      slippageBps: params.slippageBps
    }));
    showToast(`Calibrated parameters imported from microsecond stream: Fast=${params.fastPeriod}, Slow=${params.slowPeriod}, Buffer=${params.latencyUs}μs`);
  };

  // Export full trade logs to CSV
  const handleExportCSV = () => {
    if (backtestResult.trades.length === 0) {
      showToast('No trade logs available to export.');
      return;
    }

    const headers = ['Trade_ID', 'Timestamp', 'Ticker', 'Side', 'Entry_Price', 'Exit_Price', 'Shares', 'Gross_PnL', 'Slippage_USD', 'Fees_USD', 'Net_PnL', 'Return_Pct', 'Hold_Minutes', 'Latency_Ns', 'Exit_Reason', 'Entry_Signal'];
    const rows = backtestResult.trades.map(t => [
      t.id,
      t.timeStr,
      selectedTicker,
      t.side,
      t.entryPrice,
      t.exitPrice,
      t.shares,
      t.grossPnl,
      t.slippageCost,
      t.feeCost,
      t.netPnl,
      `${t.returnPct}%`,
      t.holdMinutes,
      t.latencyNs,
      t.exitReason,
      `"${t.entrySignal}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HFT_Backtest_${selectedTicker}_${selectedStrategyType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded CSV with ${backtestResult.trades.length} execution logs.`);
  };

  // Export Automation Audit Report as JSON
  const handleExportAutomationJSON = () => {
    if (!automationReport) {
      showToast('Run the Automated Testing Suite first to export the audit report.');
      return;
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(automationReport, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `HFT_Automated_Audit_${selectedTicker}_${selectedStrategyType}_${Date.now()}.json`);
    dlAnchorElem.click();
    showToast('Exported automated strategy audit report.');
  };

  const filteredTrades = useMemo(() => {
    return backtestResult.trades.filter(t => {
      if (tradeFilter === 'WINNERS' && t.netPnl <= 0) return false;
      if (tradeFilter === 'LOSERS' && t.netPnl > 0) return false;
      if (tradeSearch.trim()) {
        const query = tradeSearch.toLowerCase();
        return (
          t.timeStr.toLowerCase().includes(query) ||
          t.exitReason.toLowerCase().includes(query) ||
          t.entrySignal.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [backtestResult.trades, tradeFilter, tradeSearch]);

  const currentTickerMeta = useMemo(() => {
    const found = EXPANDED_STOCK_DATABASE.find(s => s.ticker === selectedTicker);
    if (found) return found;
    return {
      ticker: selectedTicker,
      name: selectedTicker === 'SPY' ? 'S&P 500 ETF Trust' : (selectedTicker === 'QQQ' ? 'Invesco QQQ Trust' : 'High Frequency Asset'),
      price: slicedCandles.length > 0 ? slicedCandles[slicedCandles.length - 1].price : 250,
      volatility: '24.5%',
      sector: 'Liquid Equities',
      changePercent: 1.25
    };
  }, [selectedTicker, slicedCandles]);

  const activeStrategyObj = HFT_STRATEGIES.find(s => s.id === selectedStrategyType) || HFT_STRATEGIES[0];

  return (
    <div className={cn("space-y-6 text-zinc-100", className)}>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-zinc-900 border border-emerald-500/50 text-emerald-400 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold font-mono"
          >
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* HEADER & TOP CONTROLS: Mode Switcher, Ticker, Timeframe                   */}
      {/* ========================================================================= */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 lg:p-6 backdrop-blur-xl shadow-xl space-y-5">
        
        {/* Top Row: Title, Mode Tabs, and CTAs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/60 pb-5">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Zap size={20} />
            </span>
            <div>
              <h2 className="text-lg lg:text-xl font-black tracking-tight text-white flex items-center gap-2">
                HFT Backtesting & Automation Testing Engine
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-extrabold tracking-wider">
                  v5.0 Enterprise
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Run historical simulations and execute automated testing (Walk-Forward, Monte Carlo permutations, and Stress Shocks) on your HFT strategies.
              </p>
            </div>
          </div>

          {/* Engine Mode Tabs Switcher */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setActiveEngineTab('backtest')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5",
                  activeEngineTab === 'backtest'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <BarChart3 size={13} />
                Backtest & Fills Audit
              </button>

              <button
                onClick={() => setActiveEngineTab('automation_testing')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 relative",
                  activeEngineTab === 'automation_testing'
                    ? "bg-emerald-500 text-black font-extrabold shadow-md shadow-emerald-500/20"
                    : "text-emerald-400 hover:bg-emerald-500/10"
                )}
              >
                <Award size={13} />
                Automated Testing Suite
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
              </button>

              <button
                onClick={() => setActiveEngineTab('micro_calibration')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 relative",
                  activeEngineTab === 'micro_calibration'
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-purple-400 hover:bg-purple-500/10"
                )}
              >
                <Radio size={13} />
                Live Stream μs Calibration & Data Validity
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse absolute -top-0.5 -right-0.5" />
              </button>

              <button
                onClick={() => setActiveEngineTab('newsscan3d')}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 relative",
                  activeEngineTab === 'newsscan3d'
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-500/20"
                    : "text-cyan-400 hover:bg-cyan-500/10"
                )}
              >
                <Globe size={13} />
                3D Global News Shock Radar
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse absolute -top-0.5 -right-0.5" />
              </button>
            </div>

            {/* CTAs */}
            {activeEngineTab === 'backtest' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunBacktest}
                  disabled={isRunningBacktest}
                  className={cn(
                    "px-4 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50",
                    isRunningBacktest
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                  )}
                >
                  <RefreshCw size={13} className={cn(isRunningBacktest && "animate-spin")} />
                  {isRunningBacktest ? 'Running...' : 'Run Backtest'}
                </button>
                <button
                  onClick={handleDeployToLive}
                  className="px-3.5 py-2 rounded-xl font-black uppercase tracking-widest text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white border border-zinc-700 transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <Play size={12} className="fill-current text-emerald-400" />
                  Deploy
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-2 rounded-xl font-bold uppercase tracking-wider text-xs bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1"
                  title="Export trades CSV"
                >
                  <Download size={12} />
                  CSV
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRunAutomationSuite}
                  disabled={isAutomationTestingRunning}
                  className={cn(
                    "px-4 py-2 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 disabled:opacity-50",
                    isAutomationTestingRunning
                      ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 cursor-wait"
                      : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold shadow-emerald-500/20"
                  )}
                >
                  <Award size={14} className={cn(isAutomationTestingRunning && "animate-spin")} />
                  {isAutomationTestingRunning ? `Running Tests (${automationProgress}%)...` : 'Run Automation Suite'}
                </button>
                {automationReport && (
                  <button
                    onClick={handleExportAutomationJSON}
                    className="px-3 py-2 rounded-xl font-bold uppercase tracking-wider text-xs bg-zinc-950 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 transition-all flex items-center gap-1"
                  >
                    <Download size={12} />
                    Audit JSON
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ticker Selector & Popular Pills */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          
          {/* Ticker Search & Select */}
          <div className="lg:col-span-5 flex items-center gap-2">
            <div className="relative flex-1">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
                Selected Ticker Symbol
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={tickerSearchQuery}
                    onChange={(e) => {
                      setTickerSearchQuery(e.target.value.toUpperCase());
                      setIsTickerDropdownOpen(true);
                    }}
                    onFocus={() => setIsTickerDropdownOpen(true)}
                    placeholder={`Current: ${selectedTicker} (Search any stock)`}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono font-bold text-white uppercase placeholder:text-zinc-600 focus:border-purple-500/60 outline-none"
                  />
                  {isTickerDropdownOpen && (
                    <div 
                      className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-zinc-800 rounded-xl max-h-56 overflow-y-auto shadow-2xl z-40 p-1 divide-y divide-zinc-900"
                      onMouseLeave={() => setIsTickerDropdownOpen(false)}
                    >
                      {EXPANDED_STOCK_DATABASE
                        .filter(s => !tickerSearchQuery || s.ticker.includes(tickerSearchQuery) || s.name.toLowerCase().includes(tickerSearchQuery.toLowerCase()))
                        .slice(0, 8)
                        .map(item => (
                          <button
                            key={item.ticker}
                            onClick={() => {
                              setSelectedTicker(item.ticker);
                              setTickerSearchQuery('');
                              setIsTickerDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-zinc-900 flex items-center justify-between text-xs transition-colors"
                          >
                            <div>
                              <span className="font-mono font-bold text-white">{item.ticker}</span>
                              <span className="text-[10px] text-zinc-500 ml-2 truncate max-w-[120px]">{item.name}</span>
                            </div>
                            <span className="font-mono text-[11px] text-zinc-400">${item.price.toFixed(2)}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-right min-w-[90px]">
                  <div className="text-[9px] text-zinc-500 uppercase font-black">Spot Price</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">
                    ${(currentTickerMeta.price || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Popular Ticker Pills */}
          <div className="lg:col-span-7">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block mb-1">
              Liquid High-Frequency Benchmarks
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {POPULAR_HFT_TICKERS.map(item => {
                const isSelected = selectedTicker === item.symbol;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      setSelectedTicker(item.symbol);
                      setTickerSearchQuery('');
                    }}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border flex items-center gap-1.5",
                      isSelected
                        ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/20"
                        : "bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    )}
                  >
                    <span>{item.symbol}</span>
                    <span className="text-[9px] opacity-60">{item.vol}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User-Defined Timeframe Selection Bar */}
        <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-purple-400" />
              <span className="text-xs font-black uppercase tracking-wider text-zinc-300">
                User-Defined Timeframe Window
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                ({slicedCandles.length} Sessions • {slicedCandles.length > 0 ? `${slicedCandles[0].date} → ${slicedCandles[slicedCandles.length - 1].date}` : 'N/A'})
              </span>
            </div>

            <button
              onClick={() => setIsCustomDateActive(!isCustomDateActive)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1",
                isCustomDateActive
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Sliders size={11} />
              {isCustomDateActive ? 'Custom Date Range (Active)' : 'Enable Custom Dates'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {TIMEFRAME_PRESETS.map(preset => {
                const isActive = !isCustomDateActive && timeframePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setTimeframePreset(preset.id);
                      setIsCustomDateActive(false);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border",
                      isActive
                        ? "bg-emerald-500 text-black font-extrabold border-emerald-400 shadow-md shadow-emerald-500/20"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {isCustomDateActive ? (
              <div className="flex items-center gap-3 flex-wrap bg-zinc-900/80 p-2 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-zinc-100 outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 rounded-lg px-2 py-1 text-xs font-mono text-zinc-100 outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono">
                  Lookback Candles: {slicedCandles.length}
                </span>
                <input
                  type="range"
                  min="20"
                  max="750"
                  value={slicedCandles.length}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    setCustomBarCount(val);
                    setIsCustomDateActive(true);
                  }}
                  className="w-28 accent-emerald-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW C: LIVE STREAM MICROSECOND CALIBRATION & DATA VALIDITY PANEL         */}
      {/* ========================================================================= */}
      {activeEngineTab === 'micro_calibration' && (
        <DataValidityAndMicroCalibration
          initialTicker={selectedTicker}
          allData={allData}
          onDeployCalibratedParams={handleApplyCalibratedParams}
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW D: 3D GLOBAL NEWS SCAN & MARKET SHOCK RADAR                          */}
      {/* ========================================================================= */}
      {activeEngineTab === 'newsscan3d' && (
        <GlobalNewsScan3D
          data={allData[selectedTicker] || Object.values(allData)[0]}
          allData={allData}
          onApplyShockToStrategy={(shockEvent) => {
            const top = shockEvent.impactedTickers[0];
            if (top) {
              setHftParams(prev => ({
                ...prev,
                latencyUs: Math.max(5, Math.round(prev.latencyUs * shockEvent.projectionLineShift.volatilityMultiplier)),
                slippageBps: Number((prev.slippageBps * (1 + Math.abs(top.expectedMovePct) / 100)).toFixed(1))
              }));
              showToast(`Applied ${shockEvent.city} shock parameters to HFT engine!`);
            }
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* VIEW A: AUTOMATED TESTING SUITE PANEL                                     */}
      {/* ========================================================================= */}
      {activeEngineTab === 'automation_testing' && (
        <div className="space-y-6">
          
          {/* Automation Testing Hero Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-purple-950/30 border border-purple-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                  <Award size={13} />
                  Automated Quantitative Quality Assurance
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Automated Robustness & Overfitting Testing Matrix
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
                  Automatically audits the strategy across 4 institutional risk vectors: Walk-Forward Out-Of-Sample efficiency, 100-path Monte Carlo return permutation, extreme market shock scenarios, and multi-asset cross-validation.
                </p>
              </div>

              <button
                onClick={handleRunAutomationSuite}
                disabled={isAutomationTestingRunning}
                className={cn(
                  "px-6 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2.5 transition-all shadow-xl active:scale-95 disabled:opacity-50",
                  isAutomationTestingRunning
                    ? "bg-amber-500/20 border border-amber-500/40 text-amber-300"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20"
                )}
              >
                <Award size={16} className={cn(isAutomationTestingRunning && "animate-spin")} />
                {isAutomationTestingRunning ? `Executing Battery (${automationProgress}%)...` : 'Execute Automated Tests'}
              </button>
            </div>

            {/* Test Progress Bar (when running) */}
            {isAutomationTestingRunning && (
              <div className="pt-2 space-y-2">
                <div className="flex justify-between text-[10px] font-mono font-bold text-zinc-400">
                  <span>Executing Test Battery Matrix...</span>
                  <span className="text-emerald-400">{automationProgress}% Complete</span>
                </div>
                <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 via-emerald-500 to-teal-400"
                    initial={{ width: '0%' }}
                    animate={{ width: `${automationProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Master Report View (if generated or default on initial run) */}
          {automationReport ? (
            <div className="space-y-6">
              
              {/* Score Card Header */}
              <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-black border shadow-lg",
                    automationReport.overallScore >= 80 
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400" 
                      : (automationReport.overallScore >= 60 ? "bg-amber-500/10 border-amber-500/40 text-amber-400" : "bg-rose-500/10 border-rose-500/40 text-rose-400")
                  )}>
                    <span className="text-2xl">{automationReport.overallScore}</span>
                    <span className="text-[8px] uppercase tracking-wider opacity-70">/ 100</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      Automated Quality Score &amp; Verdict
                    </span>
                    <h4 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                      <span>{automationReport.overallVerdict}</span>
                      <span className={cn(
                        "text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase",
                        automationReport.overallScore >= 80 ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      )}>
                        Passed Automated Gates
                      </span>
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1 font-mono">
                      Timestamp: {new Date(automationReport.timestamp).toLocaleString()} • Strategy: {activeStrategyObj.name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportAutomationJSON}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-zinc-700 transition-colors"
                >
                  <Download size={13} />
                  Download Audit JSON
                </button>
              </div>

              {/* 4 Automated Test Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pillar 1: Walk-Forward Overfitting Validator */}
                <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-purple-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                        1. Walk-Forward Overfitting Test
                      </h4>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono",
                      automationReport.walkForward.status === 'PASSED'
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    )}>
                      {automationReport.walkForward.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[8px] text-zinc-500 uppercase block">In-Sample Sharpe</span>
                      <span className="text-sm font-bold text-zinc-200">{automationReport.walkForward.inSampleSharpe}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[8px] text-zinc-500 uppercase block">Out-Sample Sharpe</span>
                      <span className="text-sm font-bold text-purple-400">{automationReport.walkForward.outOfSampleSharpe}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[8px] text-zinc-500 uppercase block">WF Efficiency</span>
                      <span className="text-sm font-bold text-emerald-400">{automationReport.walkForward.walkForwardEfficiencyPct}%</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-zinc-800/60">
                    {automationReport.walkForward.diagnostic}
                  </p>
                </div>

                {/* Pillar 2: Monte Carlo Permutation Matrix */}
                <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Flame size={16} className="text-amber-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                        2. Monte Carlo Sequence Shocks (100 Runs)
                      </h4>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono",
                      automationReport.monteCarlo.status === 'PASSED'
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    )}>
                      {automationReport.monteCarlo.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[8px] text-zinc-500 uppercase block">Ruin Probability</span>
                      <span className="text-sm font-bold text-emerald-400">{automationReport.monteCarlo.probabilityOfRuinPct}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[8px] text-zinc-500 uppercase block">95% Worst Drawdown</span>
                      <span className="text-sm font-bold text-rose-400">-{automationReport.monteCarlo.worstCaseDrawdownPct}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                      <span className="text-[8px] text-zinc-500 uppercase block">Median Equity</span>
                      <span className="text-sm font-bold text-zinc-200">${automationReport.monteCarlo.medianFinalEquity.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-zinc-800/60">
                    {automationReport.monteCarlo.diagnostic}
                  </p>
                </div>

                {/* Pillar 3: Extreme Market Shock Testing */}
                <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={16} className="text-rose-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                        3. Extreme Shock Stress Battery
                      </h4>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono",
                      automationReport.stressTest.status === 'PASSED'
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    )}>
                      {automationReport.stressTest.status}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {automationReport.stressTest.scenarios.map((sc, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs font-mono">
                        <div>
                          <span className="text-zinc-200 font-bold block">{sc.scenarioName}</span>
                          <span className="text-[9px] text-zinc-500">{sc.shockDescription}</span>
                        </div>
                        <div className="text-right">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold",
                            sc.survived ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {sc.survived ? 'SURVIVED' : 'FAILED'}
                          </span>
                          <span className="text-[9px] text-zinc-500 block mt-0.5">DD: -{sc.maxShockDrawdownPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-zinc-800/60">
                    {automationReport.stressTest.diagnostic}
                  </p>
                </div>

                {/* Pillar 4: Cross-Asset Basket Validation */}
                <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-blue-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                        4. Cross-Asset Basket Validation
                      </h4>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-mono",
                      automationReport.multiAsset.status === 'PASSED'
                        ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                        : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                    )}>
                      {automationReport.multiAsset.consistencyScorePct}% Consistent
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono">
                    {automationReport.multiAsset.testedAssets.map((asset, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{asset.ticker}</span>
                          <span className={cn(
                            "text-[8px] font-bold px-1 rounded",
                            asset.profitable ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          )}>
                            {asset.profitable ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1">
                          Sharpe: <span className="text-zinc-200">{asset.sharpe.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          DD: <span className="text-rose-400">-{asset.maxDD.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans bg-black/40 p-3 rounded-xl border border-zinc-800/60">
                    {automationReport.multiAsset.diagnostic}
                  </p>
                </div>

              </div>

              {/* Actionable Recommendations */}
              <div className="p-5 rounded-3xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 text-left">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <FileCheck size={14} />
                  Automated Algorithmic Hardening Recommendations
                </h4>
                <ul className="space-y-1.5 font-sans text-xs text-zinc-300">
                  {automationReport.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800/60 text-center space-y-3">
              <Award size={36} className="mx-auto text-purple-400 opacity-60 animate-pulse" />
              <h4 className="text-sm font-black text-white">No Automated Test Audit Run Yet</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Click &quot;Execute Automated Tests&quot; above to run the 4-tier automated testing battery (Walk-Forward, Monte Carlo, Stress Shocks, and Multi-Asset validation).
              </p>
              <button
                onClick={handleRunAutomationSuite}
                className="mt-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Run Automated Strategy Tests
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: STANDARD MANUAL BACKTEST & TRADE AUDIT (Original Interactive View) */}
      {/* ========================================================================= */}
      {activeEngineTab === 'backtest' && (
        <div className="space-y-6">

          {/* Strategy Selection & Parameters Sandbox Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Side: Strategy Selectors */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <Cpu size={14} className="text-emerald-400" />
                  Current HFT Strategy Library
                </h3>
                <span className="text-[10px] font-mono text-zinc-500 font-bold">
                  {HFT_STRATEGIES.length} Available
                </span>
              </div>

              <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-1">
                {HFT_STRATEGIES.map(strat => {
                  const isSelected = selectedStrategyType === strat.id;
                  return (
                    <div
                      key={strat.id}
                      onClick={() => handleStrategyChange(strat.id)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden group",
                        isSelected
                          ? "bg-zinc-900 border-purple-500/80 shadow-lg shadow-purple-500/5 ring-1 ring-purple-500/40"
                          : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/40 hover:border-zinc-700"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            isSelected ? "bg-purple-400 animate-pulse" : "bg-zinc-600"
                          )} />
                          <span className={cn(
                            "text-xs font-black tracking-tight",
                            isSelected ? "text-white" : "text-zinc-300 group-hover:text-white"
                          )}>
                            {strat.name}
                          </span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono">
                          {strat.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2">
                        {strat.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-zinc-800/40 text-[10px] text-zinc-500 font-mono">
                        <span>Stop: {(((strat.defaultParams?.stopLossPct || 0.01) * 100).toFixed(1))}%</span>
                        <span>TP: {(((strat.defaultParams?.takeProfitPct || 0.02) * 100).toFixed(1))}%</span>
                        <span>Latency: {strat.defaultParams?.latencyUs || 250}µs</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Side: Strategy Parameters Sandbox */}
            <div className="lg:col-span-7 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 lg:p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                    Active Configuration
                  </span>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Settings size={14} className="text-purple-400" />
                    {activeStrategyObj.name} Parameters
                  </h3>
                </div>

                <button
                  onClick={() => setIsAdvancedParamsExpanded(!isAdvancedParamsExpanded)}
                  className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-800/80 px-2.5 py-1.5 rounded-xl border border-zinc-700 transition-colors"
                >
                  <Sliders size={11} />
                  {isAdvancedParamsExpanded ? 'Hide Advanced' : 'Execution Friction'}
                </button>
              </div>

              {/* Core Quantitative Tuning Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Stop Loss Limit</span>
                    <span className="font-bold text-rose-400 font-mono">{((hftParams.stopLossPct) * 100).toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.002"
                    max="0.05"
                    step="0.001"
                    value={hftParams.stopLossPct}
                    onChange={(e) => setHftParams(p => ({ ...p, stopLossPct: parseFloat(e.target.value) }))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-600 block">Tightly manages drawdown risks per micro-trade</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Take Profit Target</span>
                    <span className="font-bold text-emerald-400 font-mono">{((hftParams.takeProfitPct) * 100).toFixed(2)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.004"
                    max="0.08"
                    step="0.002"
                    value={hftParams.takeProfitPct}
                    onChange={(e) => setHftParams(p => ({ ...p, takeProfitPct: parseFloat(e.target.value) }))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-600 block">Primary algorithmic exit mark for quick scalps</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Fast Micro-Period</span>
                    <span className="font-bold text-purple-400 font-mono">{hftParams.fastPeriod} bars</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="15"
                    step="1"
                    value={hftParams.fastPeriod}
                    onChange={(e) => setHftParams(p => ({ ...p, fastPeriod: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-600 block">High-frequency sample rate window</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400 text-[10px] uppercase font-bold">Slow Baseline Period</span>
                    <span className="font-bold text-blue-400 font-mono">{hftParams.slowPeriod} bars</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="1"
                    value={hftParams.slowPeriod}
                    onChange={(e) => setHftParams(p => ({ ...p, slowPeriod: parseInt(e.target.value) }))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-600 block">Macro-drift baseline filter length</span>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 cursor-pointer hover:bg-zinc-900/40 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">Trailing Tick-Stop</span>
                    <span className="text-[9px] text-zinc-500">Locks in profits after initial scalp run</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hftParams.trailingStopEnabled}
                    onChange={(e) => setHftParams(p => ({ ...p, trailingStopEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/60 cursor-pointer hover:bg-zinc-900/40 transition-colors">
                  <div>
                    <span className="text-xs font-bold text-zinc-200 block">Kelly Criterion Sizing</span>
                    <span className="text-[9px] text-zinc-500">Optimizes bet size for win/loss variance</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hftParams.kellySizing}
                    onChange={(e) => setHftParams(p => ({ ...p, kellySizing: e.target.checked }))}
                    className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Advanced Realism Model */}
              {isAdvancedParamsExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4 pt-3"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <ShieldAlert size={13} />
                      Micro-Structure Friction Models
                    </span>
                    <span className="text-[9px] text-zinc-500 font-mono">Realistic Slippage &amp; Latency</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span>Execution Latency</span>
                        <span className="text-white font-bold">{hftParams.latencyUs}µs</span>
                      </div>
                      <select
                        value={hftParams.latencyUs}
                        onChange={(e) => setHftParams(p => ({ ...p, latencyUs: parseInt(e.target.value) }))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                      >
                        <option value={50}>50 µs (Colocated FPGA)</option>
                        <option value={250}>250 µs (Ultra-HFT Direct Market)</option>
                        <option value={1000}>1 ms (Fast Broker FIX)</option>
                        <option value={5000}>5 ms (Retail WebSocket)</option>
                        <option value={25000}>25 ms (Standard REST API)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span>Slippage Model</span>
                        <span className="text-white font-bold">{hftParams.slippageBps} bps</span>
                      </div>
                      <select
                        value={hftParams.slippageBps}
                        onChange={(e) => setHftParams(p => ({ ...p, slippageBps: parseFloat(e.target.value) }))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                      >
                        <option value={0.0}>0.0 bps (Zero Slippage)</option>
                        <option value={1.0}>1.0 bps (Tight Spread SPY/QQQ)</option>
                        <option value={2.0}>2.0 bps (Mid-Cap Liquid Equities)</option>
                        <option value={4.0}>4.0 bps (High Volatility Spikes)</option>
                        <option value={8.0}>8.0 bps (Extreme Adverse Fills)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                        <span>Exchange Fee</span>
                        <span className="text-white font-bold">{hftParams.feeBps} bps</span>
                      </div>
                      <select
                        value={hftParams.feeBps}
                        onChange={(e) => setHftParams(p => ({ ...p, feeBps: parseFloat(e.target.value) }))}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none font-mono"
                      >
                        <option value={-0.2}>-0.2 bps (Maker Rebate Tier)</option>
                        <option value={0.5}>0.5 bps (Institutional Tier 1)</option>
                        <option value={1.5}>1.5 bps (Standard Exchange Fee)</option>
                        <option value={3.0}>3.0 bps (Retail Broker Commission)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Performance KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Net Profit</span>
              <div className="my-1">
                <span className={cn(
                  "text-base lg:text-lg font-black font-mono",
                  backtestResult.summary.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {backtestResult.summary.netProfit >= 0 ? '+' : ''}${backtestResult.summary.netProfit.toLocaleString()}
                </span>
                <div className={cn(
                  "text-[10px] font-mono font-bold mt-0.5",
                  backtestResult.summary.totalReturnPct >= 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  ({backtestResult.summary.totalReturnPct >= 0 ? '+' : ''}{backtestResult.summary.totalReturnPct}%)
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Base: ${hftParams.initialCapital.toLocaleString()}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Alpha over SPY</span>
              <div className="my-1">
                <span className={cn(
                  "text-base lg:text-lg font-black font-mono",
                  backtestResult.summary.alphaPct >= 0 ? "text-purple-400" : "text-zinc-400"
                )}>
                  {backtestResult.summary.alphaPct >= 0 ? '+' : ''}{backtestResult.summary.alphaPct}%
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  SPY: {backtestResult.summary.benchmarkReturnPct}%
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Excess Returns</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Win Rate</span>
              <div className="my-1">
                <span className="text-base lg:text-lg font-black font-mono text-emerald-400">
                  {backtestResult.summary.winRate}%
                </span>
                <div className="text-[10px] font-mono text-zinc-400 mt-0.5">
                  {backtestResult.summary.winningTrades}W / {backtestResult.summary.losingTrades}L
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Total: {backtestResult.summary.totalTrades} Fills</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Profit Factor</span>
              <div className="my-1">
                <span className="text-base lg:text-lg font-black font-mono text-white">
                  {backtestResult.summary.profitFactor.toFixed(2)}
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  Gains / Losses
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Target &gt; 1.50</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Sharpe Ratio</span>
              <div className="my-1">
                <span className={cn(
                  "text-base lg:text-lg font-black font-mono",
                  backtestResult.summary.sharpeRatio >= 1.5 ? "text-emerald-400" : "text-zinc-200"
                )}>
                  {backtestResult.summary.sharpeRatio.toFixed(2)}
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  Sortino: {backtestResult.summary.sortinoRatio.toFixed(2)}
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Risk-Adjusted</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Max Drawdown</span>
              <div className="my-1">
                <span className="text-base lg:text-lg font-black font-mono text-rose-400">
                  -{backtestResult.summary.maxDrawdownPct}%
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {backtestResult.summary.maxDrawdownDays} recovery days
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Calmar: {backtestResult.summary.calmarRatio.toFixed(2)}</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Avg Hold Time</span>
              <div className="my-1">
                <span className="text-base lg:text-lg font-black font-mono text-blue-400">
                  {backtestResult.summary.avgHoldMinutes}m
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  {backtestResult.summary.tradesPerDay} fills / mo
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Intraday Scalps</span>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Friction Drag</span>
              <div className="my-1">
                <span className="text-base lg:text-lg font-black font-mono text-amber-400">
                  -${backtestResult.summary.totalSlippageFeeCost.toLocaleString()}
                </span>
                <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                  VaR 95%: -{backtestResult.summary.var95Pct}%
                </div>
              </div>
              <span className="text-[8px] text-zinc-600 font-bold uppercase">Slippage + Fees</span>
            </div>
          </div>

          {/* Main Chart View */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 lg:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">
                  Cumulative Historical Equity Curve vs Benchmark ({selectedTicker})
                </h3>
              </div>

              <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                <button
                  onClick={() => setActiveChartTab('equity')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeChartTab === 'equity'
                      ? "bg-emerald-500 text-black font-extrabold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Equity ($)
                </button>
                <button
                  onClick={() => setActiveChartTab('drawdown')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeChartTab === 'drawdown'
                      ? "bg-rose-500 text-white font-extrabold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Underwater Drawdown (%)
                </button>
                <button
                  onClick={() => setActiveChartTab('price_markers')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                    activeChartTab === 'price_markers'
                      ? "bg-purple-600 text-white font-extrabold shadow-sm"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Price Overlay
                </button>
              </div>
            </div>

            <div className="flex items-center gap-5 text-[10px] font-mono text-zinc-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-white font-bold">{activeStrategyObj.name} Equity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                <span>Benchmark (SPY Buy &amp; Hold)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>{selectedTicker} Spot Price</span>
              </div>
            </div>

            <div className="h-[360px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                {activeChartTab === 'equity' ? (
                  <AreaChart data={backtestResult.equityCurve}>
                    <defs>
                      <linearGradient id="hftEquityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="benchEquityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#71717a" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#555" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                      }}
                    />
                    <YAxis 
                      stroke="#555" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                      labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="benchmarkEquity" 
                      name="Benchmark SPY"
                      stroke="#71717a" 
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      fill="url(#benchEquityGrad)"
                      dot={false}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="equity" 
                      name="Strategy Equity"
                      stroke="#10b981" 
                      strokeWidth={2.5}
                      fill="url(#hftEquityGrad)"
                      dot={false}
                    />
                  </AreaChart>
                ) : activeChartTab === 'drawdown' ? (
                  <AreaChart data={backtestResult.equityCurve}>
                    <defs>
                      <linearGradient id="hftDrawdownGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.0}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#555" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#555" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${val}%`}
                      domain={['auto', 0]}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`${val}%`, 'Drawdown']}
                    />
                    <ReferenceLine y={0} stroke="#3f3f46" strokeWidth={1} />
                    <Area 
                      type="monotone" 
                      dataKey="drawdownPct" 
                      name="Underwater Drawdown"
                      stroke="#f43f5e" 
                      strokeWidth={2}
                      fill="url(#hftDrawdownGrad)"
                      dot={false}
                    />
                  </AreaChart>
                ) : (
                  <LineChart data={backtestResult.equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#555" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#555" 
                      fontSize={10} 
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `$${val}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px', fontSize: '11px' }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Price']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      name={`${selectedTicker} Price`}
                      stroke="#a855f7" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Trade Execution Audit Log Table */}
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 lg:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/60 pb-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-200">
                  Trade Execution Log ({filteredTrades.length} of {backtestResult.trades.length})
                </h3>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setTradeFilter('ALL')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                      tradeFilter === 'ALL' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    All ({backtestResult.trades.length})
                  </button>
                  <button
                    onClick={() => setTradeFilter('WINNERS')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                      tradeFilter === 'WINNERS' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Winners ({backtestResult.summary.winningTrades})
                  </button>
                  <button
                    onClick={() => setTradeFilter('LOSERS')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                      tradeFilter === 'LOSERS' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    Losers ({backtestResult.summary.losingTrades})
                  </button>
                </div>

                <input
                  type="text"
                  value={tradeSearch}
                  onChange={(e) => setTradeSearch(e.target.value)}
                  placeholder="Search trade reason..."
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 outline-none w-48 font-mono"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-zinc-950 sticky top-0 border-b border-zinc-800 z-10 text-[9px] uppercase tracking-wider text-zinc-500 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Side</th>
                    <th className="py-2.5 px-3 text-right">Entry</th>
                    <th className="py-2.5 px-3 text-right">Exit</th>
                    <th className="py-2.5 px-3 text-right">Shares</th>
                    <th className="py-2.5 px-3 text-right">Net PnL ($)</th>
                    <th className="py-2.5 px-3 text-right">ROI (%)</th>
                    <th className="py-2.5 px-3 text-right">Hold</th>
                    <th className="py-2.5 px-3">Exit Reason</th>
                    <th className="py-2.5 px-3">Trigger Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono text-[11px]">
                  {filteredTrades.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-8 text-zinc-500 italic">
                        No trades match the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredTrades.map((t) => {
                      const isWin = t.netPnl > 0;
                      return (
                        <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-2.5 px-3 text-zinc-500">{t.tradeNumber}</td>
                          <td className="py-2.5 px-3 text-zinc-300 whitespace-nowrap">{t.timeStr}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {t.side}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-200">${t.entryPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-200">${t.exitPrice.toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">{t.shares}</td>
                          <td className={cn(
                            "py-2.5 px-3 text-right font-bold",
                            isWin ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {isWin ? '+' : ''}${t.netPnl.toFixed(2)}
                          </td>
                          <td className={cn(
                            "py-2.5 px-3 text-right font-bold",
                            isWin ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {isWin ? '+' : ''}{t.returnPct.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-zinc-400">
                            {t.holdMinutes}m
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-bold",
                              t.exitReason === 'TAKE_PROFIT' 
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : t.exitReason === 'TRAILING_STOP'
                                ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                                : t.exitReason === 'STOP_LOSS'
                                ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                : "bg-zinc-800 text-zinc-400"
                            )}>
                              {t.exitReason.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-400 text-[10px] truncate max-w-[200px]" title={t.entrySignal}>
                            {t.entrySignal}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
