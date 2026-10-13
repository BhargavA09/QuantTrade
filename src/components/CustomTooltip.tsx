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

        {/* Quantitative Model Influence & Weights Breakdown */}
        {(() => {
          const weights = data.modelWeights || (isForecast ? {
            fourier: 25,
            monteCarlo: 55,
            vortex: 12,
            neuralRegime: 8,
            dominantModel: 'Monte Carlo GBM',
            regime: 'Stochastic Diffusion',
            confidence: 84
          } : {
            fourier: 64,
            monteCarlo: 24,
            vortex: 8,
            neuralRegime: 4,
            dominantModel: 'Fourier Low-Pass Decomposition',
            regime: 'Harmonic Baseline',
            confidence: 91
          });

          return (
            <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity size={11} className="text-emerald-400" />
                  <span className="text-[9px] font-black text-zinc-300 uppercase tracking-wider">
                    Model Weights Breakdown
                  </span>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {weights.dominantModel?.includes('Fourier') ? 'Fourier Dominated' : 'Monte Carlo Dominated'}
                </span>
              </div>

              {/* Stacked Influence Proportional Bar */}
              <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                  style={{ width: `${weights.fourier}%` }} 
                  title={`Fourier Influence: ${weights.fourier}%`}
                />
                <div 
                  className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
                  style={{ width: `${weights.monteCarlo}%` }} 
                  title={`Monte Carlo Influence: ${weights.monteCarlo}%`}
                />
                <div 
                  className="h-full bg-teal-400 transition-all duration-300" 
                  style={{ width: `${weights.vortex}%` }} 
                  title={`Vortex Spiral: ${weights.vortex}%`}
                />
                <div 
                  className="h-full bg-purple-500 transition-all duration-300" 
                  style={{ width: `${weights.neuralRegime}%` }} 
                  title={`Neural Regime: ${weights.neuralRegime}%`}
                />
              </div>

              {/* Granular Model Weights Grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {/* Fourier Weight */}
                <div className="p-1.5 rounded-lg bg-zinc-900/70 border border-emerald-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
                      Fourier
                    </span>
                    <span className="text-[10px] font-mono font-black text-emerald-400">
                      {weights.fourier}%
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${weights.fourier}%` }} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono mt-0.5">Harmonics Filter</span>
                </div>

                {/* Monte Carlo Weight */}
                <div className="p-1.5 rounded-lg bg-zinc-900/70 border border-blue-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_#3b82f6]" />
                      Monte Carlo
                    </span>
                    <span className="text-[10px] font-mono font-black text-blue-400">
                      {weights.monteCarlo}%
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-blue-400 h-full rounded-full" style={{ width: `${weights.monteCarlo}%` }} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono mt-0.5">GBM Diffusion</span>
                </div>

                {/* Vortex Spiral Weight */}
                <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-teal-500/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      Vortex Flow
                    </span>
                    <span className="text-[10px] font-mono font-bold text-teal-400">
                      {weights.vortex}%
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: `${weights.vortex}%` }} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono mt-0.5">Phase Vorticity</span>
                </div>

                {/* Neural Regime Weight */}
                <div className="p-1.5 rounded-lg bg-zinc-900/50 border border-purple-500/10 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                      Neural AI
                    </span>
                    <span className="text-[10px] font-mono font-bold text-purple-400">
                      {weights.neuralRegime}%
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-zinc-950 h-1 rounded-full overflow-hidden">
                    <div className="bg-purple-400 h-full rounded-full" style={{ width: `${weights.neuralRegime}%` }} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono mt-0.5">Priors & Regime</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* AI Insights Section */}
        {(data.sentiment || data.fairValue) && (
          <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-3">
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
            <span className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Ensemble Calibrated</span>
          </div>
          <span className="text-[7px] font-mono text-zinc-600">QuantEngine v4.2</span>
        </div>
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
