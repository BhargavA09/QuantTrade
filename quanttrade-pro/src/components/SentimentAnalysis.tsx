import React from 'react';
import { MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SentimentAnalysisProps {
  sentiment: any;
  activeTicker: string;
}

const SentimentAnalysis = React.memo(({ sentiment, activeTicker }: SentimentAnalysisProps) => {
  if (!sentiment) return null;

  const getSentimentColor = (score: number) => {
    if (score > 60) return "text-emerald-400";
    if (score < 40) return "text-rose-400";
    return "text-amber-400";
  };

  const getSentimentIcon = (score: number) => {
    if (score > 60) return <TrendingUp size={14} className="text-emerald-400" />;
    if (score < 40) return <TrendingDown size={14} className="text-rose-400" />;
    return <Minus size={14} className="text-amber-400" />;
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <MessageSquare size={14} className="text-indigo-400" />
          Real-time Sentiment Analysis
        </h3>
        <div className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase">
          Social & News
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-20 w-20">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-zinc-800"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 36}
              strokeDashoffset={2 * Math.PI * 36 * (1 - sentiment.score / 100)}
              className={cn("transition-all duration-1000", getSentimentColor(sentiment.score))}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-xl font-bold", getSentimentColor(sentiment.score))}>
              {sentiment.score}
            </span>
            <span className="text-[8px] text-zinc-600 font-bold uppercase">Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Market Bias</span>
            <div className="flex items-center gap-1">
              {getSentimentIcon(sentiment.score)}
              <span className={cn("text-[10px] font-bold uppercase", getSentimentColor(sentiment.score))}>
                {sentiment.label}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-zinc-600 font-bold uppercase">
              <span>Bullish Volume</span>
              <span>{sentiment.bullish}%</span>
            </div>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${sentiment.bullish}%` }} />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-zinc-600 font-bold uppercase">
              <span>Bearish Volume</span>
              <span>{sentiment.bearish}%</span>
            </div>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500" style={{ width: `${sentiment.bearish}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[9px] text-zinc-500 font-bold uppercase">Key Drivers for {activeTicker}</p>
        <div className="flex flex-wrap gap-2">
          {sentiment.drivers.map((driver: string, i: number) => (
            <span key={i} className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-400 font-medium">
              {driver}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});

SentimentAnalysis.displayName = 'SentimentAnalysis';

export default SentimentAnalysis;
