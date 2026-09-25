import React from 'react';
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Globe, 
  Users, 
  Activity, 
  AlertCircle,
  Newspaper,
  Twitter
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
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SentimentDashboardProps {
  sentiment: any;
  activeTicker: string;
}

const SentimentDashboard = React.memo(({ sentiment, activeTicker }: SentimentDashboardProps) => {
  if (!sentiment) return null;

  const getSentimentColor = (score: number) => {
    if (score > 60) return "text-emerald-400";
    if (score < 40) return "text-rose-400";
    return "text-amber-400";
  };

  const getSentimentBg = (score: number) => {
    if (score > 60) return "bg-emerald-500/10 border-emerald-500/20";
    if (score < 40) return "bg-rose-500/10 border-rose-500/20";
    return "bg-amber-500/10 border-amber-500/20";
  };

  const getSentimentStatus = (score: number) => {
    if (score > 75) return "Strongly Bullish";
    if (score > 60) return "Bullish";
    if (score < 25) return "Strongly Bearish";
    if (score < 40) return "Bearish";
    return "Neutral";
  };

  const articles = sentiment.articles || [];
  const newsArticles = articles.filter((a: any) => a.source !== 'Twitter' && a.source !== 'Reddit');
  const socialPosts = articles.filter((a: any) => a.source === 'Twitter' || a.source === 'Reddit');

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn("glass-card p-6 flex flex-col justify-between", getSentimentBg(sentiment.score))}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-zinc-400" />
              Aggregate Score
            </h3>
            <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded border", getSentimentBg(sentiment.score))}>
              {getSentimentStatus(sentiment.score)}
            </span>
          </div>
          <div className="flex items-end gap-4">
            <span className={cn("text-5xl font-black font-mono", getSentimentColor(sentiment.score))}>
              {sentiment.score}
            </span>
            <div className="pb-1">
              {sentiment.score > 50 ? (
                <TrendingUp size={24} className="text-emerald-400" />
              ) : (
                <TrendingDown size={24} className="text-rose-400" />
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-400 leading-relaxed italic">
            "{sentiment.summary}"
          </p>
        </div>

        <div className="glass-card p-6 bg-zinc-900/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Newspaper size={16} className="text-blue-400" />
            Media Volume Breakdown
          </h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-400">Institutional News</span>
                <span className="text-emerald-400">{sentiment.bullish}% Bullish</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${sentiment.bullish}%` }} />
                <div className="h-full bg-rose-500" style={{ width: `${100 - sentiment.bullish}%` }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase">
                <span className="text-zinc-400">Social Sentiment</span>
                <span className="text-rose-400">{sentiment.bearish}% Bearish</span>
              </div>
              <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-rose-500" style={{ width: `${sentiment.bearish}%` }} />
                <div className="h-full bg-emerald-500" style={{ width: `${100 - sentiment.bearish}%` }} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 bg-zinc-900/50">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-400" />
            Trade Impact Analysis
          </h3>
          <div className="p-4 rounded-xl bg-black/40 border border-zinc-800">
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Detected Bias</span>
            <span className={cn("text-lg font-bold uppercase", getSentimentColor(sentiment.score))}>
              {sentiment.tradeImpact}
            </span>
            <div className="mt-3 flex flex-wrap gap-2">
              {sentiment.drivers.map((driver: string, i: number) => (
                <span key={i} className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-400 font-bold uppercase">
                  {driver}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Trend */}
      {sentiment.trend && (
        <div className="glass-card p-6 bg-zinc-900/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" />
              Sentiment Velocity (30D Trend)
            </h3>
            <div className="flex gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-indigo-500/20 border border-indigo-500" />
                 <span className="text-[10px] text-zinc-500 font-bold">Aggregate Score</span>
               </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sentiment.trend}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#52525b" 
                  fontSize={10}
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#52525b" fontSize={10} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Categorized Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Institutional News */}
        <div className="glass-card bg-zinc-900/50">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} className="text-blue-400" />
              Institutional News
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold">{newsArticles.length} Reports</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {newsArticles.length > 0 ? (
              newsArticles.map((article: any, i: number) => (
                <a 
                  key={i} 
                  href={article.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block p-4 border-b border-zinc-800 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-500 font-bold group-hover:text-blue-400 transition-colors uppercase">
                      {article.source}
                    </span>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                      article.sentiment === 'positive' ? 'text-emerald-400 bg-emerald-500/10' :
                      article.sentiment === 'negative' ? 'text-rose-400 bg-rose-500/10' :
                      'text-zinc-400 bg-zinc-500/10'
                    )}>
                      {article.sentiment}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-zinc-200 leading-snug">
                    {article.title}
                  </h4>
                  <div className="mt-2 text-[10px] text-zinc-500">
                    {article.time}
                  </div>
                </a>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-600 text-xs italic">
                No institutional reports found for this period.
              </div>
            )}
          </div>
        </div>

        {/* Social Sentiment Feed */}
        <div className="glass-card bg-zinc-900/50">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Users size={14} className="text-purple-400" />
              Social Sentiment Pulse
            </h3>
            <span className="text-[10px] text-zinc-500 font-bold">{socialPosts.length} Mentions</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {socialPosts.length > 0 ? (
              socialPosts.map((post: any, i: number) => (
                <div key={i} className="p-4 border-b border-zinc-800">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                      {post.source === 'Twitter' ? <Twitter size={14} className="text-sky-400" /> : <MessageSquare size={14} className="text-orange-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">{post.author || 'Anonymous'}</span>
                        <span className={cn(
                          "text-[8px] font-black uppercase px-2 py-0.5 rounded",
                          post.sentiment === 'positive' ? 'text-emerald-400 bg-emerald-500/10' :
                          post.sentiment === 'negative' ? 'text-rose-400 bg-rose-500/10' :
                          'text-zinc-400 bg-zinc-500/10'
                        )}>
                          {post.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1 line-clamp-3">
                        {post.title}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-600 text-xs italic">
                No social activity detected in the last cycle.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

SentimentDashboard.displayName = 'SentimentDashboard';

export default SentimentDashboard;
