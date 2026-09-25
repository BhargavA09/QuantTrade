import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  Globe, 
  Calendar,
  Activity,
  Maximize2
} from 'lucide-react';
import { 
  FINVIZ_STOCKS, 
  FINVIZ_SECTORS, 
  FINVIZ_NEWS, 
  FinvizStock 
} from '../../data/finvizData';
import { cn } from '../../utils/cn';

interface FinvizHomeProps {
  onSelectTicker: (ticker: string) => void;
  onNavigateToMap: () => void;
  onNavigateToScreener: () => void;
}

type SignalTab = 'gainers' | 'losers' | 'newhigh' | 'unusualvol' | 'overbought' | 'oversold';

export const FinvizHome: React.FC<FinvizHomeProps> = ({
  onSelectTicker,
  onNavigateToMap,
  onNavigateToScreener
}) => {
  const [activeSignalTab, setActiveSignalTab] = useState<SignalTab>('gainers');
  const [newsFilter, setNewsFilter] = useState<'all' | 'news' | 'blogs'>('all');

  // Filter stocks by signal
  const signalStocks = React.useMemo(() => {
    switch (activeSignalTab) {
      case 'gainers':
        return [...FINVIZ_STOCKS].sort((a, b) => b.change - a.change).slice(0, 8);
      case 'losers':
        return [...FINVIZ_STOCKS].sort((a, b) => a.change - b.change).slice(0, 8);
      case 'newhigh':
        return [...FINVIZ_STOCKS].sort((a, b) => b.high52wDist - a.high52wDist).slice(0, 8);
      case 'unusualvol':
        return [...FINVIZ_STOCKS].sort((a, b) => (b.volume / b.avgVolume) - (a.volume / a.avgVolume)).slice(0, 8);
      case 'overbought':
        return [...FINVIZ_STOCKS].sort((a, b) => b.rsi - a.rsi).slice(0, 8);
      case 'oversold':
        return [...FINVIZ_STOCKS].sort((a, b) => a.rsi - b.rsi).slice(0, 8);
      default:
        return FINVIZ_STOCKS.slice(0, 8);
    }
  }, [activeSignalTab]);

  // Major market indices
  const indices = [
    { name: 'DJIA', val: '43,820.50', chg: '+142.20', pct: '+0.33%', up: true },
    { name: 'S&P 500', val: '5,960.80', chg: '+28.40', pct: '+0.48%', up: true },
    { name: 'NASDAQ', val: '18,890.25', chg: '+125.60', pct: '+0.67%', up: true },
    { name: 'RUSSELL', val: '2,320.10', chg: '-4.20', pct: '-0.18%', up: false },
  ];

  return (
    <div className="space-y-4">
      {/* Top Finviz Index Spark Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {indices.map((idx) => (
          <div 
            key={idx.name}
            className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between shadow-lg"
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-black text-zinc-200">{idx.name}</span>
              <span className={cn("font-bold flex items-center gap-0.5", idx.up ? "text-emerald-400" : "text-rose-400")}>
                {idx.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {idx.pct}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between font-mono">
              <span className="text-lg font-bold text-zinc-100">{idx.val}</span>
              <span className={cn("text-xs font-semibold", idx.up ? "text-emerald-500" : "text-rose-500")}>
                {idx.chg}
              </span>
            </div>
            {/* Sparkline visualization */}
            <div className="mt-2 h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full", idx.up ? "bg-emerald-500" : "bg-rose-500")}
                style={{ width: idx.up ? '72%' : '38%' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Main Finviz 3-Column Portal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (3 cols): Market News & Wire */}
        <div className="lg:col-span-4 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">
                  Market News & Headlines
                </h3>
              </div>
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded border border-zinc-800 text-[10px]">
                <button 
                  onClick={() => setNewsFilter('all')}
                  className={cn("px-2 py-0.5 rounded font-mono font-bold", newsFilter === 'all' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
                >
                  All
                </button>
                <button 
                  onClick={() => setNewsFilter('news')}
                  className={cn("px-2 py-0.5 rounded font-mono font-bold", newsFilter === 'news' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400")}
                >
                  News
                </button>
              </div>
            </div>

            {/* News Feed Stream */}
            <div className="space-y-3 divide-y divide-zinc-850">
              {FINVIZ_NEWS.slice(0, 7).map((news) => (
                <div key={news.id} className="pt-2.5 first:pt-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mb-1">
                    <span className="font-bold text-zinc-400">{news.source}</span>
                    <span>{news.time}</span>
                  </div>
                  <div className="text-xs font-medium text-zinc-200 hover:text-emerald-400 transition-colors cursor-pointer leading-snug">
                    {news.title}
                  </div>
                  {news.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {news.tickers.map(t => (
                        <button
                          key={t}
                          onClick={() => onSelectTicker(t)}
                          className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/80 mt-4 text-center">
            <span className="text-[10px] font-mono text-zinc-500">Live feeds updating in real-time</span>
          </div>
        </div>

        {/* Center Column (5 cols): Mini Treemap & Market Signals */}
        <div className="lg:col-span-5 space-y-4">
          {/* Mini Treemap Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">
                  S&P 500 Market Heatmap
                </h3>
              </div>
              <button
                onClick={onNavigateToMap}
                className="text-xs font-mono font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                <span>Full Map</span>
                <Maximize2 size={12} />
              </button>
            </div>

            {/* Mini Treemap Mosaic */}
            <div className="grid grid-cols-4 gap-1.5 h-44 cursor-pointer" onClick={onNavigateToMap}>
              {FINVIZ_STOCKS.slice(0, 8).map((stock) => {
                const isGreen = stock.change >= 0;
                return (
                  <div
                    key={stock.ticker}
                    className={cn(
                      "p-2 rounded-lg flex flex-col justify-between transition-all hover:scale-105 border",
                      isGreen 
                        ? stock.change >= 2.0 ? "bg-[#00a854] text-white border-emerald-400/40" : "bg-[#108548] text-white border-emerald-500/30"
                        : "bg-[#a31d27] text-white border-rose-500/30",
                      stock.marketCap > 1000000000000 ? "col-span-2 row-span-2" : "col-span-1"
                    )}
                  >
                    <span className="font-mono font-black text-xs">{stock.ticker}</span>
                    <span className="font-mono font-bold text-[10px]">
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Market Signals Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800 mb-3">
              <div className="flex items-center gap-1 overflow-x-auto text-[10px] font-mono">
                {(['gainers', 'losers', 'newhigh', 'unusualvol', 'oversold'] as SignalTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveSignalTab(tab)}
                    className={cn(
                      "px-2 py-1 font-bold rounded uppercase tracking-wider transition-all",
                      activeSignalTab === tab
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button
                onClick={onNavigateToScreener}
                className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                Screener <ChevronRight size={12} />
              </button>
            </div>

            {/* Signal table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-zinc-500 text-[10px] uppercase border-b border-zinc-850">
                    <th className="pb-1.5">Ticker</th>
                    <th className="pb-1.5">Company</th>
                    <th className="pb-1.5 text-right">Price</th>
                    <th className="pb-1.5 text-right">Change</th>
                    <th className="pb-1.5 text-right">Quant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {signalStocks.map(stock => (
                    <tr 
                      key={stock.ticker}
                      onClick={() => onSelectTicker(stock.ticker)}
                      className="hover:bg-zinc-900/60 cursor-pointer"
                    >
                      <td className="py-2 font-bold text-emerald-400">{stock.ticker}</td>
                      <td className="py-2 text-zinc-300 truncate max-w-[110px]">{stock.name}</td>
                      <td className="py-2 text-right text-zinc-100 font-bold">${stock.price.toFixed(2)}</td>
                      <td className={cn(
                        "py-2 text-right font-bold",
                        stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                      </td>
                      <td className="py-2 text-right">
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          PROJ
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (3 cols): Sector Performance & Quant Spotlight */}
        <div className="lg:col-span-3 space-y-4">
          {/* Sector Bars */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-100">
                Sector Performance
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">1-Day</span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {FINVIZ_SECTORS.map(sec => (
                <div key={sec.name} className="space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-zinc-300 truncate max-w-[130px]">{sec.name}</span>
                    <span className={cn("font-bold", sec.perfDay >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {sec.perfDay >= 0 ? '+' : ''}{sec.perfDay.toFixed(2)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", sec.perfDay >= 0 ? "bg-emerald-500" : "bg-rose-500")}
                      style={{ width: `${Math.min(Math.abs(sec.perfDay) * 35, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Quant Spotlight */}
          <div 
            onClick={() => onSelectTicker('NVDA')}
            className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-emerald-500/40 rounded-xl p-4 shadow-xl cursor-pointer hover:border-emerald-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} className="animate-spin" />
                <span>Quant Projection Spotlight</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                NVDA
              </span>
            </div>
            <div className="text-sm font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
              NVIDIA Corp. Monte Carlo Drift
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">
              30-day projection envelope indicates +16.4% upper cone target with 80% statistical confidence.
            </p>
            <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">Current: $128.40</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                View Quant Model <ChevronRight size={12} />
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
