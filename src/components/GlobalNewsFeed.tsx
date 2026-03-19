import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, 
  AlertCircle, 
  Activity, 
  Circle, 
  ChevronUp, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ArrowUpRight 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewsItem {
  title: string;
  impact: string;
  severity: 'low' | 'medium' | 'high';
  sentiment?: 'positive' | 'neutral' | 'negative';
}

const GlobalNewsFeed = ({ news }: { news: NewsItem[] }) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (!news || news.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Newspaper size={14} className="text-emerald-500" />
          Real-time Global Trade Intelligence
        </h3>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500 uppercase">Live Feed</span>
        </div>
      </div>
      <div className="space-y-4">
        {news.map((item, idx) => {
          const isExpanded = expandedIdx === idx;
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-500/30 transition-all group cursor-pointer",
                isExpanded && "border-emerald-500/50 bg-zinc-900"
              )}
              onClick={() => setExpandedIdx(isExpanded ? null : idx)}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
                    item.severity === 'high' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    item.severity === 'medium' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  )}>
                    {item.severity === 'high' && <AlertCircle size={8} />}
                    {item.severity === 'medium' && <Activity size={8} />}
                    {item.severity === 'low' && <Circle size={8} />}
                    {item.severity} Impact
                  </span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter flex items-center gap-1",
                    item.sentiment === 'positive' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    item.sentiment === 'negative' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-zinc-800 text-zinc-400 border border-zinc-700"
                  )}>
                    {item.sentiment === 'positive' && <TrendingUp size={8} />}
                    {item.sentiment === 'negative' && <TrendingDown size={8} />}
                    {(!item.sentiment || item.sentiment === 'neutral') && <Minus size={8} />}
                    {item.sentiment || 'neutral'}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp size={12} className="text-emerald-400" />
                ) : (
                  <ChevronDown size={12} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                )}
              </div>
              <h4 className="text-sm font-bold text-zinc-200 mb-2 leading-tight group-hover:text-white transition-colors">
                {item.title}
              </h4>
              <AnimatePresence>
                {isExpanded ? (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="text-[10px] text-zinc-400 leading-relaxed mt-2 p-3 bg-black/20 rounded-lg border border-white/5 italic">
                      {item.impact}
                    </p>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-[8px] text-zinc-600 uppercase font-bold tracking-widest">Source: Intelligence Feed</span>
                      <button className="text-[8px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 flex items-center gap-1">
                        Full Report <ArrowUpRight size={8} />
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-1">
                    {item.impact}
                  </p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalNewsFeed;
