import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { fetchMarketOverview } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

interface TickerItem {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
}

export const StockTicker: React.FC = () => {
  const [stocks, setStocks] = useState<TickerItem[]>([]);
  const tickers = useMemo(() => stocks.map(s => s.ticker), [stocks]);
  const { lastUpdate, connectionState } = useWebSocket(tickers);

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        const result = await fetchMarketOverview();
        
        // Take a few from each category to show in the ticker
        const allStocks: TickerItem[] = [];
        if (result.us) allStocks.push(...result.us.slice(0, 3));
        if (result.crypto) allStocks.push(...result.crypto.slice(0, 3));
        if (result.commodities) allStocks.push(...result.commodities.slice(0, 3));
        
        setStocks(allStocks.map(s => ({
          ticker: s.ticker,
          name: s.name,
          price: s.price,
          changePercent: s.changePercent
        })));
      } catch (error) {
        console.warn("Failed to fetch ticker data:", error);
      }
    };

    fetchTickerData();
    const interval = setInterval(fetchTickerData, 60000); // Refresh list every minute
    return () => clearInterval(interval);
  }, []);

  // Update prices in real-time if we get a WebSocket update
  useEffect(() => {
    if (lastUpdate) {
      setStocks(prev => prev.map(s => 
        s.ticker === lastUpdate.ticker 
          ? { ...s, price: lastUpdate.price, changePercent: lastUpdate.changePercent }
          : s
      ));
    }
  }, [lastUpdate]);

  if (stocks.length === 0) return null;

  // Duplicate for seamless loop
  const displayStocks = [...stocks, ...stocks, ...stocks, ...stocks];

  return (
    <div className="w-full bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800/50 h-8 flex items-center overflow-hidden relative z-[70]">
      <div className={`absolute left-0 top-0 bottom-0 px-3 ${connectionState === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20' : connectionState === 'reconnecting' ? 'bg-amber-500/10 border-amber-500/20' : connectionState === 'connecting' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-zinc-500/10 border-zinc-500/20'} border-r flex items-center gap-2 z-10`}>
        <div className={`w-1 h-1 rounded-full ${connectionState === 'connected' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : connectionState === 'reconnecting' ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]' : connectionState === 'connecting' ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-zinc-500'}`} />
        <span className={`text-[9px] font-black ${connectionState === 'connected' ? 'text-emerald-400' : connectionState === 'reconnecting' ? 'text-amber-400' : connectionState === 'connecting' ? 'text-blue-400' : 'text-zinc-400'} uppercase tracking-widest`}>
          {connectionState === 'connected' ? 'Live Market Feed' : connectionState === 'reconnecting' ? 'Reconnecting...' : connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
        </span>
      </div>

      <motion.div 
        className="flex items-center gap-8 whitespace-nowrap pl-24"
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {displayStocks.map((stock, i) => (
          <div key={i} className="flex items-center gap-2 group cursor-default">
            <span className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">
              {stock.ticker.replace('^', '')}
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className={cn(
              "flex items-center gap-0.5 text-[9px] font-bold font-mono",
              stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {stock.changePercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              {Math.abs(stock.changePercent).toFixed(2)}%
            </div>
            <span className="text-zinc-800 mx-1">•</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
