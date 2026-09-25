import React from 'react';
import { Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Simulation {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

interface SimulationFeedProps {
  simulations: Simulation[];
}

const SimulationFeed = React.memo(({ simulations }: SimulationFeedProps) => {
  return (
    <div className="glass-card p-4 h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Activity size={14} className="text-emerald-400" />
          Live Simulation Feed
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500/80 uppercase">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {simulations.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Waiting for simulations...</p>
            </div>
          ) : (
            simulations.map((simulation) => (
              <motion.div
                key={simulation.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                    simulation.side === 'buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {simulation.side}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200">${simulation.price.toFixed(2)}</span>
                    <span className="text-[9px] text-zinc-500 font-medium">
                      {simulation.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">{simulation.quantity.toLocaleString()}</span>
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Shares</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
});

SimulationFeed.displayName = 'SimulationFeed';

export default SimulationFeed;
