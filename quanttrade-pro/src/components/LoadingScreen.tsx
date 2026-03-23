import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap } from 'lucide-react';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Neural Core...');
  
  const statuses = [
    'Initializing Neural Core...',
    'Fetching Global Trade Pulse...',
    'Running Monte Carlo Simulations...',
    'Analyzing Fourier Harmonics...',
    'Calibrating Risk Models...',
    'Synchronizing Logistics Data...',
    'Finalizing Intelligence Report...'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 30);

    const statusInterval = setInterval(() => {
      setStatus(prev => {
        const currentIndex = statuses.indexOf(prev);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return statuses[nextIndex];
      });
    }, 800);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[1000] flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative flex flex-col items-center max-w-md w-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-12 relative group"
        >
          <div className="absolute inset-0 bg-emerald-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all animate-pulse" />
          <Activity size={48} className="text-emerald-500 relative z-10" />
          <div className="absolute -top-2 -right-2 bg-emerald-500 text-zinc-950 p-1.5 rounded-xl shadow-lg animate-bounce">
            <Zap size={14} fill="currentColor" />
          </div>
        </motion.div>

        <div className="w-full space-y-6">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] animate-pulse">System Boot</p>
              <h2 className="text-2xl font-black text-zinc-100 tracking-tighter italic">QUANTUM CORE</h2>
            </div>
            <span className="text-2xl font-black text-emerald-500 font-mono tracking-tighter">{progress}%</span>
          </div>

          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50 p-0.5">
            <motion.div 
              className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 20 }}
            />
          </div>

          <div className="flex items-center gap-3 py-3 px-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{status}</p>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 w-full">
          {[
            { label: 'Neural', val: 'Active' },
            { label: 'Market', val: 'Sync' },
            { label: 'Risk', val: 'Safe' }
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{item.label}</p>
              <p className="text-[10px] font-bold text-zinc-400">{item.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
