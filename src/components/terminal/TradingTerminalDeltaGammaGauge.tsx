import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  Gauge, 
  TrendingUp, 
  TrendingDown, 
  RotateCw, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  Activity, 
  Sliders, 
  Info, 
  Compass, 
  ArrowRight, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw,
  ExternalLink,
  Target
} from 'lucide-react';
import { 
  fetchDeltaGammaSensitivity, 
  DeltaGammaSensitivityResult, 
  SensitivityCurvePoint 
} from '../../services/api/quantPortfolioService';
import { ActiveTrade } from '../../services/QuantTraderBrain';

interface TradingTerminalDeltaGammaGaugeProps {
  selectedTicker: string;
  currentPrice: number;
  activeTrades?: ActiveTrade[];
  onNavigateToBrain?: () => void;
}

export type PositionStructurePreset = 
  | 'active_trade'
  | 'delta_hedged_straddle'
  | 'covered_call'
  | 'protective_collar'
  | 'long_equity'
  | 'short_equity';

export const TradingTerminalDeltaGammaGauge: React.FC<TradingTerminalDeltaGammaGaugeProps> = ({
  selectedTicker,
  currentPrice,
  activeTrades = [],
  onNavigateToBrain
}) => {
  // Find if an active trade exists for selectedTicker
  const activePosition = useMemo(() => {
    return activeTrades.find(t => t.ticker.toUpperCase() === selectedTicker.toUpperCase());
  }, [activeTrades, selectedTicker]);

  // Position Structure State
  const [positionType, setPositionType] = useState<PositionStructurePreset>(() => {
    return activePosition ? 'active_trade' : 'delta_hedged_straddle';
  });
  const [quantity, setQuantity] = useState<number>(() => {
    return activePosition ? activePosition.quantity : 100;
  });
  const [targetDelta, setTargetDelta] = useState<number>(0.0);
  const [toleranceBand, setToleranceBand] = useState<number>(5.0);

  // Live Shocks
  const [priceShockPct, setPriceShockPct] = useState<number>(0.0);
  const [volShockPct, setVolShockPct] = useState<number>(0.0);
  const [baseIv, setBaseIv] = useState<number>(0.32);
  const [daysToExpiry, setDaysToExpiry] = useState<number>(30);

  // Result state
  const [data, setData] = useState<DeltaGammaSensitivityResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Hover states for D3 charts
  const [hoveredCurvePoint, setHoveredCurvePoint] = useState<SensitivityCurvePoint | null>(null);

  // SVG Refs
  const deltaGaugeSvgRef = useRef<SVGSVGElement | null>(null);
  const gammaGaugeSvgRef = useRef<SVGSVGElement | null>(null);
  const rehedgeChartSvgRef = useRef<SVGSVGElement | null>(null);
  const pnlCurveSvgRef = useRef<SVGSVGElement | null>(null);

  // Sync with activePosition when ticker changes
  useEffect(() => {
    if (activePosition) {
      setPositionType('active_trade');
      setQuantity(activePosition.quantity);
    } else {
      setPositionType('delta_hedged_straddle');
      setQuantity(100);
    }
    setPriceShockPct(0);
    setVolShockPct(0);
  }, [selectedTicker, activePosition]);

  // Determine effective backend position type
  const effectiveBackendPosType = useMemo(() => {
    if (positionType === 'active_trade') {
      if (activePosition) {
        return activePosition.tradeType === 'LONG' ? 'long_equity' : 'short_equity';
      }
      return 'long_equity';
    }
    return positionType;
  }, [positionType, activePosition]);

  // Load Quantitative Backend Calculation
  const loadSensitivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDeltaGammaSensitivity({
        ticker: selectedTicker,
        spot: currentPrice > 0 ? currentPrice : 140.0,
        positionType: effectiveBackendPosType,
        qty: quantity,
        targetDelta,
        priceShock: priceShockPct,
        volShock: volShockPct,
        iv: baseIv,
        dte: daysToExpiry,
        tolerance: toleranceBand
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to fetch delta-gamma sensitivity:', err);
      setError(`Quant backend sensitivity offline: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  }, [
    selectedTicker, 
    currentPrice, 
    effectiveBackendPosType, 
    quantity, 
    targetDelta, 
    priceShockPct, 
    volShockPct, 
    baseIv, 
    daysToExpiry, 
    toleranceBand
  ]);

  // Trigger sensitivity load on parameter adjustments
  useEffect(() => {
    loadSensitivity();
  }, [loadSensitivity]);

  // ---------------------------------------------------------------------------
  // D3 Gauge 1: Delta Directional Sensitivity Radial Arc Gauge
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!deltaGaugeSvgRef.current) return;
    const svg = d3.select(deltaGaugeSvgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 180;
    const radius = 120;
    const cx = width / 2;
    const cy = height - 20;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${cx}, ${cy})`);

    const minDelta = -150;
    const maxDelta = 150;
    const startAngle = -Math.PI * 0.65;
    const endAngle = Math.PI * 0.65;

    const angleScale = d3.scaleLinear()
      .domain([minDelta, maxDelta])
      .range([startAngle, endAngle])
      .clamp(true);

    // Colored Arc Bands
    const arcGenerator = d3.arc()
      .innerRadius(radius - 22)
      .outerRadius(radius)
      .cornerRadius(2);

    const zones = [
      { from: -150, to: -60, color: '#e11d48', label: 'Heavy Short' },
      { from: -60, to: -15, color: '#f59e0b', label: 'Bearish' },
      { from: -15, to: 15, color: '#10b981', label: 'Neutral' },
      { from: 15, to: 60, color: '#06b6d4', label: 'Bullish' },
      { from: 60, to: 150, color: '#10b981', label: 'Heavy Long' }
    ];

    zones.forEach(zone => {
      g.append('path')
        .datum({
          startAngle: angleScale(zone.from),
          endAngle: angleScale(zone.to)
        } as any)
        .attr('d', arcGenerator as any)
        .attr('fill', zone.color)
        .attr('opacity', 0.85);
    });

    // Tolerance Band indicator
    const tolBandArc = d3.arc()
      .innerRadius(radius - 26)
      .outerRadius(radius - 22)
      .cornerRadius(1);

    g.append('path')
      .datum({
        startAngle: angleScale(-toleranceBand),
        endAngle: angleScale(toleranceBand)
      } as any)
      .attr('d', tolBandArc as any)
      .attr('fill', '#ffffff')
      .attr('opacity', 0.9);

    // Ticks & Labels
    const tickValues = [-150, -100, -50, 0, 50, 100, 150];
    tickValues.forEach(val => {
      const angle = angleScale(val) - Math.PI / 2;
      const x1 = Math.cos(angle) * (radius - 24);
      const y1 = Math.sin(angle) * (radius - 24);
      const x2 = Math.cos(angle) * (radius - 30);
      const y2 = Math.sin(angle) * (radius - 30);

      g.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', val === 0 ? '#ffffff' : '#71717a')
        .attr('stroke-width', val === 0 ? 2 : 1);

      const tx = Math.cos(angle) * (radius - 42);
      const ty = Math.sin(angle) * (radius - 42);

      g.append('text')
        .attr('x', tx)
        .attr('y', ty)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', val === 0 ? '#ffffff' : '#a1a1aa')
        .attr('font-weight', val === 0 ? 'bold' : 'normal')
        .text(val > 0 ? `+${val}` : `${val}`);
    });

    const activeDeltaVal = data?.shockedGreeks.shockedDelta ?? (quantity * (positionType === 'short_equity' ? -1 : 1));
    const needleAngle = angleScale(activeDeltaVal) - Math.PI / 2;
    const needleLength = radius - 30;
    const nx = Math.cos(needleAngle) * needleLength;
    const ny = Math.sin(needleAngle) * needleLength;

    // Needle path (triangle)
    const perpAngle = needleAngle + Math.PI / 2;
    const baseW = 5;
    const bx1 = Math.cos(perpAngle) * baseW;
    const by1 = Math.sin(perpAngle) * baseW;
    const bx2 = Math.cos(perpAngle + Math.PI) * baseW;
    const by2 = Math.sin(perpAngle + Math.PI) * baseW;

    g.append('polygon')
      .attr('points', `${nx},${ny} ${bx1},${by1} ${bx2},${by2}`)
      .attr('fill', Math.abs(activeDeltaVal) <= toleranceBand ? '#10b981' : (activeDeltaVal > 0 ? '#06b6d4' : '#e11d48'))
      .attr('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))');

    // Pivot Circle
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', '#27272a')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 3)
      .attr('fill', '#ffffff');
  }, [data, toleranceBand, quantity, positionType]);

  // ---------------------------------------------------------------------------
  // D3 Gauge 2: Gamma Acceleration Risk Gauge
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!gammaGaugeSvgRef.current) return;
    const svg = d3.select(gammaGaugeSvgRef.current);
    svg.selectAll('*').remove();

    const width = 280;
    const height = 180;
    const radius = 120;
    const cx = width / 2;
    const cy = height - 20;

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${cx}, ${cy})`);

    const startAngle = -Math.PI * 0.65;
    const endAngle = Math.PI * 0.65;

    const angleScale = d3.scaleLinear()
      .domain([0, 100])
      .range([startAngle, endAngle])
      .clamp(true);

    const arcGenerator = d3.arc()
      .innerRadius(radius - 22)
      .outerRadius(radius)
      .cornerRadius(2);

    const zones = [
      { from: 0, to: 25, color: '#10b981', label: 'Linear / Low' },
      { from: 25, to: 50, color: '#f59e0b', label: 'Moderate' },
      { from: 50, to: 75, color: '#f97316', label: 'High' },
      { from: 75, to: 100, color: '#e11d48', label: 'Critical' }
    ];

    zones.forEach(zone => {
      g.append('path')
        .datum({
          startAngle: angleScale(zone.from),
          endAngle: angleScale(zone.to)
        } as any)
        .attr('d', arcGenerator as any)
        .attr('fill', zone.color)
        .attr('opacity', 0.85);
    });

    // Ticks & Labels
    const tickValues = [0, 25, 50, 75, 100];
    tickValues.forEach(val => {
      const angle = angleScale(val) - Math.PI / 2;
      const x1 = Math.cos(angle) * (radius - 24);
      const y1 = Math.sin(angle) * (radius - 24);
      const x2 = Math.cos(angle) * (radius - 30);
      const y2 = Math.sin(angle) * (radius - 30);

      g.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#71717a')
        .attr('stroke-width', 1.5);

      const tx = Math.cos(angle) * (radius - 42);
      const ty = Math.sin(angle) * (radius - 42);

      g.append('text')
        .attr('x', tx)
        .attr('y', ty)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#a1a1aa')
        .text(`${val}`);
    });

    const gammaScoreVal = data?.gammaRisk.score ?? 15.0;
    const needleAngle = angleScale(gammaScoreVal) - Math.PI / 2;
    const needleLength = radius - 30;
    const nx = Math.cos(needleAngle) * needleLength;
    const ny = Math.sin(needleAngle) * needleLength;

    const perpAngle = needleAngle + Math.PI / 2;
    const baseW = 5;
    const bx1 = Math.cos(perpAngle) * baseW;
    const by1 = Math.sin(perpAngle) * baseW;
    const bx2 = Math.cos(perpAngle + Math.PI) * baseW;
    const by2 = Math.sin(perpAngle + Math.PI) * baseW;

    g.append('polygon')
      .attr('points', `${nx},${ny} ${bx1},${by1} ${bx2},${by2}`)
      .attr('fill', gammaScoreVal > 75 ? '#e11d48' : (gammaScoreVal > 45 ? '#f97316' : '#10b981'))
      .attr('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.8))');

    // Pivot Circle
    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 8)
      .attr('fill', '#27272a')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    g.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 3)
      .attr('fill', '#ffffff');
  }, [data]);

  // ---------------------------------------------------------------------------
  // D3 Chart 1: Dynamic Re-Hedging Curve Across Price Shocks
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!rehedgeChartSvgRef.current || !data?.sensitivityCurve) return;
    const svg = d3.select(rehedgeChartSvgRef.current);
    svg.selectAll('*').remove();

    const container = rehedgeChartSvgRef.current.parentElement;
    const width = container ? container.clientWidth : 580;
    const height = 220;
    const margin = { top: 20, right: 30, bottom: 35, left: 55 };

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const curve = data.sensitivityCurve;

    const xScale = d3.scaleLinear()
      .domain([-15, 15])
      .range([0, innerW]);

    const yExtent = d3.extent(curve, d => d.rehedgeShares) as [number, number];
    const yMax = Math.max(Math.abs(yExtent[0] || 0), Math.abs(yExtent[1] || 0), 20);
    const yScale = d3.scaleLinear()
      .domain([-yMax * 1.15, yMax * 1.15])
      .range([innerH, 0]);

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', yScale(0))
      .attr('x2', innerW)
      .attr('y2', yScale(0))
      .attr('stroke', '#52525b')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    // Tolerance band zone (where -tol <= rehedge <= tol)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(toleranceBand))
      .attr('width', innerW)
      .attr('height', Math.abs(yScale(-toleranceBand) - yScale(toleranceBand)))
      .attr('fill', '#10b981')
      .attr('opacity', 0.08);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.15)
      .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerW).tickFormat(() => ''));

    // X Axis
    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(xScale).ticks(7).tickFormat(d => `${d}%`))
      .call(axis => axis.select('.domain').attr('stroke', '#3f3f46'))
      .call(axis => axis.selectAll('.tick text').attr('fill', '#a1a1aa').attr('font-size', '10px').attr('font-family', 'monospace'));

    // Y Axis
    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `${Number(d) > 0 ? '+' : ''}${d}`))
      .call(axis => axis.select('.domain').attr('stroke', '#3f3f46'))
      .call(axis => axis.selectAll('.tick text').attr('fill', '#a1a1aa').attr('font-size', '10px').attr('font-family', 'monospace'));

    // Axis Labels
    g.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 30)
      .attr('fill', '#71717a')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text('Underlying Price Shock (%)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -40)
      .attr('fill', '#71717a')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .text('Required Rebalance (Shares)');

    // Line Generator
    const lineGen = d3.line<SensitivityCurvePoint>()
      .x(d => xScale(d.priceShockPct))
      .y(d => yScale(d.rehedgeShares))
      .curve(d3.curveMonotoneX);

    // Gradient for line
    const gradId = 'rehedge-curve-grad';
    const defs = svg.append('defs');
    const grad = defs.append('linearGradient')
      .attr('id', gradId)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', 0)
      .attr('x2', innerW).attr('y2', 0);

    grad.append('stop').attr('offset', '0%').attr('stop-color', '#e11d48');
    grad.append('stop').attr('offset', '50%').attr('stop-color', '#10b981');
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4');

    g.append('path')
      .datum(curve)
      .attr('d', lineGen)
      .attr('fill', 'none')
      .attr('stroke', `url(#${gradId})`)
      .attr('stroke-width', 2.5);

    // Current Shock Point on Curve
    const currentPoint = curve.find(p => p.priceShockPct === Math.round(priceShockPct)) || curve[15];
    if (currentPoint) {
      const cxPoint = xScale(currentPoint.priceShockPct);
      const cyPoint = yScale(currentPoint.rehedgeShares);

      // Pulse circle
      g.append('circle')
        .attr('cx', cxPoint)
        .attr('cy', cyPoint)
        .attr('r', 8)
        .attr('fill', '#10b981')
        .attr('opacity', 0.25)
        .attr('class', 'animate-ping');

      g.append('circle')
        .attr('cx', cxPoint)
        .attr('cy', cyPoint)
        .attr('r', 5)
        .attr('fill', '#ffffff')
        .attr('stroke', '#10b981')
        .attr('stroke-width', 2.5);

      // Annotation tag
      g.append('rect')
        .attr('x', cxPoint > innerW - 90 ? cxPoint - 90 : cxPoint + 8)
        .attr('y', cyPoint - 22)
        .attr('width', 82)
        .attr('height', 18)
        .attr('rx', 4)
        .attr('fill', '#18181b')
        .attr('stroke', '#3f3f46');

      g.append('text')
        .attr('x', (cxPoint > innerW - 90 ? cxPoint - 90 : cxPoint + 8) + 41)
        .attr('y', cyPoint - 10)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#f4f4f5')
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .text(`${currentPoint.rehedgeShares > 0 ? '+' : ''}${currentPoint.rehedgeShares} shs`);
    }
  }, [data, priceShockPct, toleranceBand]);

  // ---------------------------------------------------------------------------
  // D3 Chart 2: Non-Linear PnL Profile (Linear Delta vs. Delta + Gamma Convexity)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!pnlCurveSvgRef.current || !data?.sensitivityCurve) return;
    const svg = d3.select(pnlCurveSvgRef.current);
    svg.selectAll('*').remove();

    const container = pnlCurveSvgRef.current.parentElement;
    const width = container ? container.clientWidth : 580;
    const height = 220;
    const margin = { top: 20, right: 30, bottom: 35, left: 60 };

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const curve = data.sensitivityCurve;

    const xScale = d3.scaleLinear()
      .domain([-15, 15])
      .range([0, innerW]);

    const allPnls = curve.flatMap(d => [d.linearPnl, d.convexPnl, d.exactPnl]);
    const pnlMax = Math.max(...allPnls.map(Math.abs), 50);
    const yScale = d3.scaleLinear()
      .domain([-pnlMax * 1.15, pnlMax * 1.15])
      .range([innerH, 0]);

    // Zero lines
    g.append('line')
      .attr('x1', 0).attr('y1', yScale(0))
      .attr('x2', innerW).attr('y2', yScale(0))
      .attr('stroke', '#52525b').attr('stroke-dasharray', '3 3');

    // Axes
    g.append('g')
      .attr('transform', `translate(0, ${innerH})`)
      .call(d3.axisBottom(xScale).ticks(7).tickFormat(d => `${d}%`))
      .call(axis => axis.select('.domain').attr('stroke', '#3f3f46'))
      .call(axis => axis.selectAll('.tick text').attr('fill', '#a1a1aa').attr('font-size', '10px').attr('font-family', 'monospace'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(5).tickFormat(d => `$${d}`))
      .call(axis => axis.select('.domain').attr('stroke', '#3f3f46'))
      .call(axis => axis.selectAll('.tick text').attr('fill', '#a1a1aa').attr('font-size', '10px').attr('font-family', 'monospace'));

    // Convexity Gap Area between Linear and Convex PnL
    const areaGen = d3.area<SensitivityCurvePoint>()
      .x(d => xScale(d.priceShockPct))
      .y0(d => yScale(d.linearPnl))
      .y1(d => yScale(d.exactPnl))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(curve)
      .attr('d', areaGen)
      .attr('fill', data.baseGreeks.netGamma >= 0 ? '#10b981' : '#e11d48')
      .attr('opacity', 0.18);

    // Linear Delta PnL Line (Dashed)
    const linearLineGen = d3.line<SensitivityCurvePoint>()
      .x(d => xScale(d.priceShockPct))
      .y(d => yScale(d.linearPnl))
      .curve(d3.curveLinear);

    g.append('path')
      .datum(curve)
      .attr('d', linearLineGen)
      .attr('fill', 'none')
      .attr('stroke', '#71717a')
      .attr('stroke-dasharray', '4 4')
      .attr('stroke-width', 1.5);

    // Actual / Convex PnL Line (Solid Bright)
    const exactLineGen = d3.line<SensitivityCurvePoint>()
      .x(d => xScale(d.priceShockPct))
      .y(d => yScale(d.exactPnl))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(curve)
      .attr('d', exactLineGen)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5);

    // Active marker
    const currentPoint = curve.find(p => p.priceShockPct === Math.round(priceShockPct)) || curve[15];
    if (currentPoint) {
      const cxPoint = xScale(currentPoint.priceShockPct);
      const cyPoint = yScale(currentPoint.exactPnl);

      g.append('circle')
        .attr('cx', cxPoint)
        .attr('cy', cyPoint)
        .attr('r', 5)
        .attr('fill', '#ffffff')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 2);
    }
  }, [data, priceShockPct]);

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header Banner & Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Real-Time Sensitivity Gauge
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Selected Asset: <strong className="text-white">{selectedTicker}</strong> (${currentPrice.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            {activePosition ? (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active Open Position: {activePosition.tradeType} {activePosition.quantity} shs @ ${activePosition.entryPrice.toFixed(2)}
              </span>
            ) : (
              <span className="text-xs font-mono text-zinc-400">
                Synthetic / Simulated Structure
              </span>
            )}
          </div>
          <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            Delta-Gamma Risk Sensitivity & Dynamic Hedging Gauge
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Simulates non-linear curvature (Gamma Γ) and volatility sensitivity (Vanna) across real-time price and volatility shifts. Calculates exact share rebalancing needed to maintain delta-neutral compliance under John C. Hull derivatives hedging frameworks.
          </p>
        </div>

        {/* Quick Refresh & Telemetry Info */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setPriceShockPct(0);
              setVolShockPct(0);
            }}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
            title="Reset Shocks to Spot Zero"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset Shocks</span>
          </button>
          {onNavigateToBrain && (
            <button
              onClick={onNavigateToBrain}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Brain Ledgers &rarr;</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Position Structure Preset Selector & Parameters */}
      <div className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
          <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Position Hedging Structure:
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'active_trade', label: activePosition ? `Active ${activePosition.tradeType} Trade` : 'Active Trade (Spot)', disabled: !activePosition },
              { id: 'delta_hedged_straddle', label: 'Delta-Hedged Straddle (Long Γ)', disabled: false },
              { id: 'covered_call', label: 'Covered Call (Short Γ)', disabled: false },
              { id: 'protective_collar', label: 'Protective Collar', disabled: false },
              { id: 'long_equity', label: 'Pure Long Spot', disabled: false }
            ].map(preset => (
              <button
                key={preset.id}
                onClick={() => setPositionType(preset.id as any)}
                disabled={preset.disabled}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  positionType === preset.id
                    ? 'bg-amber-600 text-white shadow-sm shadow-amber-950/40'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Position Size, Target Delta, & Tolerance Band Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-zinc-800/60 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Position Size (Shares/Base)</span>
              <span className="text-white font-bold">{quantity} units</span>
            </div>
            <input 
              type="range" 
              min={20} 
              max={1000} 
              step={20}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Target Hedged Delta (Δ_target)</span>
              <span className="text-white font-bold">{targetDelta > 0 ? `+${targetDelta}` : targetDelta}</span>
            </div>
            <input 
              type="range" 
              min={-50} 
              max={50} 
              step={5}
              value={targetDelta}
              onChange={(e) => setTargetDelta(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
            <div className="flex items-center justify-between text-zinc-400">
              <span>Hedging Tolerance Corridor (±τ)</span>
              <span className="text-emerald-400 font-bold">±{toleranceBand} Δ</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              {[2.5, 5.0, 10.0, 15.0].map(tol => (
                <button
                  key={tol}
                  onClick={() => setToleranceBand(tol)}
                  className={`flex-1 py-1 rounded text-[10px] font-bold ${
                    toleranceBand === tol ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  ±{tol}Δ
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Real-Time Interactive Shock Deck (Price Shift & Volatility Shift) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Price Shock Slider */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Underlying Price Shift (ΔS)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Shocked Price:</span>
              <span className="text-sm font-black text-white">
                ${data ? data.shocks.shockedPrice.toFixed(2) : (currentPrice * (1 + priceShockPct / 100)).toFixed(2)}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-black ${
                priceShockPct > 0 ? 'bg-emerald-500/20 text-emerald-300' : (priceShockPct < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-400')
              }`}>
                {priceShockPct > 0 ? `+${priceShockPct}%` : `${priceShockPct}%`}
              </span>
            </div>
          </div>

          <input 
            type="range"
            min={-20}
            max={20}
            step={0.5}
            value={priceShockPct}
            onChange={(e) => setPriceShockPct(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-1">
            {[-10, -5, -2, 0, 2, 5, 10].map(pct => (
              <button
                key={pct}
                onClick={() => setPriceShockPct(pct)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                  priceShockPct === pct
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {pct > 0 ? `+${pct}%` : `${pct}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Volatility Shock Slider */}
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-zinc-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              Implied Volatility Shift (Δσ)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Shocked IV:</span>
              <span className="text-sm font-black text-purple-300">
                {data ? (data.shocks.shockedIv * 100).toFixed(1) : ((baseIv + volShockPct / 100) * 100).toFixed(1)}%
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-black ${
                volShockPct > 0 ? 'bg-purple-500/20 text-purple-300' : (volShockPct < 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-400')
              }`}>
                {volShockPct > 0 ? `+${volShockPct}%` : `${volShockPct}%`}
              </span>
            </div>
          </div>

          <input 
            type="range"
            min={-20}
            max={30}
            step={1}
            value={volShockPct}
            onChange={(e) => setVolShockPct(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-1">
            {[
              { label: '-10% Crush', val: -10 },
              { label: 'Baseline', val: 0 },
              { label: '+10% Surge', val: 10 },
              { label: '+25% Spike', val: 25 }
            ].map(item => (
              <button
                key={item.val}
                onClick={() => setVolShockPct(item.val)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                  volShockPct === item.val
                    ? 'bg-purple-600 text-white'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Hedging Action Recommendation Banner */}
      {data && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-lg transition-all ${
          !data.hedgingRequirement.isOutsideTolerance
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : data.hedgingRequirement.status === 'REHEDGE_BUY'
              ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg shrink-0 ${
              !data.hedgingRequirement.isOutsideTolerance ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {!data.hedgingRequirement.isOutsideTolerance ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-2">
                <span>HEDGING ACTION DIRECTIVE</span>
                <span>·</span>
                <span className={`px-1.5 py-0.2 rounded font-black ${
                  data.hedgingRequirement.urgency === 'HIGH' ? 'bg-rose-500/30 text-rose-300' : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {data.hedgingRequirement.urgency} URGENCY
                </span>
              </div>
              <div className="text-sm font-black text-white mt-0.5">
                {data.hedgingRequirement.action}
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                Post-shock Delta: <span className="text-white font-bold">{data.shockedGreeks.shockedDelta > 0 ? `+${data.shockedGreeks.shockedDelta}` : data.shockedGreeks.shockedDelta}</span> · Drift: <span className={Math.abs(data.shockedGreeks.deltaDrift) > toleranceBand ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>{data.shockedGreeks.deltaDrift > 0 ? `+${data.shockedGreeks.deltaDrift}` : data.shockedGreeks.deltaDrift}Δ</span> (Corridor: ±{toleranceBand}Δ)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-right shrink-0">
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Rebalance Notional</span>
              <span className="text-sm font-black text-white">
                ${data.hedgingRequirement.rebalanceNotional.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block uppercase">Taylor PnL Impact</span>
              <span className={`text-sm font-black ${
                data.pnlDecomposition.totalTaylorPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {data.pnlDecomposition.totalTaylorPnl >= 0 ? '+' : ''}${data.pnlDecomposition.totalTaylorPnl.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Dual D3 Radial Arc Gauges (Delta & Gamma) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gauge 1: Delta Sensitivity Gauge */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-between shadow-xl space-y-2">
          <div className="w-full flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Delta Directional Exposure (Δ)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
              Corridor ±{toleranceBand}Δ
            </span>
          </div>

          {/* D3 SVG Container */}
          <div className="w-full flex justify-center py-2">
            <svg ref={deltaGaugeSvgRef} className="w-full max-w-[280px] h-[180px]" />
          </div>

          {/* Metrics Readout */}
          <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center font-mono">
            <div className="p-2 rounded-lg bg-zinc-900">
              <span className="text-[9px] uppercase text-zinc-500 block">Base Delta (Δ_0)</span>
              <span className="text-xs font-bold text-zinc-300">
                {data ? `${data.baseGreeks.netDelta > 0 ? '+' : ''}${data.baseGreeks.netDelta}` : '--'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900 border border-blue-500/30">
              <span className="text-[9px] uppercase text-zinc-400 block font-bold">Shocked (Δ_shock)</span>
              <span className={`text-sm font-black ${
                (data?.shockedGreeks.shockedDelta ?? 0) > 0 ? 'text-cyan-400' : 'text-rose-400'
              }`}>
                {data ? `${data.shockedGreeks.shockedDelta > 0 ? '+' : ''}${data.shockedGreeks.shockedDelta}` : '--'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900">
              <span className="text-[9px] uppercase text-zinc-500 block">Dollar Delta ($Δ)</span>
              <span className="text-xs font-bold text-white">
                ${data ? Math.abs(data.baseGreeks.dollarDelta).toLocaleString() : '--'}
              </span>
            </div>
          </div>
        </div>

        {/* Gauge 2: Gamma Acceleration Risk Gauge */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col items-center justify-between shadow-xl space-y-2">
          <div className="w-full flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Gamma Acceleration Threat (Γ)
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              {data ? data.gammaRisk.regime.split('(')[0] : 'Normal'}
            </span>
          </div>

          {/* D3 SVG Container */}
          <div className="w-full flex justify-center py-2">
            <svg ref={gammaGaugeSvgRef} className="w-full max-w-[280px] h-[180px]" />
          </div>

          {/* Metrics Readout */}
          <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-zinc-800/80 text-center font-mono">
            <div className="p-2 rounded-lg bg-zinc-900">
              <span className="text-[9px] uppercase text-zinc-500 block">Net Gamma (Γ_net)</span>
              <span className="text-xs font-bold text-zinc-300">
                {data ? `${data.baseGreeks.netGamma}/$1` : '--'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900 border border-amber-500/30">
              <span className="text-[9px] uppercase text-zinc-400 block font-bold">Risk Score</span>
              <span className="text-sm font-black text-amber-400">
                {data ? `${data.gammaRisk.score}/100` : '--'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-zinc-900">
              <span className="text-[9px] uppercase text-zinc-500 block">Dollar Gamma (1%)</span>
              <span className="text-xs font-bold text-white">
                ${data ? data.baseGreeks.dollarGamma1Pct.toFixed(2) : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. D3 Visual Curves: Re-Hedging Curve & Convexity PnL Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Dynamic Re-Hedging Curve Across Price Shocks */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                Dynamic Re-Hedging Schedule Curve
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Shows exact share adjustments needed as underlying price swings from -15% to +15%
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Band Corridor: ±{toleranceBand}Δ
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg ref={rehedgeChartSvgRef} className="w-full h-[220px]" />
          </div>
        </div>

        {/* Chart B: Non-Linear PnL Profile with Convexity Alpha */}
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                Convexity Profile (Linear Δ vs. Actual Δ+Γ PnL)
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Shaded band highlights the 0.5 × Γ × (ΔS)² convexity benefit or drag
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-zinc-500 flex items-center gap-1">
                <span className="w-3 h-0.5 bg-zinc-500 border-dashed" /> Linear Δ
              </span>
              <span className="text-sky-400 flex items-center gap-1">
                <span className="w-3 h-1 bg-sky-400" /> Actual PnL
              </span>
            </div>
          </div>

          <div className="w-full overflow-hidden">
            <svg ref={pnlCurveSvgRef} className="w-full h-[220px]" />
          </div>
        </div>
      </div>

      {/* 7. 2D Stress-Test Sensitivity Matrix */}
      {data?.stressMatrix && (
        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              2D Multi-Scenario Stress Test Matrix: Price Shocks (×) Volatility Regimes
            </h3>
            <span className="text-[10px] font-mono text-zinc-500">
              Evaluates Delta, Rebalance Shares, and Net PnL
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
                  <th className="py-2 px-3">Price Move</th>
                  <th className="py-2 px-3">Shock Price</th>
                  <th className="py-2 px-3 text-center bg-zinc-900/40">Vol Crush (-10%)</th>
                  <th className="py-2 px-3 text-center bg-zinc-900/80">Baseline IV (0%)</th>
                  <th className="py-2 px-3 text-center bg-zinc-900/40">Vol Surge (+15%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {data.stressMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white">
                      {row.priceShockPct > 0 ? `+${row.priceShockPct}%` : `${row.priceShockPct}%`}
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">
                      ${row.shockedPrice.toFixed(2)}
                    </td>
                    {row.cells.map((c, cIdx) => (
                      <td key={cIdx} className="py-2.5 px-3 text-center">
                        <div className="space-y-0.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-white font-bold">{c.delta > 0 ? `+${c.delta}` : c.delta}Δ</span>
                            {c.breach && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold">
                                BREACH
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            Hedge: <span className={c.rehedgeShares !== 0 ? 'text-amber-400 font-bold' : 'text-zinc-500'}>
                              {c.rehedgeShares > 0 ? `Buy ${c.rehedgeShares}` : (c.rehedgeShares < 0 ? `Sell ${Math.abs(c.rehedgeShares)}` : '0')} shs
                            </span>
                          </div>
                          <div className={`text-[10px] font-bold ${c.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {c.pnl >= 0 ? '+' : ''}${c.pnl.toFixed(2)}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 8. Mathematical Framework Reference (John C. Hull & Taylor Expansion) */}
      <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 font-mono space-y-2">
        <div className="flex items-center gap-2 text-zinc-300 font-bold uppercase tracking-wider text-[11px]">
          <Info className="w-3.5 h-3.5 text-indigo-400" />
          <span>Derivatives Risk Sensitivity & Dynamic Delta-Hedging Formulation</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          1. <strong>Taylor Expansion Formulation</strong>: The change in position value under simultaneous price and volatility shocks is approximated by <code className="text-zinc-200">ΔV ≈ Δ·ΔS + ½·Γ·(ΔS)² + Vega·Δσ + Vanna·ΔS·Δσ</code>.
        </p>
        <p className="text-[11px] leading-relaxed">
          2. <strong>Hedging Requirements</strong>: To maintain market neutrality (<code className="text-zinc-200">Δ_target = 0</code>), a rebalancing adjustment of <code className="text-zinc-200">Rebalance = - (Δ_shocked - Δ_target)</code> shares must be executed whenever delta drifts outside the configured tolerance corridor <code className="text-zinc-200">±τ</code>.
        </p>
      </div>
    </div>
  );
};
