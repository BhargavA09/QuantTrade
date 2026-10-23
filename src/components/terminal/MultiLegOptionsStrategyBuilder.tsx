import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Layers,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  RotateCw,
  CheckCircle2,
  ShieldAlert,
  Percent,
  Sliders,
  Sparkles,
  Info,
  DollarSign,
  ArrowRight,
  Activity,
  Play
} from 'lucide-react';
import { blackScholesGreeks, normalCdf } from '../../utils/quantBooksEngine';
import { quantTraderBrain } from '../../services/QuantTraderBrain';

export type OptionLegType = 'CALL' | 'PUT' | 'STOCK';
export type OptionSide = 'BUY' | 'SELL';

export interface StrategyLeg {
  id: string;
  enabled: boolean;
  type: OptionLegType;
  side: OptionSide;
  strike: number;
  dte: number; // days to expiration
  contracts: number;
  iv: number; // implied volatility, e.g. 0.32
  customPremium?: number;
}

export type StrategyPreset =
  | 'IRON_CONDOR'
  | 'LONG_STRADDLE'
  | 'SHORT_STRADDLE'
  | 'BULL_CALL_SPREAD'
  | 'BEAR_PUT_SPREAD'
  | 'IRON_BUTTERFLY'
  | 'PROTECTIVE_COLLAR'
  | 'LONG_STRANGLE';

interface MultiLegOptionsStrategyBuilderProps {
  selectedTicker: string;
  currentPrice: number;
  onExecuteStrategy?: (name: string, netDebitCredit: number) => void;
}

