import React from 'react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';
import { Clock, Activity, Zap } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isForecast = data.isForecast;

    return (
      <div className="glass-card p-4 shadow-2xl backdrop-blur-xl border-zinc-800/50 min-w-[200px] relative overflow-hidden">
        <div className="scanline opacity-[0.02]" />
        
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800/50 pb-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Clock size={12} className="text-zinc-600" />
            {new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          {isForecast && (
            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter border border-blue-500/20">
              Forecast
            </span>
          )}
        </div>

        <div className="space-y-2">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.startsWith('sim_')) return null;
            if (entry.dataKey === 'cone_range') return null;
            
            return (
              <div key={index} className="flex items-center justify-between gap-4 group">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: entry.color, color: entry.color }} />
                  <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-tighter group-hover:text-zinc-200 transition-colors">{entry.name}</span>
                </div>
                <span className={cn(
                  "text-[11px] font-mono font-bold",
                  entry.name.includes('Forecast') ? "text-blue-400" : "text-zinc-100"
                )}>
                  {Array.isArray(entry.value) 
                    ? `$${entry.value[0].toFixed(2)} - $${entry.value[1].toFixed(2)}`
                    : typeof entry.value === 'number' 
                      ? (entry.name.includes('RSI') || entry.name.includes('%') || entry.name.includes('Stochastic'))
                        ? entry.value.toFixed(2)
                        : `$${entry.value.toFixed(2)}`
                      : entry.value}
                </span>
              </div>
            );
          })}
        </div>

        {/* AI Insights Section */}
        {(data.sentiment || data.fairValue) && (
          <div className="mt-4 pt-4 border-t border-zinc-800/50 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">AI Sentiment</p>
                <div className={cn(
                  "px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter text-center border",
                  data.sentiment?.score > 0 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 glow-text-emerald" 
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20 glow-text-rose"
                )}>
                  {data.sentiment?.score > 0 ? 'Bullish' : 'Bearish'}
                </div>
              </div>

              <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Fair Value</p>
                <div className="text-[11px] font-mono font-bold text-emerald-400 text-center glow-text-emerald">
                  ${data.fairValue?.toFixed(2)}
                </div>
              </div>
            </div>

            {data.forecast && data.forecast.length > 0 && !isForecast && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Activity size={10} className="text-zinc-500" />
                  <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Neural Projection</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {data.forecast.map((f: any, i: number) => (
                    <div key={i} className="bg-zinc-950/50 p-2 rounded-lg border border-zinc-800/50 text-center group hover:border-blue-500/30 transition-colors">
                      <p className="text-[7px] text-zinc-600 font-black uppercase tracking-tighter mb-1">{new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      <p className="text-[10px] font-mono font-bold text-blue-400 group-hover:text-blue-300 transition-colors">${f.price.toFixed(0)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isForecast && data.forecastValue && (
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Forecast Confidence</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div 
                      key={s} 
                      className={cn(
                        "h-1 w-full rounded-full transition-all duration-500",
                        s <= 4 ? "bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.5)]" : "bg-zinc-800"
                      )} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 pt-2 border-t border-zinc-800/30 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">System Verified</span>
          </div>
          <span className="text-[7px] font-mono text-zinc-700">ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
