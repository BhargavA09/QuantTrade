import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Layers,
  Sparkles,
  Search,
  Filter,
  Download,
  ExternalLink,
  Zap,
  Activity,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  BarChart2,
  RefreshCw
} from 'lucide-react';
import {
  patternHistoryService,
  HistoricalPatternRecord,
  PatternPerformanceSummary
} from '../../services/patternHistoryService';
import { soundEngine } from '../../utils/audioAlerts';
import { cn } from '../../utils/cn';

interface FinvizPatternHistoryProps {
  onSelectTicker?: (ticker: string) => void;
  onSendToQuantLab?: (ticker: string) => void;
  allData?: Record<string, any>;
}

export const FinvizPatternHistory: React.FC<FinvizPatternHistoryProps> = ({
  onSelectTicker,
  onSendToQuantLab,
  allData = {}
}) => {
  const [history, setHistory] = useState<HistoricalPatternRecord[]>(() => patternHistoryService.getHistory());
  const [selectedPatternType, setSelectedPatternType] = useState<string>('ALL');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('ALL');
  const [selectedTicker, setSelectedTicker] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'return' | 'peak' | 'confidence' | 'drawdown'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [inspectModalRecord, setInspectModalRecord] = useState<HistoricalPatternRecord | null>(null);

  // Subscribe to live pattern history updates
  useEffect(() => {
    const unsub = patternHistoryService.subscribe((updated) => {
      setHistory([...updated]);
    });
    return () => unsub();
  }, []);

  // Filtered & Sorted Records
  const filteredRecords = useMemo(() => {
    return history.filter(record => {
      // Pattern type filter
      if (selectedPatternType !== 'ALL' && record.patternType !== selectedPatternType) {
        return false;
      }
      // Outcome filter
      if (selectedOutcome !== 'ALL' && record.outcome !== selectedOutcome) {
        return false;
      }
      // Ticker filter
      if (selectedTicker !== 'ALL' && record.ticker !== selectedTicker) {
        return false;
      }
      // Search query (ticker or company or pattern name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          record.ticker.toLowerCase().includes(q) ||
          record.companyName.toLowerCase().includes(q) ||
          record.patternName.toLowerCase().includes(q) ||
          record.notes.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    }).sort((a, b) => {
      let diff = 0;
      if (sortBy === 'date') {
        diff = new Date(b.detectionDate).getTime() - new Date(a.detectionDate).getTime();
      } else if (sortBy === 'return') {
        diff = b.performancePct - a.performancePct;
      } else if (sortBy === 'peak') {
        diff = b.peakReturnPct - a.peakReturnPct;
      } else if (sortBy === 'confidence') {
        diff = b.confidence - a.confidence;
      } else if (sortBy === 'drawdown') {
        diff = Math.abs(a.maxDrawdownPct) - Math.abs(b.maxDrawdownPct);
      }
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [history, selectedPatternType, selectedOutcome, selectedTicker, searchQuery, sortBy, sortOrder]);

  // Dynamic Performance Metrics for filtered set
  const metrics: PatternPerformanceSummary = useMemo(() => {
    return patternHistoryService.calculateMetrics(filteredRecords);
  }, [filteredRecords]);

  // Unique tickers list for quick filter
  const availableTickers = useMemo(() => {
    const set = new Set<string>();
    history.forEach(h => set.add(h.ticker));
    return Array.from(set);
  }, [history]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(o => o === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    soundEngine.playNotificationTap();
  };

  const handleExportCSV = () => {
    soundEngine.playNotificationTap();
    const headers = [
      'ID',
      'Ticker',
      'Company',
      'Pattern Type',
      'Pattern Name',
      'Detection Date',
      'Detection Price',
      'Current Price',
      'Target Price',
      'Stop Loss Price',
      'Peak Price',
      'Performance %',
      'Peak Return %',
      'Max Drawdown %',
      'Outcome',
      'Confidence %',
      'Volume Ratio',
      'Days Elapsed',
      'Notes'
    ];

    const rows = filteredRecords.map(r => [
      r.id,
      r.ticker,
      `"${r.companyName.replace(/"/g, '""')}"`,
      r.patternType,
      `"${r.patternName.replace(/"/g, '""')}"`,
      r.detectionDate,
      r.detectionPrice,
      r.currentPrice,
      r.targetPrice,
      r.stopLossPrice,
      r.peakPricePostDetection,
      r.performancePct,
      r.peakReturnPct,
      r.maxDrawdownPct,
      r.outcome,
      r.confidence,
      r.volumeExpansionRatio,
      r.daysElapsed,
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `finviz_pattern_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>Quant Pattern History & Performance Matrix</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  {history.length} Signals Audited
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-sans mt-0.5">
                Aggregated post-detection tracking for Ascending Triangles, Double Bottoms, and breakout channels across monitored tickers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700 transition-all shadow-sm"
            title="Export filtered records to CSV"
          >
            <Download size={13} className="text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Institutional Performance KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Win Rate */}
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3.5 shadow-md">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Win Rate</span>
            <Target size={13} className="text-emerald-400" />
          </div>
          <div className="text-xl font-black font-mono text-emerald-400 mt-1">
            {metrics.winRate}%
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            {metrics.targetReachedCount} Wins · {metrics.stopTriggeredCount} Losses
          </div>
        </div>

        {/* Avg Post-Detection Return */}
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3.5 shadow-md">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Avg Return</span>
            <TrendingUp size={13} className="text-cyan-400" />
          </div>
          <div className={cn("text-xl font-black font-mono mt-1", metrics.avgReturnPct >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {metrics.avgReturnPct >= 0 ? '+' : ''}{metrics.avgReturnPct}%
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Post-breakout baseline
          </div>
        </div>

        {/* Avg Peak Return */}
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3.5 shadow-md">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Avg Peak Return</span>
            <Zap size={13} className="text-amber-400" />
          </div>
          <div className="text-xl font-black font-mono text-amber-400 mt-1">
            +{metrics.avgPeakReturnPct}%
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Max upside achieved
          </div>
        </div>

        {/* Profit Factor */}
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3.5 shadow-md">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Profit Factor</span>
            <BarChart2 size={13} className="text-purple-400" />
          </div>
          <div className="text-xl font-black font-mono text-purple-400 mt-1">
            {metrics.profitFactor}x
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Gross gains vs losses
          </div>
        </div>

        {/* Best Pattern Type */}
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3.5 shadow-md">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Top Pattern</span>
            <Sparkles size={13} className="text-cyan-400" />
          </div>
          <div className="text-sm font-black font-mono text-cyan-300 mt-1 truncate">
            {metrics.bestPatternType}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Highest historical edge
          </div>
        </div>

        {/* Best Individual Ticker */}
        <div className="bg-zinc-900 border border-zinc-800/90 rounded-xl p-3.5 shadow-md">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
            <span>Top Outperformer</span>
            <Activity size={13} className="text-emerald-400" />
          </div>
          <div className="text-sm font-black font-mono text-emerald-400 mt-1 truncate">
            {metrics.bestPerformingTicker}
          </div>
          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
            Maximum single run
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Search Ribbon */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-3">
        {/* Search & Pattern Type Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Pattern Type Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none text-xs font-mono">
            <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Pattern:</span>
            {[
              { id: 'ALL', label: 'All Patterns' },
              { id: 'ascending_triangle', label: 'Ascending Triangle' },
              { id: 'double_bottom', label: 'Double Bottom (W)' },
              { id: 'bull_channel', label: 'Channel Up' },
              { id: 'support_resistance', label: 'Horizontal Breakout' },
              { id: 'falling_wedge', label: 'Falling Wedge' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedPatternType(p.id);
                  soundEngine.playNotificationTap();
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap",
                  selectedPatternType === p.id
                    ? "bg-cyan-500 text-black shadow-sm font-black"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search ticker, pattern, note..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl py-1.5 pl-9 pr-3 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Secondary Filter: Post-Detection Outcome & Ticker Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/70 text-xs font-mono">
          {/* Outcome Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Outcome:</span>
            {[
              { id: 'ALL', label: 'All Outcomes' },
              { id: 'TARGET_REACHED', label: '🎯 Target Reached' },
              { id: 'ACTIVE_RUNNING', label: '⏳ Active Running' },
              { id: 'STOP_TRIGGERED', label: '🛑 Stopped Out' }
            ].map(o => (
              <button
                key={o.id}
                onClick={() => {
                  setSelectedOutcome(o.id);
                  soundEngine.playNotificationTap();
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap",
                  selectedOutcome === o.id
                    ? "bg-zinc-800 text-white border border-cyan-500/50 shadow-sm"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* Quick Ticker Filter Badges */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-zinc-500 uppercase mr-1">Ticker:</span>
            <button
              onClick={() => setSelectedTicker('ALL')}
              className={cn(
                "px-2 py-0.5 rounded text-[11px] font-bold",
                selectedTicker === 'ALL'
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
              )}
            >
              ALL
            </button>
            {availableTickers.slice(0, 8).map(t => (
              <button
                key={t}
                onClick={() => {
                  setSelectedTicker(t);
                  soundEngine.playNotificationTap();
                }}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-bold transition-all",
                  selectedTicker === t
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Main Pattern History Data Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase tracking-wider font-bold">
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('date')}>
                  <div className="flex items-center gap-1">
                    <span>Detection Date</span>
                    <ArrowUpDown size={11} className={sortBy === 'date' ? "text-cyan-400" : "text-zinc-600"} />
                  </div>
                </th>
                <th className="py-3 px-4">Ticker / Company</th>
                <th className="py-3 px-4">Pattern Type</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => toggleSort('confidence')}>
                  <div className="flex items-center gap-1">
                    <span>Conf</span>
                    <ArrowUpDown size={11} className={sortBy === 'confidence' ? "text-cyan-400" : "text-zinc-600"} />
                  </div>
                </th>
                <th className="py-3 px-4">Entry vs Target</th>
                <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => toggleSort('return')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Post Return</span>
                    <ArrowUpDown size={11} className={sortBy === 'return' ? "text-cyan-400" : "text-zinc-600"} />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-white text-right" onClick={() => toggleSort('peak')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Peak Gain</span>
                    <ArrowUpDown size={11} className={sortBy === 'peak' ? "text-cyan-400" : "text-zinc-600"} />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Outcome</th>
                <th className="py-3 px-4 text-center">Trajectory</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-zinc-500 font-sans">
                    <Filter className="mx-auto mb-2 text-zinc-600" size={24} />
                    <p className="font-bold text-sm text-zinc-400">No historical patterns match the chosen criteria</p>
                    <p className="text-xs text-zinc-500 mt-1">Try resetting the filters or clearing the search query.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isWinner = r.performancePct > 0;
                  const isTargetHit = r.outcome === 'TARGET_REACHED';
                  const isStopHit = r.outcome === 'STOP_TRIGGERED';

                  return (
                    <tr
                      key={r.id}
                      onClick={() => setInspectModalRecord(r)}
                      className="hover:bg-zinc-850/60 cursor-pointer transition-colors group"
                    >
                      {/* Date & Time */}
                      <td className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                        <div className="font-bold text-zinc-200">{r.detectionDate}</div>
                        <div className="text-[10px] text-zinc-500 font-sans">{r.daysElapsed} days ago</div>
                      </td>

                      {/* Ticker & Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectTicker) onSelectTicker(r.ticker);
                            }}
                            className="font-black text-cyan-400 hover:text-cyan-300 hover:underline text-sm"
                          >
                            {r.ticker}
                          </button>
                          <span className="text-[11px] text-zinc-400 font-sans truncate max-w-[140px]">
                            {r.companyName}
                          </span>
                        </div>
                      </td>

                      {/* Pattern Type */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {r.patternType === 'ascending_triangle' ? (
                            <Zap size={13} className="text-cyan-400 flex-shrink-0" />
                          ) : r.patternType === 'double_bottom' ? (
                            <Activity size={13} className="text-emerald-400 flex-shrink-0" />
                          ) : (
                            <Target size={13} className="text-zinc-400 flex-shrink-0" />
                          )}
                          <span className="font-bold text-zinc-200 truncate max-w-[170px]">
                            {r.patternName}
                          </span>
                        </div>
                      </td>

                      {/* Confidence Score */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold",
                          r.confidence >= 90
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                        )}>
                          {r.confidence}%
                        </span>
                      </td>

                      {/* Entry Price vs Target */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-zinc-300 font-bold">
                          ${r.detectionPrice.toFixed(2)}
                          <span className="text-zinc-500 font-normal mx-1">→</span>
                          <span className="text-emerald-400 font-bold">${r.targetPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-[10px] text-rose-400/80">
                          Stop: ${r.stopLossPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Current Return % */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold">
                        <div className={cn(
                          "text-sm flex items-center justify-end gap-1 font-black",
                          r.performancePct >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {r.performancePct >= 0 ? (
                            <TrendingUp size={13} />
                          ) : (
                            <TrendingDown size={13} />
                          )}
                          <span>{r.performancePct >= 0 ? '+' : ''}{r.performancePct.toFixed(2)}%</span>
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Now: ${r.currentPrice.toFixed(2)}
                        </div>
                      </td>

                      {/* Peak Return % */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-amber-400 text-sm">
                          +{r.peakReturnPct.toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          Peak: ${r.peakPricePostDetection.toFixed(2)}
                        </div>
                      </td>

                      {/* Outcome Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isTargetHit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 size={11} className="text-emerald-400" />
                            Target Reached
                          </span>
                        ) : isStopHit ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            <XCircle size={11} className="text-rose-400" />
                            Stopped Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                            <Clock size={11} className="text-cyan-400" />
                            Active In-Play
                          </span>
                        )}
                      </td>

                      {/* Mini Sparkline Price Trajectory */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="w-24 h-6 mx-auto flex items-center justify-center">
                          <svg className="w-full h-full" viewBox="0 0 100 24" preserveAspectRatio="none">
                            {(() => {
                              const pts = r.sparkline && r.sparkline.length > 1 ? r.sparkline : [r.detectionPrice, r.currentPrice];
                              const min = Math.min(...pts);
                              const max = Math.max(...pts);
                              const range = max - min || 1;
                              const pointsStr = pts.map((p, idx) => {
                                const x = (idx / (pts.length - 1)) * 100;
                                const y = 22 - ((p - min) / range) * 20;
                                return `${x},${y}`;
                              }).join(' ');

                              return (
                                <polyline
                                  fill="none"
                                  stroke={isWinner ? "#10b981" : "#f43f5e"}
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  points={pointsStr}
                                />
                              );
                            })()}
                          </svg>
                        </div>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (onSelectTicker) onSelectTicker(r.ticker);
                              soundEngine.playBullishBreakout();
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold transition-all"
                            title="Inspect Chart"
                          >
                            Chart
                          </button>
                          {onSendToQuantLab && (
                            <button
                              onClick={() => {
                                onSendToQuantLab(r.ticker);
                                soundEngine.playBullishBreakout();
                              }}
                              className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold transition-all"
                              title="Send to QuantLab"
                            >
                              QuantLab
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Meta */}
        <div className="px-4 py-3 bg-zinc-950/70 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-zinc-400">
          <div>
            Showing <span className="font-bold text-white">{filteredRecords.length}</span> of{' '}
            <span className="font-bold text-white">{history.length}</span> recorded pattern breakouts
          </div>
          <div className="text-zinc-500">
            Real-time quant pattern recognition audit · Auto-synced with active live streaming
          </div>
        </div>
      </div>

      {/* 5. Detailed Pattern Inspection Modal / Drawer */}
      {inspectModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2.5 rounded-xl border",
                  inspectModalRecord.patternType === 'ascending_triangle'
                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                    : inspectModalRecord.patternType === 'double_bottom'
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-zinc-800 text-zinc-300 border-zinc-700"
                )}>
                  {inspectModalRecord.patternType === 'ascending_triangle' ? (
                    <Zap size={20} />
                  ) : inspectModalRecord.patternType === 'double_bottom' ? (
                    <Activity size={20} />
                  ) : (
                    <Target size={20} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-white text-base font-mono">{inspectModalRecord.ticker}</span>
                    <span className="text-zinc-400 text-xs font-sans truncate max-w-[180px]">
                      {inspectModalRecord.companyName}
                    </span>
                  </div>
                  <h3 className="font-bold text-cyan-300 text-sm font-mono mt-0.5">
                    {inspectModalRecord.patternName}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setInspectModalRecord(null)}
                className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Primary Stats Grid */}
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Detection Entry</div>
                  <div className="text-base font-bold text-zinc-100 mt-0.5">
                    ${inspectModalRecord.detectionPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-zinc-500">{inspectModalRecord.detectionDate}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Target Price</div>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    ${inspectModalRecord.targetPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-500">
                    +{(
                      ((inspectModalRecord.targetPrice - inspectModalRecord.detectionPrice) /
                        inspectModalRecord.detectionPrice) *
                      100
                    ).toFixed(1)}% Potential
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Stop Loss</div>
                  <div className="text-base font-bold text-rose-400 mt-0.5">
                    ${inspectModalRecord.stopLossPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-rose-500">
                    -{(
                      ((inspectModalRecord.detectionPrice - inspectModalRecord.stopLossPrice) /
                        inspectModalRecord.detectionPrice) *
                      100
                    ).toFixed(1)}% Risk
                  </div>
                </div>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase">Current Performance</div>
                  <div className={cn(
                    "text-lg font-black mt-0.5",
                    inspectModalRecord.performancePct >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {inspectModalRecord.performancePct >= 0 ? '+' : ''}
                    {inspectModalRecord.performancePct.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400">Now: ${inspectModalRecord.currentPrice.toFixed(2)}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase">Peak Upside Return</div>
                  <div className="text-lg font-black text-amber-400 mt-0.5">
                    +{inspectModalRecord.peakReturnPct.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400">Peak: ${inspectModalRecord.peakPricePostDetection.toFixed(2)}</div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="text-[10px] text-zinc-500 uppercase">Max Drawdown</div>
                  <div className="text-lg font-black text-rose-400 mt-0.5">
                    {inspectModalRecord.maxDrawdownPct.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-zinc-400">Low: ${inspectModalRecord.troughPricePostDetection.toFixed(2)}</div>
                </div>
              </div>

              {/* Quant Engine Technical Audit Notes */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Technical Breakout Analysis</span>
                  <span className="text-[10px] font-mono text-cyan-400">
                    Volume Expansion: {inspectModalRecord.volumeExpansionRatio}x
                  </span>
                </div>
                <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                  {inspectModalRecord.notes}
                </p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-400 pt-1 border-t border-zinc-800/60">
                  <span>Resistance: <strong className="text-zinc-200">${inspectModalRecord.keyLevels.resistance.toFixed(2)}</strong></span>
                  <span>Support: <strong className="text-zinc-200">${inspectModalRecord.keyLevels.support.toFixed(2)}</strong></span>
                  <span>Breakout Pivot: <strong className="text-cyan-400">${inspectModalRecord.keyLevels.breakoutLevel.toFixed(2)}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setInspectModalRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
              >
                Close
              </button>
              {onSendToQuantLab && (
                <button
                  onClick={() => {
                    onSendToQuantLab(inspectModalRecord.ticker);
                    soundEngine.playBullishBreakout();
                    setInspectModalRecord(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 transition-all flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Send to QuantLab</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (onSelectTicker) onSelectTicker(inspectModalRecord.ticker);
                  soundEngine.playBullishBreakout();
                  setInspectModalRecord(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-black transition-all flex items-center gap-1.5 shadow-md"
              >
                <span>Inspect Quant Chart</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