export const MultiLegOptionsStrategyBuilder: React.FC<MultiLegOptionsStrategyBuilderProps> = ({
  selectedTicker,
  currentPrice: initialCurrentPrice,
  onExecuteStrategy
}) => {
  const currentPrice = initialCurrentPrice > 0 ? initialCurrentPrice : 140.0;
  const spotRounded = Math.round(currentPrice);

  const [riskFreeRate, setRiskFreeRate] = useState<number>(0.045); // 4.5% Fed risk-free
  const [selectedPreset, setSelectedPreset] = useState<StrategyPreset>('IRON_CONDOR');
  const [legs, setLegs] = useState<StrategyLeg[]>([]);
  const [hoveredPricePoint, setHoveredPricePoint] = useState<{
    price: number;
    expiryPnl: number;
    t0Pnl: number;
  } | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Generate strategy preset legs
  const generatePresetLegs = useCallback((preset: StrategyPreset, spot: number): StrategyLeg[] => {
    const s = Math.round(spot);
    const dte = 30;
    const baseIv = 0.30;

    switch (preset) {
      case 'IRON_CONDOR':
        return [
          { id: 'leg-1', enabled: true, type: 'PUT', side: 'BUY', strike: Math.round(s * 0.90), dte, contracts: 1, iv: baseIv + 0.03 },
          { id: 'leg-2', enabled: true, type: 'PUT', side: 'SELL', strike: Math.round(s * 0.95), dte, contracts: 1, iv: baseIv + 0.01 },
          { id: 'leg-3', enabled: true, type: 'CALL', side: 'SELL', strike: Math.round(s * 1.05), dte, contracts: 1, iv: baseIv },
          { id: 'leg-4', enabled: true, type: 'CALL', side: 'BUY', strike: Math.round(s * 1.10), dte, contracts: 1, iv: baseIv + 0.02 }
        ];
      case 'LONG_STRADDLE':
        return [
          { id: 'leg-1', enabled: true, type: 'CALL', side: 'BUY', strike: s, dte, contracts: 1, iv: baseIv },
          { id: 'leg-2', enabled: true, type: 'PUT', side: 'BUY', strike: s, dte, contracts: 1, iv: baseIv }
        ];
      case 'SHORT_STRADDLE':
        return [
          { id: 'leg-1', enabled: true, type: 'CALL', side: 'SELL', strike: s, dte, contracts: 1, iv: baseIv },
          { id: 'leg-2', enabled: true, type: 'PUT', side: 'SELL', strike: s, dte, contracts: 1, iv: baseIv }
        ];
      case 'BULL_CALL_SPREAD':
        return [
          { id: 'leg-1', enabled: true, type: 'CALL', side: 'BUY', strike: s, dte, contracts: 1, iv: baseIv },
          { id: 'leg-2', enabled: true, type: 'CALL', side: 'SELL', strike: Math.round(s * 1.06), dte, contracts: 1, iv: baseIv - 0.01 }
        ];
      case 'BEAR_PUT_SPREAD':
        return [
          { id: 'leg-1', enabled: true, type: 'PUT', side: 'BUY', strike: s, dte, contracts: 1, iv: baseIv },
          { id: 'leg-2', enabled: true, type: 'PUT', side: 'SELL', strike: Math.round(s * 0.94), dte, contracts: 1, iv: baseIv + 0.02 }
        ];
      case 'IRON_BUTTERFLY':
        return [
          { id: 'leg-1', enabled: true, type: 'PUT', side: 'BUY', strike: Math.round(s * 0.94), dte, contracts: 1, iv: baseIv + 0.02 },
          { id: 'leg-2', enabled: true, type: 'PUT', side: 'SELL', strike: s, dte, contracts: 1, iv: baseIv },
          { id: 'leg-3', enabled: true, type: 'CALL', side: 'SELL', strike: s, dte, contracts: 1, iv: baseIv },
          { id: 'leg-4', enabled: true, type: 'CALL', side: 'BUY', strike: Math.round(s * 1.06), dte, contracts: 1, iv: baseIv + 0.01 }
        ];
      case 'PROTECTIVE_COLLAR':
        return [
          { id: 'leg-1', enabled: true, type: 'STOCK', side: 'BUY', strike: s, dte: 0, contracts: 1, iv: 0 },
          { id: 'leg-2', enabled: true, type: 'PUT', side: 'BUY', strike: Math.round(s * 0.95), dte, contracts: 1, iv: baseIv + 0.02 },
          { id: 'leg-3', enabled: true, type: 'CALL', side: 'SELL', strike: Math.round(s * 1.05), dte, contracts: 1, iv: baseIv }
        ];
      case 'LONG_STRANGLE':
        return [
          { id: 'leg-1', enabled: true, type: 'PUT', side: 'BUY', strike: Math.round(s * 0.95), dte, contracts: 1, iv: baseIv + 0.01 },
          { id: 'leg-2', enabled: true, type: 'CALL', side: 'BUY', strike: Math.round(s * 1.05), dte, contracts: 1, iv: baseIv }
        ];
      default:
        return [];
    }
  }, []);

  // Initialize preset on load or ticker change
  useEffect(() => {
    setLegs(generatePresetLegs(selectedPreset, currentPrice));
  }, [selectedPreset, currentPrice, generatePresetLegs]);

  // Compute live Greeks and premiums per leg
  const computedLegs = useMemo(() => {
    return legs.map(leg => {
      if (!leg.enabled) {
        return {
          ...leg,
          premium: 0,
          totalCost: 0,
          delta: 0,
          gamma: 0,
          theta: 0,
          vega: 0
        };
      }

      if (leg.type === 'STOCK') {
        const sign = leg.side === 'BUY' ? 1 : -1;
        const shares = leg.contracts * 100;
        return {
          ...leg,
          premium: currentPrice,
          totalCost: sign * shares * currentPrice,
          delta: sign * (shares / 100),
          gamma: 0,
          theta: 0,
          vega: 0
        };
      }

      const T = Math.max(0.001, leg.dte / 365.25);
      const bs = blackScholesGreeks(
        currentPrice,
        leg.strike,
        T,
        riskFreeRate,
        leg.iv,
        leg.type.toLowerCase() as 'call' | 'put'
      );

      const premium = leg.customPremium !== undefined ? leg.customPremium : bs.price;
      const sign = leg.side === 'BUY' ? 1 : -1;
      const multiplier = leg.contracts * 100;

      return {
        ...leg,
        premium: parseFloat(premium.toFixed(2)),
        totalCost: parseFloat((sign * premium * multiplier).toFixed(2)),
        delta: parseFloat((sign * bs.delta * leg.contracts).toFixed(3)),
        gamma: parseFloat((sign * bs.gamma * leg.contracts).toFixed(4)),
        theta: parseFloat((sign * bs.theta * multiplier).toFixed(2)),
        vega: parseFloat((sign * bs.vega * multiplier).toFixed(2))
      };
    });
  }, [legs, currentPrice, riskFreeRate]);

  // Net Portfolio Greeks & Aggregate Strategy Cost
  const strategySummary = useMemo(() => {
    let netCost = 0; // positive = net debit, negative = net credit
    let netDelta = 0;
    let netGamma = 0;
    let netTheta = 0;
    let netVega = 0;

    computedLegs.forEach(l => {
      if (!l.enabled) return;
      netCost += l.totalCost;
      netDelta += l.delta;
      netGamma += l.gamma;
      netTheta += l.theta;
      netVega += l.vega;
    });

    const isNetCredit = netCost < 0;
    const netPremiumDollar = Math.abs(netCost);

    return {
      netCost: parseFloat(netCost.toFixed(2)),
      isNetCredit,
      netPremiumDollar: parseFloat(netPremiumDollar.toFixed(2)),
      netDelta: parseFloat(netDelta.toFixed(3)),
      netGamma: parseFloat(netGamma.toFixed(4)),
      netTheta: parseFloat(netTheta.toFixed(2)),
      netVega: parseFloat(netVega.toFixed(2))
    };
  }, [computedLegs]);

  // Compute Expiration and T+0 curves across price range
  const { curveData, minPrice, maxPrice, maxProfit, maxLoss, breakevens, pop } = useMemo(() => {
    if (computedLegs.length === 0) {
      return { curveData: [], minPrice: 0, maxPrice: 0, maxProfit: 0, maxLoss: 0, breakevens: [], pop: 50 };
    }

    const strikes = computedLegs.filter(l => l.enabled && l.type !== 'STOCK').map(l => l.strike);
    const minStrike = strikes.length > 0 ? Math.min(...strikes, currentPrice) : currentPrice * 0.85;
    const maxStrike = strikes.length > 0 ? Math.max(...strikes, currentPrice) : currentPrice * 1.15;

    const span = Math.max(currentPrice * 0.25, (maxStrike - minStrike) * 0.75);
    const lowerBound = Math.max(1, currentPrice - span);
    const upperBound = currentPrice + span;

    const steps = 140;
    const stepSize = (upperBound - lowerBound) / steps;
    const points: Array<{ price: number; expiryPnl: number; t0Pnl: number }> = [];

    let overallMaxProfit = -Infinity;
    let overallMaxLoss = Infinity;

    for (let i = 0; i <= steps; i++) {
      const price = lowerBound + i * stepSize;
      let expiryPnl = 0;
      let t0Pnl = 0;

      computedLegs.forEach(leg => {
        if (!leg.enabled) return;

        const sign = leg.side === 'BUY' ? 1 : -1;
        const multiplier = leg.contracts * 100;

        if (leg.type === 'STOCK') {
          const pnl = sign * (price - currentPrice) * multiplier;
          expiryPnl += pnl;
          t0Pnl += pnl;
          return;
        }

        // Expiration Payoff: intrinsic value - cost paid
        const intrinsic = leg.type === 'CALL'
          ? Math.max(0, price - leg.strike)
          : Math.max(0, leg.strike - price);

        const legExpiry = (sign * intrinsic - (leg.side === 'BUY' ? leg.premium : -leg.premium)) * multiplier;
        expiryPnl += legExpiry;

        // T+0 Theoretical Value via Black-Scholes
        const T = Math.max(0.001, leg.dte / 365.25);
        const bsT0 = blackScholesGreeks(
          price,
          leg.strike,
          T,
          riskFreeRate,
          leg.iv,
          leg.type.toLowerCase() as 'call' | 'put'
        );

        const legT0 = (sign * bsT0.price - (leg.side === 'BUY' ? leg.premium : -leg.premium)) * multiplier;
        t0Pnl += legT0;
      });

      points.push({
        price: parseFloat(price.toFixed(2)),
        expiryPnl: parseFloat(expiryPnl.toFixed(2)),
        t0Pnl: parseFloat(t0Pnl.toFixed(2))
      });

      if (expiryPnl > overallMaxProfit) overallMaxProfit = expiryPnl;
      if (expiryPnl < overallMaxLoss) overallMaxLoss = expiryPnl;
    }

    // Identify Breakevens (zero crossings of expiryPnl)
    const foundBreakevens: number[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if ((p1.expiryPnl <= 0 && p2.expiryPnl >= 0) || (p1.expiryPnl >= 0 && p2.expiryPnl <= 0)) {
        // Linear interpolation for exact zero crossing
        const ratio = Math.abs(p1.expiryPnl) / (Math.abs(p1.expiryPnl) + Math.abs(p2.expiryPnl) || 1);
        const be = p1.price + ratio * (p2.price - p1.price);
        foundBreakevens.push(parseFloat(be.toFixed(2)));
      }
    }

    // Probability of Profit (POP) Calculation via Log-Normal Distribution
    // Hull Chapter 15: In a log-normal diffusion with annualized vol sigma and time T
    let computedPop = 50.0;
    const firstOptionLeg = computedLegs.find(l => l.enabled && l.type !== 'STOCK');
    const avgVol = firstOptionLeg ? firstOptionLeg.iv : 0.30;
    const avgDte = firstOptionLeg ? firstOptionLeg.dte : 30;
    const T = Math.max(0.001, avgDte / 365.25);
    const sigmaSqrtT = avgVol * Math.sqrt(T);

    if (foundBreakevens.length === 2) {
      const [b1, b2] = foundBreakevens.sort((a, b) => a - b);
      const d2_b1 = (Math.log(currentPrice / b1) + (riskFreeRate - 0.5 * avgVol * avgVol) * T) / sigmaSqrtT;
      const d2_b2 = (Math.log(currentPrice / b2) + (riskFreeRate - 0.5 * avgVol * avgVol) * T) / sigmaSqrtT;
      const probInside = Math.abs(normalCdf(d2_b1) - normalCdf(d2_b2));
      // If middle is profitable (like Iron Condor or Short Straddle)
      const midPoint = points.find(p => p.price >= (b1 + b2) / 2);
      computedPop = midPoint && midPoint.expiryPnl > 0 ? probInside * 100 : (1 - probInside) * 100;
    } else if (foundBreakevens.length === 1) {
      const be = foundBreakevens[0];
      const d2 = (Math.log(currentPrice / be) + (riskFreeRate - 0.5 * avgVol * avgVol) * T) / sigmaSqrtT;
      if (be > currentPrice) {
        // Bullish spread: profit above be
        computedPop = normalCdf(d2) * 100;
      } else {
        // Bearish spread: profit below be
        computedPop = (1 - normalCdf(d2)) * 100;
      }
    } else {
      // Multiple crossings or unbounded
      const profitablePoints = points.filter(p => p.expiryPnl > 0).length;
      computedPop = (profitablePoints / points.length) * 100;
    }

    computedPop = Math.min(99, Math.max(1, parseFloat(computedPop.toFixed(1))));

    return {
      curveData: points,
      minPrice: lowerBound,
      maxPrice: upperBound,
      maxProfit: parseFloat(overallMaxProfit.toFixed(2)),
      maxLoss: parseFloat(overallMaxLoss.toFixed(2)),
      breakevens: foundBreakevens,
      pop: computedPop
    };
  }, [computedLegs, currentPrice, riskFreeRate]);

  // Render D3 SVG Chart
  useEffect(() => {
    if (!svgRef.current || curveData.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Price)
    const xScale = d3.scaleLinear()
      .domain([minPrice, maxPrice])
      .range([0, innerWidth]);

    // Y Scale (PnL in Dollars)
    const yExtent = d3.extent(curveData, d => d.expiryPnl) as [number, number];
    const yMin = Math.min(yExtent[0] || -100, -50);
    const yMax = Math.max(yExtent[1] || 100, 50);
    const yPadding = (yMax - yMin) * 0.15;

    const yScale = d3.scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    // Grid lines
    const xGrid = d3.axisBottom(xScale).ticks(8).tickSize(-innerHeight).tickFormat(() => '');
    const yGrid = d3.axisLeft(yScale).ticks(6).tickSize(-innerWidth).tickFormat(() => '');

    g.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xGrid)
      .selectAll('line')
      .attr('stroke', '#27272a')
      .attr('stroke-dasharray', '2,2');

    g.append('g')
      .attr('class', 'grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#27272a')
      .attr('stroke-dasharray', '2,2');

    // Zero PnL Reference Line
    const yZero = yScale(0);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yZero)
      .attr('y2', yZero)
      .attr('stroke', '#71717a')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    // Shaded Profit Zone above 0
    const profitArea = d3.area<any>()
      .x(d => xScale(d.price))
      .y0(yZero)
      .y1(d => Math.min(yZero, yScale(d.expiryPnl)))
      .defined(d => d.expiryPnl >= 0);

    g.append('path')
      .datum(curveData)
      .attr('d', profitArea)
      .attr('fill', '#10b981')
      .attr('opacity', 0.15);

    // Shaded Loss Zone below 0
    const lossArea = d3.area<any>()
      .x(d => xScale(d.price))
      .y0(yZero)
      .y1(d => Math.max(yZero, yScale(d.expiryPnl)))
      .defined(d => d.expiryPnl <= 0);

    g.append('path')
      .datum(curveData)
      .attr('d', lossArea)
      .attr('fill', '#f43f5e')
      .attr('opacity', 0.15);

    // Line Generator for Expiration Payoff
    const expiryLine = d3.line<any>()
      .x(d => xScale(d.price))
      .y(d => yScale(d.expiryPnl))
      .curve(d3.curveLinear);

    g.append('path')
      .datum(curveData)
      .attr('d', expiryLine)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.5);

    // Line Generator for T+0 Theoretical Curve
    const t0Line = d3.line<any>()
      .x(d => xScale(d.price))
      .y(d => yScale(d.t0Pnl))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(curveData)
      .attr('d', t0Line)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    // Vertical Current Spot Line
    const spotX = xScale(currentPrice);
    if (spotX >= 0 && spotX <= innerWidth) {
      g.append('line')
        .attr('x1', spotX)
        .attr('x2', spotX)
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '3,3');

      g.append('text')
        .attr('x', spotX + 4)
        .attr('y', 14)
        .attr('font-size', '10px')
        .attr('font-family', 'monospace')
        .attr('font-weight', 'bold')
        .attr('fill', '#fbbf24')
        .text(`Spot $${currentPrice.toFixed(2)}`);
    }

    // Breakeven Markers
    breakevens.forEach(be => {
      const beX = xScale(be);
      if (beX >= 0 && beX <= innerWidth) {
        g.append('circle')
          .attr('cx', beX)
          .attr('cy', yZero)
          .attr('r', 4.5)
          .attr('fill', '#ffffff')
          .attr('stroke', '#6366f1')
          .attr('stroke-width', 2);

        g.append('text')
          .attr('x', beX)
          .attr('y', yZero - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('fill', '#a5b4fc')
          .text(`BE $${be.toFixed(2)}`);
      }
    });

    // Strikes Markers (small dots on zero line)
    computedLegs.forEach(leg => {
      if (!leg.enabled || leg.type === 'STOCK') return;
      const strikeX = xScale(leg.strike);
      if (strikeX >= 0 && strikeX <= innerWidth) {
        g.append('circle')
          .attr('cx', strikeX)
          .attr('cy', innerHeight)
          .attr('r', 3)
          .attr('fill', leg.type === 'CALL' ? '#38bdf8' : '#c084fc');
      }
    });

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(8).tickFormat(d => `$${d}`);
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(d => `$${d}`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('fill', '#a1a1aa');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('fill', '#a1a1aa');

    // Interactive Hover Overlay
    const overlay = g.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .attr('cursor', 'crosshair');

    const focusLine = g.append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('opacity', 0);

    const focusCircleExpiry = g.append('circle')
      .attr('r', 4.5)
      .attr('fill', '#10b981')
      .style('opacity', 0);

    const focusCircleT0 = g.append('circle')
      .attr('r', 4)
      .attr('fill', '#38bdf8')
      .style('opacity', 0);

    overlay
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event);
        const hoveredPrice = xScale.invert(mx);
        const nearest = curveData.reduce((prev, curr) =>
          Math.abs(curr.price - hoveredPrice) < Math.abs(prev.price - hoveredPrice) ? curr : prev
        );

        if (nearest) {
          const nx = xScale(nearest.price);
          focusLine
            .attr('x1', nx)
            .attr('x2', nx)
            .style('opacity', 1);

          focusCircleExpiry
            .attr('cx', nx)
            .attr('cy', yScale(nearest.expiryPnl))
            .style('opacity', 1);

          focusCircleT0
            .attr('cx', nx)
            .attr('cy', yScale(nearest.t0Pnl))
            .style('opacity', 1);

          setHoveredPricePoint(nearest);
        }
      })
      .on('mouseleave', () => {
        focusLine.style('opacity', 0);
        focusCircleExpiry.style('opacity', 0);
        focusCircleT0.style('opacity', 0);
        setHoveredPricePoint(null);
      });
  }, [curveData, minPrice, maxPrice, currentPrice, breakevens, computedLegs]);

  // Leg Management Handlers
  const handleToggleLeg = (id: string) => {
    setLegs(prev => prev.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l));
  };

  const handleUpdateLeg = (id: string, updates: Partial<StrategyLeg>) => {
    setLegs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const handleDeleteLeg = (id: string) => {
    setLegs(prev => prev.filter(l => l.id !== id));
  };

  const handleAddLeg = () => {
    const newLeg: StrategyLeg = {
      id: `leg-${Date.now()}`,
      enabled: true,
      type: 'CALL',
      side: 'BUY',
      strike: spotRounded,
      dte: 30,
      contracts: 1,
      iv: 0.30
    };
    setLegs(prev => [...prev, newLeg]);
  };

  const handleDeployToBrain = () => {
    try {
      const summaryText = `${selectedPreset.replace('_', ' ')}: Net ${strategySummary.isNetCredit ? 'Credit' : 'Debit'} $${strategySummary.netPremiumDollar}`;
      // Paper trade allocation into Brain
      quantTraderBrain.executeOrder(
        selectedTicker,
        strategySummary.netDelta >= 0 ? 'LONG' : 'SHORT',
        currentPrice,
        `Options: ${selectedPreset}`
      );
      setExecutionMessage(`Deployed ${selectedPreset} on ${selectedTicker} to Quant Trader Brain paper account!`);
      if (onExecuteStrategy) {
        onExecuteStrategy(selectedPreset, strategySummary.netCost);
      }
      setTimeout(() => setExecutionMessage(null), 5000);
    } catch (e: any) {
      setExecutionMessage(`Execution note: ${e.message}`);
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header Banner & Preset Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Multi-Leg Options Architect
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Underlying: <strong className="text-white">{selectedTicker}</strong> (${currentPrice.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              POP: {pop}%
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Multi-Leg Strategy Builder & Expiration / T+0 Payoff Diagram
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Design, simulate, and stress-test complex multi-leg derivative structures (Iron Condors, Spreads, Straddles, Collars) with exact Black-Scholes Greeks, log-normal Probability of Profit (POP), and non-linear T+0 decay curves.
          </p>
        </div>

        {/* Action Button: Paper Execute */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDeployToBrain}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-black flex items-center gap-1.5 transition-colors shadow-lg shadow-purple-950/40"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Deploy to Brain Paper Account</span>
          </button>
        </div>
      </div>

      {/* Preset Strategy Buttons */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
          Standard Strategy Archetypes:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'IRON_CONDOR', label: 'Iron Condor', desc: 'Rangebound Non-Directional' },
            { id: 'LONG_STRADDLE', label: 'Long Straddle', desc: 'High Volatility Breakout' },
            { id: 'SHORT_STRADDLE', label: 'Short Straddle', desc: 'Max Theta Decay' },
            { id: 'BULL_CALL_SPREAD', label: 'Bull Call Spread', desc: 'Defined Risk Long' },
            { id: 'BEAR_PUT_SPREAD', label: 'Bear Put Spread', desc: 'Defined Risk Short' },
            { id: 'IRON_BUTTERFLY', label: 'Iron Butterfly', desc: 'Pin Strike Convergence' },
            { id: 'PROTECTIVE_COLLAR', label: 'Protective Collar', desc: 'Hedged Spot Overlay' },
            { id: 'LONG_STRANGLE', label: 'Long Strangle', desc: 'Out-of-Money Explosion' }
          ].map(preset => (
            <button
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id as StrategyPreset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap text-left border ${
                selectedPreset === preset.id
                  ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-md shadow-purple-950/50'
                  : 'bg-zinc-950/80 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className="font-bold">{preset.label}</div>
              <div className="text-[9px] text-zinc-400 font-sans">{preset.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Execution Feedback */}
      {executionMessage && (
        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{executionMessage}</span>
        </div>
      )}

      {/* 2. Analytical KPI Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">
            Net Premium
          </span>
          <span className={`text-base font-black font-mono ${strategySummary.isNetCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
            {strategySummary.isNetCredit ? 'Credit: ' : 'Debit: '}${strategySummary.netPremiumDollar}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            {strategySummary.isNetCredit ? 'Collected upfront' : 'Paid upfront'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">
            Prob of Profit (POP)
          </span>
          <span className="text-base font-black font-mono text-emerald-400">
            {pop}%
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            Log-Normal analytical
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">
            Max Potential Profit
          </span>
          <span className="text-base font-black font-mono text-emerald-400">
            {maxProfit > 99999 ? 'Unlimited' : `$${maxProfit.toFixed(0)}`}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            At expiration
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">
            Max Potential Loss
          </span>
          <span className="text-base font-black font-mono text-rose-400">
            {maxLoss < -99999 ? 'Unlimited' : `$${Math.abs(maxLoss).toFixed(0)}`}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            Worst-case risk
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">
            Net Delta (Δ)
          </span>
          <span className={`text-base font-black font-mono ${strategySummary.netDelta >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
            {strategySummary.netDelta > 0 ? `+${strategySummary.netDelta}` : strategySummary.netDelta}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            Directional bias
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono block">
            Daily Theta (Decay)
          </span>
          <span className={`text-base font-black font-mono ${strategySummary.netTheta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {strategySummary.netTheta >= 0 ? '+' : ''}${strategySummary.netTheta}/day
          </span>
          <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">
            Time value erosion
          </span>
        </div>
      </div>

      {/* 3. Interactive D3 SVG Payoff Diagram */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Payoff Topology: Expiration (Green/Red) vs. T+0 Theoretical (Dashed Cyan)
            </h3>
            <p className="text-[11px] text-zinc-400 font-mono">
              Hover across the diagram to inspect spot price sensitivity, expiration profit/loss, and analytical T+0 PnL
            </p>
          </div>

          {/* Breakeven Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {breakevens.map((be, idx) => (
              <span key={idx} className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
                Breakeven #{idx + 1}: ${be.toFixed(2)}
              </span>
            ))}
            {breakevens.length === 0 && (
              <span className="text-[10px] font-mono text-zinc-500">No breakevens within range</span>
            )}
          </div>
        </div>

        {/* Hover Inspector Readout */}
        {hoveredPricePoint && (
          <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/60 flex items-center justify-between text-xs font-mono animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">At Price:</span>
              <strong className="text-white font-black">${hoveredPricePoint.price.toFixed(2)}</strong>
              <span className="text-zinc-500 text-[10px]">
                ({(((hoveredPricePoint.price - currentPrice) / currentPrice) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-zinc-400">Expiration PnL: </span>
                <span className={`font-black ${hoveredPricePoint.expiryPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hoveredPricePoint.expiryPnl >= 0 ? '+' : ''}${hoveredPricePoint.expiryPnl.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-zinc-400">T+0 Theoretical PnL: </span>
                <span className={`font-black ${hoveredPricePoint.t0Pnl >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                  {hoveredPricePoint.t0Pnl >= 0 ? '+' : ''}${hoveredPricePoint.t0Pnl.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="w-full overflow-hidden">
          <svg ref={svgRef} className="w-full h-[300px]" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-2 border-t border-zinc-800/80">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-1 bg-emerald-500 rounded" /> Expiration Payoff
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-sky-400 border-dashed" /> T+0 Analytical Line
            </span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Current Spot (${currentPrice.toFixed(2)})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Net Vega: {strategySummary.netVega > 0 ? `+$${strategySummary.netVega}` : `-$${Math.abs(strategySummary.netVega)}`}/1% IV</span>
            <span>·</span>
            <span className="text-zinc-500">Net Gamma: {strategySummary.netGamma}</span>
          </div>
        </div>
      </div>

      {/* 4. Interactive Strategy Leg Editor Table */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Constituent Option Legs & Contract Editor ({computedLegs.length} Active Legs)
            </h3>
          </div>
          <button
            onClick={handleAddLeg}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Leg</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-400 uppercase">
                <th className="py-2 px-3">Active</th>
                <th className="py-2 px-3">Side</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Strike ($)</th>
                <th className="py-2 px-3">DTE</th>
                <th className="py-2 px-3">Contracts</th>
                <th className="py-2 px-3">IV (%)</th>
                <th className="py-2 px-3 text-right">Est. Premium</th>
                <th className="py-2 px-3 text-right">Total Outlay</th>
                <th className="py-2 px-3 text-right">Delta (Δ)</th>
                <th className="py-2 px-3 text-right">Daily Theta</th>
                <th className="py-2 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {computedLegs.map((leg) => (
                <tr key={leg.id} className={`hover:bg-zinc-900/40 transition-colors ${!leg.enabled ? 'opacity-40' : ''}`}>
                  {/* Enable Checkbox */}
                  <td className="py-2.5 px-3">
                    <input
                      type="checkbox"
                      checked={leg.enabled}
                      onChange={() => handleToggleLeg(leg.id)}
                      className="accent-purple-600 rounded cursor-pointer"
                    />
                  </td>

                  {/* Buy / Sell */}
                  <td className="py-2.5 px-3">
                    <button
                      onClick={() => handleUpdateLeg(leg.id, { side: leg.side === 'BUY' ? 'SELL' : 'BUY' })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        leg.side === 'BUY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {leg.side}
                    </button>
                  </td>

                  {/* Call / Put / Stock */}
                  <td className="py-2.5 px-3">
                    <select
                      value={leg.type}
                      onChange={(e) => handleUpdateLeg(leg.id, { type: e.target.value as OptionLegType })}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white"
                    >
                      <option value="CALL">CALL</option>
                      <option value="PUT">PUT</option>
                      <option value="STOCK">STOCK SPOT</option>
                    </select>
                  </td>

                  {/* Strike Price */}
                  <td className="py-2.5 px-3">
                    {leg.type === 'STOCK' ? (
                      <span className="text-zinc-500">Spot ${currentPrice.toFixed(2)}</span>
                    ) : (
                      <input
                        type="number"
                        step={1}
                        value={leg.strike}
                        onChange={(e) => handleUpdateLeg(leg.id, { strike: Number(e.target.value) })}
                        className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white font-bold"
                      />
                    )}
                  </td>

                  {/* DTE */}
                  <td className="py-2.5 px-3">
                    {leg.type === 'STOCK' ? (
                      <span className="text-zinc-500">--</span>
                    ) : (
                      <select
                        value={leg.dte}
                        onChange={(e) => handleUpdateLeg(leg.id, { dte: Number(e.target.value) })}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white"
                      >
                        <option value={7}>7d (Weekly)</option>
                        <option value={14}>14d</option>
                        <option value={30}>30d (Monthly)</option>
                        <option value={45}>45d</option>
                        <option value={60}>60d</option>
                        <option value={90}>90d (Quarterly)</option>
                      </select>
                    )}
                  </td>

                  {/* Contracts */}
                  <td className="py-2.5 px-3">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={leg.contracts}
                      onChange={(e) => handleUpdateLeg(leg.id, { contracts: Math.max(1, Number(e.target.value)) })}
                      className="w-14 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white"
                    />
                  </td>

                  {/* IV */}
                  <td className="py-2.5 px-3">
                    {leg.type === 'STOCK' ? (
                      <span className="text-zinc-500">--</span>
                    ) : (
                      <input
                        type="number"
                        step={1}
                        min={5}
                        max={200}
                        value={Math.round(leg.iv * 100)}
                        onChange={(e) => handleUpdateLeg(leg.id, { iv: Number(e.target.value) / 100 })}
                        className="w-16 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-white"
                      />
                    )}
                  </td>

                  {/* Est. Premium */}
                  <td className="py-2.5 px-3 text-right text-zinc-300">
                    ${leg.premium.toFixed(2)}
                  </td>

                  {/* Total Cost */}
                  <td className={`py-2.5 px-3 text-right font-bold ${leg.totalCost > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {leg.totalCost > 0 ? `-$${leg.totalCost.toFixed(2)}` : `+$${Math.abs(leg.totalCost).toFixed(2)}`}
                  </td>

                  {/* Delta */}
                  <td className={`py-2.5 px-3 text-right font-bold ${leg.delta >= 0 ? 'text-sky-400' : 'text-amber-400'}`}>
                    {leg.delta > 0 ? `+${leg.delta}` : leg.delta}
                  </td>

                  {/* Theta */}
                  <td className={`py-2.5 px-3 text-right ${leg.theta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {leg.theta >= 0 ? `+$${leg.theta}` : `-$${Math.abs(leg.theta)}`}
                  </td>

                  {/* Delete */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => handleDeleteLeg(leg.id)}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors"
                      title="Remove Leg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
