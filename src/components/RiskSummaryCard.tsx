import React, { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { RiskSummary } from '../types';

interface RiskSummaryCardProps {
  risk: RiskSummary;
  ticker: string;
}

const RiskSummaryCard: React.FC<RiskSummaryCardProps> = ({ risk, ticker }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!risk) return null;

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return "text-emerald-400";
      case 'medium': return "text-amber-400";
      case 'high': return "text-rose-400";
      default: return "text-zinc-400";
    }
  };

  const getRiskBg = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return "bg-emerald-500/10 border-emerald-500/20";
      case 'medium': return "bg-amber-500/10 border-amber-500/20";
      case 'high': return "bg-rose-500/10 border-rose-500/20";
      default: return "bg-zinc-900/50 border-zinc-800";
    }
  };

  return (
    <div className="glass-card overflow-hidden transition-all duration-300 border-zinc-800/50 hover:border-zinc-700/50">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-1.5 rounded-lg border", getRiskBg(risk.level))}>
            <ShieldAlert size={14} className={getRiskColor(risk.level)} />
          </div>
          <div className="text-left">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">Risk Profile</p>
            <h4 className="text-[11px] font-black text-white uppercase tracking-tighter flex items-center gap-1.5">
              {ticker} <span className={cn("text-[9px]", getRiskColor(risk.level))}>• {risk.level} Risk</span>
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 mr-4">
            <div className="text-right">
              <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Volatility</p>
              <p className="text-[10px] font-mono font-bold text-zinc-300">{risk.volatility}%</p>
            </div>
            <div className="text-right">
              <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Beta</p>
              <p className="text-[10px] font-mono font-bold text-zinc-300">{risk.beta}</p>
            </div>
          </div>
          <div className="p-1 rounded-md bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
            {isExpanded ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-800/50"
          >
            <div className="p-4 space-y-4 relative">
              <div className="scanline opacity-[0.02]" />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={10} className="text-zinc-500" />
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Sharpe Ratio</p>
                  </div>
                  <p className="text-sm font-black text-white glow-text-blue">{risk.sharpeRatio}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={10} className="text-rose-500" />
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Max Drawdown</p>
                  </div>
                  <p className="text-sm font-black text-rose-400 glow-text-rose">{risk.maxDrawdown}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Risk Factors</p>
                <div className="flex flex-wrap gap-2">
                  {risk.factors.map((factor: string, i: number) => (
                    <span 
                      key={i} 
                      className="px-2 py-1 rounded-md bg-zinc-900/50 border border-zinc-800 text-[8px] font-bold text-zinc-400 uppercase tracking-tighter"
                    >
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-800/30 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Real-time Risk Monitoring</span>
                </div>
                <span className="text-[7px] font-mono text-zinc-700">VAR_95: {risk.var95}%</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RiskSummaryCard;
