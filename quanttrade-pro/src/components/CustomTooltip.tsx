import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
          {new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.startsWith('sim_')) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[11px] text-zinc-300 font-medium">{entry.name}</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-100">
                  {Array.isArray(entry.value) 
                    ? `$${entry.value[0].toFixed(2)} - $${entry.value[1].toFixed(2)}`
                    : typeof entry.value === 'number' 
                      ? `$${entry.value.toFixed(2)}`
                      : entry.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* AI Insights Section */}
        {payload[0].payload.sentiment && (
          <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">AI Sentiment</span>
              <div className={cn(
                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                payload[0].payload.sentiment.score > 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              )}>
                {payload[0].payload.sentiment.score > 0 ? 'Bullish' : 'Bearish'}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Fair Value Est.</span>
              <span className="text-[10px] font-bold text-emerald-400">${payload[0].payload.fairValue}</span>
            </div>

            {payload[0].payload.forecast && payload[0].payload.forecast.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Short-term Forecast</span>
                <div className="grid grid-cols-3 gap-1">
                  {payload[0].payload.forecast.map((f: any, i: number) => (
                    <div key={i} className="bg-zinc-950 p-1.5 rounded border border-zinc-800 text-center">
                      <p className="text-[7px] text-zinc-500 font-bold uppercase">{new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[9px] font-bold text-zinc-200">${f.price.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
