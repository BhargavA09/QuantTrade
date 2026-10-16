import React, { useState, useEffect } from 'react';
import {
  Radar,
  Activity,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Flame,
  Radio,
  Sparkles,
  RefreshCw,
  Search,
  ExternalLink,
  Zap,
  Volume2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { soundEngine } from '../../utils/audioAlerts';

export interface WhaleOrder {
  id: string;
  ticker: string;
  timestamp: string;
  type: 'DARK_POOL_BLOCK' | 'SWEEP_CALL' | 'SWEEP_PUT' | 'GAMMA_SURGE' | 'SPLIT_FILL';
  sharesOrContracts: number;
  price: number;
  notionalValue: number; // e.g. 15_000_000
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  venue: 'FINRA Dark Pool' | 'CBOE Sweep' | 'PHLX' | 'Direct Route' | 'ATS Cross';
  details: string;
  volVsAvg: number; // e.g. 3.4x
}

const INITIAL_WHALE_ORDERS: WhaleOrder[] = [
  {
    id: 'w-01',
    ticker: 'NVDA',
    timestamp: 'Just now',
    type: 'DARK_POOL_BLOCK',
    sharesOrContracts: 320000,
    price: 138.45,
    notionalValue: 44304000,
    sentiment: 'BULLISH',
    venue: 'FINRA Dark Pool',
    details: 'Institutional block execution 3.8x above 30-day block average.',
    volVsAvg: 3.8
  },
  {
    id: 'w-02',
    ticker: 'TSLA',
    timestamp: '2m ago',
    type: 'SWEEP_CALL',
    sharesOrContracts: 14500,
    price: 245.0,
    notionalValue: 18200000,
    sentiment: 'BULLISH',
    venue: 'CBOE Sweep',
    details: 'OTM $260 Calls expiring in 14 days aggressively lifted at the ask.',
    volVsAvg: 4.2
  },
  {
    id: 'w-03',
    ticker: 'AAPL',
    timestamp: '5m ago',
    type: 'DARK_POOL_BLOCK',
    sharesOrContracts: 210000,
    price: 228.10,
    notionalValue: 47901000,
    sentiment: 'BULLISH',
    venue: 'ATS Cross',
    details: 'Significant dark pool accumulation printed at mid-point.',
    volVsAvg: 2.9
  },
  {
    id: 'w-04',
    ticker: 'AMD',
    timestamp: '8m ago',
    type: 'GAMMA_SURGE',
    sharesOrContracts: 8500,
    price: 162.30,
    notionalValue: 9400000,
    sentiment: 'BULLISH',
    venue: 'PHLX',
    details: 'Call/Put volume ratio expanded to 4.8x. High gamma squeeze potential.',
    volVsAvg: 3.5
  },
  {
    id: 'w-05',
    ticker: 'MSFT',
    timestamp: '12m ago',
    type: 'SWEEP_PUT',
    sharesOrContracts: 5400,
    price: 422.50,
    notionalValue: 12500000,
    sentiment: 'BEARISH',
    venue: 'CBOE Sweep',
    details: 'Near-the-money hedge puts bought aggressively into market rally.',
    volVsAvg: 2.4
  },
  {
    id: 'w-06',
    ticker: 'PLTR',
    timestamp: '16m ago',
    type: 'SWEEP_CALL',
    sharesOrContracts: 22000,
    price: 44.80,
    notionalValue: 15800000,
    sentiment: 'BULLISH',
    venue: 'Direct Route',
    details: 'Sweeper sweeping multi-exchange book on government contract rumors.',
    volVsAvg: 5.1
  }
];

interface FinvizWhaleRadarProps {
  onSelectTicker?: (ticker: string) => void;
  onSendToQuantLab?: (ticker: string) => void;
}

export const FinvizWhaleRadar: React.FC<FinvizWhaleRadarProps> = ({
  onSelectTicker,
  onSendToQuantLab
}) => {
  const [orders, setOrders] = useState<WhaleOrder[]>(INITIAL_WHALE_ORDERS);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [minNotional, setMinNotional] = useState<number>(10); // $10M+
  const [isLiveScanning, setIsLiveScanning] = useState<boolean>(true);

  // Periodic synthetic whale order pulse
  useEffect(() => {
    if (!isLiveScanning) return;
    const interval = setInterval(() => {
      const tickers = ['NVDA', 'TSLA', 'AAPL', 'AMD', 'MSFT', 'AMZN', 'META', 'GOOGL', 'PLTR', 'AVGO'];
      const types: WhaleOrder['type'][] = ['DARK_POOL_BLOCK', 'SWEEP_CALL', 'SWEEP_CALL', 'GAMMA_SURGE'];
      const sym = tickers[Math.floor(Math.random() * tickers.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const basePrices: Record<string, number> = { NVDA: 138, TSLA: 245, AAPL: 228, AMD: 162, MSFT: 422, AMZN: 185, META: 575, GOOGL: 168, PLTR: 45, AVGO: 175 };
      const price = (basePrices[sym] || 150) + (Math.random() - 0.5) * 2;
      const notional = Math.round((10 + Math.random() * 45) * 1000000);
      const shares = Math.round(notional / price);
      const isBull = type !== 'SWEEP_PUT';

      const newOrder: WhaleOrder = {
        id: `w-${Date.now()}`,
        ticker: sym,
        timestamp: 'Just now',
        type,
        sharesOrContracts: shares,
        price: Number(price.toFixed(2)),
        notionalValue: notional,
        sentiment: isBull ? 'BULLISH' : 'BEARISH',
        venue: type === 'DARK_POOL_BLOCK' ? 'FINRA Dark Pool' : 'CBOE Sweep',
        details: isBull
          ? `Massive institutional ${type.replace(/_/g, ' ')} detected exceeding 3.5x expected volatility.`
          : 'Aggressive institutional downside put protection sweep.',
        volVsAvg: Number((2.5 + Math.random() * 3.2).toFixed(1))
      };

      setOrders(prev => [newOrder, ...prev.slice(0, 25)]);
      soundEngine.playWhaleSonar();
    }, 14000);

    return () => clearInterval(interval);
  }, [isLiveScanning]);

  const filteredOrders = orders.filter(o => {
    if (filterType !== 'ALL' && o.type !== filterType) return false;
    if (o.notionalValue < minNotional * 1000000) return false;
    return true;
  });

  const totalNotionalScanned = orders.reduce((a, b) => a + b.notionalValue, 0);
  const bullishPct = Math.round((orders.filter(o => o.sentiment === 'BULLISH').length / Math.max(1, orders.length)) * 100);

  return (
    <div className="space-y-4 text-zinc-100">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-mono">Whale Volume Tracked</div>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              ${(totalNotionalScanned / 1000000).toFixed(1)}M
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Radar size={22} className="animate-spin" style={{ animationDuration: '6s' }} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-mono">Smart Money Sentiment</div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
              {bullishPct}% Bullish Accumulation
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-mono">Dark Pool vs Lit Ratio</div>
            <div className="text-xl font-black text-purple-400 font-mono mt-0.5">
              43.8% Dark Pool
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <Activity size={22} />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-zinc-400 font-mono">Gamma Squeeze Alerts</div>
            <div className="text-xl font-black text-amber-400 font-mono mt-0.5">
              3 Extreme Skews
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Flame size={22} />
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Whale & Unusual Options / Dark Pool Order Flow Radar
              <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                {isLiveScanning ? '● Live Radar Active' : '○ Paused'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Institutional block trades &gt; $10M and aggressive call/put sweeps with gamma skew indicators
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Order Type Filter */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
            {['ALL', 'DARK_POOL_BLOCK', 'SWEEP_CALL', 'SWEEP_PUT', 'GAMMA_SURGE'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-2 py-1 rounded text-[11px] font-medium transition-all",
                  filterType === t
                    ? "bg-zinc-800 text-purple-400 font-bold border border-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Min Size Filter */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs text-zinc-400">
            <span className="px-2 font-medium">Min:</span>
            {[5, 10, 25].map((m) => (
              <button
                key={m}
                onClick={() => setMinNotional(m)}
                className={cn(
                  "px-2 py-0.5 rounded font-mono font-bold",
                  minNotional === m ? "bg-purple-600 text-white" : "hover:text-white"
                )}
              >
                ${m}M+
              </button>
            ))}
          </div>

          {/* Pause / Resume Scanner */}
          <button
            onClick={() => {
              setIsLiveScanning(!isLiveScanning);
              soundEngine.playNotificationTap();
            }}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border",
              isLiveScanning
                ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                : "bg-emerald-500 text-black border-emerald-400"
            )}
          >
            <RefreshCw size={13} className={isLiveScanning ? "animate-spin" : ""} />
            {isLiveScanning ? 'Pause Scanner' : 'Resume Scanner'}
          </button>
        </div>
      </div>

      {/* Whale Order Flow Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4 font-semibold">Time</th>
                <th className="py-3 px-4 font-semibold">Ticker</th>
                <th className="py-3 px-4 font-semibold">Order Classification</th>
                <th className="py-3 px-4 font-semibold text-right">Price</th>
                <th className="py-3 px-4 font-semibold text-right">Size (Shares/Contracts)</th>
                <th className="py-3 px-4 font-semibold text-right">Notional Value</th>
                <th className="py-3 px-4 font-semibold text-right">Volume Multiplier</th>
                <th className="py-3 px-4 font-semibold">Route / Execution Venue</th>
                <th className="py-3 px-4 font-semibold text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredOrders.map((order) => {
                const isBull = order.sentiment === 'BULLISH';
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectTicker?.(order.ticker)}
                  >
                    <td className="py-3 px-4 text-zinc-400 text-[11px]">{order.timestamp}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-white group-hover:text-purple-400 transition-colors">
                          {order.ticker}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-bold",
                            isBull ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                          )}
                        >
                          {order.sentiment}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          order.type === 'DARK_POOL_BLOCK'
                            ? "bg-purple-500/15 text-purple-300 border-purple-500/40"
                            : order.type === 'GAMMA_SURGE'
                            ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                            : order.type === 'SWEEP_CALL'
                            ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                            : "bg-rose-500/15 text-rose-300 border-rose-500/40"
                        )}
                      >
                        {order.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      ${order.price.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-300 font-bold">
                      {order.sharesOrContracts.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-white text-sm bg-zinc-800 px-2 py-0.5 rounded">
                        ${(order.notionalValue / 1000000).toFixed(2)}M
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-amber-400 font-bold">
                        {order.volVsAvg}x Avg
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-[11px] font-sans">
                      {order.venue}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectTicker?.(order.ticker)}
                          className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-sans"
                        >
                          Chart
                        </button>
                        <button
                          onClick={() => {
                            onSendToQuantLab?.(order.ticker);
                            soundEngine.playBullishBreakout();
                          }}
                          className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-sans font-bold flex items-center gap-1"
                        >
                          <Sparkles size={11} />
                          QuantLab
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
