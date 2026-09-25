import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down';
}

const StatCard = React.memo(({ label, value, subValue, trend }: StatCardProps) => (
  <div className="glass-card p-4 hover:border-emerald-500/30 transition-all min-w-[140px] group relative overflow-hidden">
    <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:opacity-30 transition-opacity">
      <div className="w-8 h-8 border-t border-r border-zinc-500 rounded-tr-lg" />
    </div>
    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-1.5">{label}</p>
    <div className="flex items-center gap-2">
      <h3 className={cn(
        "text-xl font-black tracking-tighter transition-colors",
        trend === 'up' ? "text-emerald-400 glow-text-emerald" : 
        trend === 'down' ? "text-rose-400 glow-text-rose" : "text-zinc-100"
      )}>
        {value}
      </h3>
      {trend && (
        <div className={cn(
          "p-1 rounded-lg border",
          trend === 'up' ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
        )}>
          {trend === 'up' ? (
            <TrendingUp size={12} className="text-emerald-400" />
          ) : (
            <TrendingDown size={12} className="text-rose-400" />
          )}
        </div>
      )}
    </div>
    {subValue && (
      <div className="flex items-center gap-1.5 mt-2">
        <div className="w-1 h-1 rounded-full bg-zinc-700" />
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{subValue}</p>
      </div>
    )}
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;
