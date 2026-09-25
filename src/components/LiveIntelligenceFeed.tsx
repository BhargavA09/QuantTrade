import React, { useState, useEffect } from 'react';
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
  ArrowUpRight,
  Zap,
  Globe,
  Clock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
  url: string;
  sentiment: any;
  impact?: string;
}

interface LiveIntelligenceFeedProps {
  news: NewsItem[];
  ticker: string;
}

const LiveIntelligenceFeed = ({ news, ticker }: LiveIntelligenceFeedProps) => {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!news || news.length === 0) {
    return (
      <div className="glass-card p-8 text-center border-dashed border-zinc-800">
        <Globe size={32} className="mx-auto text-zinc-700 mb-4 animate-pulse" />
        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Scanning global intelligence networks for {ticker}...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Newspaper size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
              Live Intelligence Feed
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[8px] font-bold text-zinc-400">{ticker}</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Real-time Stream Active</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-mono text-zinc-500">{currentTime.toLocaleTimeString()}</p>
          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">System Time</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {news.map((item, idx) => {
          const isExpanded = expandedIdx === idx;
          const sentimentColor = 
            item.sentiment === 'positive' ? 'emerald' : 
            item.sentiment === 'negative' ? 'rose' : 'zinc';

          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                isExpanded 
                  ? `bg-zinc-900 border-${sentimentColor}-500/50 shadow-lg shadow-${sentimentColor}-500/5` 
                  : "bg-zinc-900/40 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/60"
              )}
            >
              {/* Progress/Glow Bar */}
              <div className={cn(
                "absolute top-0 left-0 w-1 h-full transition-all duration-500",
                item.sentiment === 'positive' ? "bg-emerald-500" : 
                item.sentiment === 'negative' ? "bg-rose-500" : "bg-zinc-700"
              )} />

              <div className="p-4 pl-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border",
                        item.sentiment === 'positive' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        item.sentiment === 'negative' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        "bg-zinc-800 text-zinc-400 border-zinc-700"
                      )}>
                        {item.sentiment}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} />
                        {item.time}
                      </span>
                    </div>
                    <h4 className={cn(
                      "text-sm font-bold leading-snug transition-colors",
                      isExpanded ? "text-white" : "text-zinc-300 group-hover:text-white"
                    )}>
                      {item.title}
                    </h4>
                  </div>
                  <button 
                    onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                    className="p-1.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-500 hover:text-emerald-400 transition-all"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Source Integrity</p>
                            <div className="flex items-center gap-2">
                              <ShieldAlert size={12} className="text-emerald-500" />
                              <span className="text-[10px] font-bold text-zinc-300">{item.source}</span>
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-black/40 border border-white/5">
                            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Signal Strength</p>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <div 
                                  key={s} 
                                  className={cn(
                                    "h-1.5 w-3 rounded-full",
                                    s <= 4 ? "bg-emerald-500" : "bg-zinc-800"
                                  )} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <Zap size={12} className="text-amber-400" />
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">AI Analysis Complete</span>
                            </div>
                          </div>
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 transition-all"
                          >
                            Access Source <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveIntelligenceFeed;
