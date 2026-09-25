import React from 'react';
import { motion } from 'motion/react';
import { Info, BarChart2, Users, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '../utils/cn';

interface FundamentalsData {
  marketCap: string;
  peRatio: string;
  dividendYield: string;
  revenue: string;
  netIncome: string;
  eps: string;
  beta: string;
  fiftyTwoWeekHigh: string;
  fiftyTwoWeekLow: string;
  floatShares?: string;
  heldByInstitutions?: string;
  shortRatio?: string;
}

export const FundamentalsSection: React.FC<{ fundamentals: FundamentalsData }> = ({ fundamentals }) => {
  const cards = [
    { label: 'Market Cap', value: fundamentals.marketCap, icon: DollarSign, color: 'text-blue-400' },
    { label: 'P/E Ratio', value: fundamentals.peRatio, icon: BarChart2, color: 'text-emerald-400' },
    { label: 'Div Yield', value: fundamentals.dividendYield, icon: TrendingUp, color: 'text-purple-400' },
    { label: 'Rev (TTM)', value: fundamentals.revenue, icon: Info, color: 'text-zinc-400' },
    { label: 'Net Income', value: fundamentals.netIncome, icon: DollarSign, color: 'text-emerald-400' },
    { label: 'EPS', value: fundamentals.eps, icon: Info, color: 'text-zinc-400' },
    { label: 'Beta', value: fundamentals.beta, icon: Activity, iconColor: 'text-rose-400' },
    { label: 'Float', value: fundamentals.floatShares || 'N/A', icon: Users, color: 'text-amber-400' },
    { label: 'Inst. Owned', value: fundamentals.heldByInstitutions || 'N/A', icon: Users, color: 'text-blue-400' },
    { label: 'Short Ratio', value: fundamentals.shortRatio || 'N/A', icon: TrendingUp, color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
          <BarChart2 className="text-emerald-400" size={24} />
          Structural Fundamentals
        </h3>
        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
          Source: Global Financial Data Hub
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col gap-3 group"
          >
            <div className="flex items-center justify-between">
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{card.label}</p>
               <card.icon size={12} className={cn("opacity-40 group-hover:opacity-100 transition-opacity", card.color)} />
            </div>
            <p className={cn("text-xl font-black tracking-tight", card.color)}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">52-Week Range Visualization</p>
          <div className="flex items-center gap-4">
             <span className="text-xs font-bold text-zinc-400">${fundamentals.fiftyTwoWeekLow}</span>
             <div className="flex-1 h-1 bg-zinc-800 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-500/20" />
                {/* Mock current pointer */}
                <div className="absolute top-0 bottom-0 w-1 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ left: '65%' }} />
             </div>
             <span className="text-xs font-bold text-emerald-400">${fundamentals.fiftyTwoWeekHigh}</span>
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-4">
          <div className="p-3 rounded-full bg-emerald-500/10">
            <Info size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-100 mb-1 uppercase tracking-widest">Neural Insights</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Company fundamentals show strong {parseFloat(fundamentals.peRatio) < 20 ? 'value' : 'growth'} characteristics. 
              {parseFloat(fundamentals.beta) < 1 ? ' Lower beta indicates defensive positioning.' : ' Higher beta suggests aggressive market correlation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Activity = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
