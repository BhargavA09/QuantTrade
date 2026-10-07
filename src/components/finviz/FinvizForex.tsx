import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  ShieldCheck, 
  BarChart2, 
  Grid, 
  RefreshCw, 
  Layers, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { FINVIZ_FOREX_PAIRS, FinvizForexPair } from '../../data/finvizData';
import { cn } from '../../utils/cn';

interface FinvizForexProps {
  allData?: Record<string, any>;
  onSelectTicker?: (ticker: string) => void;
}

export const FinvizForex: React.FC<FinvizForexProps> = ({ allData = {}, onSelectTicker }) => {
  const [activeTimeframe, setActiveTimeframe] = useState<'1D' | '1W' | '1M' | 'YTD'>('1D');
  const [selectedPair, setSelectedPair] = useState<FinvizForexPair>(FINVIZ_FOREX_PAIRS[0]);

  // Synchronize pairs with live open-source stream
  const pairs = useMemo(() => {
    return FINVIZ_FOREX_PAIRS.map(p => {
      const live = allData[p.symbol];
      if (live && live.currentPrice > 0) {
        const price = live.currentPrice;
        const change = live.change !== undefined ? live.change : (price - (live.previousClose || price));
        const changePercent = live.changePercent !== undefined ? live.changePercent : p.changePercent;
        return {
          ...p,
          price,
          change,
          changePercent,
          high: Math.max(p.high, price),
          low: Math.min(p.low, price)
        };
      }
      return p;
    });
  }, [allData]);

  const getPairPerf = (p: FinvizForexPair) => {
    switch (activeTimeframe) {
      case '1W': return p.perfWeek;
      case '1M': return p.perfMonth;
      case 'YTD': return p.perfYtd;
      case '1D':
      default: return p.changePercent;
    }
  };

  // Mini spark series
  const getPairMiniHistory = (p: FinvizForexPair) => {
    const points = [];
    const base = p.price * (1 - (p.changePercent / 100) * 0.7);
    let curr = base;
    for (let i = 12; i >= 0; i--) {
      const noise = (Math.sin(i * 0.8) * 0.002 + (Math.random() - 0.49) * 0.003);
      curr = curr * (1 + noise);
      if (i === 0) curr = p.price;
      points.push({ idx: 13 - i, price: Number(curr.toFixed(4)) });
    }
    return points;
  };

  return (
    <div className="space-y-6">
      {/* Forex Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-600 text-white font-black text-xs px-2 py-0.5 rounded tracking-wider">
              FINVIZ
            </span>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              Foreign Exchange (Forex) Pairs
            </h1>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time open-source currency cross pairs with central bank rates and relative strength indicators.
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
          {(['1D', '1W', '1M', 'YTD'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={cn(
                "px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all",
                activeTimeframe === tf ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Forex Pairs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {pairs.map((p) => {
          const perf = getPairPerf(p);
          const isUp = perf >= 0;
          const isSelected = selectedPair.symbol === p.symbol;

          return (
            <motion.div
              key={p.symbol}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedPair(p)}
              className={cn(
                "bg-zinc-950 border rounded-2xl p-4 cursor-pointer transition-all flex flex-col justify-between shadow-xl",
                isSelected ? "border-emerald-500 bg-zinc-900/40 ring-1 ring-emerald-500/40" : "border-zinc-850 hover:border-zinc-700"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-sm text-white">{p.name}</span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">{p.base}/{p.quote}</span>
                </div>
                <div className="text-lg font-black font-mono text-zinc-100">
                  {p.price < 5 ? p.price.toFixed(4) : p.price.toFixed(2)}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-zinc-850 flex items-center justify-between font-mono text-xs">
                <span className="text-[10px] text-zinc-500">
                  {isUp ? '+' : ''}{p.change.toFixed(4)}
                </span>
                <span className={cn(
                  "font-bold px-1.5 py-0.5 rounded text-[11px] flex items-center gap-0.5",
                  isUp ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                )}>
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {isUp ? '+' : ''}{perf.toFixed(2)}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Currency Pair Deep Chart & Carry Rate */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-850 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Globe className="text-emerald-400" size={18} />
            <h2 className="text-sm font-black uppercase text-white">
              {selectedPair.name} Intraday Carry & Trend Channel
            </h2>
          </div>
          <span className="text-xs text-zinc-400">
            Current Rate: <strong className="text-white">${selectedPair.price < 5 ? selectedPair.price.toFixed(4) : selectedPair.price.toFixed(2)}</strong>
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getPairMiniHistory(selectedPair)}>
              <defs>
                <linearGradient id="forexGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="idx" hide />
              <YAxis domain={['auto', 'auto']} stroke="#71717a" fontSize={10} orientation="right" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09090b',
                  borderColor: '#27272a',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
              />
              <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} fill="url(#forexGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
