import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Filter, 
  ShieldCheck,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { fetchFinvizInsiders, FinvizInsiderItem } from '../../services/api/finvizService';
import { cn } from '../../utils/cn';

interface FinvizInsidersProps {
  onSelectTicker: (ticker: string) => void;
}

export const FinvizInsiders: React.FC<FinvizInsidersProps> = ({ onSelectTicker }) => {
  const [insiders, setInsiders] = useState<FinvizInsiderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'Buy' | 'Sale'>('all');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchFinvizInsiders();
      if (res && res.insiders) {
        setInsiders(res.insiders);
      }
    } catch (err) {
      console.warn('Failed fetching insiders from Python backend, using baseline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = insiders.filter(item => {
    if (filterType !== 'all' && item.transaction !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.ticker.toLowerCase().includes(q) ||
        item.insider.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.relationship.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalBuyVolume = insiders
    .filter(i => i.transaction === 'Buy')
    .reduce((acc, i) => acc + i.value, 0);

  const totalSaleVolume = insiders
    .filter(i => i.transaction === 'Sale')
    .reduce((acc, i) => acc + i.value, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="text-emerald-400" size={20} />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Authentic Finviz Insider Trading Wire
            </h2>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
              SEC FORM 4 LIVE
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Real-time insider transactions submitted to the SEC by executives, directors, and 10% beneficial owners.
          </p>
        </div>

        {/* Quick summary metrics */}
        <div className="flex items-center gap-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Insider Purchases</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              ${(totalBuyVolume / 1e6).toFixed(2)}M
            </span>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-right">
            <span className="text-[10px] font-mono text-zinc-500 uppercase block">Insider Sales</span>
            <span className="text-xs font-mono font-bold text-rose-400">
              ${(totalSaleVolume / 1e6).toFixed(2)}M
            </span>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all border border-zinc-700"
            title="Refresh from Python Engine"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : ""} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950 border border-zinc-850 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 font-bold uppercase">Filter:</span>
          {(['all', 'Buy', 'Sale'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono font-bold rounded transition-all",
                filterType === type
                  ? type === 'Buy'
                    ? "bg-emerald-600 text-white"
                    : type === 'Sale'
                    ? "bg-rose-600 text-white"
                    : "bg-zinc-800 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
              )}
            >
              {type === 'all' ? 'All Transactions' : `${type}s Only`}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search insider, ticker, officer..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1 pl-8 pr-3 text-xs font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-3">Ticker</th>
                <th className="py-2.5 px-3">Owner / Executive</th>
                <th className="py-2.5 px-3">Relationship</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Transaction</th>
                <th className="py-2.5 px-3 text-right">Cost</th>
                <th className="py-2.5 px-3 text-right"># Shares</th>
                <th className="py-2.5 px-3 text-right">Value ($)</th>
                <th className="py-2.5 px-3 text-right"># Shares Total</th>
                <th className="py-2.5 px-3 text-center">SEC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850/60">
              {filtered.map((item, idx) => {
                const isBuy = item.transaction === 'Buy';
                return (
                  <tr
                    key={item.id || idx}
                    className="hover:bg-zinc-900/60 transition-colors group cursor-pointer"
                    onClick={() => onSelectTicker(item.ticker)}
                  >
                    <td className="py-2.5 px-3">
                      <span className="font-black text-emerald-400 group-hover:underline">
                        {item.ticker}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-200 font-medium">
                      {item.insider}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 text-[11px]">
                      {item.relationship}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-flex items-center gap-1",
                          isBuy
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        )}
                      >
                        {isBuy ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                        {item.transaction}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-300 font-bold">
                      ${item.cost.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-200">
                      {item.shares.toLocaleString()}
                    </td>
                    <td className={cn("py-2.5 px-3 text-right font-black", isBuy ? "text-emerald-400" : "text-rose-400")}>
                      ${item.value >= 1e6 ? `${(item.value / 1e6).toFixed(2)}M` : item.value.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-zinc-400">
                      {item.sharesTotal.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-zinc-500 hover:text-emerald-400 inline-flex items-center gap-0.5">
                        {item.secForm}
                        <ExternalLink size={9} />
                      </span>
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
