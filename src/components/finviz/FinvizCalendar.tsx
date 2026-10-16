import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Flame,
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { soundEngine } from '../../utils/audioAlerts';

interface EarningsRelease {
  ticker: string;
  company: string;
  date: string;
  time: 'BMO' | 'AMC';
  estimatedEPS: number;
  reportedEPS?: number;
  surprisePct?: number;
  impliedMovePct: number;
  marketCap: string;
  sector: string;
}

interface EconomicEvent {
  date: string;
  time: string;
  indicator: string;
  country: string;
  period: string;
  actual?: string;
  consensus: string;
  previous: string;
  volatilityImpact: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'Inflation' | 'Monetary Policy' | 'Employment' | 'Consumer' | 'Manufacturing';
}

const EARNINGS_CALENDAR: EarningsRelease[] = [
  { ticker: 'NVDA', company: 'NVIDIA Corp.', date: 'Today', time: 'AMC', estimatedEPS: 0.74, reportedEPS: 0.81, surprisePct: 9.46, impliedMovePct: 7.8, marketCap: '$3.42T', sector: 'Semiconductors' },
  { ticker: 'TSLA', company: 'Tesla Inc.', date: 'Today', time: 'AMC', estimatedEPS: 0.58, reportedEPS: 0.62, surprisePct: 6.90, impliedMovePct: 8.5, marketCap: '$780B', sector: 'Consumer Cyclical' },
  { ticker: 'MSFT', company: 'Microsoft Corp.', date: 'Tomorrow', time: 'AMC', estimatedEPS: 3.10, impliedMovePct: 4.2, marketCap: '$3.15T', sector: 'Technology' },
  { ticker: 'AAPL', company: 'Apple Inc.', date: 'Tomorrow', time: 'AMC', estimatedEPS: 1.54, impliedMovePct: 3.9, marketCap: '$3.45T', sector: 'Technology' },
  { ticker: 'AMD', company: 'Advanced Micro Devices', date: 'Tomorrow', time: 'AMC', estimatedEPS: 0.92, impliedMovePct: 6.8, marketCap: '$240B', sector: 'Semiconductors' },
  { ticker: 'AMZN', company: 'Amazon.com Inc.', date: 'This Week', time: 'AMC', estimatedEPS: 1.14, impliedMovePct: 5.5, marketCap: '$2.02T', sector: 'Consumer Cyclical' },
  { ticker: 'GOOGL', company: 'Alphabet Inc.', date: 'This Week', time: 'AMC', estimatedEPS: 1.75, impliedMovePct: 4.8, marketCap: '$2.15T', sector: 'Communication Services' },
  { ticker: 'META', company: 'Meta Platforms', date: 'This Week', time: 'AMC', estimatedEPS: 5.25, impliedMovePct: 6.2, marketCap: '$1.48T', sector: 'Communication Services' },
  { ticker: 'TSM', company: 'Taiwan Semiconductor', date: 'Next Week', time: 'BMO', estimatedEPS: 1.94, impliedMovePct: 5.1, marketCap: '$980B', sector: 'Semiconductors' },
  { ticker: 'AVGO', company: 'Broadcom Inc.', date: 'Next Week', time: 'AMC', estimatedEPS: 1.39, impliedMovePct: 5.8, marketCap: '$840B', sector: 'Technology' },
  { ticker: 'PLTR', company: 'Palantir Technologies', date: 'Next Week', time: 'AMC', estimatedEPS: 0.09, impliedMovePct: 11.2, marketCap: '$98B', sector: 'Technology' }
];

const ECONOMIC_EVENTS: EconomicEvent[] = [
  { date: 'Today', time: '08:30 AM EST', indicator: 'Core CPI (MoM / YoY)', country: 'US', period: 'Sep', consensus: '0.3% / 3.2%', previous: '0.3% / 3.2%', actual: '0.2% / 3.1%', volatilityImpact: 'HIGH', category: 'Inflation' },
  { date: 'Tomorrow', time: '02:00 PM EST', indicator: 'FOMC Interest Rate Decision & Press Conf', country: 'US', period: 'Current', consensus: '4.75% (-25 bps)', previous: '5.00%', volatilityImpact: 'HIGH', category: 'Monetary Policy' },
  { date: 'Thursday', time: '08:30 AM EST', indicator: 'Initial Jobless Claims', country: 'US', period: 'Weekly', consensus: '225K', previous: '228K', volatilityImpact: 'MEDIUM', category: 'Employment' },
  { date: 'Friday', time: '08:30 AM EST', indicator: 'Non-Farm Payrolls (NFP) & Unemployment', country: 'US', period: 'Sep', consensus: '145K / 4.1%', previous: '142K / 4.2%', volatilityImpact: 'HIGH', category: 'Employment' },
  { date: 'Next Week', time: '08:30 AM EST', indicator: 'Core PCE Price Index', country: 'US', period: 'Monthly', consensus: '0.2%', previous: '0.2%', volatilityImpact: 'HIGH', category: 'Inflation' },
  { date: 'Next Week', time: '10:00 AM EST', indicator: 'ISM Manufacturing PMI', country: 'US', period: 'Sep', consensus: '47.8', previous: '47.2', volatilityImpact: 'MEDIUM', category: 'Manufacturing' }
];

interface FinvizCalendarProps {
  onSelectTicker?: (ticker: string) => void;
  onSendToQuantLab?: (ticker: string) => void;
}

