import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Globe, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { fetchMarketOverview } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface MarketData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  market: string;
}

export const GlobalMarketOverview: React.FC = () => {
  const [data, setData] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);
  const tickers = useMemo(() => data.map(d => d.ticker), [data]);
  const { lastUpdate, connectionState } = useWebSocket(tickers);

  const fetchData = async () => {
    try {
      const result = await fetchMarketOverview();
      
      if (result && typeof result === 'object' && !Array.isArray(result)) {
        const flattened = Object.values(result).flat() as MarketData[];
        setData(flattened);
      } else {
        setData(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.warn("Failed to fetch market overview:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh list every 5 minutes
    return () => clearInterval(interval);
  }, []);

  // Update prices in real-time if we get a WebSocket update
  useEffect(() => {
    if (lastUpdate) {
      setData(prev => prev.map(d => 
        d.ticker === lastUpdate.ticker 
          ? { ...d, price: lastUpdate.price, change: lastUpdate.change, changePercent: lastUpdate.changePercent }
          : d
      ));
    }
  }, [lastUpdate]);

  if (loading) {
    return (
      <div className="p-6 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 animate-pulse">
        <div className="h-6 w-48 bg-white/10 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const markets = [...new Set(data.map(d => d.market))];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-emerald-500/5 pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
            <Globe size={20} className="icon-glow-blue animate-float" />
          </div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Global Market Pulse</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 bg-zinc-900/50 px-3 py-1 rounded-full border border-zinc-800">
          <Activity size={12} className="animate-pulse text-emerald-500 icon-glow-emerald" />
          <span className="uppercase tracking-widest">Cross-Asset Intelligence Active</span>
        </div>
      </div>

      <div className="space-y-8 relative z-10">
        {markets.map((marketType) => (
          <div key={marketType} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">{marketType}</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.filter(d => d.market === marketType).map((market, idx) => (
                <motion.div
                  key={`${market.ticker}-${idx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-zinc-950/30 rounded-2xl border border-zinc-800/50 hover:border-zinc-700 transition-all hover:bg-zinc-900/40 group/item"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-zinc-500 group-hover/item:text-zinc-400 transition-colors uppercase tracking-widest">
                      {market.ticker?.replace('^', '')}
                    </span>
                    <div className="flex items-center gap-1">
                      {market.change >= 0 ? (
                        <TrendingUp size={14} className="text-emerald-400" />
                      ) : (
                        <TrendingDown size={14} className="text-rose-400" />
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-zinc-400 truncate mb-2 uppercase tracking-tight">
                    {market.name === market.ticker ? market.ticker.replace('^', '') : market.name}
                  </div>
                  <div className="flex items-baseline justify-between overflow-hidden">
                    <motion.span 
                      key={market.price}
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 1 }}
                      className="text-lg font-mono font-black text-zinc-100"
                    >
                      {market.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </motion.span>
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${market.change >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10'}`}>
                      {market.change >= 0 ? '+' : ''}{market.changePercent?.toFixed(2)}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-800/50 flex justify-between items-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
        <span>Global exchange data stream active</span>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse' : connectionState === 'reconnecting' ? 'bg-amber-500 animate-pulse' : connectionState === 'connecting' ? 'bg-blue-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span>{connectionState === 'connected' ? 'WebSocket Connected' : connectionState === 'reconnecting' ? 'Reconnecting...' : connectionState === 'connecting' ? 'Connecting...' : 'Offline'}</span>
        </div>
      </div>
    </motion.div>
  );
};
