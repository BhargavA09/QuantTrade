import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, TrendingUp, TrendingDown, Minus, ExternalLink, Filter } from 'lucide-react';
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
  sentiment: string;
}

interface TickerNewsFeedProps {
  news: NewsItem[];
  ticker: string;
  sentimentScore: number;
}

const TickerNewsFeed = ({ news, ticker, sentimentScore }: TickerNewsFeedProps) => {
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  const filteredNews = useMemo(() => {
    if (!news) return [];
    if (filter === 'all') return news;
    return news.filter(item => item.sentiment.toLowerCase() === filter);
  }, [news, filter]);

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return "text-emerald-400";
    if (score < -0.2) return "text-rose-400";
    return "text-amber-400";
  };

  const getSentimentBg = (score: number) => {
    if (score > 0.2) return "bg-emerald-500/10 border-emerald-500/20";
    if (score < -0.2) return "bg-rose-500/10 border-rose-500/20";
    return "bg-amber-500/10 border-amber-500/20";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.2) return "Bullish";
    if (score < -0.2) return "Bearish";
    return "Neutral";
  };

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Newspaper size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
              {ticker} News & Sentiment
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-bold uppercase tracking-widest", getSentimentColor(sentimentScore))}>
                Overall Sentiment: {getSentimentLabel(sentimentScore)} ({sentimentScore.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-500" />
          <div className="flex bg-zinc-900/50 rounded-lg p-1 border border-zinc-800">
            {(['all', 'positive', 'neutral', 'negative'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all",
                  filter === f 
                    ? f === 'positive' ? "bg-emerald-500/20 text-emerald-400" :
                      f === 'negative' ? "bg-rose-500/20 text-rose-400" :
                      f === 'neutral' ? "bg-amber-500/20 text-amber-400" :
                      "bg-zinc-700 text-white"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredNews.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">No {filter !== 'all' ? filter : ''} news found</p>
            </motion.div>
          ) : (
            filteredNews.map((item, idx) => {
              const itemSentiment = item.sentiment.toLowerCase();
              return (
                <motion.div 
                  key={`${item.title}-${idx}`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 transition-all group"
                >
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <h4 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors leading-snug">
                      {item.title}
                    </h4>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-zinc-800/50 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all shrink-0"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        {item.source}
                      </span>
                      <span className="text-[10px] text-zinc-600 font-medium">
                        {item.time}
                      </span>
                    </div>
                    
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter border flex items-center gap-1",
                      itemSentiment === 'positive' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      itemSentiment === 'negative' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {itemSentiment === 'positive' && <TrendingUp size={10} />}
                      {itemSentiment === 'negative' && <TrendingDown size={10} />}
                      {itemSentiment === 'neutral' && <Minus size={10} />}
                      {itemSentiment}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TickerNewsFeed;
