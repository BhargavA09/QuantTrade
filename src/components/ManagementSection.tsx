import React from 'react';
import { Users, UserCheck, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils/cn';

interface ManagementSectionProps {
  management?: {
    ceo: string;
    insiderSentiment: string;
    recentInsiderTrades: { insider: string; relation: string; type: string; amount: string; price: string; date: string }[];
    keyExecutives: { name: string; role: string }[];
  };
}

const ManagementSection: React.FC<ManagementSectionProps> = ({ management }) => {
  if (!management || Object.keys(management).length === 0) return null;

  const insiderSentiment = management.insiderSentiment || 'Neutral';
  const ceoName = management.ceo || 'N/A';
  const keyExecutives = management.keyExecutives || [];
  const recentInsiderTrades = management.recentInsiderTrades || [];

  return (
    <div className="glass-card p-6 space-y-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
        <Users size={120} />
      </div>

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tighter text-white uppercase">Management & Insiders</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Executive Leadership & Insider Activity</p>
          </div>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
          insiderSentiment === 'Bullish' 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
            : insiderSentiment === 'Bearish'
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
              : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
        )}>
          Insider Sentiment: {insiderSentiment}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* CEO & Key Executives */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
                <img src={`https://picsum.photos/seed/${ceoName}/100/100`} alt="CEO" referrerPolicy="no-referrer" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Chief Executive Officer</p>
                <p className="text-lg font-black text-white tracking-tight">{ceoName}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <UserCheck size={12} className="text-blue-400" />
                Key Executives
              </p>
              <div className="grid grid-cols-1 gap-2">
                {keyExecutives.map((exec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-black/20 border border-white/5 group hover:border-blue-500/30 transition-colors">
                    <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors">{exec.name}</span>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">{exec.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Insider Trades */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 h-full">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Info size={12} className="text-amber-400" />
              Recent Insider Activity
            </p>
            <div className="space-y-2">
              {recentInsiderTrades.map((trade, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-1.5 rounded-lg",
                      trade.type === 'Buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {trade.type === 'Buy' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{trade.insider}</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase">{trade.date} • {trade.relation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xs font-mono font-bold",
                      trade.type === 'Buy' ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {trade.type === 'Buy' ? '+' : '-'}{trade.amount}
                    </p>
                    <p className="text-[9px] text-zinc-600 font-bold uppercase">{trade.price}</p>
                  </div>
                </motion.div>
              ))}
              {recentInsiderTrades.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
                  <Info size={24} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-bold uppercase tracking-widest">No recent insider trades detected</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementSection;
