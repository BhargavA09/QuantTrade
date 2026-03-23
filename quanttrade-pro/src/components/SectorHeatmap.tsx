import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Pattern {
  sector: string;
  pattern: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  confidence: number;
}

const SectorHeatmap = ({ patterns }: { patterns: Pattern[] }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {patterns.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className={cn(
            "p-5 rounded-3xl border transition-all hover:scale-[1.02] group relative overflow-hidden",
            p.impactScore > 40 ? "bg-emerald-500/10 border-emerald-500/20" :
            p.impactScore > 0 ? "bg-emerald-500/5 border-emerald-500/10" :
            p.impactScore < -40 ? "bg-rose-500/10 border-rose-500/20" :
            p.impactScore < 0 ? "bg-rose-500/5 border-rose-500/10" :
            "bg-zinc-900/50 border-zinc-800"
          )}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-100">{p.sector}</h4>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter mt-0.5">Pattern Identified</p>
            </div>
            <div className={cn(
              "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
              p.impactScore > 0 ? "bg-emerald-500/20 text-emerald-400" : 
              p.impactScore < 0 ? "bg-rose-500/20 text-rose-400" : "bg-zinc-800 text-zinc-500"
            )}>
              {p.impactScore > 0 ? 'Bullish' : p.impactScore < 0 ? 'Bearish' : 'Neutral'}
            </div>
          </div>
          
          <p className="text-xs text-zinc-300 leading-relaxed mb-6 min-h-[3rem]">
            {p.pattern}
          </p>
          
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-3xl font-black font-mono leading-none",
                  p.impactScore > 0 ? "text-emerald-400" : p.impactScore < 0 ? "text-rose-400" : "text-zinc-400"
                )}>
                  {p.impactScore > 0 ? '+' : ''}{p.impactScore}
                </span>
                <div className="h-4 w-[1px] bg-zinc-800" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-zinc-500 uppercase leading-none">Confidence</span>
                  <span className="text-[10px] font-mono font-bold text-zinc-200">{(p.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    "w-1 h-3 rounded-full",
                    idx < Math.ceil(Math.abs(p.impactScore) / 20) 
                      ? (p.impactScore > 0 ? "bg-emerald-500" : "bg-rose-500") 
                      : "bg-zinc-800"
                  )} 
                />
              ))}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default SectorHeatmap;
