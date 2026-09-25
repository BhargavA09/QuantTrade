import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Zap, Globe, AlertCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TickerItem {
  title: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  impact: string;
}

interface NewsTickerProps {
  news: TickerItem[];
}

const NewsTicker = ({ news }: NewsTickerProps) => {
  if (!news || news.length === 0) return null;

  // Duplicate news to create seamless loop
  const tickerItems = [...news, ...news, ...news];

  return (
    <div className="w-full bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 h-10 flex items-center overflow-hidden relative z-[60]">
      {/* Label */}
      <div className="absolute left-0 top-0 bottom-0 px-4 bg-zinc-950 border-r border-zinc-800 flex items-center gap-2 z-10 shadow-[10px_0_20px_rgba(0,0,0,0.5)]">
        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Intel</span>
      </div>

      {/* Ticker Track */}
      <motion.div 
        className="flex items-center gap-12 whitespace-nowrap pl-32"
        animate={{ x: [0, -1000] }}
        transition={{ 
          duration: 40, 
          repeat: Infinity, 
          ease: "linear" 
        }}
      >
        {tickerItems.map((item, i) => (
          <div key={i} className="flex items-center gap-3 group cursor-default">
            <div className={cn(
              "p-1 rounded bg-zinc-900 border border-zinc-800 transition-colors group-hover:border-emerald-500/50",
              item.sentiment === 'positive' ? "text-emerald-400" : 
              item.sentiment === 'negative' ? "text-rose-400" : "text-zinc-500"
            )}>
              {item.sentiment === 'positive' && <TrendingUp size={10} />}
              {item.sentiment === 'negative' && <TrendingDown size={10} />}
              {item.sentiment === 'neutral' && <Zap size={10} />}
            </div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:text-white transition-colors">
              {item.title}
            </span>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
              item.impact === 'high' ? "bg-rose-500/10 text-rose-400" :
              item.impact === 'medium' ? "bg-amber-500/10 text-amber-400" :
              "bg-zinc-800 text-zinc-500"
            )}>
              {item.impact}
            </span>
            <span className="text-zinc-800 mx-2">/</span>
          </div>
        ))}
      </motion.div>

      {/* Gradient Fades */}
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-zinc-950 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default NewsTicker;
