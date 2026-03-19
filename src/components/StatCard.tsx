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
  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all min-w-[140px]">
    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-bold text-zinc-100">{value}</h3>
      {trend && (
        <div className={cn(
          "p-1 rounded-full",
          trend === 'up' ? "bg-emerald-500/10" : "bg-rose-500/10"
        )}>
          {trend === 'up' ? (
            <TrendingUp size={10} className="text-emerald-400" />
          ) : (
            <TrendingDown size={10} className="text-rose-400" />
          )}
        </div>
      )}
    </div>
    {subValue && <p className="text-[10px] text-zinc-500 mt-1 font-medium">{subValue}</p>}
  </div>
));

StatCard.displayName = 'StatCard';

export default StatCard;
