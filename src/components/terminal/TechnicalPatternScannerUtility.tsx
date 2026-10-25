import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Activity,
  Layers,
  ArrowRight,
  Maximize2,
  RotateCw,
  Play,
  Info,
  ChevronRight
} from 'lucide-react';
import {
  detectAutomatedPatterns,
  ChartPattern,
  PatternStatus,
  PatternType
} from '../../utils/patternRecognition';
import { quantTraderBrain } from '../../services/QuantTraderBrain';

interface TechnicalPatternScannerUtilityProps {
  selectedTicker: string;
  currentPrice: number;
  chartBars?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }>;
  onTradePattern?: (pattern: ChartPattern) => void;
}

export const TechnicalPatternScannerUtility: React.FC<TechnicalPatternScannerUtilityProps> = ({
  selectedTicker,
  currentPrice: initialSpot,
  chartBars = [],
  onTradePattern
}) => {
  const currentPrice = initialSpot > 0 ? initialSpot : 140.0;

  // Filter & Selected Pattern State
  const [filterType, setFilterType] = useState<'all' | 'reversal' | 'continuation' | 'bullish' | 'bearish'>('all');
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(null);
  const [executionToast, setExecutionToast] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Synthetic historical bars fallback if chartBars is sparse
  const activeBars = useMemo(() => {
    if (chartBars && chartBars.length >= 10) return chartBars;

    const dummy: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }> = [];
    let p = currentPrice * 0.94;
    const now = Date.now();

    for (let i = 24; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toLocaleDateString([], { month: 'short', day: 'numeric' });
      // Synthesize realistic structure containing flag impulse or head & shoulders
      let dailyMove = (Math.sin(i * 0.45) + (Math.random() - 0.48)) * (p * 0.015);
      if (i > 14 && i <= 19) dailyMove += p * 0.022; // Flagpole surge
      if (i > 8 && i <= 14) dailyMove -= p * 0.008; // Flag consolidation drift

      const open = p;
      const close = parseFloat(Math.max(1, p + dailyMove).toFixed(2));
      const high = parseFloat((Math.max(open, close) + Math.random() * (p * 0.008)).toFixed(2));
      const low = parseFloat((Math.min(open, close) - Math.random() * (p * 0.008)).toFixed(2));
      const volume = Math.floor(1200000 + Math.random() * 2400000);

      dummy.push({ date, open, high, low, close, volume });
      p = close;
    }
    dummy[dummy.length - 1].close = currentPrice;
    return dummy;
  }, [chartBars, currentPrice]);

  // Run automated pattern detection across historical candles
  const detectedPatterns = useMemo(() => {
    return detectAutomatedPatterns(activeBars);
  }, [activeBars]);

  // Set default selected pattern to the highest confidence one
  useEffect(() => {
    if (detectedPatterns.length > 0 && !selectedPatternId) {
      setSelectedPatternId(detectedPatterns[0].id);
    }
  }, [detectedPatterns, selectedPatternId]);

  // Filtered patterns
  const filteredPatterns = useMemo(() => {
    return detectedPatterns.filter(p => {
      if (filterType === 'reversal') return p.category === 'Reversal';
      if (filterType === 'continuation') return p.category === 'Continuation';
      if (filterType === 'bullish') return p.bias === 'bullish';
      if (filterType === 'bearish') return p.bias === 'bearish';
      return true;
    });
  }, [detectedPatterns, filterType]);

  const activePattern = useMemo(() => {
    return detectedPatterns.find(p => p.id === selectedPatternId) || detectedPatterns[0] || null;
  }, [detectedPatterns, selectedPatternId]);

  // Render D3 Candlestick / Pattern Geometry Overlay Chart
  useEffect(() => {
    if (!svgRef.current || activeBars.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 320;
    const margin = { top: 25, right: 75, bottom: 30, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Bar Index)
    const xScale = d3.scaleLinear()
      .domain([0, activeBars.length - 1])
      .range([0, innerWidth]);

    // Y Scale (Price)
    const allLows = activeBars.map(b => b.low);
    const allHighs = activeBars.map(b => b.high);
    if (activePattern?.targetPrice) {
      allLows.push(activePattern.targetPrice);
      allHighs.push(activePattern.targetPrice);
    }
    const minP = Math.min(...allLows);
    const maxP = Math.max(...allHighs);
    const pPad = (maxP - minP) * 0.12;

    const yScale = d3.scaleLinear()
      .domain([minP - pPad, maxP + pPad])
      .range([innerHeight, 0]);

    // Grid lines
    const yAxisGrid = d3.axisLeft(yScale).ticks(6).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'grid')
      .call(yAxisGrid)
      .selectAll('line')
      .attr('stroke', '#27272a')
      .attr('stroke-dasharray', '2,2');

    // Candlesticks
    const barWidth = Math.max(3, (innerWidth / activeBars.length) * 0.65);
    activeBars.forEach((bar, idx) => {
      const isGreen = bar.close >= bar.open;
      const x = xScale(idx);

      // Wick
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale(bar.high))
        .attr('y2', yScale(bar.low))
        .attr('stroke', isGreen ? '#10b981' : '#f43f5e')
        .attr('stroke-width', 1.2);

      // Candle body
      const bodyTop = yScale(Math.max(bar.open, bar.close));
      const bodyBottom = yScale(Math.min(bar.open, bar.close));
      const bodyHeight = Math.max(2, bodyBottom - bodyTop);

      g.append('rect')
        .attr('x', x - barWidth / 2)
        .attr('y', bodyTop)
        .attr('width', barWidth)
        .attr('height', bodyHeight)
        .attr('fill', isGreen ? '#10b981' : '#f43f5e')
        .attr('opacity', 0.85);
    });

    // Pattern Geometry Overlays for activePattern
    if (activePattern) {
      // Draw Trendlines
      activePattern.trendlines.forEach(tl => {
        const x1 = xScale(Math.max(0, Math.min(activeBars.length - 1, tl.x1)));
        const y1 = yScale(tl.y1);
        const x2 = xScale(Math.max(0, Math.min(activeBars.length - 1, tl.x2)));
        const y2 = yScale(tl.y2);

        const line = g.append('line')
          .attr('x1', x1)
          .attr('y1', y1)
          .attr('x2', x2)
          .attr('y2', y2)
          .attr('stroke', tl.color || (activePattern.bias === 'bullish' ? '#10b981' : '#f43f5e'))
          .attr('stroke-width', tl.type === 'flagpole' ? 3.5 : (tl.type === 'neckline' ? 2.5 : 2));

        if (tl.style === 'dashed') line.attr('stroke-dasharray', '5,3');
        if (tl.style === 'dotted') line.attr('stroke-dasharray', '2,3');

        // Trendline Label
        g.append('text')
          .attr('x', x2 + 6)
          .attr('y', y2 + 3)
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', tl.color || '#e4e4e7')
          .text(tl.label);
      });

      // Highlight Pivot Points (Left Shoulder, Head, Right Shoulder, or Flag Poles)
      const pivots = activePattern.keyLevels.pivotPoints;
      if (pivots) {
        Object.entries(pivots).forEach(([key, pt]) => {
          if (!pt) return;
          const px = xScale(Math.max(0, Math.min(activeBars.length - 1, pt.index)));
          const py = yScale(pt.price);

          g.append('circle')
            .attr('cx', px)
            .attr('cy', py)
            .attr('r', 5)
            .attr('fill', '#ffffff')
            .attr('stroke', activePattern.bias === 'bullish' ? '#10b981' : '#f43f5e')
            .attr('stroke-width', 2);

          const label = key === 'leftShoulder' ? 'LS'
            : key === 'head' ? 'HEAD'
            : key === 'rightShoulder' ? 'RS'
            : key === 'flagpoleStart' ? 'POLE'
            : key === 'flagpoleEnd' ? 'PEAK'
            : key.toUpperCase();

          g.append('text')
            .attr('x', px)
            .attr('y', py - 9)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'black')
            .attr('fill', '#ffffff')
            .text(label);
        });
      }

      // Measured Move Target Projected Horizontal Line
      const targetY = yScale(activePattern.targetPrice);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', targetY)
        .attr('y2', targetY)
        .attr('stroke', activePattern.bias === 'bullish' ? '#10b981' : '#f43f5e')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');

      g.append('rect')
        .attr('x', innerWidth + 4)
        .attr('y', targetY - 10)
        .attr('width', 68)
        .attr('height', 18)
        .attr('rx', 4)
        .attr('fill', activePattern.bias === 'bullish' ? '#064e3b' : '#881337')
        .attr('stroke', activePattern.bias === 'bullish' ? '#10b981' : '#f43f5e');

      g.append('text')
        .attr('x', innerWidth + 38)
        .attr('y', targetY + 2)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#ffffff')
        .text(`Tgt $${activePattern.targetPrice.toFixed(2)}`);

      // Invalidation / Stop Loss Line
      const stopY = yScale(activePattern.stopLossPrice);
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', stopY)
        .attr('y2', stopY)
        .attr('stroke', '#a1a1aa')
        .attr('stroke-width', 1.2)
        .attr('stroke-dasharray', '2,2');

      g.append('text')
        .attr('x', 6)
        .attr('y', stopY - 4)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#a1a1aa')
        .text(`Stop Loss $${activePattern.stopLossPrice.toFixed(2)}`);
    }

    // Y Axis (Price)
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => `$${d}`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('fill', '#a1a1aa');

    // X Axis (Date)
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(d => {
      const idx = Math.round(Number(d));
      return activeBars[idx]?.date || '';
    });
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '9px')
      .attr('fill', '#71717a');

  }, [activeBars, activePattern]);

  // Execute paper trade based on detected pattern setup
  const handleExecutePattern = (pattern: ChartPattern) => {
    try {
      const tradeType = pattern.bias === 'bullish' ? 'LONG' : 'SHORT';
      const trade = quantTraderBrain.executeOrder(
        selectedTicker,
        tradeType,
        currentPrice,
        `Pattern: ${pattern.name}`
      );

      setExecutionToast(`Executed ${pattern.name} trade: ${tradeType} ${trade.quantity} shs @ $${currentPrice.toFixed(2)}. Target: $${pattern.targetPrice}, Stop: $${pattern.stopLossPrice}`);
      if (onTradePattern) onTradePattern(pattern);
      setTimeout(() => setExecutionToast(null), 6000);
    } catch (e: any) {
      setExecutionToast(`Trade execution notice: ${e.message}`);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header Banner & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Technical Pattern Recognition Engine
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Ticker: <strong className="text-white">{selectedTicker}</strong> (${currentPrice.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {detectedPatterns.length} Patterns Identified
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Algorithmic Chart Pattern Identifier & Geometry Visualizer
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Detects classical high-conviction formations (Head & Shoulders, Bull/Bear Flags, Double Tops/Bottoms, Triangles, Cup & Handle) with exact pivot coordinates, neckline slopes, measured move targets, and volume verification.
          </p>
        </div>

        {/* Quick Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          {[
            { id: 'all', label: 'All Patterns' },
            { id: 'reversal', label: 'Reversals' },
            { id: 'continuation', label: 'Continuation' },
            { id: 'bullish', label: 'Bullish Bias' },
            { id: 'bearish', label: 'Bearish Bias' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/40'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Execution Feedback Toast */}
      {executionToast && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{executionToast}</span>
        </div>
      )}

      {/* 2. Interactive D3 Pattern Overlay Canvas */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Pattern Geometry Overlay & Candlestick Structure: {activePattern?.name || 'Technical Overview'}
            </h3>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
            {activePattern && (
              <span className={`px-2 py-0.5 rounded font-black ${
                activePattern.status === 'CONFIRMED_BREAKOUT'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : activePattern.status === 'TARGET_REACHED'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                STATUS: {activePattern.status}
              </span>
            )}
            <span className="text-zinc-500">Confidence: <strong className="text-emerald-400 font-bold">{activePattern?.confidence}%</strong></span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg ref={svgRef} className="w-full h-[320px]" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-indigo-500" /> Pivot Points (LS / Head / RS)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-emerald-400" /> Neckline / Channel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-indigo-400 border-dotted" /> Measured Target
            </span>
          </div>

          {activePattern && (
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Risk:Reward</span>
              <strong className="text-emerald-400">1 : {activePattern.riskRewardRatio}</strong>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-500">Projected Move:</span>
              <strong className={activePattern.potentialMovePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {activePattern.potentialMovePct >= 0 ? '+' : ''}{activePattern.potentialMovePct}%
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* 3. Detected Formations Grid & Detailed Action Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Detected Technical Patterns ({filteredPatterns.length} Formations Available)
          </h3>
          <span className="text-[10px] font-mono text-zinc-500">
            Click any pattern to inspect geometry overlay above
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPatterns.map(pattern => {
            const isSelected = pattern.id === selectedPatternId;
            return (
              <div
                key={pattern.id}
                onClick={() => setSelectedPatternId(pattern.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-3 ${
                  isSelected
                    ? 'bg-zinc-950 border-indigo-500 shadow-xl shadow-indigo-950/30'
                    : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/60'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                        pattern.bias === 'bullish'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : pattern.bias === 'bearish'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {pattern.bias}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 px-1.5 py-0.2 rounded bg-zinc-900 border border-zinc-800">
                        {pattern.category}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                        pattern.status === 'CONFIRMED_BREAKOUT'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : pattern.status === 'TARGET_REACHED'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {pattern.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mt-1">{pattern.name}</h4>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 font-mono block">Confidence</span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {pattern.confidence}%
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  {pattern.description}
                </p>

                {/* Technical Levels Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs pt-1">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[9px] uppercase text-zinc-500 block">Entry / Breakout</span>
                    <span className="font-bold text-white">${pattern.entryPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[9px] uppercase text-zinc-500 block">Measured Target</span>
                    <span className={`font-black ${pattern.bias === 'bullish' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ${pattern.targetPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[9px] uppercase text-zinc-500 block">Stop Invalidation</span>
                    <span className="font-bold text-rose-400">${pattern.stopLossPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                    <span className="text-[9px] uppercase text-zinc-500 block">Risk : Reward</span>
                    <span className="font-black text-amber-300">1 : {pattern.riskRewardRatio}</span>
                  </div>
                </div>

                {/* Volume Confirmation Insight */}
                {pattern.volumeProfileConfirmation && (
                  <div className="text-[11px] font-mono text-zinc-400 bg-zinc-900/40 p-2 rounded-lg border border-zinc-800/80 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{pattern.volumeProfileConfirmation}</span>
                  </div>
                )}

                {/* Trade Button */}
                <div className="pt-2 flex items-center justify-between border-t border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500">
                    Projected Return: <strong className={pattern.potentialMovePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {pattern.potentialMovePct >= 0 ? '+' : ''}{pattern.potentialMovePct}%
                    </strong>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecutePattern(pattern);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md ${
                      pattern.bias === 'bullish'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                        : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                    }`}
                  >
                    <Play className="w-3 h-3" />
                    <span>Trade {pattern.bias === 'bullish' ? 'Long' : 'Short'} Setup</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