export const FinvizCalendar: React.FC<FinvizCalendarProps> = ({
  onSelectTicker,
  onSendToQuantLab
}) => {
  const [viewMode, setViewMode] = useState<'earnings' | 'economic'>('earnings');
  const [timeFilter, setTimeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEarnings = EARNINGS_CALENDAR.filter(item => {
    if (timeFilter !== 'ALL' && item.date !== timeFilter) return false;
    if (searchTerm && !item.ticker.includes(searchTerm.toUpperCase()) && !item.company.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredEconomic = ECONOMIC_EVENTS.filter(item => {
    if (timeFilter !== 'ALL' && item.date !== timeFilter) return false;
    if (searchTerm && !item.indicator.toLowerCase().includes(searchTerm.toLowerCase()) && !item.category.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 text-zinc-100">
      {/* Header bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Corporate Earnings & Macroeconomic Event Radar
              <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full font-bold">
                Consensus Surprises
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Track EPS consensus beats/misses and high-impact macro catalysts with implied volatility move scores
            </p>
          </div>
        </div>

        {/* View Switcher & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Earnings vs Economic Toggle */}
          <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => {
                setViewMode('earnings');
                soundEngine.playNotificationTap();
              }}
              className={cn(
                "px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5",
                viewMode === 'earnings'
                  ? "bg-cyan-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <DollarSign size={13} />
              Earnings Releases ({EARNINGS_CALENDAR.length})
            </button>
            <button
              onClick={() => {
                setViewMode('economic');
                soundEngine.playNotificationTap();
              }}
              className={cn(
                "px-3 py-1 rounded-md font-bold transition-all flex items-center gap-1.5",
                viewMode === 'economic'
                  ? "bg-cyan-500 text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              <Flame size={13} />
              Macro Radar ({ECONOMIC_EVENTS.length})
            </button>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1 text-xs">
            {['ALL', 'Today', 'Tomorrow', 'This Week', 'Next Week'].map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={cn(
                  "px-2 py-1 rounded text-[11px] font-medium transition-all",
                  timeFilter === f
                    ? "bg-zinc-800 text-cyan-400 font-bold"
                    : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-28 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'earnings' ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ticker / Company</th>
                  <th className="py-3 px-4 font-semibold">Release Date</th>
                  <th className="py-3 px-4 font-semibold">Market Session</th>
                  <th className="py-3 px-4 font-semibold text-right">Est. EPS</th>
                  <th className="py-3 px-4 font-semibold text-right">Reported EPS</th>
                  <th className="py-3 px-4 font-semibold text-right">Surprise %</th>
                  <th className="py-3 px-4 font-semibold text-right">Implied Move</th>
                  <th className="py-3 px-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredEarnings.map((item) => {
                  const hasReported = item.reportedEPS !== undefined;
                  const isBeat = (item.surprisePct ?? 0) >= 0;

                  return (
                    <tr
                      key={item.ticker}
                      className="hover:bg-zinc-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectTicker?.(item.ticker)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                            {item.ticker}
                          </span>
                          <span className="text-[11px] text-zinc-400 truncate max-w-[140px] font-sans">
                            {item.company}
                          </span>
                          <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-sans">
                            {item.sector}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-300 font-sans font-medium">
                        {item.date}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1",
                            item.time === 'BMO'
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/30"
                          )}
                        >
                          <Clock size={10} />
                          {item.time === 'BMO' ? 'Before Open (BMO)' : 'After Close (AMC)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-zinc-300">
                        ${item.estimatedEPS.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasReported ? (
                          <span className={cn("font-black text-sm", isBeat ? "text-emerald-400" : "text-rose-400")}>
                            ${item.reportedEPS?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-zinc-600 italic">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasReported ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded font-bold text-xs",
                              isBeat ? "bg-emerald-500/15 text-emerald-400" : "bg-rose-500/15 text-rose-400"
                            )}
                          >
                            {isBeat ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {isBeat ? '+' : ''}{item.surprisePct?.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          ±{item.impliedMovePct.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectTicker?.(item.ticker)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-sans font-medium"
                          >
                            Chart
                          </button>
                          <button
                            onClick={() => {
                              onSendToQuantLab?.(item.ticker);
                              soundEngine.playBullishBreakout();
                            }}
                            className="px-2 py-1 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-[10px] font-sans font-bold flex items-center gap-1"
                          >
                            <Sparkles size={11} />
                            Simulate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-zinc-950/80 text-zinc-400 border-b border-zinc-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Macro Catalyst / Indicator</th>
                  <th className="py-3 px-4 font-semibold">Release Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Period</th>
                  <th className="py-3 px-4 font-semibold text-right">Consensus</th>
                  <th className="py-3 px-4 font-semibold text-right">Previous</th>
                  <th className="py-3 px-4 font-semibold text-right">Actual</th>
                  <th className="py-3 px-4 font-semibold text-center">Volatility Impact Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredEconomic.map((ev, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm font-sans flex items-center gap-2">
                        {ev.indicator}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      <div className="font-sans font-medium">{ev.date}</div>
                      <div className="text-[10px] text-zinc-500">{ev.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-zinc-800 text-cyan-300 font-medium">
                        {ev.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">{ev.period}</td>
                    <td className="py-3 px-4 text-right text-zinc-200 font-bold">{ev.consensus}</td>
                    <td className="py-3 px-4 text-right text-zinc-500">{ev.previous}</td>
                    <td className="py-3 px-4 text-right">
                      {ev.actual ? (
                        <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {ev.actual}
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">Pending</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1",
                          ev.volatilityImpact === 'HIGH'
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        )}
                      >
                        <Flame size={11} />
                        {ev.volatilityImpact} VOLATILITY
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
