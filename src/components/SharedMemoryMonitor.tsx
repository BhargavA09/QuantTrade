import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Database, Activity } from 'lucide-react';

const SharedMemoryMonitor = () => {
  const [memoryUsage, setMemoryUsage] = useState(42);
  const [cacheHits, setCacheHits] = useState(0);
  const [latency, setLatency] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
      setMemoryUsage(prev => {
        const change = (Math.random() - 0.5) * 2;
        return Math.min(100, Math.max(0, prev + change));
      });
      setLatency(prev => {
        const change = (Math.random() - 0.5) * 4;
        return Math.min(50, Math.max(5, prev + change));
      });
      setCacheHits(prev => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card p-4 bg-zinc-900/50 border-emerald-500/10 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full -mr-12 -mt-12 group-hover:bg-emerald-500/10 transition-all" />
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
          <Database size={14} className="text-emerald-400" />
          Shared Memory Engine
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] font-bold text-emerald-500/80 uppercase">Optimized</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Allocation</p>
          <div className="flex items-end gap-1">
            <span className="text-lg font-black text-zinc-200 tracking-tighter">{memoryUsage.toFixed(1)}%</span>
            <Cpu size={10} className="text-zinc-600 mb-1" />
          </div>
          <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              animate={{ width: `${memoryUsage}%` }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Cache Hits</p>
          <div className="flex items-end gap-1">
            <span className="text-lg font-black text-zinc-200 tracking-tighter">{cacheHits}</span>
            <Activity size={10} className="text-zinc-600 mb-1" />
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < (cacheHits % 5) ? 'bg-blue-400' : 'bg-zinc-800'}`} />
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Latency</p>
          <div className="flex items-end gap-1">
            <span className="text-lg font-black text-zinc-200 tracking-tighter">{latency.toFixed(0)}ms</span>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mb-1.5" />
          </div>
          <p className="text-[8px] font-bold text-emerald-500/50 uppercase italic">Ultra Low</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/50 flex items-center justify-between">
        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Persistence Layer</p>
        <div className="flex gap-2">
          <span className="text-[8px] font-black text-emerald-500/40 uppercase">Local</span>
          <span className="text-[8px] font-black text-blue-500/40 uppercase">Session</span>
        </div>
      </div>
    </div>
  );
};

export default SharedMemoryMonitor;
