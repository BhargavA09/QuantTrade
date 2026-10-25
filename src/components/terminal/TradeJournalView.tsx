import React, { useState, useEffect } from 'react';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { 
  quantTraderBrain, 
  TraderBrainState, 
  ClosedTrade 
} from '../../services/QuantTraderBrain';

interface TradeJournalViewProps {
  onSelectTicker?: (ticker: string) => void;
}

export const TradeJournalView: React.FC<TradeJournalViewProps> = ({ onSelectTicker }) => {
  const [brainState, setBrainState] = useState<TraderBrainState>(() => quantTraderBrain.getState());
  const [filter, setFilter] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  useEffect(() => {
    return quantTraderBrain.subscribe(setBrainState);
  }, []);

  const closedTrades = brainState.closedTrades || [];
  const filteredTrades = filter === 'ALL'
    ? closedTrades
    : closedTrades.filter(t => t.outcome === filter);

  return (
    <div className="space-y-6">
      {/* 1. Performance Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Portfolio Balance</span>
          <div className="text-xl font-black text-white font-mono">
            ${brainState.stats.capital.toLocaleString()}
          </div>
          <span className={`text-[11px] font-mono font-bold mt-1 block ${brainState.stats.netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {brainState.stats.netPnl >= 0 ? '+' : ''}${brainState.stats.netPnl.toLocaleString()} ({brainState.stats.netPnlPct >= 0 ? '+' : ''}{brainState.stats.netPnlPct.toFixed(2)}%)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Win Rate</span>
          <div className="text-xl font-black text-emerald-400 font-mono">
            {brainState.stats.winRate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
            {brainState.stats.winningTrades} W / {brainState.stats.losingTrades} L
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Profit Factor</span>
          <div className="text-xl font-black text-indigo-400 font-mono">
            {brainState.stats.profitFactor.toFixed(2)}x
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
            Avg Win ${brainState.stats.averageWin.toFixed(0)} / Loss ${brainState.stats.averageLoss.toFixed(0)}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Sharpe Ratio</span>
          <div className="text-xl font-black text-amber-400 font-mono">
            {brainState.stats.sharpeRatio.toFixed(2)}
          </div>
          <span className="text-[11px] text-zinc-400 font-mono mt-1 block">
            Max Drawdown -{brainState.stats.maxDrawdown.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* 2. Trade Ledger Table */}
      <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              Algorithmic Trade Log & Post-Mortem Records
            </h3>
            <p className="text-xs text-zinc-400">
              Audit trail of all executed trades with the adaptive lesson extracted
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filter === 'ALL' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              All ({closedTrades.length})
            </button>
            <button
              onClick={() => setFilter('WIN')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filter === 'WIN' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Wins
            </button>
            <button
              onClick={() => setFilter('LOSS')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                filter === 'LOSS' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              Mistakes
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-zinc-950/80 text-zinc-400 uppercase text-[10px] font-bold tracking-wider border-y border-zinc-800">
              <tr>
                <th className="py-2.5 px-3">Trade ID</th>
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Entry</th>
                <th className="py-2.5 px-3">Exit</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">PnL ($)</th>
                <th className="py-2.5 px-3">Return</th>
                <th className="py-2.5 px-3">Setup & Learning Lesson</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredTrades.map((t, idx) => {
                const isWin = t.outcome === 'WIN';
                return (
                  <tr key={`${t.id || 'tr'}-${idx}`} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">{t.id}</td>
                    <td 
                      className="py-2.5 px-3 font-bold text-emerald-400 cursor-pointer hover:underline"
                      onClick={() => onSelectTicker && onSelectTicker(t.ticker)}
                    >
                      {t.ticker}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        t.tradeType === 'LONG' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {t.tradeType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-300">${t.entryPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-zinc-300">${t.exitPrice.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{t.quantity}</td>
                    <td className={`py-2.5 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isWin ? '+' : ''}{t.pnlPct.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 font-sans text-zinc-300 text-[11px] max-w-sm truncate" title={t.lesson || t.setup}>
                      <span className="text-zinc-400 font-bold font-mono mr-1">[{t.setup}]</span>
                      {t.lesson || "Routine execution"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
