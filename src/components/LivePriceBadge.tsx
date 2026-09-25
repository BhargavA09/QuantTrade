import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';
import { ConnectionState } from '../hooks/useWebSocket';

interface LivePriceBadgeProps {
  price: number;
  change: number;
  changePercent: number;
  isConnected: boolean;
  connectionState?: ConnectionState;
}

export const LivePriceBadge: React.FC<LivePriceBadgeProps> = ({ price, change, changePercent, isConnected, connectionState = isConnected ? 'connected' : 'disconnected' }) => {
  const getStatusColor = () => {
    switch (connectionState) {
      case 'connected': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      case 'reconnecting': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
      case 'connecting': return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
      default: return 'bg-zinc-600';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case 'connected': return 'Live Feed';
      case 'reconnecting': return 'Reconnecting...';
      case 'connecting': return 'Connecting...';
      default: return 'Offline';
    }
  };

  const getTextColor = () => {
    switch (connectionState) {
      case 'connected': return 'text-emerald-400';
      case 'reconnecting': return 'text-amber-400';
      case 'connecting': return 'text-blue-400';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-2 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        {connectionState === 'reconnecting' ? (
          <RefreshCw size={10} className="text-amber-500 animate-spin" />
        ) : (
          <div className={cn(
            "w-2 h-2 rounded-full",
            connectionState !== 'disconnected' && "animate-pulse",
            getStatusColor()
          )} />
        )}
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          getTextColor()
        )}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="w-px h-4 bg-zinc-800" />
      
      <div className="flex items-baseline gap-2">
        <AnimatePresence mode="wait">
          <motion.span 
            key={price}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={cn(
              "text-lg font-mono font-black tracking-tighter transition-colors",
              connectionState === 'disconnected' ? "text-zinc-500" : "text-white"
            )}
          >
            ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </motion.span>
        </AnimatePresence>
        
        <div className={cn(
          "flex items-center gap-0.5 text-[10px] font-bold font-mono transition-colors",
          connectionState === 'disconnected' ? "text-zinc-600" : (change >= 0 ? "text-emerald-400" : "text-rose-400")
        )}>
          {change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{change >= 0 ? '+' : ''}{change.toFixed(2)}</span>
          <span className="opacity-60">({changePercent.toFixed(2)}%)</span>
        </div>
      </div>
    </div>
  );
};
