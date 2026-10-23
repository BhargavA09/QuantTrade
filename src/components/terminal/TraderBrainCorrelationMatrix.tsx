import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  Network, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Activity, 
  Compass, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Info, 
  Sliders, 
  Sparkles, 
  BarChart2, 
  RefreshCw,
  ExternalLink,
  Target
} from 'lucide-react';
import { 
  fetchCorrelationMatrix, 
  CorrelationMatrixResult, 
  PrimaryCorrelationItem 
} from '../../services/api/quantPortfolioService';

interface TraderBrainCorrelationMatrixProps {
  selectedTicker?: string;
  onSelectTicker?: (ticker: string) => void;
}

const QUICK_TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'GLD', 'USO', 'BTC-USD', 'AMZN'];

export const TraderBrainCorrelationMatrix: React.FC<TraderBrainCorrelationMatrixProps> = ({
  selectedTicker = 'NVDA',
  onSelectTicker
}) => {
  const [activeTicker, setActiveTicker] = useState<string>(selectedTicker);
  const [tickerInput, setTickerInput] = useState<string>(selectedTicker);
  const [universe, setUniverse] = useState<'all' | 'indices' | 'sectors' | 'macro'>('all');
  const [lookback, setLookback] = useState<number>(90);
  const [data, setData] = useState<CorrelationMatrixResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Selected pair for deep-dive inspection
  const [selectedPair, setSelectedPair] = useState<{ t1: string; t2: string; corr: number } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    row: number;
    col: number;
    t1: string;
    t2: string;
    corr: number;
  } | null>(null);

  const heatmapSvgRef = useRef<SVGSVGElement | null>(null);
  const rollingSvgRef = useRef<SVGSVGElement | null>(null);

  const loadMatrix = async (ticker: string, uni: 'all' | 'indices' | 'sectors' | 'macro', lb: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchCorrelationMatrix({
        ticker,
        universe: uni,
        lookback: lb
      });
      setData(res);
      if (res.tickers.length > 1) {
        setSelectedPair({
          t1: res.tickers[0],
          t2: res.tickers[1],
          corr: res.matrix[0][1]
        });
      }
    } catch (err: any) {
      console.error('Failed to load correlation matrix:', err);
      setError(`Failed to load quantitative correlation matrix: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTicker && selectedTicker !== activeTicker) {
      setActiveTicker(selectedTicker);
      setTickerInput(selectedTicker);
    }
  }, [selectedTicker]);

  useEffect(() => {
    loadMatrix(activeTicker, universe, lookback);
  }, [activeTicker, universe, lookback]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = tickerInput.trim().toUpperCase();
    if (clean) {
      setActiveTicker(clean);
      if (onSelectTicker) onSelectTicker(clean);
    }
  };

  // 1. D3.js Heatmap Rendering
  useEffect(() => {
    if (!data || !heatmapSvgRef.current) return;

    const svg = d3.select(heatmapSvgRef.current);
    svg.selectAll('*').remove();

    const tickers = data.tickers;
    const n = tickers.length;
    const matrix = data.matrix;

    const cellSize = Math.min(48, Math.max(34, Math.floor(580 / n)));
    const margin = { top: 75, right: 25, bottom: 25, left: 75 };
    const width = cellSize * n + margin.left + margin.right;
    const height = cellSize * n + margin.top + margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // D3 Diverging Color Scale for Pearson Correlation (-1.0 to +1.0)
    // -1: Deep Crimson / Rose (#e11d48)
    //  0: Dark Slate / Neutral Zinc (#18181b)
    // +1: Emerald / Teal (#059669)
    const colorScale = d3.scaleDiverging<string>()
      .domain([-1.0, 0.0, 1.0])
      .interpolator(d3.interpolateRgbBasis(['#e11d48', '#fda4af', '#18181b', '#34d399', '#059669']));

    // Render cells
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const val = matrix[r][c];
        const t1 = tickers[r];
        const t2 = tickers[c];
        const isHovered = hoveredCell && (hoveredCell.row === r || hoveredCell.col === c);
        const isExactHovered = hoveredCell && hoveredCell.row === r && hoveredCell.col === c;
        const isSelected = selectedPair && 
          ((selectedPair.t1 === t1 && selectedPair.t2 === t2) || (selectedPair.t1 === t2 && selectedPair.t2 === t1));

        const cellGroup = g.append('g')
          .attr('transform', `translate(${c * cellSize},${r * cellSize})`)
          .style('cursor', 'pointer');

        // Background rect
        cellGroup.append('rect')
          .attr('width', cellSize - 1.5)
          .attr('height', cellSize - 1.5)
          .attr('rx', 4)
          .attr('fill', r === c ? '#27272a' : colorScale(val))
          .attr('stroke', isSelected ? '#38bdf8' : (isExactHovered ? '#ffffff' : (isHovered ? '#52525b' : '#27272a')))
          .attr('stroke-width', isSelected ? 2 : (isExactHovered ? 1.5 : 0.75))
          .style('opacity', isHovered && !isExactHovered ? 0.75 : 1);

        // Numeric text label
        cellGroup.append('text')
          .attr('x', (cellSize - 1.5) / 2)
          .attr('y', (cellSize - 1.5) / 2 + 3.5)
          .attr('text-anchor', 'middle')
          .attr('font-size', cellSize < 38 ? '9px' : '10px')
          .attr('font-family', 'monospace')
          .attr('font-weight', r === c || Math.abs(val) > 0.6 ? 'bold' : 'normal')
          .attr('fill', () => {
            if (r === c) return '#a1a1aa';
            if (Math.abs(val) < 0.2) return '#71717a';
            return '#ffffff';
          })
          .text(r === c ? '1.0' : (val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2)));

        // Interactive Handlers
        cellGroup
          .on('mouseenter', () => {
            setHoveredCell({ row: r, col: c, t1, t2, corr: val });
          })
          .on('mouseleave', () => {
            setHoveredCell(null);
          })
          .on('click', () => {
            setSelectedPair({ t1, t2, corr: val });
          });
      }
    }

    // Top X Labels
    g.selectAll('.x-label')
      .data(tickers)
      .enter()
      .append('text')
      .attr('class', 'x-label')
      .attr('x', (d, i) => i * cellSize + cellSize / 2)
      .attr('y', -10)
      .attr('text-anchor', 'start')
      .attr('transform', (d, i) => `rotate(-45, ${i * cellSize + cellSize / 2}, -10)`)
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d, i) => hoveredCell && hoveredCell.col === i ? 'bold' : (d === data.primaryTicker ? 'bold' : 'normal'))
      .attr('fill', (d, i) => {
        if (d === data.primaryTicker) return '#34d399';
        if (hoveredCell && hoveredCell.col === i) return '#38bdf8';
        return '#a1a1aa';
      })
      .text(d => d);

    // Left Y Labels
    g.selectAll('.y-label')
      .data(tickers)
      .enter()
      .append('text')
      .attr('class', 'y-label')
      .attr('x', -10)
      .attr('y', (d, i) => i * cellSize + cellSize / 2 + 3.5)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', (d, i) => hoveredCell && hoveredCell.row === i ? 'bold' : (d === data.primaryTicker ? 'bold' : 'normal'))
      .attr('fill', (d, i) => {
        if (d === data.primaryTicker) return '#34d399';
        if (hoveredCell && hoveredCell.row === i) return '#38bdf8';
        return '#a1a1aa';
      })
      .text(d => d);

  }, [data, hoveredCell, selectedPair]);

  // 2. D3.js Rolling Correlation Timeline
  useEffect(() => {
    if (!data || !rollingSvgRef.current || !data.rollingTimeline || data.rollingTimeline.length === 0) return;

    const svg = d3.select(rollingSvgRef.current);
    svg.selectAll('*').remove();

    const timeline = data.rollingTimeline;
    const width = 560;
    const height = 140;
    const margin = { top: 15, right: 25, bottom: 25, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scalePoint()
      .domain(timeline.map(d => d.date))
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([-1.0, 1.0])
      .range([innerHeight, 0]);

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#3f3f46')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2');

    // SPY Correlation Line (Emerald)
    const lineSPY = d3.line<{ date: string; corrSPY: number }>()
      .x(d => xScale(d.date) || 0)
      .y(d => yScale(d.corrSPY))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(timeline)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('d', lineSPY);

    // QQQ Correlation Line (Indigo)
    const lineQQQ = d3.line<{ date: string; corrQQQ: number }>()
      .x(d => xScale(d.date) || 0)
      .y(d => yScale(d.corrQQQ))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(timeline)
      .attr('fill', 'none')
      .attr('stroke', '#818cf8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,2')
      .attr('d', lineQQQ);

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#71717a')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .tickValues(timeline.filter((_, i) => i % 4 === 0).map(d => d.date));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#71717a')
      .attr('font-size', '9px')
      .attr('font-family', 'monospace');

    g.selectAll('.domain').attr('stroke', '#3f3f46');
    g.selectAll('.tick line').attr('stroke', '#3f3f46');

  }, [data]);

  return (
    <div className="space-y-6">
      {/* 1. Control Header & Ticker Search Strip */}
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono flex items-center gap-1.5">
                <Network className="w-3 h-3 text-indigo-400" />
                QUANTITATIVE MULTI-ASSET CORRELATION ENGINE
              </span>
              <span className="text-xs text-zinc-500 font-mono">
                D3.js Matrix · Factor Beta · Sector Decoupling
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Compass className="w-6 h-6 text-indigo-400 shrink-0" />
              <span>Cross-Asset & Sector Correlation Matrix: {activeTicker}</span>
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Dynamically evaluates pairwise Pearson correlation coefficients between {activeTicker}, major market benchmarks (SPY, QQQ, IWM), sector ETFs (XLK, SMH, XLF, XLE), and macro hedges (TLT, GLD, VIX) to measure systematic factor sensitivity.
            </p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={tickerInput}
                onChange={(e) => setTickerInput(e.target.value)}
                placeholder="Analyze ticker (e.g. NVDA, TSLA, AAPL)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !tickerInput.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-950/40 disabled:opacity-50 shrink-0 font-mono"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              <span>Compute</span>
            </button>
          </form>
        </div>

        {/* Quick Tickers & Parameter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs font-mono">
          {/* Quick Assets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Anchor Asset:</span>
            {QUICK_TICKERS.map(t => (
              <button
                key={t}
                onClick={() => {
                  setTickerInput(t);
                  setActiveTicker(t);
                  if (onSelectTicker) onSelectTicker(t);
                }}
                className={`px-2 py-0.5 rounded text-[11px] border transition-all ${
                  activeTicker === t
                    ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Universe Filter & Lookback */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Universe Filter */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px]">
              {(['all', 'indices', 'sectors', 'macro'] as const).map(u => (
                <button
                  key={u}
                  onClick={() => setUniverse(u)}
                  className={`px-2 py-1 rounded font-bold capitalize transition-all ${
                    universe === u
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* Lookback Selector */}
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px]">
              {([30, 90, 180, 252] as const).map(lb => (
                <button
                  key={lb}
                  onClick={() => setLookback(lb)}
                  className={`px-2 py-1 rounded font-bold transition-all ${
                    lookback === lb
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {lb}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* 2. Top-Level Systematic Risk & Beta Scorecard */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Beta to S&P 500 (SPY)</span>
              <div className="text-xl font-black text-white font-mono">
                {data.insights.betaSPY.toFixed(2)}x
              </div>
              <span className="text-[10px] text-zinc-400 block font-mono">
                {data.insights.betaSPY > 1.2 ? 'High Market Sensitivity' : 'Moderate Market Beta'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Beta to Tech (QQQ)</span>
              <div className="text-xl font-black text-indigo-400 font-mono">
                {data.insights.betaQQQ.toFixed(2)}x
              </div>
              <span className="text-[10px] text-zinc-400 block font-mono">
                Nasdaq growth loading
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Top Driver Asset</span>
              <div className="text-lg font-black text-emerald-400 font-mono truncate">
                {data.topDriver?.ticker}: +{data.topDriver?.correlation.toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-400 block truncate">
                {data.topDriver?.name}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Best Downside Hedge</span>
              <div className="text-lg font-black text-rose-400 font-mono truncate">
                {data.topHedge?.ticker}: {data.topHedge?.correlation.toFixed(2)}
              </div>
              <span className="text-[10px] text-zinc-400 block truncate">
                {data.topHedge?.name}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Systematic Factor Exposure</span>
              <div className="text-base font-black text-amber-400 font-mono truncate">
                {data.insights.systematicFactorExposure}
              </div>
              <span className="text-[10px] text-zinc-400 block font-mono">
                Avg Corr: {data.insights.averageCorrelation.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Diversification Score</span>
              <div className="text-xl font-black text-teal-400 font-mono">
                {data.insights.diversificationScore.toFixed(0)}/100
              </div>
              <span className="text-[10px] text-zinc-400 block font-mono">
                Idiosyncratic buffer
              </span>
            </div>
          </div>

          {/* 3. D3.js Heatmap & Interactive Inspection Pane */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 8 Cols: D3 Heatmap Grid */}
            <div className="lg:col-span-8 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-400" />
                    <span>D3.js Dynamic Pairwise Heatmap Grid</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Hover over cells to highlight factor co-movement; click any coordinate to inspect pair mechanics.
                  </p>
                </div>

                {/* Color Legend Bar */}
                <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400">
                  <span className="text-rose-400">-1.0 (Hedge)</span>
                  <div className="w-24 h-2.5 rounded bg-gradient-to-r from-rose-600 via-zinc-900 to-emerald-500 border border-zinc-700" />
                  <span className="text-emerald-400">+1.0 (Coupled)</span>
                </div>
              </div>

              {/* D3 Heatmap Container */}
              <div className="relative bg-zinc-950 rounded-xl border border-zinc-800/80 p-3 overflow-x-auto flex justify-center">
                <svg ref={heatmapSvgRef} className="w-full max-w-[620px] h-auto select-none overflow-visible" />

                {/* Real-time Cell Hover Tooltip */}
                {hoveredCell && (
                  <div className="absolute bottom-3 left-3 bg-zinc-900/95 border border-zinc-700/80 rounded-lg p-2.5 text-[11px] font-mono shadow-2xl space-y-0.5 backdrop-blur-md">
                    <div className="text-zinc-400">Pair: <strong className="text-white">{hoveredCell.t1} ↔ {hoveredCell.t2}</strong></div>
                    <div className="text-zinc-400">Correlation: <strong className={hoveredCell.corr >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {hoveredCell.corr > 0 ? `+${hoveredCell.corr.toFixed(2)}` : hoveredCell.corr.toFixed(2)}
                    </strong></div>
                    <div className="text-[10px] text-zinc-500">
                      {hoveredCell.corr >= 0.7 ? 'Strong Direct Coupling' : (hoveredCell.corr <= -0.4 ? 'Inverse Shock Cushion' : 'Low / Diversified')}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
                <span>N = {data.tickers.length} Assets in Active Matrix</span>
                <span>Lookback: {data.lookbackDays} Trading Days</span>
                <span>PCA Factor Variance: {data.insights.pcaFirstComponentVariancePct}%</span>
              </div>
            </div>

            {/* Right 4 Cols: Selected Pair Inspector & Rolling Correlation */}
            <div className="lg:col-span-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-4 shadow-xl flex flex-col justify-between">
              
              {/* Selected Pair Deep-Dive */}
              {selectedPair ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                      Selected Pair Deep Dive
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                      selectedPair.corr >= 0.6 
                        ? 'bg-emerald-500/20 text-emerald-300' 
                        : (selectedPair.corr <= -0.2 ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-300')
                    }`}>
                      r = {selectedPair.corr > 0 ? `+${selectedPair.corr.toFixed(2)}` : selectedPair.corr.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <h4 className="text-base font-bold text-white flex items-center gap-1.5 font-mono">
                          <span>{selectedPair.t1}</span>
                          <span className="text-zinc-600">↔</span>
                          <span>{selectedPair.t2}</span>
                        </h4>
                        <span className="text-[10px] text-zinc-400 block">
                          Pairwise Co-Movement Relationship
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                      {selectedPair.corr >= 0.75 
                        ? `Extremely high factor alignment. ${selectedPair.t1} and ${selectedPair.t2} share primary institutional liquidity channels. Low diversification if held together.`
                        : (selectedPair.corr >= 0.35 
                            ? `Moderate positive correlation. ${selectedPair.t1} follows broader sector direction while maintaining distinct firm-level alpha.`
                            : (selectedPair.corr <= -0.2 
                                ? `Counter-cyclical inverse relationship. ${selectedPair.t2} serves as a systematic hedge against adverse liquidity shocks in ${selectedPair.t1}.`
                                : `Decoupled / Uncorrelated. Excellent diversification pair with near-zero mutual factor drag.`))}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-mono py-8 text-center">
                  Click any cell in the heatmap to inspect pair dynamics.
                </div>
              )}

              {/* Rolling 30D Correlation Trendline */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    Rolling 30D Correlation Trend
                  </span>
                  <div className="flex items-center gap-2 font-mono text-[10px]">
                    <span className="text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
                      SPY
                    </span>
                    <span className="text-indigo-400 flex items-center gap-1">
                      <span className="w-2 h-0.5 bg-indigo-400 inline-block" />
                      QQQ
                    </span>
                  </div>
                </div>

                <div className="bg-zinc-950 rounded-xl p-2.5 border border-zinc-800/80">
                  <svg ref={rollingSvgRef} className="w-full h-auto select-none overflow-visible" />
                </div>
                <span className="text-[10px] text-zinc-500 font-mono block text-center">
                  Tracks whether {activeTicker} is coupling or decoupling from market indices
                </span>
              </div>

            </div>
          </div>

          {/* 4. Ranked Cross-Asset Correlations Breakdown */}
          <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Ranked Cross-Asset Correlations & Hedge Decomposition ({activeTicker})
                </h3>
              </div>
              <span className="text-xs text-zinc-500 font-mono">
                Sorted by Co-Movement Strength
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.primaryCorrelations.map(item => (
                <div
                  key={item.ticker}
                  onClick={() => setSelectedPair({ t1: activeTicker, t2: item.ticker, corr: item.correlation })}
                  className={`p-3.5 rounded-xl bg-zinc-950/80 border transition-all cursor-pointer space-y-2 ${
                    selectedPair && selectedPair.t2 === item.ticker
                      ? 'border-indigo-500/60 shadow-lg shadow-indigo-950/30'
                      : 'border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-white text-sm">{item.ticker}</span>
                        <span className="text-[10px] font-mono text-zinc-500">({item.category})</span>
                      </div>
                      <span className="text-[11px] text-zinc-400 truncate max-w-[170px] block">{item.name}</span>
                    </div>

                    <div className="text-right font-mono">
                      <span className={`text-base font-black ${
                        item.correlation >= 0.5 ? 'text-emerald-400' : (item.correlation <= -0.15 ? 'text-rose-400' : 'text-zinc-300')
                      }`}>
                        {item.correlation > 0 ? `+${item.correlation.toFixed(2)}` : item.correlation.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Correlation Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full ${
                        item.correlation >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.abs(item.correlation) * 100)}%`,
                        marginLeft: item.correlation < 0 ? '0%' : 'auto'
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-snug">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
