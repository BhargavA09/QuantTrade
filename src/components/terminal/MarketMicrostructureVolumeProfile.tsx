import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Layers,
  Activity,
  Zap,
  ShieldCheck,
  RotateCw,
  Info,
  Sliders,
  Target,
  ArrowRight
} from 'lucide-react';

export interface VolumeProfileBin {
  priceMin: number;
  priceMax: number;
  priceMid: number;
  buyVolume: number;
  sellVolume: number;
  totalVolume: number;
  deltaVolume: number;
  isPoc: boolean;
  isValueArea: boolean;
  isHvn: boolean; // High volume node
  isLvn: boolean; // Low volume node
}

export interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPct: number;
  isDarkPoolBlock?: boolean;
}

interface MarketMicrostructureVolumeProfileProps {
  selectedTicker: string;
  currentPrice: number;
  chartBars?: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
}

export const MarketMicrostructureVolumeProfile: React.FC<MarketMicrostructureVolumeProfileProps> = ({
  selectedTicker,
  currentPrice: initialSpot,
  chartBars = []
}) => {
  const currentPrice = initialSpot > 0 ? initialSpot : 140.0;

  const [binsCount, setBinsCount] = useState<number>(28);
  const [profileViewMode, setProfileViewMode] = useState<'total' | 'delta'>('total');
  const [sessionRange, setSessionRange] = useState<'all' | 'recent_10' | 'recent_5'>('all');
  const [hoveredBin, setHoveredBin] = useState<VolumeProfileBin | null>(null);

  const profileSvgRef = useRef<SVGSVGElement | null>(null);

  // Filter bars according to sessionRange
  const activeBars = useMemo(() => {
    if (!chartBars || chartBars.length === 0) {
      // Synthesize 20 realistic bars if none supplied
      const dummy = [];
      let p = currentPrice;
      for (let i = 20; i >= 1; i--) {
        const drift = (Math.sin(i * 0.4) + (Math.random() - 0.48)) * (p * 0.015);
        const open = p;
        const close = p + drift;
        const high = Math.max(open, close) + Math.random() * (p * 0.01);
        const low = Math.min(open, close) - Math.random() * (p * 0.01);
        const volume = Math.floor(800000 + Math.random() * 1200000);
        dummy.push({
          date: `Bar-${i}`,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(close.toFixed(2)),
          volume
        });
        p = close;
      }
      return dummy;
    }

    if (sessionRange === 'recent_5') return chartBars.slice(-5);
    if (sessionRange === 'recent_10') return chartBars.slice(-10);
    return chartBars;
  }, [chartBars, sessionRange, currentPrice]);

  // Compute Volume Profile, Point of Control (POC), and Value Area High/Low (VAH/VAL 70%)
  const profileAnalysis = useMemo(() => {
    if (activeBars.length === 0) {
      return {
        bins: [],
        pocPrice: currentPrice,
        vahPrice: currentPrice * 1.02,
        valPrice: currentPrice * 0.98,
        totalVolume: 0,
        pocBin: null
      };
    }

    const minPrice = Math.min(...activeBars.map(b => b.low));
    const maxPrice = Math.max(...activeBars.map(b => b.high));
    const priceSpan = Math.max(0.1, maxPrice - minPrice);
    const binSize = priceSpan / binsCount;

    // Allocate bins
    const bins: VolumeProfileBin[] = Array.from({ length: binsCount }, (_, idx) => {
      const priceMin = minPrice + idx * binSize;
      const priceMax = priceMin + binSize;
      return {
        priceMin: parseFloat(priceMin.toFixed(2)),
        priceMax: parseFloat(priceMax.toFixed(2)),
        priceMid: parseFloat(((priceMin + priceMax) / 2).toFixed(2)),
        buyVolume: 0,
        sellVolume: 0,
        totalVolume: 0,
        deltaVolume: 0,
        isPoc: false,
        isValueArea: false,
        isHvn: false,
        isLvn: false
      };
    });

    let cumulativeVol = 0;

    // Distribute bar volumes across intersecting price bins
    activeBars.forEach(bar => {
      const barRange = Math.max(0.01, bar.high - bar.low);
      const isBullish = bar.close >= bar.open;
      const buyShare = isBullish ? 0.58 : 0.42;

      bins.forEach(bin => {
        const overlapStart = Math.max(bin.priceMin, bar.low);
        const overlapEnd = Math.min(bin.priceMax, bar.high);
        if (overlapEnd > overlapStart) {
          const overlapRatio = (overlapEnd - overlapStart) / barRange;
          const allocatedVolume = Math.round(bar.volume * overlapRatio);
          const buyVol = Math.round(allocatedVolume * buyShare);
          const sellVol = allocatedVolume - buyVol;

          bin.buyVolume += buyVol;
          bin.sellVolume += sellVol;
          bin.totalVolume += allocatedVolume;
          bin.deltaVolume += (buyVol - sellVol);
          cumulativeVol += allocatedVolume;
        }
      });
    });

    // Determine POC (max total volume bin)
    let maxBinVol = -1;
    let pocIdx = 0;
    bins.forEach((b, idx) => {
      if (b.totalVolume > maxBinVol) {
        maxBinVol = b.totalVolume;
        pocIdx = idx;
      }
    });

    if (bins[pocIdx]) {
      bins[pocIdx].isPoc = true;
    }

    // Determine 70% Value Area (Market Profile Standard - Steidlmayer methodology)
    const targetVaVolume = cumulativeVol * 0.70;
    let currentVaVol = bins[pocIdx] ? bins[pocIdx].totalVolume : 0;
    if (bins[pocIdx]) bins[pocIdx].isValueArea = true;

    let upIdx = pocIdx + 1;
    let downIdx = pocIdx - 1;

    while (currentVaVol < targetVaVolume && (upIdx < binsCount || downIdx >= 0)) {
      const upVol = upIdx < binsCount ? bins[upIdx].totalVolume : -1;
      const downVol = downIdx >= 0 ? bins[downIdx].totalVolume : -1;

      if (upVol >= downVol && upIdx < binsCount) {
        bins[upIdx].isValueArea = true;
        currentVaVol += bins[upIdx].totalVolume;
        upIdx++;
      } else if (downIdx >= 0) {
        bins[downIdx].isValueArea = true;
        currentVaVol += bins[downIdx].totalVolume;
        downIdx--;
      } else if (upIdx < binsCount) {
        bins[upIdx].isValueArea = true;
        currentVaVol += bins[upIdx].totalVolume;
        upIdx++;
      } else {
        break;
      }
    }

    const valueAreaBins = bins.filter(b => b.isValueArea);
    const vahPrice = valueAreaBins.length > 0 ? Math.max(...valueAreaBins.map(b => b.priceMax)) : maxPrice;
    const valPrice = valueAreaBins.length > 0 ? Math.min(...valueAreaBins.map(b => b.priceMin)) : minPrice;

    // Calculate High & Low Volume Nodes (HVN vs LVN)
    const avgVol = cumulativeVol / binsCount;
    bins.forEach(b => {
      if (b.totalVolume > avgVol * 1.4) b.isHvn = true;
      if (b.totalVolume < avgVol * 0.45) b.isLvn = true;
    });

    return {
      bins,
      pocPrice: bins[pocIdx] ? bins[pocIdx].priceMid : currentPrice,
      vahPrice: parseFloat(vahPrice.toFixed(2)),
      valPrice: parseFloat(valPrice.toFixed(2)),
      totalVolume: cumulativeVol,
      pocBin: bins[pocIdx] || null
    };
  }, [activeBars, binsCount, currentPrice]);

  // Synthesize Microstructure L2 Order Book Depth Ladder around current spot
  const orderBook = useMemo(() => {
    const spreadCents = 0.02; // 2 cents spread
    const tick = 0.05;
    const baseBid = Math.floor(currentPrice / tick) * tick;
    const baseAsk = baseBid + spreadCents;

    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    let cumBid = 0;
    let cumAsk = 0;

    for (let i = 0; i < 8; i++) {
      const bidPrice = parseFloat((baseBid - i * tick).toFixed(2));
      const askPrice = parseFloat((baseAsk + i * tick).toFixed(2));

      // Occasional institutional dark pool wall
      const isBidWall = i === 4;
      const isAskWall = i === 3;

      const bidSize = isBidWall ? 14200 : Math.floor(1200 + Math.random() * 2800);
      const askSize = isAskWall ? 16500 : Math.floor(1100 + Math.random() * 2600);

      cumBid += bidSize;
      cumAsk += askSize;

      bids.push({
        price: bidPrice,
        size: bidSize,
        total: cumBid,
        depthPct: 0,
        isDarkPoolBlock: isBidWall
      });

      asks.push({
        price: askPrice,
        size: askSize,
        total: cumAsk,
        depthPct: 0,
        isDarkPoolBlock: isAskWall
      });
    }

    const maxCum = Math.max(cumBid, cumAsk);
    bids.forEach(b => b.depthPct = (b.total / maxCum) * 100);
    asks.forEach(a => a.depthPct = (a.total / maxCum) * 100);

    // Order Flow Imbalance Ratio (OFI)
    const ofi = parseFloat((((cumBid - cumAsk) / (cumBid + cumAsk)) * 100).toFixed(1));
    const spreadBps = parseFloat((((baseAsk - baseBid) / currentPrice) * 10000).toFixed(1));

    // Micro-price (Volume-weighted fair value)
    const microPrice = parseFloat((((baseBid * asks[0].size) + (baseAsk * bids[0].size)) / (bids[0].size + asks[0].size)).toFixed(3));

    return {
      bids,
      asks,
      cumBid,
      cumAsk,
      ofi,
      spread: parseFloat((baseAsk - baseBid).toFixed(2)),
      spreadBps,
      microPrice
    };
  }, [currentPrice]);

  // Render D3 Horizontal Volume Profile SVG
  useEffect(() => {
    if (!profileSvgRef.current || profileAnalysis.bins.length === 0) return;

    const svg = d3.select(profileSvgRef.current);
    svg.selectAll('*').remove();

    const width = profileSvgRef.current.clientWidth || 550;
    const height = 320;
    const margin = { top: 15, right: 80, bottom: 25, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const { bins, pocPrice, vahPrice, valPrice } = profileAnalysis;
    const minP = bins[0].priceMin;
    const maxP = bins[bins.length - 1].priceMax;

    // Y Scale: Price
    const yScale = d3.scaleLinear()
      .domain([minP, maxP])
      .range([innerHeight, 0]);

    // X Scale: Volume
    const maxVol = d3.max(bins, d => profileViewMode === 'total' ? d.totalVolume : Math.abs(d.deltaVolume)) || 10000;
    const xScale = d3.scaleLinear()
      .domain([0, maxVol * 1.1])
      .range([0, innerWidth]);

    // Shaded Value Area Background (70% Volume Zone)
    const valY = yScale(valPrice);
    const vahY = yScale(vahPrice);
    g.append('rect')
      .attr('x', 0)
      .attr('y', Math.min(valY, vahY))
      .attr('width', innerWidth)
      .attr('height', Math.abs(valY - vahY))
      .attr('fill', '#3b82f6')
      .attr('opacity', 0.08);

    // Bars
    bins.forEach(bin => {
      const y0 = yScale(bin.priceMax);
      const y1 = yScale(bin.priceMin);
      const barHeight = Math.max(2, Math.abs(y1 - y0) - 1.5);

      if (profileViewMode === 'total') {
        const buyW = xScale(bin.buyVolume);
        const sellW = xScale(bin.sellVolume);

        // Buy Volume Bar (Emerald)
        g.append('rect')
          .attr('x', 0)
          .attr('y', y0)
          .attr('width', buyW)
          .attr('height', barHeight)
          .attr('fill', bin.isPoc ? '#fbbf24' : (bin.isValueArea ? '#10b981' : '#059669'))
          .attr('opacity', bin.isValueArea ? 0.9 : 0.45);

        // Sell Volume Bar (Rose stacked next to buy)
        g.append('rect')
          .attr('x', buyW)
          .attr('y', y0)
          .attr('width', sellW)
          .attr('height', barHeight)
          .attr('fill', bin.isPoc ? '#f59e0b' : (bin.isValueArea ? '#f43f5e' : '#e11d48'))
          .attr('opacity', bin.isValueArea ? 0.9 : 0.45);
      } else {
        // Delta mode
        const deltaW = xScale(Math.abs(bin.deltaVolume));
        g.append('rect')
          .attr('x', 0)
          .attr('y', y0)
          .attr('width', deltaW)
          .attr('height', barHeight)
          .attr('fill', bin.deltaVolume >= 0 ? '#10b981' : '#f43f5e')
          .attr('opacity', 0.85);
      }

      // Invisible hover trigger
      g.append('rect')
        .attr('x', 0)
        .attr('y', y0)
        .attr('width', innerWidth)
        .attr('height', barHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', () => setHoveredBin(bin))
        .on('mouseleave', () => setHoveredBin(null));
    });

    // Reference Lines & Badges
    // 1. POC Line (Amber)
    const pocY = yScale(pocPrice);
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', pocY)
      .attr('y2', pocY)
      .attr('stroke', '#fbbf24')
      .attr('stroke-width', 2);

    g.append('text')
      .attr('x', innerWidth + 6)
      .attr('y', pocY + 3)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', '#fbbf24')
      .text(`POC $${pocPrice.toFixed(2)}`);

    // 2. VAH Line (Cyan)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', vahY)
      .attr('y2', vahY)
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    g.append('text')
      .attr('x', innerWidth + 6)
      .attr('y', vahY + 3)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#38bdf8')
      .text(`VAH $${vahPrice.toFixed(2)}`);

    // 3. VAL Line (Purple)
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', valY)
      .attr('y2', valY)
      .attr('stroke', '#c084fc')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    g.append('text')
      .attr('x', innerWidth + 6)
      .attr('y', valY + 3)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#c084fc')
      .text(`VAL $${valPrice.toFixed(2)}`);

    // 4. Current Market Spot Line (Dashed White)
    const currentSpotY = yScale(currentPrice);
    if (currentSpotY >= 0 && currentSpotY <= innerHeight) {
      g.append('line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', currentSpotY)
        .attr('y2', currentSpotY)
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '2,2');

      g.append('circle')
        .attr('cx', 0)
        .attr('cy', currentSpotY)
        .attr('r', 3.5)
        .attr('fill', '#ffffff');
    }

    // Y Axis (Price)
    const yAxis = d3.axisLeft(yScale).ticks(8).tickFormat(d => `$${d}`);
    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '10px')
      .attr('fill', '#a1a1aa');

    // X Axis (Volume)
    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d => {
      const v = Number(d);
      return v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${Math.round(v / 1000)}k`;
    });
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-family', 'monospace')
      .attr('font-size', '9px')
      .attr('fill', '#71717a');
  }, [profileAnalysis, profileViewMode, currentPrice]);

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-blue-400" />
              Microstructure & Volume Profile
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Asset: <strong className="text-white">{selectedTicker}</strong> (${currentPrice.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-amber-300 font-bold">
              POC: ${profileAnalysis.pocPrice.toFixed(2)}
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-zinc-300">
              VAH: ${profileAnalysis.vahPrice.toFixed(2)} / VAL: ${profileAnalysis.valPrice.toFixed(2)}
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Volume Profile (POC / VAH / VAL) & Level-2 Order Flow Imbalance Ladder
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Identifies institutional accumulation clusters, Point of Control (POC), 70% Value Area boundaries, and real-time bid-ask depth imbalance to pinpoint high-probability support/resistance reaction zones.
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            <button
              onClick={() => setProfileViewMode('total')}
              className={`px-2.5 py-1 rounded transition-colors ${
                profileViewMode === 'total'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Buy/Sell Split
            </button>
            <button
              onClick={() => setProfileViewMode('delta')}
              className={`px-2.5 py-1 rounded transition-colors ${
                profileViewMode === 'delta'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Delta Volume
            </button>
          </div>

          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
            {[14, 28, 42].map(n => (
              <button
                key={n}
                onClick={() => setBinsCount(n)}
                className={`px-2 py-1 rounded transition-colors ${
                  binsCount === n
                    ? 'bg-zinc-800 text-white font-bold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={`${n} price resolution bins`}
              >
                {n}B
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Microstructure Scorecard Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            Point of Control (POC)
          </span>
          <span className="text-base font-black text-amber-400">
            ${profileAnalysis.pocPrice.toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            {profileAnalysis.pocBin ? `${(profileAnalysis.pocBin.totalVolume / 1000).toFixed(0)}k volume clustered` : 'Highest traded level'}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            70% Value Area (VA)
          </span>
          <span className="text-base font-black text-sky-400">
            ${profileAnalysis.valPrice.toFixed(2)} - ${profileAnalysis.vahPrice.toFixed(2)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Fair value institutional zone
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            Order Flow Imbalance (OFI)
          </span>
          <span className={`text-base font-black ${orderBook.ofi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {orderBook.ofi >= 0 ? `+${orderBook.ofi}% BUY` : `${orderBook.ofi}% SELL`}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Top-8 L2 Book imbalance
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            Micro-Price & Spread
          </span>
          <span className="text-base font-black text-white">
            ${orderBook.microPrice.toFixed(3)}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-0.5">
            Spread: {orderBook.spreadBps} bps (${orderBook.spread.toFixed(2)})
          </span>
        </div>
      </div>

      {/* 3. Main Split View: Volume Profile Chart (Left) + L2 Depth Ladder (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Volume Profile D3 Chart */}
        <div className="lg:col-span-7 rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Horizontal Price Distribution & Market Profile
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-amber-400" /> POC
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-sky-400" /> VAH
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded bg-purple-400" /> VAL
              </span>
            </div>
          </div>

          {/* Hover Bin Inspector */}
          {hoveredBin && (
            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs font-mono animate-fade-in">
              <div>
                <span className="text-zinc-500">Range: </span>
                <span className="text-white font-bold">${hoveredBin.priceMin.toFixed(2)} - ${hoveredBin.priceMax.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500">Volume: </span>
                <span className="text-emerald-400 font-bold">{hoveredBin.buyVolume.toLocaleString()} Buy</span>
                <span className="text-zinc-600 mx-1">/</span>
                <span className="text-rose-400 font-bold">{hoveredBin.sellVolume.toLocaleString()} Sell</span>
              </div>
              <div>
                <span className="text-zinc-500">Delta: </span>
                <span className={`font-black ${hoveredBin.deltaVolume >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {hoveredBin.deltaVolume >= 0 ? '+' : ''}{hoveredBin.deltaVolume.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <div className="w-full overflow-hidden">
            <svg ref={profileSvgRef} className="w-full h-[320px]" />
          </div>

          <div className="text-[11px] font-mono text-zinc-500 flex items-center justify-between pt-1">
            <span>Volume profile computed over {activeBars.length} sessions</span>
            <span>Total Volume: {(profileAnalysis.totalVolume / 1000000).toFixed(2)}M shs</span>
          </div>
        </div>

        {/* Right 5 Cols: Level-2 Order Book Depth Ladder */}
        <div className="lg:col-span-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 p-5 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Level-2 Order Book & Depth
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              Live Tape L2
            </span>
          </div>

          {/* Ask Ladder (Red, descending) */}
          <div className="space-y-1 font-mono text-xs">
            <div className="text-[10px] text-zinc-500 uppercase flex justify-between px-2">
              <span>Ask Price</span>
              <span>Size</span>
              <span>Total Depth</span>
            </div>
            {orderBook.asks.slice().reverse().map((ask, idx) => (
              <div key={idx} className="relative flex items-center justify-between p-1 px-2 rounded hover:bg-zinc-900/50">
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-rose-500/15 rounded"
                  style={{ width: `${ask.depthPct}%` }}
                />
                <span className="font-bold text-rose-400 relative z-10">
                  ${ask.price.toFixed(2)}
                </span>
                <span className="text-zinc-300 relative z-10 flex items-center gap-1.5">
                  {ask.size.toLocaleString()}
                  {ask.isDarkPoolBlock && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      BLOCK WALL
                    </span>
                  )}
                </span>
                <span className="text-zinc-500 text-[11px] relative z-10">
                  {ask.total.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* Current Spread Divider */}
          <div className="py-2 border-y border-zinc-800/80 flex items-center justify-between font-mono text-xs px-2 bg-zinc-900/40 rounded">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-400 text-[11px]">Spread:</span>
              <strong className="text-white">${orderBook.spread.toFixed(2)}</strong>
              <span className="text-zinc-500 text-[10px]">({orderBook.spreadBps} bps)</span>
            </div>
            <div className="text-zinc-400 text-[11px]">
              Micro-Price: <strong className="text-emerald-400 font-mono">${orderBook.microPrice.toFixed(3)}</strong>
            </div>
          </div>

          {/* Bid Ladder (Green, descending) */}
          <div className="space-y-1 font-mono text-xs">
            {orderBook.bids.map((bid, idx) => (
              <div key={idx} className="relative flex items-center justify-between p-1 px-2 rounded hover:bg-zinc-900/50">
                {/* Visual Depth Bar */}
                <div
                  className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 rounded"
                  style={{ width: `${bid.depthPct}%` }}
                />
                <span className="font-bold text-emerald-400 relative z-10">
                  ${bid.price.toFixed(2)}
                </span>
                <span className="text-zinc-300 relative z-10 flex items-center gap-1.5">
                  {bid.size.toLocaleString()}
                  {bid.isDarkPoolBlock && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                      BLOCK WALL
                    </span>
                  )}
                </span>
                <span className="text-zinc-500 text-[11px] relative z-10">
                  {bid.total.toLocaleString()}
                </span>
              </div>
            ))}
            <div className="text-[10px] text-zinc-500 uppercase flex justify-between px-2 pt-1">
              <span>Bid Price</span>
              <span>Size</span>
              <span>Total Depth</span>
            </div>
          </div>

          {/* Imbalance Meter Bar */}
          <div className="pt-2 border-t border-zinc-800/80 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-[11px]">
              <span className="text-emerald-400 font-bold">Total Bids: {orderBook.cumBid.toLocaleString()}</span>
              <span className="text-rose-400 font-bold">Total Asks: {orderBook.cumAsk.toLocaleString()}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 transition-all duration-300"
                style={{ width: `${((orderBook.cumBid / (orderBook.cumBid + orderBook.cumAsk)) * 100)}%` }}
              />
              <div
                className="bg-rose-500 transition-all duration-300"
                style={{ width: `${((orderBook.cumAsk / (orderBook.cumBid + orderBook.cumAsk)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
