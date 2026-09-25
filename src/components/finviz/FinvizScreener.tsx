import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Sparkles, 
  BarChart3, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Eye,
  Grid,
  List
} from 'lucide-react';
import { FINVIZ_STOCKS, FinvizStock } from '../../data/finvizData';
import { cn } from '../../utils/cn';

interface FinvizScreenerProps {
  onSelectTicker: (ticker: string) => void;
}

type ScreenerView = 'overview' | 'valuation' | 'financial' | 'ownership' | 'performance' | 'technical' | 'charts';

export const FinvizScreener: React.FC<FinvizScreenerProps> = ({ onSelectTicker }) => {
  const [activeView, setActiveView] = useState<ScreenerView>('overview');
  const [exchangeFilter, setExchangeFilter] = useState<string>('any');
  const [marketCapFilter, setMarketCapFilter] = useState<string>('any');
  const [sectorFilter, setSectorFilter] = useState<string>('any');
  const [peFilter, setPeFilter] = useState<string>('any');
  const [sma20Filter, setSma20Filter] = useState<string>('any');
  const [sma50Filter, setSma50Filter] = useState<string>('any');
  const [sma200Filter, setSma200Filter] = useState<string>('any');
  const [rsiFilter, setRsiFilter] = useState<string>('any');
  const [signalFilter, setSignalFilter] = useState<string>('any');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sorting state
  const [sortKey, setSortKey] = useState<keyof FinvizStock>('marketCap');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const handleSort = (key: keyof FinvizStock) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false); // default desc for financial metrics
    }
  };

  const resetFilters = () => {
    setExchangeFilter('any');
    setMarketCapFilter('any');
    setSectorFilter('any');
    setPeFilter('any');
    setSma20Filter('any');
    setSma50Filter('any');
    setSma200Filter('any');
    setRsiFilter('any');
    setSignalFilter('any');
    setSearchQuery('');
  };

  const filteredStocks = useMemo(() => {
    return FINVIZ_STOCKS.filter(stock => {
      // Exchange
      if (exchangeFilter !== 'any' && stock.exchange !== exchangeFilter) return false;

      // Sector
      if (sectorFilter !== 'any' && stock.sector !== sectorFilter) return false;

      // Market Cap
      if (marketCapFilter === 'mega' && stock.marketCap < 200000000000) return false;
      if (marketCapFilter === 'large' && (stock.marketCap < 10000000000 || stock.marketCap >= 200000000000)) return false;
      if (marketCapFilter === 'mid' && (stock.marketCap < 2000000000 || stock.marketCap >= 10000000000)) return false;

      // P/E
      if (peFilter === 'low' && (stock.pe <= 0 || stock.pe > 15)) return false;
      if (peFilter === 'under25' && (stock.pe <= 0 || stock.pe > 25)) return false;
      if (peFilter === 'profitable' && stock.pe <= 0) return false;
      if (peFilter === 'high' && stock.pe < 40) return false;

      // SMA 20
      if (sma20Filter === 'above' && stock.sma20 <= 0) return false;
      if (sma20Filter === 'below' && stock.sma20 >= 0) return false;

      // SMA 50
      if (sma50Filter === 'above' && stock.sma50 <= 0) return false;
      if (sma50Filter === 'below' && stock.sma50 >= 0) return false;

      // SMA 200
      if (sma200Filter === 'above' && stock.sma200 <= 0) return false;
      if (sma200Filter === 'below' && stock.sma200 >= 0) return false;

      // RSI
      if (rsiFilter === 'overbought' && stock.rsi < 70) return false;
      if (rsiFilter === 'oversold' && stock.rsi > 30) return false;
      if (rsiFilter === 'neutral' && (stock.rsi < 40 || stock.rsi > 60)) return false;

      // Signal Presets
      if (signalFilter === 'gainers' && stock.change <= 1.0) return false;
      if (signalFilter === 'losers' && stock.change >= -0.5) return false;
      if (signalFilter === 'newhigh' && stock.high52wDist < -3.0) return false;
      if (signalFilter === 'oversold' && stock.rsi > 40) return false;
      if (signalFilter === 'overbought' && stock.rsi < 65) return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = stock.ticker.toLowerCase().includes(q) ||
                        stock.name.toLowerCase().includes(q) ||
                        stock.sector.toLowerCase().includes(q) ||
                        stock.industry.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return 0;
    });
  }, [
    exchangeFilter, sectorFilter, marketCapFilter, peFilter, 
    sma20Filter, sma50Filter, sma200Filter, rsiFilter, 
    signalFilter, searchQuery, sortKey, sortAsc
  ]);

  return (
    <div className="space-y-4">
      {/* Finviz Screener Filter Controls Box */}
      <div className="bg-zinc-900/90 dark:bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-emerald-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-zinc-100">
              Finviz Stock Screener & Filter Engine
            </h2>
            <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
              {filteredStocks.length} of {FINVIZ_STOCKS.length} Stocks
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-750 transition-all"
            >
              <RefreshCw size={12} />
              Reset Filters
            </button>
            <div className="relative w-48 sm:w-60">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, company..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 2-Row Filter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-3 text-xs">
          {/* Exchange */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Exchange</label>
            <select
              value={exchangeFilter}
              onChange={(e) => setExchangeFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any Exchange</option>
              <option value="NASDAQ">NASDAQ</option>
              <option value="NYSE">NYSE</option>
              <option value="AMEX">AMEX</option>
            </select>
          </div>

          {/* Market Cap */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Market Cap</label>
            <select
              value={marketCapFilter}
              onChange={(e) => setMarketCapFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any Cap</option>
              <option value="mega">Mega ($200B+)</option>
              <option value="large">Large ($10B-$200B)</option>
              <option value="mid">Mid ($2B-$10B)</option>
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Sector</label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any Sector</option>
              <option value="Technology">Technology</option>
              <option value="Communication Services">Communication Services</option>
              <option value="Consumer Cyclical">Consumer Cyclical</option>
              <option value="Financial">Financial</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Consumer Defensive">Consumer Defensive</option>
              <option value="Energy">Energy</option>
              <option value="Industrials">Industrials</option>
              <option value="Utilities">Utilities</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Basic Materials">Basic Materials</option>
            </select>
          </div>

          {/* P/E Ratio */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">P/E Ratio</label>
            <select
              value={peFilter}
              onChange={(e) => setPeFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any P/E</option>
              <option value="low">Low (&lt; 15)</option>
              <option value="under25">Under 25</option>
              <option value="profitable">Profitable (&gt; 0)</option>
              <option value="high">High (&gt; 40)</option>
            </select>
          </div>

          {/* Signals Preset */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Signal Preset</label>
            <select
              value={signalFilter}
              onChange={(e) => setSignalFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-emerald-400 font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">None (All Stocks)</option>
              <option value="gainers">Top Gainers (&gt; +1%)</option>
              <option value="losers">Top Losers</option>
              <option value="newhigh">Near 52W High</option>
              <option value="oversold">Oversold (RSI &lt; 40)</option>
              <option value="overbought">Overbought (RSI &gt; 65)</option>
            </select>
          </div>

          {/* 20-Day SMA */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Price vs SMA20</label>
            <select
              value={sma20Filter}
              onChange={(e) => setSma20Filter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="above">Price Above SMA20</option>
              <option value="below">Price Below SMA20</option>
            </select>
          </div>

          {/* 50-Day SMA */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Price vs SMA50</label>
            <select
              value={sma50Filter}
              onChange={(e) => setSma50Filter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="above">Price Above SMA50</option>
              <option value="below">Price Below SMA50</option>
            </select>
          </div>

          {/* 200-Day SMA */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Price vs SMA200</label>
            <select
              value={sma200Filter}
              onChange={(e) => setSma200Filter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any</option>
              <option value="above">Price Above SMA200</option>
              <option value="below">Price Below SMA200</option>
            </select>
          </div>

          {/* RSI (14) */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">RSI (14)</label>
            <select
              value={rsiFilter}
              onChange={(e) => setRsiFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1 px-2 text-xs font-mono text-zinc-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="any">Any RSI</option>
              <option value="overbought">Overbought (&gt; 70)</option>
              <option value="oversold">Oversold (&lt; 30)</option>
              <option value="neutral">Neutral (40 - 60)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Finviz Screener View Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {(['overview', 'valuation', 'financial', 'ownership', 'performance', 'technical', 'charts'] as ScreenerView[]).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                activeView === v
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              )}
            >
              {v}
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-zinc-400 flex items-center gap-2">
          <span>Sort by: <strong className="text-zinc-200">{String(sortKey)}</strong> ({sortAsc ? 'ASC' : 'DESC'})</span>
        </div>
      </div>

      {/* Data Table or Charts Grid View */}
      {activeView === 'charts' ? (
        // Finviz Mini Technical Candlestick Charts Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStocks.map(stock => (
            <div
              key={stock.ticker}
              onClick={() => onSelectTicker(stock.ticker)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 hover:border-emerald-500/50 cursor-pointer transition-all hover:scale-[1.01] shadow-lg group"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-black text-emerald-400 text-base group-hover:text-emerald-300">
                      {stock.ticker}
                    </span>
                    <span className="text-[10px] text-zinc-500 uppercase">({stock.exchange})</span>
                  </div>
                  <div className="text-xs text-zinc-300 truncate max-w-[180px]">{stock.name}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-sm font-bold text-zinc-100">${stock.price.toFixed(2)}</div>
                  <div className={cn(
                    "text-xs font-bold",
                    stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Simulated Finviz Mini Technical Chart representation */}
              <div className="h-32 bg-zinc-900/80 rounded-lg p-2 relative overflow-hidden border border-zinc-800/80 flex flex-col justify-between">
                {/* MA Legend */}
                <div className="flex items-center gap-3 text-[9px] font-mono">
                  <span className="text-amber-400">SMA20: {stock.sma20 >= 0 ? '+' : ''}{stock.sma20.toFixed(1)}%</span>
                  <span className="text-blue-400">SMA50: {stock.sma50 >= 0 ? '+' : ''}{stock.sma50.toFixed(1)}%</span>
                  <span className="text-fuchsia-400">SMA200: {stock.sma200 >= 0 ? '+' : ''}{stock.sma200.toFixed(1)}%</span>
                </div>

                {/* Stylized trendline curve */}
                <svg className="w-full h-16 overflow-visible">
                  <path
                    d={`M 0,${stock.change > 0 ? 40 : 15} Q 60,${stock.change > 0 ? 30 : 25} 120,${stock.change > 0 ? 20 : 35} T 240,${stock.change > 0 ? 10 : 50}`}
                    fill="none"
                    stroke={stock.change >= 0 ? '#10b981' : '#f43f5e'}
                    strokeWidth="2.5"
                  />
                  <line x1="0" y1="28" x2="240" y2="28" stroke="#3f3f46" strokeDasharray="3 3" strokeWidth="1" />
                  <line x1="0" y1="42" x2="240" y2="42" stroke="#6366f1" strokeDasharray="2 2" strokeWidth="0.8" opacity="0.6" />
                </svg>

                {/* Bottom Volume & RSI */}
                <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 pt-1 border-t border-zinc-800">
                  <span>Vol: {(stock.volume / 1e6).toFixed(1)}M</span>
                  <span>RSI: {stock.rsi.toFixed(1)}</span>
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <Sparkles size={10} /> Projections
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Finviz High-Density Tabular View
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider select-none">
                  <th className="py-2.5 px-3 w-10 text-center">No.</th>
                  <th 
                    onClick={() => handleSort('ticker')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Ticker {sortKey === 'ticker' && (sortAsc ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Company
                  </th>
                  <th 
                    onClick={() => handleSort('sector')}
                    className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors"
                  >
                    Sector
                  </th>

                  {activeView === 'overview' && (
                    <>
                      <th onClick={() => handleSort('industry')} className="py-2.5 px-3 cursor-pointer hover:text-white">Industry</th>
                      <th onClick={() => handleSort('country')} className="py-2.5 px-3 cursor-pointer hover:text-white">Country</th>
                      <th onClick={() => handleSort('marketCap')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Market Cap</th>
                      <th onClick={() => handleSort('pe')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">P/E</th>
                      <th onClick={() => handleSort('price')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Price</th>
                      <th onClick={() => handleSort('change')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Change</th>
                      <th onClick={() => handleSort('volume')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Volume</th>
                    </>
                  )}

                  {activeView === 'valuation' && (
                    <>
                      <th onClick={() => handleSort('marketCap')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Market Cap</th>
                      <th onClick={() => handleSort('pe')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">P/E</th>
                      <th onClick={() => handleSort('fwdPe')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Fwd P/E</th>
                      <th onClick={() => handleSort('peg')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">PEG</th>
                      <th onClick={() => handleSort('ps')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">P/S</th>
                      <th onClick={() => handleSort('pb')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">P/B</th>
                      <th onClick={() => handleSort('pfcf')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">P/FCF</th>
                      <th onClick={() => handleSort('eps')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">EPS (ttm)</th>
                      <th onClick={() => handleSort('price')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Price</th>
                      <th onClick={() => handleSort('change')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Change</th>
                    </>
                  )}

                  {activeView === 'financial' && (
                    <>
                      <th onClick={() => handleSort('marketCap')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Market Cap</th>
                      <th onClick={() => handleSort('dividendYield')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Div %</th>
                      <th onClick={() => handleSort('roa')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">ROA</th>
                      <th onClick={() => handleSort('roe')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">ROE</th>
                      <th onClick={() => handleSort('roi')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">ROI</th>
                      <th onClick={() => handleSort('currentRatio')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Curr R</th>
                      <th onClick={() => handleSort('quickRatio')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Quick R</th>
                      <th onClick={() => handleSort('debtEq')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Debt/Eq</th>
                      <th onClick={() => handleSort('grossMargin')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Gross M</th>
                      <th onClick={() => handleSort('profitMargin')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Profit M</th>
                    </>
                  )}

                  {activeView === 'ownership' && (
                    <>
                      <th onClick={() => handleSort('marketCap')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Market Cap</th>
                      <th onClick={() => handleSort('insiderOwn')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Insider Own</th>
                      <th onClick={() => handleSort('insiderTrans')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Insider Trans</th>
                      <th onClick={() => handleSort('instOwn')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Inst Own</th>
                      <th onClick={() => handleSort('instTrans')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Inst Trans</th>
                      <th onClick={() => handleSort('shortFloat')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Short Float</th>
                      <th onClick={() => handleSort('shortRatio')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Short Ratio</th>
                    </>
                  )}

                  {activeView === 'performance' && (
                    <>
                      <th onClick={() => handleSort('perfWeek')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Perf W</th>
                      <th onClick={() => handleSort('perfMonth')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Perf M</th>
                      <th onClick={() => handleSort('perfQuart')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Perf Q</th>
                      <th onClick={() => handleSort('perfHalf')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Perf Half</th>
                      <th onClick={() => handleSort('perfYear')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Perf Y</th>
                      <th onClick={() => handleSort('perfYtd')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Perf YTD</th>
                      <th onClick={() => handleSort('volatilityW')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Vol W</th>
                      <th onClick={() => handleSort('volatilityM')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Vol M</th>
                    </>
                  )}

                  {activeView === 'technical' && (
                    <>
                      <th onClick={() => handleSort('beta')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">Beta</th>
                      <th onClick={() => handleSort('atr')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">ATR</th>
                      <th onClick={() => handleSort('sma20')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">SMA20</th>
                      <th onClick={() => handleSort('sma50')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">SMA50</th>
                      <th onClick={() => handleSort('sma200')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">SMA200</th>
                      <th onClick={() => handleSort('rsi')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">RSI (14)</th>
                      <th onClick={() => handleSort('high52wDist')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">52W High</th>
                      <th onClick={() => handleSort('low52wDist')} className="py-2.5 px-3 cursor-pointer hover:text-white text-right">52W Low</th>
                    </>
                  )}

                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredStocks.map((stock, idx) => (
                  <tr 
                    key={stock.ticker}
                    onClick={() => onSelectTicker(stock.ticker)}
                    className={cn(
                      "hover:bg-zinc-850/60 cursor-pointer transition-colors",
                      idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"
                    )}
                  >
                    <td className="py-2 px-3 text-center text-zinc-500 text-[11px]">{idx + 1}</td>
                    <td className="py-2 px-3 font-bold text-emerald-400 hover:underline">
                      {stock.ticker}
                    </td>
                    <td className="py-2 px-3 text-zinc-200 truncate max-w-[160px]">{stock.name}</td>
                    <td className="py-2 px-3 text-zinc-400">{stock.sector}</td>

                    {activeView === 'overview' && (
                      <>
                        <td className="py-2 px-3 text-zinc-400 truncate max-w-[140px]">{stock.industry}</td>
                        <td className="py-2 px-3 text-zinc-400">{stock.country}</td>
                        <td className="py-2 px-3 text-right text-zinc-200 font-bold">${(stock.marketCap / 1e9).toFixed(1)}B</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.pe.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-100 font-bold">${stock.price.toFixed(2)}</td>
                        <td className={cn(
                          "py-2 px-3 text-right font-bold",
                          stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-right text-zinc-400">{(stock.volume / 1e6).toFixed(1)}M</td>
                      </>
                    )}

                    {activeView === 'valuation' && (
                      <>
                        <td className="py-2 px-3 text-right text-zinc-200 font-bold">${(stock.marketCap / 1e9).toFixed(1)}B</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.pe.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.fwdPe.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.peg.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.ps.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.pb.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.pfcf.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">${stock.eps.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-zinc-100 font-bold">${stock.price.toFixed(2)}</td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                        </td>
                      </>
                    )}

                    {activeView === 'financial' && (
                      <>
                        <td className="py-2 px-3 text-right text-zinc-200 font-bold">${(stock.marketCap / 1e9).toFixed(1)}B</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.dividendYield.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.roa.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.roe.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.roi.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.currentRatio.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.quickRatio.toFixed(1)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.debtEq.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.grossMargin.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.profitMargin.toFixed(1)}%</td>
                      </>
                    )}

                    {activeView === 'ownership' && (
                      <>
                        <td className="py-2 px-3 text-right text-zinc-200 font-bold">${(stock.marketCap / 1e9).toFixed(1)}B</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.insiderOwn.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.insiderTrans.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.instOwn.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.instTrans.toFixed(2)}%</td>
                        <td className="py-2 px-3 text-right text-amber-400 font-bold">{stock.shortFloat.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.shortRatio.toFixed(1)}</td>
                      </>
                    )}

                    {activeView === 'performance' && (
                      <>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.perfWeek >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.perfWeek >= 0 ? '+' : ''}{stock.perfWeek.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.perfMonth >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.perfMonth >= 0 ? '+' : ''}{stock.perfMonth.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.perfQuart >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.perfQuart >= 0 ? '+' : ''}{stock.perfQuart.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.perfHalf >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.perfHalf >= 0 ? '+' : ''}{stock.perfHalf.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.perfYear >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.perfYear >= 0 ? '+' : ''}{stock.perfYear.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.perfYtd >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.perfYtd >= 0 ? '+' : ''}{stock.perfYtd.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-right text-zinc-400">{stock.volatilityW.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-zinc-400">{stock.volatilityM.toFixed(1)}%</td>
                      </>
                    )}

                    {activeView === 'technical' && (
                      <>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.beta.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-zinc-300">{stock.atr.toFixed(2)}</td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.sma20 >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.sma20 >= 0 ? '+' : ''}{stock.sma20.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.sma50 >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.sma50 >= 0 ? '+' : ''}{stock.sma50.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.sma200 >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {stock.sma200 >= 0 ? '+' : ''}{stock.sma200.toFixed(2)}%
                        </td>
                        <td className={cn("py-2 px-3 text-right font-bold", stock.rsi > 70 ? "text-amber-400" : stock.rsi < 30 ? "text-emerald-400" : "text-zinc-300")}>
                          {stock.rsi.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-400">{stock.high52wDist.toFixed(1)}%</td>
                        <td className="py-2 px-3 text-right text-emerald-400">+{stock.low52wDist.toFixed(1)}%</td>
                      </>
                    )}

                    <td className="py-2 px-3 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectTicker(stock.ticker);
                        }}
                        className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold uppercase transition-all flex items-center gap-1 mx-auto"
                      >
                        <Sparkles size={10} />
                        Quant
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
