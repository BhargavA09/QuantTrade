import React, { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Newspaper, 
  ShieldAlert, 
  ExternalLink, 
  Radio, 
  Zap, 
  Sparkles, 
  Clock, 
  Target, 
  Layers, 
  Sliders, 
  Eye, 
  ChevronRight,
  Flame,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowUpRight,
  ArrowDownRight,
  Compass
} from 'lucide-react';
import { 
  fetchStockProjectionIntelligence, 
  StockProjectionIntelligence,
  StockInsiderTransaction,
  InstitutionalWhaleFlow
} from '../../services/api/marketService';

interface StockSearchScenarioProjectionProps {
  initialTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

const QUICK_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GLD', 'USO', 'AMZN', 'BTC-USD'];

export const StockSearchScenarioProjection: React.FC<StockSearchScenarioProjectionProps> = ({
  initialTicker = 'NVDA',
  onSelectTicker
}) => {
  const [searchInput, setSearchInput] = useState(initialTicker);
  const [activeTicker, setActiveTicker] = useState(initialTicker);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockProjectionIntelligence | null>(null);
  const [activeScenarioTab, setActiveScenarioTab] = useState<'baseCase' | 'bullCase' | 'bearCase'>('baseCase');

  const loadTickerProjection = async (ticker: string) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStockProjectionIntelligence(clean);
      setData(result);
      setActiveTicker(clean);
      if (onSelectTicker) {
        onSelectTicker(clean);
      }
    } catch (err: any) {
      console.error('Failed to load projection intelligence:', err);
      setError(`Failed to fetch live projection intelligence for ${clean}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickerProjection(initialTicker);
  }, [initialTicker]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchInput.trim()) {
      loadTickerProjection(searchInput.trim().toUpperCase());
    }
  };

  const currentPrice = data?.currentPrice || 150.0;
  const mc = data?.monteCarloProjection;
  const insider = data?.insiderIntelligence;
  const scenarios = data?.scenarioOverview;

  return (
    <div className="space-y-6">
      {/* 1. Search Bar & Quick Ticker Selector Header */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                SEARCH PROJECTION ENGINE
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                Multi-Scenario · SEC Form 4 Insiders · Live News Catalysts
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Target className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Stock Projection, Inside Information & Scenario Overview</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Search any equity, ETF, or commodity to run real-time Monte Carlo forward projections, analyze C-suite Form 4 insider transactions, scan live news wires, and review the current scenario shaping future price trajectory.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search ANY stock (e.g. NVDA, AAPL, GLD, TSLA)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchInput.trim()}
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
              <span>Project ↵</span>
            </button>
          </form>
        </div>

        {/* Quick Tickers Strip */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-zinc-800/80 text-xs font-mono">
          <span className="text-[10px] text-zinc-500 uppercase font-bold">Quick Assets:</span>
          {QUICK_TICKERS.map(t => (
            <button
              key={t}
              onClick={() => {
                setSearchInput(t);
                loadTickerProjection(t);
              }}
              className={`px-2.5 py-1 rounded-lg border transition-all ${
                activeTicker === t
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                  : 'bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {loading && !data && (
        <div className="p-12 text-center text-zinc-500 font-mono text-sm space-y-2">
          <div className="animate-pulse text-emerald-400 text-lg">⚡ Simulating Multi-Scenario Forward Paths...</div>
          <p className="text-xs text-zinc-500">Cross-referencing SEC Form 4 insider disclosures & live news wires for {activeTicker}</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          
          {/* 2. Top Metric Snapshot for Searched Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Live Quote ({data.ticker})</span>
              <div className="text-2xl font-black text-white font-mono">
                ${data.currentPrice.toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-400 truncate block">{data.companyName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">30D Expected Median</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                ${mc?.expectedPriceMedian.toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-400 block font-mono">
                {mc?.expectedReturnPct && mc.expectedReturnPct >= 0 ? '+' : ''}{mc?.expectedReturnPct.toFixed(2)}% Expected
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Probability of Profit</span>
              <div className="text-2xl font-black text-indigo-400 font-mono">
                {mc?.probProfitPct.toFixed(1)}%
              </div>
              <span className="text-[10px] text-zinc-400 block">Monte Carlo 500 Paths</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Insider Conviction</span>
              <div className={`text-sm font-black font-mono truncate ${
                (insider?.netScore ?? 0) > 10 
                  ? 'text-emerald-400' 
                  : ((insider?.netScore ?? 0) < -10 ? 'text-rose-400' : 'text-amber-400')
              }`}>
                {insider?.insiderConviction.replace(/_/g, ' ') || 'NEUTRAL'}
              </div>
              <span className="text-[10px] text-zinc-400 block">
                Net Score: {insider?.netScore && insider.netScore >= 0 ? '+' : ''}{insider?.netScore}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">30D Value at Risk (95%)</span>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {mc?.var95Pct.toFixed(1)}%
              </div>
              <span className="text-[10px] text-zinc-400 block">Lower bound: ${mc?.targetLow95.toFixed(2)}</span>
            </div>
          </div>

          {/* 3. Multi-Scenario Overview & Future Impact (The Core User Request) */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-400" />
                  <span>Current Scenario & Future Trajectory Matrix for {data.ticker}</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Synthesized impact model evaluating Macro, C-suite insider flow, and options dealer positioning
                </p>
              </div>

              {/* Scenario Tab Buttons */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setActiveScenarioTab('baseCase')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeScenarioTab === 'baseCase'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Base Case ({scenarios?.baseCase.probabilityPct}%)
                </button>
                <button
                  onClick={() => setActiveScenarioTab('bullCase')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeScenarioTab === 'bullCase'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Bull Case ({scenarios?.bullCase.probabilityPct}%)
                </button>
                <button
                  onClick={() => setActiveScenarioTab('bearCase')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    activeScenarioTab === 'bearCase'
                      ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Bear Case ({scenarios?.bearCase.probabilityPct}%)
                </button>
              </div>
            </div>

            {/* Selected Scenario Deep-Dive Card */}
            {scenarios && (
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold">
                      Scenario Name
                    </span>
                    <h4 className="text-base font-bold text-white">
                      {scenarios[activeScenarioTab].name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 text-right font-mono">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">30D Target</span>
                      <span className={`text-xl font-black ${
                        scenarios[activeScenarioTab].expectedReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        ${scenarios[activeScenarioTab].targetPrice.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase block">Expected Return</span>
                      <span className={`text-xl font-black ${
                        scenarios[activeScenarioTab].expectedReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {scenarios[activeScenarioTab].expectedReturnPct >= 0 ? '+' : ''}{scenarios[activeScenarioTab].expectedReturnPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Core Macro & Micro Thesis:
                    </span>
                    <p className="text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                      {scenarios[activeScenarioTab].thesis}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Primary Liquidity & Catalyst Driver:
                    </span>
                    <p className="text-zinc-300 leading-relaxed bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                      {scenarios[activeScenarioTab].driver}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Visual Forward Trajectory Sparkline / Horizon Paths */}
            {mc && mc.timeline && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-zinc-400">
                    Monte Carlo 30-Day Simulated Trajectories:
                  </span>
                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    <span className="text-emerald-400">Upper 95%: ${mc.targetHigh95.toFixed(2)}</span>
                    <span className="text-zinc-400">Median: ${mc.expectedPriceMedian.toFixed(2)}</span>
                    <span className="text-rose-400">Lower 95%: ${mc.targetLow95.toFixed(2)}</span>
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div className="bg-zinc-950 rounded-xl p-3 border border-zinc-800/80 overflow-hidden">
                  <svg className="w-full h-28" viewBox="0 0 600 110" preserveAspectRatio="none">
                    {/* Background Grid */}
                    <line x1="0" y1="20" x2="600" y2="20" stroke="#27272a" strokeDasharray="3,3" />
                    <line x1="0" y1="55" x2="600" y2="55" stroke="#27272a" strokeDasharray="3,3" />
                    <line x1="0" y1="90" x2="600" y2="90" stroke="#27272a" strokeDasharray="3,3" />

                    {/* Sample Paths */}
                    {mc.samplePaths && mc.samplePaths.slice(0, 10).map((path, idx) => {
                      const points = path.map((val, i) => {
                        const x = (i / (path.length - 1)) * 600;
                        const minP = mc.targetLow95 * 0.95;
                        const maxP = mc.targetHigh95 * 1.05;
                        const y = 100 - ((val - minP) / (maxP - minP)) * 90;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <polyline
                          key={idx}
                          fill="none"
                          stroke={idx % 2 === 0 ? 'rgba(52, 211, 153, 0.25)' : 'rgba(99, 102, 241, 0.2)'}
                          strokeWidth="1.2"
                          points={points}
                        />
                      );
                    })}

                    {/* Bull Case Target Line */}
                    <line
                      x1="0"
                      y1="22"
                      x2="600"
                      y2="22"
                      stroke="#34d399"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />

                    {/* Median Expected Path */}
                    <line
                      x1="0"
                      y1="55"
                      x2="600"
                      y2="55"
                      stroke="#818cf8"
                      strokeWidth="2"
                    />

                    {/* Bear Case Target Line */}
                    <line
                      x1="0"
                      y1="90"
                      x2="600"
                      y2="90"
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />
                  </svg>
                  
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                    <span>Day 1 (Today: ${data.currentPrice.toFixed(2)})</span>
                    <span>Day 15 (Mid-Cycle)</span>
                    <span>Day 30 (Projection Target Horizon)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4. Inside Information & SEC Form 4 Intelligence (C-Suite Trades & Whale Flows) */}
          {insider && (
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      SEC Form 4 Inside Information & Executive Order Flow
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Disclosures from corporate officers, directors, and 10% beneficial owners for {data.ticker}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">C-Suite Net Buying Ratio</span>
                    <span className="font-black text-emerald-400">{insider.netBuyingPercent}%</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block uppercase font-bold">Net Cash Flow</span>
                    <span className={`font-black ${insider.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {insider.netCashFlow >= 0 ? '+' : ''}${Math.round(insider.netCashFlow / 1000).toLocaleString()}k
                    </span>
                  </div>
                </div>
              </div>

              {/* Form 4 Transactions Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase">
                      <th className="py-2 px-3">Insider & Title</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Transaction Type</th>
                      <th className="py-2 px-3 text-right">Shares</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total Value</th>
                      <th className="py-2 px-3 text-right">Shares Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {insider.transactions.map((tx, txIdx) => (
                      <tr key={`${tx.id || 'tx'}-${txIdx}`} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-zinc-200">{tx.insiderName}</div>
                          <div className="text-[10px] text-zinc-500 font-sans">{tx.title}</div>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-400">{tx.transactionDate}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            tx.isBuy 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-300">
                          {tx.shares.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-300">
                          ${tx.price.toFixed(2)}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold ${
                          tx.isBuy ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {tx.isBuy ? '+' : '-'}${tx.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="py-2.5 px-3 text-right text-zinc-400">
                          {tx.sharesOwnedFollowing.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Institutional 13F Whales */}
              {insider.institutionalWhales && insider.institutionalWhales.length > 0 && (
                <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                    Institutional Whale Concentration (13F Filings):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono">
                    {insider.institutionalWhales.map((whale, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-zinc-950/70 border border-zinc-800/70 space-y-0.5">
                        <div className="text-zinc-300 font-bold truncate">{whale.fund}</div>
                        <div className="flex items-center justify-between text-[10px] text-zinc-500">
                          <span>{whale.shares} ({whale.pctHeld})</span>
                          <span className="text-emerald-400 font-bold">{whale.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Real-Time Related News & Catalyst Impact Wires */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  Related News Catalysts & Market Pulse ({data.ticker})
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {data.newsCount} WIRE SIGNALS
              </span>
            </div>

            {(!data.newsEvents || data.newsEvents.length === 0) ? (
              <div className="text-xs text-zinc-500 font-mono py-4 text-center">
                No active news catalysts detected in the current window for {data.ticker}.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.newsEvents.map((item, idx) => (
                  <div 
                    key={`${item.id || 'news'}-${idx}`}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-400 font-bold truncate max-w-[130px]">{item.source}</span>
                        <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                          item.sentiment_score > 0.1 
                            ? 'bg-emerald-500/20 text-emerald-300' 
                            : (item.sentiment_score < -0.1 ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-400')
                        }`}>
                          {item.trade_bias || (item.sentiment_score > 0 ? 'BULLISH' : 'BEARISH')} ({item.sentiment_score > 0 ? '+' : ''}{item.sentiment_score.toFixed(2)})
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                      <span>{item.pubDate ? new Date(item.pubDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                      {item.link && (
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          Source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Upcoming Future Milestones & Catalyst Timeline */}
          {data.catalysts && data.catalysts.length > 0 && (
            <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Future Milestone Roadmap & Volatility Events ({data.ticker})
                  </h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Forward Catalysts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {data.catalysts.map((cat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        cat.impactRating === 'HIGH' 
                          ? 'bg-rose-500/20 text-rose-300' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {cat.impactRating} Impact
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">{cat.timeframe}</span>
                    </div>
                    <div className="font-bold text-zinc-200">{cat.event}</div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      Expected Vol: <strong className="text-amber-400">{cat.expectedVolExpansion}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
