import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, 
  Search, 
  Layers, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Calendar,
  Sparkles,
  BarChart2
} from 'lucide-react';
import { FINVIZ_STOCKS, FinvizStock } from '../../data/finvizData';
import { cn } from '../../utils/cn';

interface FinvizMapProps {
  onSelectTicker: (ticker: string) => void;
}

export const FinvizMap: React.FC<FinvizMapProps> = ({ onSelectTicker }) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'YTD'>('1D');
  const [mapUniverse, setMapUniverse] = useState<'sp500' | 'world' | 'crypto'>('sp500');
  const [sizeBy, setSizeBy] = useState<'marketCap' | 'volume'>('marketCap');
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredStock, setHoveredStock] = useState<FinvizStock | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Get change percentage based on selected timeframe
  const getChange = (stock: FinvizStock) => {
    switch (timeframe) {
      case '1W': return stock.perfWeek;
      case '1M': return stock.perfMonth;
      case 'YTD': return stock.perfYtd;
      case '1D':
      default: return stock.change;
    }
  };

  // Finviz authentic color mapping function
  const getHeatmapColor = (change: number) => {
    if (change >= 3.0) return 'bg-[#00a854] text-white hover:bg-[#00c864]';
    if (change >= 1.5) return 'bg-[#108548] text-white hover:bg-[#159a54]';
    if (change >= 0.2) return 'bg-[#195336] text-emerald-100 hover:bg-[#206342]';
    if (change > -0.2) return 'bg-[#2b303c] text-zinc-300 hover:bg-[#383f4f]';
    if (change > -1.5) return 'bg-[#6b252c] text-rose-100 hover:bg-[#7e2b34]';
    if (change > -3.0) return 'bg-[#a31d27] text-white hover:bg-[#b8222d]';
    return 'bg-[#d91e2a] text-white hover:bg-[#eb2533]';
  };

  const getHeatmapBorder = (change: number) => {
    if (change >= 1.5) return 'border-[#00c864]/40';
    if (change >= 0.2) return 'border-[#108548]/30';
    if (change > -0.2) return 'border-zinc-700/40';
    if (change > -1.5) return 'border-[#a31d27]/30';
    return 'border-[#d91e2a]/40';
  };

  // Group stocks by sector
  const sectors = useMemo(() => {
    const grouped: Record<string, FinvizStock[]> = {};
    
    FINVIZ_STOCKS.forEach(stock => {
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matches = stock.ticker.toLowerCase().includes(query) || 
                        stock.name.toLowerCase().includes(query) ||
                        stock.sector.toLowerCase().includes(query) ||
                        stock.industry.toLowerCase().includes(query);
        if (!matches) return;
      }

      if (!grouped[stock.sector]) {
        grouped[stock.sector] = [];
      }
      grouped[stock.sector].push(stock);
    });

    // Sort stocks inside sector by size
    Object.keys(grouped).forEach(sector => {
      grouped[sector].sort((a, b) => {
        const sizeA = sizeBy === 'marketCap' ? a.marketCap : (a.volume * a.price);
        const sizeB = sizeBy === 'marketCap' ? b.marketCap : (b.volume * b.price);
        return sizeB - sizeA;
      });
    });

    return grouped;
  }, [searchFilter, sizeBy]);

  const totalMarketVal = useMemo(() => {
    return FINVIZ_STOCKS.reduce((acc, s) => acc + (sizeBy === 'marketCap' ? s.marketCap : s.volume * s.price), 0);
  }, [sizeBy]);

  const handleMouseMove = (e: React.MouseEvent, stock: FinvizStock) => {
    setHoveredStock(stock);
    setTooltipPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="space-y-4">
      {/* Finviz Map Controls Bar */}
      <div className="bg-zinc-900/90 dark:bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 backdrop-blur-md shadow-lg">
        {/* Universe Selector */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80">
          <button 
            onClick={() => setMapUniverse('sp500')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              mapUniverse === 'sp500' ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            S&P 500
          </button>
          <button 
            onClick={() => setMapUniverse('world')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              mapUniverse === 'world' ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            World / ADR
          </button>
          <button 
            onClick={() => setMapUniverse('crypto')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
              mapUniverse === 'crypto' ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            Crypto Map
          </button>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden sm:inline">Performance:</span>
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80">
            {(['1D', '1W', '1M', 'YTD'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2.5 py-1 text-xs font-mono font-bold rounded transition-all",
                  timeframe === tf ? "bg-zinc-800 text-emerald-400 border border-emerald-500/40" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Sizing metric selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest hidden md:inline">Tile Size:</span>
          <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/80 text-xs">
            <button
              onClick={() => setSizeBy('marketCap')}
              className={cn(
                "px-2.5 py-1 font-bold rounded transition-all",
                sizeBy === 'marketCap' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Market Cap
            </button>
            <button
              onClick={() => setSizeBy('volume')}
              className={cn(
                "px-2.5 py-1 font-bold rounded transition-all",
                sizeBy === 'volume' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Volume $
            </button>
          </div>
        </div>

        {/* Search filter */}
        <div className="relative flex-1 sm:w-48 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input
            type="text"
            placeholder="Filter map ticker..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-1.5 pl-8 pr-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Finviz Color Scale Legend */}
      <div className="flex items-center justify-between text-[11px] px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/70 rounded-lg text-zinc-400">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          <span>Finviz Treemap</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 font-mono">Click tile to launch Quant Projections</span>
        </div>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          <span className="text-rose-400 font-bold">-3%</span>
          <div className="flex h-3 rounded overflow-hidden">
            <div className="w-5 bg-[#d91e2a]" title="-3% or less" />
            <div className="w-5 bg-[#a31d27]" title="-1.5% to -3%" />
            <div className="w-5 bg-[#6b252c]" title="-0.2% to -1.5%" />
            <div className="w-5 bg-[#2b303c]" title="0%" />
            <div className="w-5 bg-[#195336]" title="+0.2% to +1.5%" />
            <div className="w-5 bg-[#108548]" title="+1.5% to +3%" />
            <div className="w-5 bg-[#00a854]" title="+3% or more" />
          </div>
          <span className="text-emerald-400 font-bold">+3%</span>
        </div>
      </div>

      {/* Main Interactive Treemap Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 min-h-[620px] shadow-2xl relative select-none">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Object.entries(sectors).map(([sectorName, stocks]) => {
            if (stocks.length === 0) return null;

            // Calculate sector total metric
            const sectorVal = stocks.reduce((acc, s) => acc + (sizeBy === 'marketCap' ? s.marketCap : s.volume * s.price), 0);
            const sectorPct = totalMarketVal > 0 ? (sectorVal / totalMarketVal) * 100 : 0;
            const avgChange = stocks.reduce((acc, s) => acc + getChange(s), 0) / stocks.length;

            return (
              <div 
                key={sectorName} 
                className={cn(
                  "border rounded-xl p-2 flex flex-col bg-zinc-900/40 backdrop-blur-sm transition-all",
                  sectorPct > 15 ? "col-span-1 md:col-span-2 xl:col-span-2" : "col-span-1",
                  "border-zinc-800/90"
                )}
              >
                {/* Sector Header Header */}
                <div className="flex items-center justify-between px-1.5 pb-2 border-b border-zinc-800/60 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-zinc-200">{sectorName}</h3>
                    <span className="text-[9px] font-mono text-zinc-500">({stocks.length})</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className={cn(
                      "font-bold",
                      avgChange >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Stock Tiles in this Sector */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 flex-1 items-stretch">
                  {stocks.map((stock) => {
                    const changeVal = getChange(stock);
                    const colorClass = getHeatmapColor(changeVal);
                    const borderClass = getHeatmapBorder(changeVal);
                    const isMega = stock.marketCap > 1000000000000;

                    return (
                      <motion.div
                        key={stock.ticker}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectTicker(stock.ticker)}
                        onMouseMove={(e) => handleMouseMove(e, stock)}
                        onMouseLeave={() => setHoveredStock(null)}
                        className={cn(
                          "cursor-pointer rounded-lg p-2.5 flex flex-col justify-between transition-all duration-150 border shadow-sm relative overflow-hidden",
                          colorClass,
                          borderClass,
                          isMega ? "col-span-2 row-span-2 min-h-[110px]" : "min-h-[75px]"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span className={cn(
                            "font-black tracking-tight font-mono",
                            isMega ? "text-lg sm:text-xl" : "text-sm sm:text-base"
                          )}>
                            {stock.ticker}
                          </span>
                          <span className="text-[10px] font-mono font-semibold opacity-90">
                            ${stock.price.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-1">
                          <div className={cn(
                            "font-mono font-black tracking-tight leading-none",
                            isMega ? "text-xl sm:text-2xl" : "text-xs sm:text-sm"
                          )}>
                            {changeVal >= 0 ? '+' : ''}{changeVal.toFixed(2)}%
                          </div>
                          <div className="text-[9px] opacity-75 truncate mt-1">
                            {stock.name}
                          </div>
                        </div>

                        {/* Subtle bottom ticker tag */}
                        <div className="flex items-center justify-between text-[8px] opacity-60 font-mono mt-1 border-t border-white/10 pt-1">
                          <span>${(stock.marketCap / 1e9).toFixed(0)}B</span>
                          <span>PE {stock.pe.toFixed(1)}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Finviz Floating Stock Inspection Card (Hover Tooltip) */}
      <AnimatePresence>
        {hoveredStock && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'fixed',
              left: Math.min(tooltipPos.x + 15, window.innerWidth - 340),
              top: Math.min(tooltipPos.y + 15, window.innerHeight - 380),
              zIndex: 9999,
              pointerEvents: 'none'
            }}
            className="w-80 bg-zinc-950/95 border border-zinc-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-zinc-200"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-2 mb-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black font-mono text-emerald-400">{hoveredStock.ticker}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                    {hoveredStock.exchange}
                  </span>
                  {hoveredStock.signal && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 uppercase">
                      {hoveredStock.signal}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold text-zinc-100 truncate mt-0.5">
                  {hoveredStock.name}
                </div>
                <div className="text-[10px] text-zinc-400">
                  {hoveredStock.sector} · {hoveredStock.industry}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono font-black text-zinc-100">${hoveredStock.price.toFixed(2)}</div>
                <div className={cn(
                  "text-xs font-mono font-bold",
                  hoveredStock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {hoveredStock.change >= 0 ? '+' : ''}{hoveredStock.change.toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono mb-2.5">
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">Market Cap:</span>
                <span className="font-bold text-zinc-200">${(hoveredStock.marketCap / 1e9).toFixed(1)}B</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">P/E (ttm):</span>
                <span className="font-bold text-zinc-200">{hoveredStock.pe.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">Fwd P/E:</span>
                <span className="font-bold text-zinc-200">{hoveredStock.fwdPe.toFixed(1)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">PEG Ratio:</span>
                <span className="font-bold text-zinc-200">{hoveredStock.peg.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">Div Yield:</span>
                <span className="font-bold text-zinc-200">{hoveredStock.dividendYield.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">RSI (14):</span>
                <span className={cn(
                  "font-bold",
                  hoveredStock.rsi > 70 ? "text-amber-400" : hoveredStock.rsi < 30 ? "text-emerald-400" : "text-zinc-200"
                )}>
                  {hoveredStock.rsi.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">Perf Week:</span>
                <span className={cn(hoveredStock.perfWeek >= 0 ? "text-emerald-400" : "text-rose-400", "font-bold")}>
                  {hoveredStock.perfWeek >= 0 ? '+' : ''}{hoveredStock.perfWeek.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between border-b border-zinc-800/40 pb-0.5">
                <span className="text-zinc-500">Perf YTD:</span>
                <span className={cn(hoveredStock.perfYtd >= 0 ? "text-emerald-400" : "text-rose-400", "font-bold")}>
                  {hoveredStock.perfYtd >= 0 ? '+' : ''}{hoveredStock.perfYtd.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 52-Week Range Bar */}
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span>52W L: ${hoveredStock.low52w.toFixed(2)}</span>
                <span>52W H: ${hoveredStock.high52w.toFixed(2)}</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(Math.max(((hoveredStock.price - hoveredStock.low52w) / (hoveredStock.high52w - hoveredStock.low52w)) * 100, 5), 100)}%`
                  }}
                />
              </div>
            </div>

            {/* CTA hint */}
            <div className="pt-2 border-t border-zinc-800 flex items-center justify-between text-[10px] text-emerald-400">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkles size={12} />
                Click to open Quant Projections
              </span>
              <span className="text-zinc-500 font-mono">Target: ${hoveredStock.targetPrice.toFixed(2)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
