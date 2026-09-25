import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Zap } from 'lucide-react';
import { Logo } from './Logo';

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing Neural Core...');
  
  const statuses = [
    'Initializing Neural Core...',
    'Fetching Global Trade Pulse...',
    'Allocating Shared Memory...',
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
        // Faster progress initially, then slows down
        const increment = prev < 30 ? 2 : prev < 70 ? 1 : 0.5;
        return Math.min(100, prev + increment);
      });
    }, 40);

    const statusInterval = setInterval(() => {
      setStatus(prev => {
        const currentIndex = statuses.indexOf(prev);
        const nextIndex = (currentIndex + 1) % statuses.length;
        return statuses[nextIndex];
      });
    }, 1200);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950 z-[1000] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="relative flex flex-col items-center max-w-md w-full">
        {/* Logo Section */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-16 relative group shadow-2xl"
        >
          <div className="absolute inset-0 bg-emerald-500/10 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all animate-pulse" />
          <Logo size={64} className="relative z-10 icon-glow-emerald" />
          <div className="absolute -top-3 -right-3 bg-emerald-500 text-zinc-950 p-2 rounded-2xl shadow-lg animate-bounce">
            <Logo size={18} />
          </div>
          
          {/* Orbital Rings */}
          <div className="absolute inset-[-20px] border border-emerald-500/10 rounded-full animate-[spin_10s_linear_infinite]" />
          <div className="absolute inset-[-40px] border border-blue-500/5 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
        </motion.div>

        <div className="w-full space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">System Boot</p>
              </div>
              <h2 className="text-4xl font-black text-zinc-100 tracking-tighter italic leading-none">LOGISTICS ALPHA</h2>
            </div>
            <div className="text-right">
              <span className="text-4xl font-black text-emerald-500 font-mono tracking-tighter tabular-nums">{Math.floor(progress)}%</span>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Loading Core</p>
            </div>
          </div>

          <div className="h-2 w-full bg-zinc-900/50 rounded-full overflow-hidden border border-zinc-800/50 p-0.5 backdrop-blur-sm">
            <motion.div 
              className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: 'spring', damping: 25, stiffness: 50 }}
            />
          </div>

          <div className="flex items-center justify-between py-4 px-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                <div className="w-3 h-3 rounded-full bg-emerald-500 relative z-10" />
              </div>
              <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">{status}</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-1 h-4 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div 
                    className="w-full bg-emerald-500"
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-12 w-full">
          {[
            { label: 'Neural Engine', val: 'v4.2.0' },
            { label: 'Shared Memory', val: 'Optimized' },
            { label: 'Risk Protocol', val: 'Active' }
          ].map((item, i) => (
            <div key={i} className="text-center space-y-1">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{item.label}</p>
              <p className="text-[11px] font-bold text-zinc-300 italic">{item.val}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
