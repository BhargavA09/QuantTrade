import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { FINVIZ_SECTORS } from '../../data/finvizData';
import { cn } from '../../utils/cn';

export const FinvizGroups: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | 'YTD'>('1D');

  const data = FINVIZ_SECTORS.map(s => {
    let perf = s.perfDay;
    if (timeframe === '1W') perf = s.perfWeek;
    if (timeframe === '1M') perf = s.perfMonth;
    if (timeframe === 'YTD') perf = s.perfYtd;

    return {
      sector: s.name,
      perf: Number(perf.toFixed(2)),
      marketCap: (s.marketCap / 1e12).toFixed(1)
    };
  }).sort((a, b) => b.perf - a.perf);

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            Finviz Sector & Industry Performance Groups
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cross-sector rotation and capital allocation breakdown
          </p>
        </div>

        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {(['1D', '1W', '1M', 'YTD'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 py-1 text-xs font-mono font-bold rounded transition-all",
                timeframe === tf ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl">
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 120, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
              <XAxis 
                type="number" 
                stroke="#71717a" 
                fontSize={10} 
                fontFamily="monospace"
                tickFormatter={v => `${v}%`} 
              />
              <YAxis 
                type="category" 
                dataKey="sector" 
                stroke="#d4d4d8" 
                fontSize={11} 
                fontFamily="sans-serif"
                fontWeight={600}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  borderColor: '#27272a', 
                  borderRadius: '0.5rem', 
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}
                formatter={(val: any) => [`${val}%`, 'Performance']}
              />
              <Bar dataKey="perf" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.perf >= 0 ? '#10b981' : '#f43f5e'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* High-density Sector Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3">Sector</th>
              <th className="py-2.5 px-3 text-right">Market Cap</th>
              <th className="py-2.5 px-3 text-right">1-Day</th>
              <th className="py-2.5 px-3 text-right">1-Week</th>
              <th className="py-2.5 px-3 text-right">1-Month</th>
              <th className="py-2.5 px-3 text-right">YTD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-850">
            {FINVIZ_SECTORS.map((s, idx) => (
              <tr key={s.name} className={idx % 2 === 0 ? "bg-zinc-950" : "bg-zinc-900/30"}>
                <td className="py-2.5 px-3 font-bold text-zinc-200">{s.name}</td>
                <td className="py-2.5 px-3 text-right text-zinc-300 font-bold">${(s.marketCap / 1e12).toFixed(2)}T</td>
                <td className={cn("py-2.5 px-3 text-right font-bold", s.perfDay >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {s.perfDay >= 0 ? '+' : ''}{s.perfDay.toFixed(2)}%
                </td>
                <td className={cn("py-2.5 px-3 text-right font-bold", s.perfWeek >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {s.perfWeek >= 0 ? '+' : ''}{s.perfWeek.toFixed(2)}%
                </td>
                <td className={cn("py-2.5 px-3 text-right font-bold", s.perfMonth >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {s.perfMonth >= 0 ? '+' : ''}{s.perfMonth.toFixed(2)}%
                </td>
                <td className={cn("py-2.5 px-3 text-right font-bold", s.perfYtd >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {s.perfYtd >= 0 ? '+' : ''}{s.perfYtd.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
