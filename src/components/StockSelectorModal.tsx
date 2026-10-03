import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  X, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Database,
  ArrowRight,
  Filter
} from 'lucide-react';
import { 
  EXPANDED_STOCK_DATABASE, 
  STOCK_SECTORS, 
  StockSectorType, 
  DetailedStockItem,
  searchDatabase 
} from '../data/expandedStockDatabase';
import { cn } from '../utils/cn';

interface StockSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTicker: string;
  onSelectTicker: (ticker: string) => void;
}

export default function StockSelectorModal({
  isOpen,
  onClose,
  activeTicker,
  onSelectTicker
}: StockSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<StockSectorType>('All');
  const [customTicker, setCustomTicker] = useState('');

  const filteredStocks = useMemo(() => {
    return searchDatabase(searchQuery, selectedSector);
  }, [searchQuery, selectedSector]);

  if (!isOpen) return null;

  const handleSelect = (ticker: string) => {
    onSelectTicker(ticker);
    onClose();
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customTicker.trim().toUpperCase();
    if (clean) {
      onSelectTicker(clean);
      setCustomTicker('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-zinc-900 text-emerald-400 border border-zinc-800">
                <Database size={20} />
              </span>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  Stock & Market Database
                  <span className="text-xs text-zinc-400 font-normal">
                    · {EXPANDED_STOCK_DATABASE.length} Premier Assets
                  </span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Select an asset to update quantitative models, stochastic projections, and algorithmic backtests.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Bar & Custom Input Bar */}
          <div className="p-4 border-b border-zinc-800/60 bg-zinc-900/10 space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by symbol, company name, or industry (e.g. NVDA, Apple, Semiconductor, Bitcoin)..."
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sector Segmented Controls */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-xs text-zinc-500 flex items-center gap-1 pl-1 pr-2">
                <Filter size={12} /> Sector:
              </span>
              {STOCK_SECTORS.map((sector) => (
                <button
                  key={sector}
                  onClick={() => setSelectedSector(sector)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                    selectedSector === sector
                      ? "bg-zinc-100 text-zinc-900 font-semibold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  )}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>

          {/* Asset List Grid */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredStocks.length === 0 ? (
              <div className="py-12 text-center space-y-4">
                <p className="text-sm text-zinc-400">
                  No catalog asset matches "{searchQuery}".
                </p>
                {/* Custom Ticker Lookup */}
                <form onSubmit={handleCustomSubmit} className="max-w-md mx-auto flex items-center gap-2">
                  <input
                    type="text"
                    value={customTicker || searchQuery}
                    onChange={(e) => setCustomTicker(e.target.value)}
                    placeholder="Enter custom ticker (e.g. GOOG, INTC, ARM)"
                    className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    Load Ticker <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filteredStocks.map((stock: DetailedStockItem) => {
                  const isActive = stock.ticker === activeTicker;
                  const isPositive = stock.change >= 0;

                  return (
                    <div
                      key={stock.ticker}
                      onClick={() => handleSelect(stock.ticker)}
                      className={cn(
                        "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group",
                        isActive
                          ? "bg-emerald-950/20 border-emerald-500/50"
                          : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/90 hover:border-zinc-700"
                      )}
                    >
                      <div>
                        {/* Top Line: Symbol, Name, Sector, and Live Price */}
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                                {stock.ticker}
                              </span>
                              <span className="text-xs text-zinc-400">
                                {stock.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <span>{stock.sector}</span>
                              <span aria-hidden="true">·</span>
                              <span>{stock.industry}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-bold text-white font-mono">
                              ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className={cn(
                              "text-xs font-semibold flex items-center justify-end gap-0.5",
                              isPositive ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                              <span>{isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary description */}
                        <p className="text-[11px] text-zinc-400 line-clamp-2 mb-3">
                          {stock.summary}
                        </p>
                      </div>

                      {/* Bottom Quantitative Metrics (Clean unboxed metadata with separators) */}
                      <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between text-[11px] text-zinc-400">
                        <div className="flex items-center gap-2">
                          <span>Cap {stock.marketCap}</span>
                          <span aria-hidden="true">·</span>
                          <span>Vol {stock.volatility}</span>
                          {stock.pe > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>P/E {stock.pe}</span>
                            </>
                          )}
                        </div>

                        {isActive ? (
                          <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                            <Sparkles size={12} /> Active
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 group-hover:text-zinc-200 flex items-center gap-1">
                            Select <ArrowRight size={12} />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with custom ticker entry */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-zinc-400">
              Can't find a symbol? Type any stock, crypto, or commodity ticker:
            </div>
            <form onSubmit={handleCustomSubmit} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value)}
                placeholder="Symbol (e.g. INTC, ARM)"
                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 w-36 uppercase font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Analyze
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
