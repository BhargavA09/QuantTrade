import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RiskAnalysisProps {
  risk: any;
  activeTicker: string;
}

const RiskAnalysis = React.memo(({ risk, activeTicker }: RiskAnalysisProps) => {
  if (!risk) return null;

  const getRiskColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return "text-emerald-400";
      case 'medium': return "text-amber-400";
      case 'high': return "text-rose-400";
      default: return "text-zinc-400";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'low': return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'medium': return <AlertTriangle size={14} className="text-amber-400" />;
      case 'high': return <ShieldAlert size={14} className="text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert size={14} className="text-rose-400" />
          Risk Exposure Analysis
        </h3>
        <div className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[10px] font-bold text-rose-400 uppercase">
          Volatility & Beta
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Volatility</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold text-zinc-100">{risk.volatility}%</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Beta</p>
          <div className="flex items-center gap-1">
            <p className="text-lg font-bold text-zinc-100">{risk.beta}</p>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Risk Level</p>
          <div className="flex items-center gap-1">
            {getRiskIcon(risk.level)}
            <p className={cn("text-lg font-bold uppercase", getRiskColor(risk.level))}>
              {risk.level}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Sharpe Ratio</span>
          <span className="text-[10px] text-zinc-100 font-bold">{risk.sharpeRatio}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">Max Drawdown</span>
          <span className="text-rose-400 text-[10px] font-bold">{risk.maxDrawdown}%</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">VaR (95%)</span>
          <span className="text-rose-400 text-[10px] font-bold">{risk.var95}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-[9px] text-zinc-500 font-bold uppercase">Risk Factors for {activeTicker}</p>
        <div className="space-y-1">
          {risk.factors.map((factor: string, i: number) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
              <div className="h-1 w-1 rounded-full bg-rose-500" />
              <span className="text-[9px] text-zinc-400 font-medium">{factor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

RiskAnalysis.displayName = 'RiskAnalysis';

export default RiskAnalysis;
