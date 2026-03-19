import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../utils/cn';

interface MonteCarloControlsProps {
  numSims: number;
  setNumSims: (val: number) => void;
  confInterval: number;
  setConfInterval: (val: number) => void;
}

export const MonteCarloControls: React.FC<MonteCarloControlsProps> = ({
  numSims,
  setNumSims,
  confInterval,
  setConfInterval
}) => {
  return (
    <div className="glass-card p-4 bg-zinc-900/50 border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <RefreshCw size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Simulation Parameters</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Refine Monte Carlo Engine</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Simulations</label>
              <span className="text-[10px] font-mono font-bold text-emerald-400">{numSims}</span>
            </div>
            <input 
              type="range" 
              min="50" 
              max="500" 
              step="50" 
              value={numSims} 
              onChange={(e) => setNumSims(parseInt(e.target.value))}
              className="w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Confidence Interval</label>
            <div className="flex gap-2">
              {[0.5, 0.7, 0.8, 0.9].map((val) => (
                <button
                  key={val}
                  onClick={() => setConfInterval(val)}
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded border transition-all",
                    confInterval === val 
                      ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                      : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                  )}
                >
                  {(val * 100).toFixed(0)}%
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
