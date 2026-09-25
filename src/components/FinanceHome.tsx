import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  Star, 
  Plus,
  X,
  Loader2,
  Globe,
  Zap,
  BarChart3,
  Activity,
  Brain,
  Shield,
  Target,
  Briefcase,
  Check,
  Sparkles,
  Trash2,
  ArrowUpRight
} from 'lucide-react';
import { fetchMarketOverview, searchTicker, resolveTickerSymbol } from '../services/api';
import { cn } from '../utils/cn';
import { neuralBrain, NeuralMemory } from '../services/NeuralBrain';

const POPULAR_SYMBOLS = [
  { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Semiconductors' },
  { symbol: 'AAPL', name: 'Apple Inc', sector: 'Consumer Tech' },
  { symbol: 'TSLA', name: 'Tesla Inc', sector: 'Automotive & AI' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'Index ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'Tech Index' },
  { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Cloud & AI' },
  { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'E-Commerce' },
  { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Search & AI' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Social & VR' },
  { symbol: 'PLTR', name: 'Palantir Tech', sector: 'Enterprise AI' },
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Crypto Platform' },
  { symbol: 'BTC-USD', name: 'Bitcoin USD', sector: 'Cryptocurrency' },
  { symbol: 'ETH-USD', name: 'Ethereum USD', sector: 'Cryptocurrency' },
];

const TICKER_NAME_MAP: Record<string, string> = {
  'SPY': 'SPDR S&P 500 ETF',
  'QQQ': 'Invesco QQQ Trust',
  'DIA': 'SPDR Dow Jones ETF',
  'IWM': 'iShares Russell 2000',
  'NVDA': 'NVIDIA Corporation',
  'AAPL': 'Apple Inc.',
  'TSLA': 'Tesla Inc.',
  'MSFT': 'Microsoft Corporation',
  'AMZN': 'Amazon.com Inc.',
  'GOOGL': 'Alphabet Inc.',
  'META': 'Meta Platforms Inc.',
  'PLTR': 'Palantir Technologies',
  'AMD': 'Advanced Micro Devices',
  'COIN': 'Coinbase Global Inc.',
  'BTC-USD': 'Bitcoin / USD',
  'ETH-USD': 'Ethereum / USD',
  'SOL-USD': 'Solana / USD',
  'GC=F': 'Gold Futures',
  'SI=F': 'Silver Futures',
  'CL=F': 'Crude Oil Futures',
};

interface FinanceHomeProps {
  onSelectTicker: (ticker: string) => void;
  onTabChange?: (tab: any) => void;
  onAddWatchlist?: (ticker: string) => void;
  onRemoveWatchlist?: (ticker: string) => void;
  onToggleWatchlist?: (ticker: string) => void;
  watchlist?: string[];
}

export const FinanceHome: React.FC<FinanceHomeProps> = ({ 
  onSelectTicker, 
  onTabChange,
  onAddWatchlist,
  onRemoveWatchlist,
  onToggleWatchlist,
  watchlist = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [marketData, setMarketData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMarketTab, setActiveMarketTab] = useState<'us' | 'crypto' | 'commodities'>('us');

  // Watchlist specific state
  const [watchlistQuotes, setWatchlistQuotes] = useState<Record<string, any>>({});
  const [isQuotesLoading, setIsQuotesLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addSymbolInput, setAddSymbolInput] = useState('');
  const [inlineSymbolInput, setInlineSymbolInput] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [isAddingSymbol, setIsAddingSymbol] = useState(false);

  useEffect(() => {
    const loadMarketData = async () => {
      try {
        const data = await fetchMarketOverview();
        setMarketData(data);
      } catch (error) {
        console.warn("Failed to load market data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMarketData();
  }, []);

  const [neuralMemory, setNeuralMemory] = useState<NeuralMemory | null>(neuralBrain.getMemory());

  useEffect(() => {
    return neuralBrain.subscribe(setNeuralMemory);
  }, []);

  // Fetch real-time quotes for watchlist items
  useEffect(() => {
    if (!watchlist || watchlist.length === 0) {
      setWatchlistQuotes({});
      return;
    }

    let isMounted = true;
    const loadWatchlistQuotes = async () => {
      try {
        const query = watchlist.join(',');
        const res = await fetch(`/api/stock/quotes?tickers=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.quotes) {
            setWatchlistQuotes(prev => ({ ...prev, ...data.quotes }));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch watchlist quotes:", err);
      }
    };

    loadWatchlistQuotes();
    const interval = setInterval(loadWatchlistQuotes, 12000); // Live poll every 12 seconds
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [watchlist]);

  const showNotification = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

  const handleAddTickerToWatchlist = async (rawInput: string) => {
    const trimmed = rawInput.trim();
    if (!trimmed) return;

    setIsAddingSymbol(true);
    try {
      let symbol = trimmed.toUpperCase();
      // If user typed a company name or long query, try search
      if (trimmed.length > 5 || trimmed.includes(' ')) {
        const found = await searchTicker(trimmed);
        if (found) symbol = found;
      }
      const resolved = resolveTickerSymbol(symbol);

      if (watchlist.includes(resolved)) {
        showNotification(`${resolved} is already in your Watchlist`);
      } else {
        if (onAddWatchlist) {
          onAddWatchlist(resolved);
        }
        showNotification(`Added ${resolved} to your Watchlist`);
        
        // Immediate quote fetch for the newly added symbol
        try {
          const res = await fetch(`/api/stock/quotes?tickers=${encodeURIComponent(resolved)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.quotes) {
              setWatchlistQuotes(prev => ({ ...prev, ...data.quotes }));
            }
          }
        } catch (e) {
          // Ignore quote load err
        }
      }
    } catch (e) {
      console.error("Error adding symbol to watchlist:", e);
    } finally {
      setIsAddingSymbol(false);
      setAddSymbolInput('');
      setInlineSymbolInput('');
    }
  };

  const handleToggleTicker = (ticker: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const resolved = resolveTickerSymbol(ticker);
    if (watchlist.includes(resolved)) {
      if (onRemoveWatchlist) {
        onRemoveWatchlist(resolved);
      } else if (onToggleWatchlist) {
        onToggleWatchlist(resolved);
      }
      showNotification(`Removed ${resolved} from Watchlist`);
    } else {
      if (onAddWatchlist) {
        onAddWatchlist(resolved);
      } else if (onToggleWatchlist) {
        onToggleWatchlist(resolved);
      }
      showNotification(`Added ${resolved} to Watchlist`);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const ticker = await searchTicker(searchQuery);
      if (ticker) {
        onSelectTicker(ticker);
        setSearchQuery('');
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const getTickerDisplayName = (ticker: string): string => {
    if (TICKER_NAME_MAP[ticker]) return TICKER_NAME_MAP[ticker];
    if (watchlistQuotes[ticker]?.name) return watchlistQuotes[ticker].name;
    // Check marketData
    const allMarketItems = [
      ...(marketData?.us || []),
      ...(marketData?.crypto || []),
      ...(marketData?.commodities || []),
    ];
    const match = allMarketItems.find(item => item.ticker === ticker);
    if (match?.name) return match.name;
    return `${ticker} Asset`;
  };

  const getTickerDisplayQuote = (ticker: string) => {
    if (watchlistQuotes[ticker]) return watchlistQuotes[ticker];
    // Check marketData fallback
    const allMarketItems = [
      ...(marketData?.us || []),
      ...(marketData?.crypto || []),
      ...(marketData?.commodities || []),
    ];
    return allMarketItems.find(item => item.ticker === ticker);
  };

  const marketIndices = marketData?.[activeMarketTab] || [];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Toast Feedback Banner */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 bg-emerald-500 text-zinc-950 px-4 py-2.5 rounded-xl font-black text-xs shadow-2xl flex items-center gap-2 border border-emerald-400"
          >
            <Check size={16} className="stroke-[3]" />
            <span>{actionFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Header */}
      <div className="relative group">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for stocks, ETFs, or crypto (e.g. AAPL, BTC-USD)..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all text-lg"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="animate-spin text-emerald-500" size={20} />
            </div>
          )}
        </form>
      </div>

      {/* Quick Navigation Cards */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: 'finviz', label: 'Finviz Quant', icon: Sparkles, color: 'text-emerald-400' },
          { id: 'summary', label: 'Monitor', icon: Activity, color: 'text-emerald-400' },
          { id: 'portfolio', label: 'Portfolio', icon: Briefcase, color: 'text-blue-400' },
          { id: 'yieldcurve', label: 'Yield Curve', icon: Activity, color: 'text-amber-400' },
          { id: 'advancedchart', label: 'Pro Charts', icon: TrendingUp, color: 'text-purple-400' },
          { id: 'aiscan', label: 'AI Scan', icon: Zap, color: 'text-amber-400' },
          { id: 'neural', label: 'Neural', icon: Brain, color: 'text-blue-400' },
          { id: 'quant', label: 'Agent', icon: Target, color: 'text-rose-400' },
        ].map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange ? onTabChange(item.id) : null}
            className="flex-1 min-w-[120px] bg-zinc-900/40 border border-zinc-800/50 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-zinc-800/50 transition-all group"
          >
            <div className={cn("p-2 rounded-xl bg-zinc-950 group-hover:scale-110 transition-transform", item.color)}>
              <item.icon size={20} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-100 transition-colors">{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Market Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Globe size={20} className="text-emerald-500" />
              Market Overview
            </h2>
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800">
              {(['us', 'crypto', 'commodities'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveMarketTab(tab)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
                    activeMarketTab === tab 
                      ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" 
                      : "text-zinc-500 hover:text-zinc-300"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 bg-zinc-900/50 rounded-2xl animate-pulse border border-zinc-800" />
              ))
            ) : (
              marketIndices.slice(0, 4).map((item: any, idx: number) => {
                const isStarred = watchlist.includes(item.ticker);
                return (
                  <motion.div
                    key={`${item.ticker}-${idx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => onSelectTicker(item.ticker)}
                    className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/50 p-4 rounded-2xl cursor-pointer transition-all group relative overflow-hidden"
                  >
                    <div className="absolute right-2 top-2 flex items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTicker(item.ticker, e)}
                        className={cn(
                          "p-1.5 rounded-lg transition-all",
                          isStarred 
                            ? "text-amber-400 bg-amber-500/10 hover:bg-amber-500/20" 
                            : "text-zinc-600 hover:text-amber-400 hover:bg-zinc-800 opacity-60 group-hover:opacity-100"
                        )}
                        title={isStarred ? "Remove from Watchlist" : "Add to Watchlist"}
                      >
                        <Star size={14} className={isStarred ? "fill-amber-400" : ""} />
                      </button>
                      <div className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} className="text-zinc-500" />
                      </div>
                    </div>
                    <div className="flex justify-between items-start mb-2 pr-12">
                      <div>
                        <h3 className="text-sm font-black text-zinc-100 uppercase tracking-tight">{item.ticker.replace('^', '')}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">{item.name}</p>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-black",
                        item.changePercent >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-mono font-bold text-zinc-100">
                        {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Trending / Most Active */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" />
            Trending Now
          </h2>
          <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-zinc-700" />
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {(marketData?.us || []).slice(4, 10).map((item: any, idx: number) => {
                  const isStarred = watchlist.includes(item.ticker);
                  return (
                    <div
                      key={`${item.ticker}-${idx}`}
                      onClick={() => onSelectTicker(item.ticker)}
                      className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition-colors">
                          {item.ticker.substring(0, 2)}
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-zinc-100">{item.ticker}</div>
                          <div className="text-[10px] text-zinc-500">{item.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold text-zinc-100">
                            {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <div className={cn(
                            "text-[10px] font-bold",
                            item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleToggleTicker(item.ticker, e)}
                          className={cn(
                            "p-1.5 rounded-lg transition-colors",
                            isStarred 
                              ? "text-amber-400 bg-amber-500/10" 
                              : "text-zinc-600 hover:text-amber-400 hover:bg-zinc-800"
                          )}
                          title={isStarred ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          <Star size={15} className={isStarred ? "fill-amber-400" : ""} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watchlist Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Star size={20} className="fill-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-zinc-100 flex items-center gap-2">
                Your Watchlist
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                  {watchlist.length} {watchlist.length === 1 ? 'ticker' : 'tickers'}
                </span>
              </h2>
              <p className="text-xs text-zinc-500">Persistent real-time tracking of your preferred financial assets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Inline Quick Add Input */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTickerToWatchlist(inlineSymbolInput);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inlineSymbolInput}
                onChange={(e) => setInlineSymbolInput(e.target.value)}
                placeholder="Symbol (e.g. PLTR, AMD)"
                className="w-40 sm:w-48 bg-zinc-900/80 border border-zinc-800 focus:border-emerald-500/60 rounded-xl py-1.5 pl-3 pr-8 text-xs text-white placeholder:text-zinc-600 focus:outline-none transition-all font-mono uppercase"
              />
              <button
                type="submit"
                disabled={!inlineSymbolInput.trim() || isAddingSymbol}
                className="absolute right-1 p-1 rounded-lg text-emerald-400 hover:text-white hover:bg-emerald-500 disabled:opacity-30 transition-all"
                title="Add to Watchlist"
              >
                {isAddingSymbol ? <Loader2 size={13} className="animate-spin" /> : <Plus size={14} />}
              </button>
            </form>

            {/* Open Full Add Symbol Modal Button */}
            <button 
              id="btn-open-add-symbol"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/10 transition-all active:scale-95"
            >
              <Plus size={15} />
              <span>Add Symbols</span>
            </button>
          </div>
        </div>
        
        {watchlist.length === 0 ? (
          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl p-10 text-center">
            <div className="w-16 h-16 bg-zinc-900/80 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-zinc-800 text-zinc-600">
              <Star size={28} className="text-zinc-600" />
            </div>
            <h3 className="text-zinc-200 font-black text-lg mb-1">Your watchlist is currently empty</h3>
            <p className="text-zinc-500 text-sm max-w-sm mx-auto mb-6">
              Track your favorite stocks, ETFs, and cryptocurrencies with real-time price updates and quick access to quantitative projections.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <button 
                id="btn-empty-add-symbols"
                onClick={() => setIsAddModalOpen(true)}
                className="bg-emerald-500 text-zinc-950 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                + Add Symbols to Watchlist
              </button>
            </div>

            {/* Quick-add chips */}
            <div className="pt-4 border-t border-zinc-800/40 max-w-md mx-auto">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2.5">
                Quick Add Popular Symbols
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {['NVDA', 'AAPL', 'TSLA', 'SPY', 'QQQ', 'BTC-USD', 'PLTR'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => handleAddTickerToWatchlist(sym)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-emerald-500/20 border border-zinc-700/60 hover:border-emerald-500/40 text-[11px] font-mono font-bold text-zinc-300 hover:text-emerald-400 transition-all flex items-center gap-1"
                  >
                    <Plus size={11} />
                    {sym}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {watchlist.map((ticker) => {
              const quote = getTickerDisplayQuote(ticker);
              const displayName = getTickerDisplayName(ticker);
              const price = quote?.price != null ? Number(quote.price) : null;
              const changePercent = quote?.changePercent != null ? Number(quote.changePercent) : null;
              const isPositive = (changePercent ?? 0) >= 0;

              return (
                <motion.div
                  key={ticker}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -3 }}
                  onClick={() => onSelectTicker(ticker)}
                  className="bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/70 hover:border-emerald-500/40 p-4 rounded-2xl cursor-pointer transition-all group relative overflow-hidden flex flex-col justify-between shadow-md"
                >
                  {/* Top Bar: Symbol Avatar, Name, and Star Button */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-black text-xs text-white group-hover:bg-emerald-500 group-hover:text-black transition-colors shrink-0">
                        {ticker.replace(/[^A-Z]/g, '').substring(0, 2) || ticker.substring(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                          {ticker}
                        </h4>
                        <p className="text-[11px] text-zinc-400 font-medium truncate max-w-[130px]">
                          {displayName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTicker(ticker, e)}
                        className="p-1.5 rounded-lg text-amber-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Remove from Watchlist"
                      >
                        <Star size={16} className="fill-amber-400 hover:fill-transparent" />
                      </button>
                    </div>
                  </div>

                  {/* Middle: Real-time Price and Change Badge */}
                  <div className="flex items-baseline justify-between gap-2 mb-3">
                    <div>
                      <span className="text-xl font-mono font-bold text-white tracking-tight">
                        {price != null 
                          ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                          : '---'}
                      </span>
                    </div>

                    {changePercent != null && (
                      <div className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1",
                        isPositive 
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" 
                          : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                      )}>
                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                      </div>
                    )}
                  </div>

                  {/* Bottom: Day Range or Volume and Analyze hint */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] text-zinc-500 font-mono">
                    <div className="truncate">
                      {quote?.low != null && quote?.high != null ? (
                        <span>L: ${Number(quote.low).toFixed(1)} · H: ${Number(quote.high).toFixed(1)}</span>
                      ) : quote?.volume ? (
                        <span>Vol: {(Number(quote.volume) / 1e6).toFixed(1)}M</span>
                      ) : (
                        <span className="text-zinc-600">Saved Asset</span>
                      )}
                    </div>
                    <span className="text-emerald-400 text-[10px] font-bold font-sans opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      Analyze <ChevronRight size={12} />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Add Symbol Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      Add to Watchlist
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Add any stock, index ETF, or crypto symbol to your persistent watchlist
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Symbol Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTickerToWatchlist(addSymbolInput);
                }}
                className="mb-6 space-y-3"
              >
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input
                    type="text"
                    autoFocus
                    value={addSymbolInput}
                    onChange={(e) => setAddSymbolInput(e.target.value)}
                    placeholder="Enter symbol or company (e.g. MSFT, PLTR, AMD, ETH-USD)"
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-emerald-500/80 rounded-2xl py-3 pl-10 pr-24 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-all font-mono uppercase"
                  />
                  <button
                    type="submit"
                    disabled={!addSymbolInput.trim() || isAddingSymbol}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-emerald-500 text-black font-black text-xs uppercase tracking-wider hover:bg-emerald-400 disabled:opacity-40 transition-all flex items-center gap-1 shadow-sm"
                  >
                    {isAddingSymbol ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    Add
                  </button>
                </div>
              </form>

              {/* Popular Symbols Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    Popular Market Assets
                  </span>
                  <span className="text-[10px] text-zinc-500">Click to toggle</span>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {POPULAR_SYMBOLS.map((item) => {
                    const isAdded = watchlist.includes(item.symbol);
                    return (
                      <button
                        key={item.symbol}
                        type="button"
                        onClick={() => handleToggleTicker(item.symbol)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group",
                          isAdded
                            ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/15"
                            : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700"
                        )}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                              {item.symbol}
                            </span>
                            <span className="text-[9px] text-zinc-500 uppercase tracking-tighter truncate">
                              {item.sector}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate">{item.name}</p>
                        </div>
                        <div className={cn(
                          "p-1 rounded-lg transition-colors shrink-0",
                          isAdded ? "text-amber-400" : "text-zinc-600 group-hover:text-white"
                        )}>
                          {isAdded ? <Check size={14} className="stroke-[3]" /> : <Plus size={14} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                <span className="text-xs text-zinc-500 font-mono">
                  {watchlist.length} saved in watchlist
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Market Stats / News */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Brain size={160} className="text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="bg-emerald-500/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4">
              <Brain className="text-emerald-400" size={20} />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2">Neural Insight Core</h3>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed line-clamp-2">
              {neuralMemory ? neuralMemory.keyInsights[0] : "Our AI models are currently analyzing global trade flows and sentiment shifts."}
            </p>
            <div className="flex items-center gap-4">
              <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Confidence: {neuralMemory ? Math.round(neuralMemory.modelConfidence * 100) : '--'}%
              </div>
              <div className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <Target className="w-3 h-3" />
                Mood: {neuralMemory ? neuralMemory.globalSentiment : '--'}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6">
          <h3 className="text-lg font-bold text-zinc-100 mb-4">Market News</h3>
          <div className="space-y-4">
            {[
              { title: "Fed signals potential rate pause in upcoming meeting", time: "2h ago", source: "MarketWatch" },
              { title: "Tech stocks rally as AI demand continues to surge", time: "4h ago", source: "Bloomberg" },
              { title: "Oil prices stabilize amid global supply concerns", time: "5h ago", source: "Reuters" }
            ].map((news, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{news.source}</span>
                  <span className="text-[10px] text-zinc-600">{news.time}</span>
                </div>
                <h4 className="text-sm font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors line-clamp-1">
                  {news.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
