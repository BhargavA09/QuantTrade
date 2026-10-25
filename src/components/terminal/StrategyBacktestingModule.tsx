import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Play,
  RotateCw,
  Sliders,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
  Target,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Activity,
  Download,
  Plus,
  Trash2,
  Zap,
  Info,
  DollarSign,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  StrategyConfig,
  SignalCondition,
  IndicatorType,
  SignalOperator,
  BacktestResult,
  PRESET_STRATEGIES,
  runBacktestSimulation,
  BarData
} from '../../utils/backtestEngine';
import { quantTraderBrain } from '../../services/QuantTraderBrain';

interface StrategyBacktestingModuleProps {
  selectedTicker: string;
  currentPrice: number;
  chartBars?: BarData[];
  onDeployToBrain?: (config: StrategyConfig) => void;
}

export const StrategyBacktestingModule: React.FC<StrategyBacktestingModuleProps> = ({
  selectedTicker,
  currentPrice,
  chartBars = [],
  onDeployToBrain
}) => {
  // Strategy Configuration State initialized from first preset
  const [config, setConfig] = useState<StrategyConfig>(() => {
    const base = PRESET_STRATEGIES[0];
    return {
      ...base,
      ticker: selectedTicker,
      name: `${selectedTicker} Adaptive Momentum Strategy`
    };
  });

  const [activeTab, setActiveTab] = useState<'metrics' | 'trades' | 'monthly' | 'rules'>('metrics');
  const [enableTickSimulation, setEnableTickSimulation] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [deployFeedback, setDeployFeedback] = useState<string | null>(null);

  // When ticker changes, update config ticker
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      ticker: selectedTicker,
      name: `${selectedTicker} Custom Signal Strategy`
    }));
  }, [selectedTicker]);

  // Execute Backtest
  const handleRunBacktest = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const result = runBacktestSimulation(chartBars, config, {
          generateTicks: enableTickSimulation
        });
        setBacktestResult(result);
      } catch (err) {
        console.warn('Backtest execution error:', err);
      } finally {
        setIsRunning(false);
      }
    }, 150);
  }, [chartBars, config, enableTickSimulation]);

  // Run backtest initially when component loads or ticker changes
  useEffect(() => {
    handleRunBacktest();
  }, [selectedTicker, handleRunBacktest]);

  // Preset Selection
  const handleSelectPreset = (preset: StrategyConfig) => {
    setConfig({
      ...preset,
      ticker: selectedTicker,
      name: `${selectedTicker} - ${preset.name}`
    });
  };

  // Add / Remove Custom Rule
  const handleAddCondition = () => {
    const newCond: SignalCondition = {
      id: `c_${Date.now()}`,
      indicator: 'RSI',
      operator: 'LESS_THAN',
      compareType: 'VALUE',
      value: 30,
      description: 'RSI is less than 30'
    };
    setConfig(prev => ({
      ...prev,
      entryRules: [...prev.entryRules, newCond]
    }));
  };

  const handleRemoveCondition = (id: string) => {
    setConfig(prev => ({
      ...prev,
      entryRules: prev.entryRules.filter(c => c.id !== id)
    }));
  };

  const handleUpdateCondition = (id: string, updates: Partial<SignalCondition>) => {
    setConfig(prev => ({
      ...prev,
      entryRules: prev.entryRules.map(c => (c.id === id ? { ...c, ...updates } : c))
    }));
  };

  // Deploy to QuantTraderBrain
  const handleDeployToBrain = () => {
    if (!backtestResult) return;
    try {
      const trade = quantTraderBrain.executeOrder(
        selectedTicker,
        'LONG',
        currentPrice,
        `Backtest Deploy: ${config.name}`
      );

      const msg = `Strategy [${config.name}] deployed to Brain! Order: ${trade.quantity} shs @ $${currentPrice.toFixed(2)}. Win Rate: ${backtestResult.metrics.winRatePct}%, Sharpe: ${backtestResult.metrics.sharpeRatio}, Alpha: +${backtestResult.metrics.alphaPct}%`;
      setDeployFeedback(msg);
      if (onDeployToBrain) onDeployToBrain(config);
      setTimeout(() => setDeployFeedback(null), 6000);
    } catch (e: any) {
      setDeployFeedback(`Deployment note: ${e.message}`);
    }
  };

  // Export Results to JSON
  const handleExportJSON = () => {
    if (!backtestResult) return;
    const blob = new Blob([JSON.stringify(backtestResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backtest_${selectedTicker}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Trades to CSV
  const handleExportCSV = () => {
    if (!backtestResult || backtestResult.trades.length === 0) return;
    const headers = ['Trade #', 'Side', 'Entry Date', 'Exit Date', 'Entry Price', 'Exit Price', 'Shares', 'Net PnL ($)', 'Return (%)', 'Duration (Bars)', 'Exit Reason'];
    const rows = backtestResult.trades.map(t => [
      t.tradeNumber,
      t.positionSide,
      t.entryDate,
      t.exitDate,
      t.entryPrice,
      t.exitPrice,
      t.shares,
      t.netPnl,
      t.returnPct,
      t.durationBars,
      t.exitReason
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${selectedTicker}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const metrics = backtestResult?.metrics;

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              Algorithmic Strategy Backtesting & Simulation Engine
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Ticker: <strong className="text-white">{selectedTicker}</strong> (${currentPrice.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {chartBars.length} Historical Bars Loaded
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Event-Driven Backtest & Custom Signal Logic Simulator
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Design multi-factor entry and exit criteria (RSI, EMA Crossovers, Bollinger Squeezes, VWAP, Volume Spikes), model market frictions (slippage, commissions), and execute tick-resolution simulations with full risk attribution.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Simulating...' : 'Run Backtest'}
          </button>

          <button
            onClick={handleDeployToBrain}
            disabled={!backtestResult}
            className="px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-purple-950/40"
            title="Deploy strategy parameters to continuous paper trading brain"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Deploy to Brain
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!backtestResult || backtestResult.trades.length === 0}
            className="px-3 py-2 rounded-xl text-xs font-bold font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 flex items-center gap-1.5 transition-all"
            title="Export Trades to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Deployment Toast */}
      {deployFeedback && (
        <div className="p-3.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{deployFeedback}</span>
          </div>
          <button
            onClick={() => setDeployFeedback(null)}
            className="text-purple-400 hover:text-white text-xs px-2 py-0.5 rounded hover:bg-purple-800/40"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Strategy Presets Selector Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-mono font-bold text-zinc-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Battle-Tested Strategy Templates
          </span>
          <span className="text-[10px] font-mono text-zinc-500">
            Select a template or customize rules below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESET_STRATEGIES.map(preset => {
            const isSelected = config.name.includes(preset.name);
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-950/30'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                <div>
                  <div className="text-xs font-bold font-mono text-white flex items-center justify-between">
                    <span>{preset.name}</span>
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 leading-snug">
                    {preset.description}
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                  <span>SL {preset.exitRules.stopLossPct}% / TP {preset.exitRules.takeProfitPct}%</span>
                  <span className="text-purple-400 uppercase font-bold">{preset.positionSizing.replace('_', ' ')}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Custom Signal Logic Builder & Frictions Accordion */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
              Custom Signal Logic & Parameter Studio
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-zinc-500">Logic Confluence:</span>
            <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => setConfig(prev => ({ ...prev, entryLogicOperator: 'ALL' }))}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.entryLogicOperator === 'ALL' ? 'bg-emerald-600 text-white' : 'text-zinc-400'
                }`}
              >
                AND (Match All)
              </button>
              <button
                onClick={() => setConfig(prev => ({ ...prev, entryLogicOperator: 'ANY' }))}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  config.entryLogicOperator === 'ANY' ? 'bg-indigo-600 text-white' : 'text-zinc-400'
                }`}
              >
                OR (Match Any)
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Entry Conditions List */}
        <div className="space-y-2">
          {config.entryRules.map((cond, idx) => (
            <div
              key={cond.id}
              className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold">
                  Rule #{idx + 1}
                </span>

                {/* Indicator 1 */}
                <select
                  value={cond.indicator}
                  onChange={e => handleUpdateCondition(cond.id, { indicator: e.target.value as IndicatorType })}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="PRICE">PRICE (Close)</option>
                  <option value="RSI">RSI (Relative Strength)</option>
                  <option value="EMA_FAST">EMA Fast (12)</option>
                  <option value="EMA_SLOW">EMA Slow (26)</option>
                  <option value="SMA_200">SMA 200 (Long-Term)</option>
                  <option value="MACD_LINE">MACD Line</option>
                  <option value="MACD_HIST">MACD Histogram</option>
                  <option value="BB_PCT_B">Bollinger %B</option>
                  <option value="ATR">ATR (Volatility)</option>
                  <option value="VOLUME_RATIO">Volume Ratio (vs 20 MA)</option>
                  <option value="VWAP">VWAP (Institutional)</option>
                  <option value="STOCH_K">Stochastic %K</option>
                </select>

                {/* Operator */}
                <select
                  value={cond.operator}
                  onChange={e => handleUpdateCondition(cond.id, { operator: e.target.value as SignalOperator })}
                  className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-emerald-400 font-bold text-xs font-mono focus:outline-none focus:border-emerald-500"
                >
                  <option value="CROSSES_ABOVE">CROSSES ABOVE</option>
                  <option value="CROSSES_BELOW">CROSSES BELOW</option>
                  <option value="GREATER_THAN">&gt; GREATER THAN</option>
                  <option value="LESS_THAN">&lt; LESS THAN</option>
                  <option value="EQUALS">= EQUALS</option>
                </select>

                {/* Target Type */}
                <div className="flex items-center gap-1">
                  <select
                    value={cond.compareType}
                    onChange={e => handleUpdateCondition(cond.id, { compareType: e.target.value as 'VALUE' | 'INDICATOR' })}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-zinc-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  >
                    <option value="VALUE">Fixed Value</option>
                    <option value="INDICATOR">Indicator</option>
                  </select>

                  {cond.compareType === 'VALUE' ? (
                    <input
                      type="number"
                      step="any"
                      value={cond.value ?? 0}
                      onChange={e => handleUpdateCondition(cond.id, { value: parseFloat(e.target.value) || 0 })}
                      className="w-20 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                    />
                  ) : (
                    <select
                      value={cond.compareIndicator || 'EMA_SLOW'}
                      onChange={e => handleUpdateCondition(cond.id, { compareIndicator: e.target.value as IndicatorType })}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                    >
                      <option value="EMA_SLOW">EMA Slow</option>
                      <option value="SMA_200">SMA 200</option>
                      <option value="VWAP">VWAP</option>
                      <option value="MACD_SIGNAL">MACD Signal</option>
                      <option value="BB_LOWER">BB Lower Band</option>
                      <option value="BB_UPPER">BB Upper Band</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Remove Condition */}
              <button
                onClick={() => handleRemoveCondition(cond.id)}
                disabled={config.entryRules.length <= 1}
                className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors self-end md:self-auto disabled:opacity-30"
                title="Remove condition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleAddCondition}
            className="w-full py-2 rounded-lg border border-dashed border-zinc-800 hover:border-emerald-500/50 text-xs font-mono text-zinc-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-all bg-zinc-900/40"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Entry Signal Rule
          </button>
        </div>

        {/* Risk & Friction Settings Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
          {/* Initial Capital */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">CAPITAL ($)</span>
            <input
              type="number"
              step="5000"
              value={config.initialCapital}
              onChange={e => setConfig(prev => ({ ...prev, initialCapital: Math.max(1000, parseFloat(e.target.value) || 10000) }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Sizing Model */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">POSITION SIZING</span>
            <select
              value={config.positionSizing}
              onChange={e => setConfig(prev => ({ ...prev, positionSizing: e.target.value as any }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="HALF_KELLY">Half-Kelly Criterion</option>
              <option value="FULL_KELLY">Full-Kelly Max</option>
              <option value="FIXED_PCT">Fixed % Capital</option>
              <option value="FIXED_CASH">Fixed Cash ($)</option>
            </select>
          </div>

          {/* Stop Loss */}
          <div className="space-y-1">
            <span className="text-[10px] text-rose-400 font-bold block">STOP LOSS (%)</span>
            <input
              type="number"
              step="0.5"
              value={config.exitRules.stopLossPct}
              onChange={e => setConfig(prev => ({
                ...prev,
                exitRules: { ...prev.exitRules, stopLossPct: Math.max(0.5, parseFloat(e.target.value) || 2.0) }
              }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-rose-400 font-mono text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Take Profit */}
          <div className="space-y-1">
            <span className="text-[10px] text-emerald-400 font-bold block">TAKE PROFIT (%)</span>
            <input
              type="number"
              step="0.5"
              value={config.exitRules.takeProfitPct}
              onChange={e => setConfig(prev => ({
                ...prev,
                exitRules: { ...prev.exitRules, takeProfitPct: Math.max(1.0, parseFloat(e.target.value) || 5.0) }
              }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Slippage Bps */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold block">SLIPPAGE (BPS)</span>
            <input
              type="number"
              step="0.5"
              value={config.frictions.slippageBps}
              onChange={e => setConfig(prev => ({
                ...prev,
                frictions: { ...prev.frictions, slippageBps: Math.max(0, parseFloat(e.target.value) || 0) }
              }))}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tick Simulation Toggle */}
          <div className="space-y-1 flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer pt-3">
              <input
                type="checkbox"
                checked={enableTickSimulation}
                onChange={e => setEnableTickSimulation(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-800 text-emerald-500 focus:ring-0"
              />
              <span className="text-[10px] text-zinc-300 font-bold">SUB-BAR TICKS</span>
            </label>
          </div>
        </div>
      </div>

      {/* 4. Performance Metrics KPI Dashboard */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
          {/* Total Net Profit */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">Strategy Net Return</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${metrics.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {metrics.totalReturnPct >= 0 ? '+' : ''}{metrics.totalReturnPct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Net: ${metrics.netProfit >= 0 ? '+' : ''}{metrics.netProfit.toLocaleString()}
            </div>
          </div>

          {/* Alpha vs Benchmark */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">Alpha vs Benchmark</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${metrics.alphaPct >= 0 ? 'text-purple-400' : 'text-zinc-400'}`}>
                {metrics.alphaPct >= 0 ? '+' : ''}{metrics.alphaPct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-500">
              B&H: {metrics.benchmarkReturnPct}%
            </div>
          </div>

          {/* Sharpe & Sortino */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">Sharpe / Sortino</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-amber-400">
                {metrics.sharpeRatio}
              </span>
              <span className="text-xs text-zinc-400">/ {metrics.sortinoRatio}</span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Calmar: {metrics.calmarRatio}
            </div>
          </div>

          {/* Win Rate & Trades */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">Win Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-xl font-black ${metrics.winRatePct >= 50 ? 'text-emerald-400' : 'text-zinc-200'}`}>
                {metrics.winRatePct}%
              </span>
              <span className="text-xs text-zinc-500">({metrics.winningTrades}W / {metrics.losingTrades}L)</span>
            </div>
            <div className="text-[10px] text-zinc-400">
              Total Trades: {metrics.totalTrades}
            </div>
          </div>

          {/* Max Drawdown */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">Max Drawdown</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-rose-400">
                -{metrics.maxDrawdownPct}%
              </span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Duration: {metrics.maxDrawdownBars} bars
            </div>
          </div>

          {/* Profit Factor & Payoff */}
          <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
            <span className="text-[10px] uppercase text-zinc-500 font-bold block">Profit Factor</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">
                {metrics.profitFactor}x
              </span>
            </div>
            <div className="text-[10px] text-zinc-500">
              Payoff: {metrics.payoffRatio}:1
            </div>
          </div>
        </div>
      )}

      {/* 5. Synchronized Equity Curve & Drawdown Chart */}
      {backtestResult && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold font-mono uppercase text-white tracking-wider">
                  Cumulative Equity Curve vs Buy & Hold Benchmark
                </h4>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-emerald-400" />
                  <span className="text-zinc-300">Strategy: ${backtestResult.metrics.finalEquity.toLocaleString()}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-zinc-500" />
                  <span className="text-zinc-500">Benchmark B&H</span>
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={backtestResult.equityCurve} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis
                    dataKey="date"
                    stroke="#71717a"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={val => val.slice(5)}
                  />
                  <YAxis
                    stroke="#71717a"
                    tick={{ fontSize: 10, fontFamily: 'monospace' }}
                    tickFormatter={val => `$${Math.round(val / 1000)}k`}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '0.75rem', fontSize: '11px', fontFamily: 'monospace' }}
                    formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                  />
                  <Line
                    type="monotone"
                    dataKey="benchmarkEquity"
                    name="Benchmark"
                    stroke="#71717a"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="strategyEquity"
                    name="Strategy Equity"
                    stroke="#10b981"
                    strokeWidth={2.2}
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Underwater Drawdown Chart */}
            <div className="pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                <span>PORTFOLIO UNDERWATER DRAWDOWN (%)</span>
                <span className="text-rose-400 font-bold">Max: -{backtestResult.metrics.maxDrawdownPct}%</span>
              </div>
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={backtestResult.equityCurve} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#27272a" />
                    <XAxis dataKey="date" hide />
                    <YAxis
                      stroke="#71717a"
                      tick={{ fontSize: 9, fontFamily: 'monospace' }}
                      tickFormatter={val => `-${val}%`}
                      domain={[0, Math.max(10, Math.ceil(backtestResult.metrics.maxDrawdownPct * 1.2))]}
                      reversed
                    />
                    <Area
                      type="monotone"
                      dataKey="drawdownPct"
                      name="Drawdown %"
                      stroke="#f43f5e"
                      fill="#881337"
                      fillOpacity={0.4}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tabs: Trade Log & Monthly Attribution */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'metrics' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Risk Attribution (VaR & Streaks)
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'trades' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Trade Execution Log ({backtestResult?.trades.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              activeTab === 'monthly' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Monthly Returns Matrix
          </button>
        </div>

        {/* Tab 1: Risk Attribution */}
        {activeTab === 'metrics' && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Downside Tail Risk</span>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">1-Day 95% VaR:</span>
                <span className="text-rose-400 font-bold">-{metrics.var95Pct}%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Conditional VaR (CVaR):</span>
                <span className="text-rose-400 font-bold">-{metrics.cvar95Pct}%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Beta to Benchmark:</span>
                <span className="text-white font-bold">{metrics.beta}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Streak & Duration</span>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Max Win Streak:</span>
                <span className="text-emerald-400 font-bold">{metrics.maxConsecutiveWins} trades</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Max Loss Streak:</span>
                <span className="text-rose-400 font-bold">{metrics.maxConsecutiveLosses} trades</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Avg Trade Duration:</span>
                <span className="text-white font-bold">{metrics.avgTradeDurationBars} bars</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block">Friction Drag Paid</span>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Broker Commissions:</span>
                <span className="text-amber-400 font-bold">${metrics.totalCommissionPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Slippage Cost:</span>
                <span className="text-amber-400 font-bold">${metrics.totalSlippageCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-400">Ticks Evaluated:</span>
                <span className="text-white font-bold">{backtestResult.ticksProcessed.toLocaleString()} ticks</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Trades Log Table */}
        {activeTab === 'trades' && backtestResult && (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/70 max-h-80 overflow-y-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800 text-[10px] uppercase text-zinc-400">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Side</th>
                  <th className="py-2.5 px-3">Entry Date</th>
                  <th className="py-2.5 px-3">Exit Date</th>
                  <th className="py-2.5 px-3">Entry $</th>
                  <th className="py-2.5 px-3">Exit $</th>
                  <th className="py-2.5 px-3">Shares</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Reason</th>
                  <th className="py-2.5 px-3 text-right">Net PnL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {backtestResult.trades.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-6 text-center text-zinc-500 font-mono">
                      No trades triggered with current signal criteria. Try relaxing entry thresholds.
                    </td>
                  </tr>
                ) : (
                  backtestResult.trades.map(trade => (
                    <tr key={trade.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2 px-3 text-zinc-400 font-bold">{trade.tradeNumber}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                          {trade.positionSide}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-zinc-300">{trade.entryDate}</td>
                      <td className="py-2 px-3 text-zinc-300">{trade.exitDate}</td>
                      <td className="py-2 px-3 text-white">${trade.entryPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-white">${trade.exitPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-zinc-400">{trade.shares}</td>
                      <td className="py-2 px-3 text-zinc-400">{trade.durationBars}b</td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          trade.exitReason === 'TAKE_PROFIT' ? 'bg-emerald-500/20 text-emerald-400' :
                          trade.exitReason === 'STOP_LOSS' ? 'bg-rose-500/20 text-rose-400' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {trade.exitReason}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-right font-bold ${trade.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trade.netPnl >= 0 ? '+' : ''}${trade.netPnl.toLocaleString()} ({trade.returnPct >= 0 ? '+' : ''}{trade.returnPct}%)
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Monthly Matrix */}
        {activeTab === 'monthly' && backtestResult && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono text-xs">
            {backtestResult.monthlyReturns.map((m, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                  m.returnPct >= 0
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="text-[10px] text-zinc-400 font-bold">
                  {m.year}-{m.month}
                </div>
                <div className="text-base font-black mt-1">
                  {m.returnPct >= 0 ? '+' : ''}{m.returnPct}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
