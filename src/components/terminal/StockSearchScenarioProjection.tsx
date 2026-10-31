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
  Compass,
  RotateCw
} from 'lucide-react';
import { 
  fetchStockProjectionIntelligence, 
  StockProjectionIntelligence,
  StockInsiderTransaction,
  InstitutionalWhaleFlow
} from '../../services/api/marketService';
import { EXPANDED_STOCK_DATABASE } from '../../data/expandedStockDatabase';

interface StockSearchScenarioProjectionProps {
  initialTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

const REGIONAL_QUICK_TICKERS: Record<string, { label: string; icon: string; tickers: string[] }> = {
  'ALL': { label: 'All Global', icon: '🌐', tickers: ['NVDA', 'SHOP.TO', 'SHEL.L', 'ASML.AS', '7203.T', '0700.HK', 'PLUG', 'SNDL', 'BTC-USD', 'GC=F'] },
  'US': { label: 'US Equities', icon: '🇺🇸', tickers: ['NVDA', 'AAPL', 'MSFT', 'TSLA', 'SPY', 'QQQ', 'PLTR', 'AMD'] },
  'TSX': { label: 'Canadian (TSX)', icon: '🇨🇦', tickers: ['SHOP.TO', 'RY.TO', 'TD.TO', 'ENB.TO', 'CNR.TO', 'BMO.TO', 'XIU.TO'] },
  'EUROPE': { label: 'European', icon: '🇪🇺', tickers: ['SHEL.L', 'ASML.AS', 'MC.PA', 'SAP.DE', 'SIE.DE'] },
  'ASIA': { label: 'Asia-Pacific', icon: '🌏', tickers: ['7203.T', '0700.HK', '9988.HK', 'BHP.AX', 'CBA.AX'] },
  'PENNY': { label: 'Penny Stocks (< $5)', icon: '🪙', tickers: ['PLUG', 'SNDL', 'SOFI', 'MARA', 'DNA', 'LCID', 'RIOT', 'CLOV', 'OPEN'] },
  'CRYPTO': { label: 'Crypto & Commodities', icon: '⚡', tickers: ['BTC-USD', 'ETH-USD', 'GC=F', 'SI=F', 'CL=F'] }
};

export const StockSearchScenarioProjection: React.FC<StockSearchScenarioProjectionProps> = ({
  initialTicker = 'NVDA',
  onSelectTicker
}) => {
  const getSavedTicker = (): string => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTicker = urlParams.get('ticker') || urlParams.get('symbol');
        if (urlTicker && urlTicker.trim()) return urlTicker.trim().toUpperCase();

        const saved = localStorage.getItem('quant_terminal_active_ticker');
        if (saved && saved.trim()) return saved.trim().toUpperCase();
      }
    } catch {}
    return initialTicker;
  };

  const startingTicker = getSavedTicker();
  const [searchInput, setSearchInput] = useState(startingTicker);
  const [activeTicker, setActiveTicker] = useState(startingTicker);
  const [activeRegion, setActiveRegion] = useState<string>('ALL');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StockProjectionIntelligence | null>(null);
  const [activeScenarioTab, setActiveScenarioTab] = useState<'baseCase' | 'bullCase' | 'bearCase'>('baseCase');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Live Connected');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quant_recent_searches');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['NVDA', 'SHOP.TO', 'AAPL', 'PLUG', 'SNDL'];
  });

  // Real-Time Market Noise & News Radar State
  const [newsFilter, setNewsFilter] = useState<'all' | 'catalyst' | 'noise' | 'analyst'>('all');
  const [isAutoScanningNoise, setIsAutoScanningNoise] = useState<boolean>(true);
  const [noiseScanTick, setNoiseScanTick] = useState<number>(0);
  const [isRefreshingNews, setIsRefreshingNews] = useState<boolean>(false);
  const [lastNoiseScanTime, setLastNoiseScanTime] = useState<string>('Live Streaming');

  const refreshMarketNoise = async (ticker: string) => {
    if (!ticker) return;
    try {
      setIsRefreshingNews(true);
      const res = await fetch(`/api/news?ticker=${encodeURIComponent(ticker)}`);
      if (res.ok) {
        const json = await res.json();
        const incomingEvents = json.events || [];
        if (incomingEvents.length > 0) {
          setData(prev => {
            if (!prev) return prev;
            const existing = prev.newsEvents || [];
            const seen = new Set(existing.map(e => e.title.toLowerCase().trim()));
            const newItems = incomingEvents.filter((e: any) => !seen.has(e.title.toLowerCase().trim()));
            return {
              ...prev,
              newsCount: existing.length + newItems.length,
              newsEvents: [...newItems, ...existing].slice(0, 15)
            };
          });
        }
        setLastNoiseScanTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.warn('Continuous noise scanning poll error:', err);
    } finally {
      setIsRefreshingNews(false);
    }
  };

  useEffect(() => {
    if (!isAutoScanningNoise) return;
    const interval = setInterval(() => {
      setNoiseScanTick(t => t + 1);
    }, 12000);
    return () => clearInterval(interval);
  }, [isAutoScanningNoise]);

  useEffect(() => {
    if (noiseScanTick > 0 && activeTicker) {
      refreshMarketNoise(activeTicker);
    }
  }, [noiseScanTick, activeTicker]);

  const formatTxDate = (dStr: string): string => {
    if (!dStr) return '-';
    const cleanStr = dStr.replace(/'/g, '').trim();
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length === 3) {
        const d = new Date(cleanStr);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        }
      }
    }
    return cleanStr;
  };

  const getCurrencySymbol = (ticker: string): string => {
    if (ticker.endsWith('.TO') || ticker.endsWith('.V')) return 'C$';
    if (ticker.endsWith('.L')) return '£';
    if (ticker.endsWith('.AS') || ticker.endsWith('.PA') || ticker.endsWith('.DE')) return '€';
    if (ticker.endsWith('.T')) return '¥';
    if (ticker.endsWith('.HK')) return 'HK$';
    if (ticker.endsWith('.AX')) return 'A$';
    if (ticker.endsWith('.NS')) return '₹';
    return '$';
  };

  const formatCashFlow = (val: number): string => {
    const absVal = Math.abs(val);
    const sign = val >= 0 ? '+' : '-';
    if (absVal >= 1_000_000_000) {
      return `${sign}$${(absVal / 1_000_000_000).toFixed(2)}B`;
    }
    if (absVal >= 1_000_000) {
      return `${sign}$${(absVal / 1_000_000).toFixed(2)}M`;
    }
    if (absVal >= 1_000) {
      return `${sign}$${Math.round(absVal / 1000).toLocaleString()}k`;
    }
    return `${sign}$${absVal.toLocaleString()}`;
  };

  const loadTickerProjection = async (ticker: string) => {
    const clean = ticker.trim().toUpperCase();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setSearchResults([]);
    try {
      const result = await fetchStockProjectionIntelligence(clean);
      setData(result);
      setActiveTicker(clean);
      setSearchInput(clean);
      setLastRefreshedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      try {
        localStorage.setItem('quant_terminal_active_ticker', clean);
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.set('ticker', clean);
          window.history.replaceState({}, '', url.toString());
        }
        setRecentSearches(prev => {
          const updated = [clean, ...prev.filter(t => t !== clean)].slice(0, 8);
          localStorage.setItem('quant_recent_searches', JSON.stringify(updated));
          return updated;
        });
      } catch {}

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

  // Auto-search any ticker across global exchanges with 0ms instant local match + live backend enrichment
  const handleInputChange = async (val: string) => {
    setSearchInput(val);
    const clean = val.trim().toUpperCase();
    if (!clean || clean.length < 1) {
      setSearchResults([]);
      return;
    }

    // 1. Instant local match (<1ms) so accurate price is visible immediately without delay
    const localMatches = EXPANDED_STOCK_DATABASE
      .filter(s => s.ticker.startsWith(clean) || s.ticker.includes(clean) || s.name.toUpperCase().includes(clean))
      .slice(0, 8)
      .map(s => ({
        symbol: s.ticker,
        shortname: s.name,
        longname: s.name,
        name: s.name,
        currentPrice: s.price,
        price: s.price,
        change: s.change,
        changePercent: s.changePercent,
        exchange: s.ticker.endsWith('.TO') ? 'TSX' : (s.ticker.endsWith('.L') ? 'LSE' : (s.ticker.endsWith('.AS') ? 'AMS' : (s.ticker.endsWith('.T') ? 'TSE' : 'US')))
      }));

    if (localMatches.length > 0) {
      setSearchResults(localMatches);
    }

    // 2. Fetch live global quotes from backend in background to supplement global universe
    try {
      setIsSearching(true);
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const json = await res.json();
        const quotes = json.quotes || json.results || [];
        if (Array.isArray(quotes) && quotes.length > 0) {
          // Merge deduplicated, keeping instant local prices prioritized for accurate display
          const seen = new Set<string>();
          const merged: any[] = [];
          [...quotes, ...localMatches].forEach(q => {
            const sym = (q.symbol || q.ticker || '').toUpperCase();
            if (sym && !seen.has(sym)) {
              seen.add(sym);
              merged.push(q);
            }
          });
          setSearchResults(merged.slice(0, 10));
        }
      }
    } catch {
      // ignore search error
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const target = initialTicker || getSavedTicker();
    loadTickerProjection(target);
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
  const currSym = getCurrencySymbol(activeTicker);

  return (
    <div className="space-y-6">
      {/* 1. Search Bar & Global Quick Ticker Selector Header */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                GLOBAL PROJECTION ENGINE
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                Worldwide Exchanges · Penny Stocks · SEC Form 4 Insiders · Live News Catalysts
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Target className="w-6 h-6 text-emerald-400 shrink-0" />
              <span>Global Stock Projection & Forward Scenario Intelligence</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Search ANY equity, penny stock, Canadian TSX, or international stock from any market in the world to run dynamic 30-day forward Monte Carlo simulations, inspect C-suite Form 4 insider transactions, scan live news wires, and review future price trajectories.
            </p>
          </div>

          {/* Search Form with Auto-Search */}
          <div className="relative max-w-md w-full">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Type ANY ticker or company (e.g. SHOP.TO, NVDA, PLUG, SNDL, SHEL.L, 7203.T)..."
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

            {/* Auto-suggest dropdown across all global markets with LIVE SPOT PRICES */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl z-50 p-2 space-y-1 backdrop-blur-md max-h-80 overflow-y-auto">
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-400 px-2 py-1 border-b border-zinc-800">
                  <span>Global Exchange Matches</span>
                  <span className="text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Streaming Prices
                  </span>
                </div>
                {searchResults.map((q, idx) => {
                  const sym = q.symbol || q.ticker;
                  const symCurr = getCurrencySymbol(sym);
                  const priceVal = q.currentPrice ?? q.price;
                  const chgPct = q.changePercent ?? 0;
                  return (
                    <div
                      key={`${sym}-${idx}`}
                      onClick={() => {
                        setSearchInput(sym);
                        loadTickerProjection(sym);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-zinc-800/90 cursor-pointer text-xs font-mono transition-colors border border-transparent hover:border-zinc-700/80 group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded group-hover:bg-emerald-600 transition-colors">
                          {sym}
                        </span>
                        <span className="text-zinc-300 truncate max-w-[130px] sm:max-w-[160px] text-[11px]">
                          {q.shortname || q.longname || q.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-sans font-bold">
                          {q.exchange || 'EXCHANGE'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {priceVal !== undefined && priceVal !== null ? (
                          <span className="font-black text-white text-xs">
                            {symCurr}{Number(priceVal).toFixed(Number(priceVal) < 5 ? 3 : 2)}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-[11px]">Syncing...</span>
                        )}
                        {chgPct !== undefined && chgPct !== null && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            chgPct >= 0
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {chgPct >= 0 ? '+' : ''}{Number(chgPct).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recently Searched Equities with Real-Time Quick Access */}
            {recentSearches.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] font-mono">
                <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  Recent:
                </span>
                {recentSearches.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSearchInput(t);
                      loadTickerProjection(t);
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[11px] font-mono transition-all ${
                      activeTicker === t
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Global Market Filter Switcher */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs font-mono">
            {Object.entries(REGIONAL_QUICK_TICKERS).map(([key, reg]) => (
              <button
                key={key}
                onClick={() => setActiveRegion(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeRegion === key
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border border-transparent'
                }`}
              >
                <span>{reg.icon}</span>
                <span>{reg.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Tickers for Selected Region */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
            <span className="text-[10px] text-zinc-500 uppercase font-bold">Quick Assets:</span>
            {REGIONAL_QUICK_TICKERS[activeRegion].tickers.map(t => (
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
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1 relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 uppercase font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Quote ({data.ticker})
                </span>
                <button
                  onClick={() => loadTickerProjection(data.ticker)}
                  disabled={loading}
                  title="Refresh Live Price for Searched Stock"
                  className="text-zinc-400 hover:text-emerald-400 transition-colors p-1 rounded hover:bg-zinc-800"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
                </button>
              </div>
              <div className="text-2xl font-black text-white font-mono flex items-baseline gap-1.5">
                <span>{currSym}{data.currentPrice.toFixed(data.currentPrice < 5 ? 3 : 2)}</span>
                <span className="text-[10px] text-zinc-500 font-sans font-normal">
                  {lastRefreshedTime}
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 truncate block">{data.companyName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">30D Expected Median</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {currSym}{mc?.expectedPriceMedian ? mc.expectedPriceMedian.toFixed(data.currentPrice < 5 ? 3 : 2) : '---'}
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
              <span className="text-[10px] text-zinc-400 block">Lower bound: {currSym}{mc?.targetLow95 ? mc.targetLow95.toFixed(data.currentPrice < 5 ? 3 : 2) : '---'}</span>
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

          {/* 4. Inside Information & SEC Form 4 Intelligence (Real C-Suite Trades & Whale Flows) */}
          {insider && (() => {
            const hasTransactions = Boolean(insider.transactions && insider.transactions.length > 0);
            return (
              <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          SEC Form 4 Inside Information & Executive Order Flow
                        </h3>
                        {hasTransactions ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            OFFICIAL SEC EDGAR DISCLOSURES
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 font-bold flex items-center gap-1">
                            <Lock className="w-3 h-3 text-zinc-500" />
                            NO ACTIVE DISCLOSURES AT THE MOMENT
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400">
                        Disclosures from corporate officers, directors, and 10% beneficial owners for {data.ticker}
                      </p>
                    </div>
                  </div>

                  {hasTransactions ? (
                    <div className="flex items-center gap-2 sm:gap-3 font-mono text-xs flex-wrap">
                      <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block uppercase font-bold">C-Suite Net Buying Ratio</span>
                        <span className="font-black text-emerald-400">{insider.netBuyingPercent}%</span>
                      </div>
                      <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800">
                        <span className="text-zinc-500 text-[10px] block uppercase font-bold">Net Cash Flow</span>
                        <span className={`font-black ${insider.netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCashFlow(insider.netCashFlow)}
                        </span>
                      </div>
                      {insider.totalBoughtCash > 0 && (
                        <div className="px-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 hidden md:block">
                          <span className="text-zinc-500 text-[10px] block uppercase font-bold">Total Bought</span>
                          <span className="font-black text-emerald-400">
                            {formatCashFlow(insider.totalBoughtCash)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-500" />
                      <span>Zero Form 4 Transactions Filed</span>
                    </div>
                  )}
                </div>

                {/* Form 4 Transactions Table or "No Information" Truthful Banner */}
                {hasTransactions ? (
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
                          <th className="py-2 px-3 text-center">SEC Filing</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {insider.transactions.map((tx, txIdx) => (
                          <tr key={`${tx.id || 'tx'}-${txIdx}`} className="hover:bg-zinc-800/40 transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="font-bold text-zinc-200">{tx.insiderName}</div>
                              <div className="text-[10px] text-zinc-500 font-sans">{tx.title}</div>
                            </td>
                            <td className="py-2.5 px-3 text-zinc-400 font-semibold">{formatTxDate(tx.transactionDate)}</td>
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
                            <td className="py-2.5 px-3 text-center">
                              {tx.secLink ? (
                                <a
                                  href={tx.secLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 transition-all font-semibold"
                                  title="View official SEC EDGAR Form 4 filing XML/HTML"
                                >
                                  SEC EDGAR
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span className="text-[10px] text-zinc-500 font-sans">Official Form 4</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 px-5 rounded-xl bg-zinc-950/60 border border-zinc-850 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
                      <ShieldAlert className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-200">
                        No information at the moment
                      </h4>
                      <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                        No official SEC Form 4 insider transactions are available at the moment for {data.ticker}. We only display legally verified SEC EDGAR disclosures with zero synthetic placeholders.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[10px]">
                      <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                        SEC EDGAR Database Polled
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                        Zero Synthetic Fillers
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                        Active Reporting Window
                      </span>
                    </div>
                  </div>
                )}

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
            );
          })()}

          {/* 5. Real-Time Continuous Market Noise & News Catalyst Scanner */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Continuous Market Noise & News Catalyst Scanner ({data.ticker})
                    </h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      AUTO-STREAMING (12s)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500 hidden sm:inline">
                      Last Scan: {lastNoiseScanTime}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Real-time automated scanning of market noise, news catalysts, rumors, and analyst wires for {data.ticker}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Instant Manual Scan Button */}
                <button
                  onClick={() => refreshMarketNoise(activeTicker)}
                  disabled={isRefreshingNews}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 font-mono text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 font-bold"
                  title="Force instant market noise wire re-scan"
                >
                  <RotateCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshingNews ? 'animate-spin' : ''}`} />
                  <span>{isRefreshingNews ? 'Scanning...' : 'Scan Now'}</span>
                </button>

                {/* Noise Filtering Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setNewsFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    newsFilter === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  All Signals ({data.newsEvents?.length || 0})
                </button>
                <button
                  onClick={() => setNewsFilter('catalyst')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    newsFilter === 'catalyst'
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Catalysts (High Impact)
                </button>
                <button
                  onClick={() => setNewsFilter('noise')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    newsFilter === 'noise'
                      ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Market Noise & Rumors
                </button>
                <button
                  onClick={() => setNewsFilter('analyst')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                    newsFilter === 'analyst'
                      ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Analyst Wires
                </button>
              </div>
            </div>
          </div>

            {/* Filtered News List */}
            {(() => {
              const events = (data.newsEvents || []).map(item => {
                const lower = item.title.toLowerCase();
                const isAnalyst = lower.includes('analyst') || lower.includes('rating') || lower.includes('target') || lower.includes('reiterate') || lower.includes('downgrade') || lower.includes('upgrade');
                const isCatalyst = Math.abs(item.sentiment_score) >= 0.28 || lower.includes('earnings') || lower.includes('contract') || lower.includes('revenue') || lower.includes('fda') || lower.includes('sec');
                const noiseType: 'catalyst' | 'analyst' | 'noise' = isAnalyst ? 'analyst' : (isCatalyst ? 'catalyst' : 'noise');
                return { ...item, noiseType };
              });

              const filtered = events.filter(e => {
                if (newsFilter === 'all') return true;
                return e.noiseType === newsFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="py-8 px-4 rounded-xl bg-zinc-950/50 border border-zinc-850 text-center space-y-2">
                    <Radio className="w-6 h-6 text-indigo-400 animate-pulse mx-auto" />
                    <div className="text-sm font-semibold text-zinc-300">
                      Scanning live news wires for {data.ticker}...
                    </div>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Noise scanner continuously listening to market wires, SEC 8-K disclosures, and news streams.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filtered.map((item, idx) => {
                    const isHighImpact = item.noiseType === 'catalyst';
                    const isNoise = item.noiseType === 'noise';

                    return (
                      <div 
                        key={`${item.id || 'news'}-${idx}`}
                        className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between space-y-2.5 hover:border-zinc-750 transition-colors"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-zinc-400 font-bold truncate max-w-[130px]">{item.source}</span>
                            <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                              isHighImpact
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : isNoise
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            }`}>
                              {isHighImpact ? 'CATALYST' : (isNoise ? 'MARKET NOISE' : 'ANALYST')} ({item.sentiment_score > 0 ? '+' : ''}{item.sentiment_score.toFixed(2)})
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-zinc-200 line-clamp-2 leading-snug">
                            {item.title}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] font-mono text-zinc-500">
                          <span>{item.pubDate ? new Date(item.pubDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Live Tape'}</span>
                          {item.link ? (
                            <a 
                              href={item.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold"
                            >
                              Source <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span className="text-zinc-600">Verified Wire</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
