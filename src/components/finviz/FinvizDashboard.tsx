import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  BarChart2, 
  Grid, 
  Globe, 
  Layers, 
  Sparkles, 
  Bookmark, 
  ShieldAlert,
  ArrowRight,
  Zap,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { FinvizTickerTape } from './FinvizTickerTape';
import { FinvizHome } from './FinvizHome';
import { FinvizScreener } from './FinvizScreener';
import { FinvizMap } from './FinvizMap';
import { FinvizGroups } from './FinvizGroups';
import { FinvizChartWithProjections } from './FinvizChartWithProjections';
import { FINVIZ_NEWS, FINVIZ_STOCKS } from '../../data/finvizData';
import { cn } from '../../utils/cn';

export type FinvizTab = 'home' | 'news' | 'screener' | 'map' | 'groups' | 'chart';

interface FinvizDashboardProps {
  initialTicker?: string;
  onOpenRiskEngine?: () => void;
  watchlist?: string[];
  onToggleWatchlist?: (ticker: string) => void;
}

export const FinvizDashboard: React.FC<FinvizDashboardProps> = ({
  initialTicker = 'NVDA',
  onOpenRiskEngine,
  watchlist = ['AAPL', 'NVDA', 'MSFT', 'TSLA'],
  onToggleWatchlist
}) => {
  const [activeTab, setActiveTab] = useState<FinvizTab>('home');
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<typeof FINVIZ_STOCKS>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSelectTicker = (ticker: string) => {
    setSelectedTicker(ticker.toUpperCase());
    setActiveTab('chart');
    setIsSearching(false);
    setSearchQuery('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const q = val.toLowerCase();
      const filtered = FINVIZ_STOCKS.filter(s => 
        s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      ).slice(0, 6);
      setSuggestions(filtered);
      setIsSearching(true);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSelectTicker(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Finviz Live Ticker Marquee */}
      <FinvizTickerTape />

      {/* 2. Authentic Finviz Navigation & Branding Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-3">
            
            {/* Logo and Brand */}
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="bg-emerald-600 text-white font-black text-lg px-2 py-0.5 rounded tracking-tighter shadow-md group-hover:bg-emerald-500 transition-colors">
                  FINVIZ
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                    QUANT TRADE <span className="bg-emerald-500/20 text-emerald-300 text-[8px] px-1 rounded">PRO</span>
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono -mt-0.5">
                    Stock Screener & Projections
                  </span>
                </div>
              </div>

              {/* Mobile search toggle */}
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('chart')}
                  className="px-2 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/30"
                >
                  {selectedTicker}
                </button>
              </div>
            </div>

            {/* Finviz Global Search Box */}
            <div className="relative flex-1 max-w-md mx-auto md:mx-6">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery && setIsSearching(true)}
                    placeholder="Search ticker, company (e.g. AAPL, NVDA, TSLA)..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg py-1.5 pl-9 pr-20 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono font-bold uppercase transition-all"
                  >
                    Quote
                  </button>
                </div>
              </form>

              {/* Autocomplete dropdown */}
              <AnimatePresence>
                {isSearching && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                  >
                    {suggestions.map(s => (
                      <div
                        key={s.ticker}
                        onClick={() => handleSelectTicker(s.ticker)}
                        className="px-3 py-2 hover:bg-zinc-800 cursor-pointer flex items-center justify-between text-xs border-b border-zinc-800 last:border-b-0 font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-400">{s.ticker}</span>
                          <span className="text-zinc-300 font-sans text-[11px] truncate max-w-[180px]">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-100">${s.price.toFixed(2)}</span>
                          <span className={cn("ml-2 font-bold", s.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Tickers & Risk Button */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleSelectTicker(t)}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all font-bold",
                      selectedTicker === t && activeTab === 'chart'
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {onOpenRiskEngine && (
                <button
                  onClick={onOpenRiskEngine}
                  className="ml-2 flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-750 transition-all"
                >
                  <ShieldAlert size={13} className="text-amber-400" />
                  <span>Risk Engine</span>
                </button>
              )}
            </div>

          </div>

          {/* Finviz Secondary Menu Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 border-t border-zinc-800/60 scrollbar-none text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('home')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                activeTab === 'home'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('screener')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'screener'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <SlidersHorizontal size={13} />
              Screener
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'map'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Grid size={13} />
              Maps (Treemap)
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'groups'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <BarChart2 size={13} />
              Groups
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border",
                activeTab === 'chart'
                  ? "bg-emerald-600 text-white font-black border-emerald-500 shadow-sm"
                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              )}
            >
              <Sparkles size={13} />
              Quant Chart ({selectedTicker})
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'news'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Globe size={13} />
              News
            </button>
          </nav>
        </div>
      </header>

      {/* 3. Main Dashboard Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'home' && (
          <FinvizHome
            onSelectTicker={handleSelectTicker}
            onNavigateToMap={() => setActiveTab('map')}
            onNavigateToScreener={() => setActiveTab('screener')}
          />
        )}

        {activeTab === 'screener' && (
          <FinvizScreener onSelectTicker={handleSelectTicker} />
        )}

        {activeTab === 'map' && (
          <FinvizMap onSelectTicker={handleSelectTicker} />
        )}

        {activeTab === 'groups' && (
          <FinvizGroups />
        )}

        {activeTab === 'chart' && (
          <FinvizChartWithProjections
            ticker={selectedTicker}
            onSelectTicker={handleSelectTicker}
            onAddWatchlist={onToggleWatchlist}
            isWatchlisted={watchlist.includes(selectedTicker)}
          />
        )}

        {activeTab === 'news' && (
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Globe className="text-emerald-400" size={18} />
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  Real-Time Global Financial News Wire
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">Curated from Bloomberg, Reuters, WSJ, CNBC</span>
            </div>

            <div className="divide-y divide-zinc-850 space-y-3">
              {FINVIZ_NEWS.map(n => (
                <div key={n.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
                      <span className="font-bold text-zinc-300">{n.source}</span>
                      <span>·</span>
                      <span>{n.time}</span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 hover:text-emerald-400 cursor-pointer transition-colors">
                      {n.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {n.tickers.map(t => (
                      <button
                        key={t}
                        onClick={() => handleSelectTicker(t)}
                        className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* 4. Finviz-Style Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-4 mt-8 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">FINVIZ QUANT TRADE</span>
            <span>·</span>
            <span>Quotes delayed 15 min · Mathematical Projections Generated via Monte Carlo & Fuzzy Inference</span>
          </div>
          <div className="text-zinc-600 text-[11px]">
            Hedge Fund Grade Analytics
          </div>
        </div>
      </footer>
    </div>
  );
};
