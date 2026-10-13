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

const DEFAULT_TICKERS: TickerItem[] = [
  { ticker: 'SPY', name: 'S&P 500 ETF', price: 586.20, changePercent: 0.65 },
  { ticker: 'QQQ', name: 'Nasdaq 100 ETF', price: 494.50, changePercent: 1.00 },
  { ticker: 'NVDA', name: 'NVIDIA Corp', price: 138.40, changePercent: 2.82 },
  { ticker: 'AAPL', name: 'Apple Inc', price: 228.50, changePercent: 1.02 },
  { ticker: 'MSFT', name: 'Microsoft Corp', price: 422.30, changePercent: 0.74 },
  { ticker: 'BTC-USD', name: 'Bitcoin USD', price: 66200.00, changePercent: 2.24 },
  { ticker: 'ETH-USD', name: 'Ethereum USD', price: 2640.00, changePercent: 2.92 },
  { ticker: 'GC=F', name: 'Gold Futures', price: 2685.40, changePercent: 0.48 }
];

const sanitizeNum = (val: any, fallback = 0): number => {
  if (typeof val === 'number' && !isNaN(val) && isFinite(val)) return val;
  const num = parseFloat(val);
  return isNaN(num) || !isFinite(num) ? fallback : num;
};

export const StockTicker: React.FC = () => {
  const [stocks, setStocks] = useState<TickerItem[]>(DEFAULT_TICKERS);
  const tickers = useMemo(() => stocks.map(s => s.ticker), [stocks]);
  const { lastUpdate, connectionState } = useWebSocket(tickers);

  useEffect(() => {
    let isMounted = true;
    const fetchTickerData = async () => {
      try {
        const result = await fetchMarketOverview();
        if (!isMounted || !result) return;
        
        // Take a few from each category to show in the ticker
        const allStocks: any[] = [];
        if (Array.isArray(result.us)) allStocks.push(...result.us.slice(0, 3));
        if (Array.isArray(result.crypto)) allStocks.push(...result.crypto.slice(0, 3));
        if (Array.isArray(result.commodities)) allStocks.push(...result.commodities.slice(0, 3));
        
        if (allStocks.length > 0) {
          const parsed = allStocks
            .filter(s => s && s.ticker)
            .map(s => ({
              ticker: String(s.ticker),
              name: String(s.name || s.ticker),
              price: sanitizeNum(s.price ?? s.currentPrice ?? s.close, 100),
              changePercent: sanitizeNum(s.changePercent ?? s.change_percent, 0)
            }));
          
          if (parsed.length > 0) {
            setStocks(parsed);
          }
        }
      } catch (error) {
        console.warn("Failed to fetch ticker data:", error);
      }
    };

    fetchTickerData();
    const interval = setInterval(fetchTickerData, 60000); // Refresh list every minute
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update prices in real-time if we get a WebSocket update
  useEffect(() => {
    if (lastUpdate && lastUpdate.ticker) {
      setStocks(prev => prev.map(s => {
        if (s.ticker === lastUpdate.ticker) {
          const updatedPrice = typeof lastUpdate.price === 'number' && !isNaN(lastUpdate.price) 
            ? lastUpdate.price 
            : s.price;
          const updatedChange = typeof lastUpdate.changePercent === 'number' && !isNaN(lastUpdate.changePercent) 
            ? lastUpdate.changePercent 
            : s.changePercent;
          return {
            ...s,
            price: sanitizeNum(updatedPrice, s.price),
            changePercent: sanitizeNum(updatedChange, s.changePercent)
          };
        }
        return s;
      }));
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
        {displayStocks.map((stock, i) => {
          if (!stock) return null;
          const price = sanitizeNum(stock.price, 0);
          const changePercent = sanitizeNum(stock.changePercent, 0);
          const isUp = changePercent >= 0;

          return (
            <div key={`${stock.ticker || i}-${i}`} className="flex items-center gap-2 group cursor-default">
              <span className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">
                {(stock.ticker || '').replace('^', '')}
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <div className={cn(
                "flex items-center gap-0.5 text-[9px] font-bold font-mono",
                isUp ? "text-emerald-400" : "text-rose-400"
              )}>
                {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {Math.abs(changePercent).toFixed(2)}%
              </div>
              <span className="text-zinc-800 mx-1">•</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};
