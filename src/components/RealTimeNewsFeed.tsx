import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ExternalLink, 
  Filter, 
  Zap, 
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
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
  score?: number;
}

interface RealTimeNewsFeedProps {
  news: NewsItem[];
  ticker: string;
  sentimentScore: number;
  forecast: { date: string; price: number }[];
  currentPrice: number;
  onRefresh?: () => void;
}

const RealTimeNewsFeed = ({ news, ticker, sentimentScore, forecast, currentPrice, onRefresh }: RealTimeNewsFeedProps) => {
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const filteredNews = useMemo(() => {
    if (!news) return [];
    if (filter === 'all') return news;
    return news.filter(item => item.sentiment.toLowerCase() === filter);
  }, [news, filter]);

  const forecastData = useMemo(() => {
    if (!forecast || forecast.length === 0) return [];
    return forecast.slice(0, 10).map((item, i) => ({
      day: `T+${i + 1}`,
      price: parseFloat(item.price.toFixed(2))
    }));
  }, [forecast]);

  const getSentimentColor = (score: number) => {
    if (score > 60) return "text-emerald-400";
    if (score < 40) return "text-rose-400";
    return "text-amber-400";
  };

  const getSentimentLabel = (score: number) => {
    if (score > 60) return "Bullish";
    if (score < 40) return "Bearish";
    return "Neutral";
  };

  const forecastTrend = useMemo(() => {
    if (!forecast || forecast.length < 2) return 'neutral';
    const first = forecast[0].price;
    const last = forecast[forecast.length - 1].price;
    if (last > first * 1.02) return 'up';
    if (last < first * 0.98) return 'down';
    return 'neutral';
  }, [forecast]);

  return (
    <div className="glass-card p-6 flex flex-col h-full bg-gradient-to-br from-zinc-900/80 to-zinc-950 border-zinc-800/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Newspaper size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
              Intelligence Stream
              <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[8px] font-bold text-zinc-400">{ticker}</span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Real-time Analysis Active</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className={cn(
              "p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-emerald-400 transition-all",
              isRefreshing && "animate-spin text-emerald-400"
            )}
            title="Refresh Intelligence"
          >
            <RefreshCw size={14} />
          </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* News List */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredNews.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12"
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
                      className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/50 hover:border-zinc-700 transition-all group relative overflow-hidden"
                    >
                      <div className={cn(
                        "absolute top-0 left-0 w-1 h-full transition-all duration-500",
                        itemSentiment === 'positive' ? "bg-emerald-500" : 
                        itemSentiment === 'negative' ? "bg-rose-500" : "bg-zinc-700"
                      )} />

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
                          <span className="text-[10px] text-zinc-600 font-medium flex items-center gap-1">
                            <Clock size={10} />
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

        {/* Intelligence Summary & Forecast */}
        <div className="lg:col-span-1 space-y-4">
          {/* Overall Sentiment Card */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={64} className={cn(getSentimentColor(sentimentScore))} />
            </div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Sentiment Overview</h4>
            <div className="flex items-end gap-3 mb-4">
              <span className={cn("text-4xl font-black tracking-tighter", getSentimentColor(sentimentScore))}>
                {sentimentScore.toFixed(0)}
              </span>
              <div className="mb-1">
                <p className={cn("text-xs font-bold uppercase tracking-widest", getSentimentColor(sentimentScore))}>
                  {getSentimentLabel(sentimentScore)}
                </p>
                <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">Neural Score</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${sentimentScore}%` }}
                className={cn("h-full transition-all duration-1000", 
                  sentimentScore > 60 ? "bg-emerald-500" : 
                  sentimentScore < 40 ? "bg-rose-500" : "bg-amber-500"
                )}
              />
            </div>
          </div>

          {/* Quick Forecast Card */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={14} className="text-indigo-400" />
                AI Forecast (10D)
              </h4>
              <div className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                forecastTrend === 'up' ? "bg-emerald-500/10 text-emerald-400" :
                forecastTrend === 'down' ? "bg-rose-500/10 text-rose-400" :
                "bg-zinc-800 text-zinc-500"
              )}>
                {forecastTrend === 'up' ? <ArrowUpRight size={10} /> : 
                 forecastTrend === 'down' ? <ArrowDownRight size={10} /> : null}
                {forecastTrend}
              </div>
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={forecastTrend === 'up' ? "#10b981" : forecastTrend === 'down' ? "#f43f5e" : "#6366f1"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={forecastTrend === 'up' ? "#10b981" : forecastTrend === 'down' ? "#f43f5e" : "#6366f1"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    hide 
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    hide 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase">{payload[0].payload.day}</p>
                            <p className="text-xs font-black text-white">${payload[0].value}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={forecastTrend === 'up' ? "#10b981" : forecastTrend === 'down' ? "#f43f5e" : "#6366f1"} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#forecastGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target (T+10)</p>
                <p className="text-xs font-black text-white">
                  ${forecastData[forecastData.length - 1]?.price || '---'}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800/50">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Proj. Return</p>
                <p className={cn("text-xs font-black", 
                  forecastTrend === 'up' ? "text-emerald-400" : 
                  forecastTrend === 'down' ? "text-rose-400" : "text-zinc-400"
                )}>
                  {forecastData.length > 0 ? (((forecastData[forecastData.length - 1].price - currentPrice) / currentPrice) * 100).toFixed(2) : '0.00'}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeNewsFeed;
