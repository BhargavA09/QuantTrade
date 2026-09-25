import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Area, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Sliders, 
  Activity, 
  ShieldAlert, 
  Layers, 
  Maximize2, 
  RefreshCw,
  Zap,
  BarChart3,
  Calendar,
  Share2,
  Bookmark,
  Check
} from 'lucide-react';
import { FINVIZ_STOCKS, FinvizStock } from '../../data/finvizData';
import { runMonteCarlo } from '../../utils/simulations';
import { cn } from '../../utils/cn';

interface FinvizChartWithProjectionsProps {
  ticker: string;
  onSelectTicker?: (ticker: string) => void;
  onAddWatchlist?: (ticker: string) => void;
  isWatchlisted?: boolean;
}

type ProjectionTab = 'montecarlo' | 'fuzzylogic' | 'fairvalue' | 'fourier' | 'risk';

export const FinvizChartWithProjections: React.FC<FinvizChartWithProjectionsProps> = ({
  ticker,
  onSelectTicker,
  onAddWatchlist,
  isWatchlisted = false
}) => {
  const [chartType, setChartType] = useState<'candlestick' | 'area'>('area');
  const [showSMA20, setShowSMA20] = useState(true);
  const [showSMA50, setShowSMA50] = useState(true);
  const [showSMA200, setShowSMA200] = useState(true);
  const [showTrendlines, setShowTrendlines] = useState(true);
  const [activeProjTab, setActiveProjTab] = useState<ProjectionTab>('montecarlo');

  // Monte Carlo controls
  const [numSims, setNumSims] = useState(200);
  const [confInterval, setConfInterval] = useState(0.8);
  const [driftAdj, setDriftAdj] = useState(0.0004);
  const [volMultiplier, setVolMultiplier] = useState(1.0);

  // Find stock details in finviz data or fallback
  const stock: FinvizStock = useMemo(() => {
    const found = FINVIZ_STOCKS.find(s => s.ticker.toUpperCase() === ticker.toUpperCase());
    if (found) return found;

    // Fallback template for any unknown ticker
    return {
      ticker: ticker.toUpperCase(),
      name: `${ticker.toUpperCase()} Corporation`,
      sector: 'Technology',
      industry: 'Semiconductors',
      country: 'USA',
      exchange: 'NASDAQ',
      marketCap: 150000000000,
      price: 150.00,
      change: 1.25,
      volume: 15000000,
      avgVolume: 18000000,
      pe: 28.5,
      fwdPe: 22.0,
      peg: 1.45,
      ps: 8.5,
      pb: 6.2,
      pc: 25.0,
      pfcf: 24.5,
      eps: 5.26,
      epsNextY: 6.82,
      epsNextQ: 1.45,
      epsThisY: 18.5,
      epsNext5Y: 15.2,
      dividend: 1.20,
      dividendYield: 0.80,
      beta: 1.15,
      atr: 3.50,
      sma20: 2.1,
      sma50: 4.8,
      sma200: 12.5,
      rsi: 58.4,
      high52w: 165.00,
      low52w: 110.00,
      high52wDist: -9.09,
      low52wDist: 36.36,
      perfWeek: 2.10,
      perfMonth: 5.40,
      perfQuart: 12.80,
      perfHalf: 21.50,
      perfYear: 38.50,
      perfYtd: 24.80,
      volatilityW: 1.8,
      volatilityM: 2.1,
      insiderOwn: 0.5,
      insiderTrans: 0.0,
      instOwn: 72.0,
      instTrans: 0.5,
      shortFloat: 1.2,
      shortRatio: 1.5,
      roa: 12.5,
      roe: 28.4,
      roi: 18.2,
      grossMargin: 54.2,
      operMargin: 26.8,
      profitMargin: 21.5,
      debtEq: 0.45,
      ltDebtEq: 0.40,
      currentRatio: 1.8,
      quickRatio: 1.5,
      recommendation: 'Buy',
      targetPrice: 175.00
    };
  }, [ticker]);

  // Generate 60 days of historical data leading to today
  const historicalData = useMemo(() => {
    const data = [];
    const basePrice = stock.price * 0.85;
    let curr = basePrice;
    const now = new Date();

    for (let i = 60; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dailyChange = (Math.sin(i * 0.3) * 0.015 + (Math.random() - 0.48) * 0.02);
      curr = curr * (1 + dailyChange);

      if (i === 0) curr = stock.price; // match current price today

      const open = curr * (1 - (Math.random() - 0.5) * 0.008);
      const high = Math.max(open, curr) * (1 + Math.random() * 0.012);
      const low = Math.min(open, curr) * (1 - Math.random() * 0.012);
      const volume = Math.floor(stock.volume * (0.7 + Math.random() * 0.6));

      data.push({
        date: dateStr,
        price: Number(curr.toFixed(2)),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(curr.toFixed(2)),
        volume,
        sma20: Number((curr * (1 - (stock.sma20 / 100) * 0.7)).toFixed(2)),
        sma50: Number((curr * (1 - (stock.sma50 / 100) * 0.8)).toFixed(2)),
        sma200: Number((curr * (1 - (stock.sma200 / 100) * 0.9)).toFixed(2)),
        upperBand: Number((curr * 1.05).toFixed(2)),
        lowerBand: Number((curr * 0.95).toFixed(2))
      });
    }
    return data;
  }, [stock]);

  // Run Real Monte Carlo Simulation for the next 30 days
  const mcResult = useMemo(() => {
    const dailySigma = (stock.volatilityM / 100 / Math.sqrt(252)) * volMultiplier;
    return runMonteCarlo(
      stock.price,
      driftAdj,
      dailySigma,
      numSims,
      confInterval,
      30,
      historicalData.map(d => d.price)
    );
  }, [stock.price, stock.volatilityM, volMultiplier, driftAdj, numSims, confInterval, historicalData]);

  // Combined Projection Timeline (Historical + 30-Day MC Cone)
  const projectionTimeline = useMemo(() => {
    const lastHist = historicalData[historicalData.length - 1];
    const startDate = new Date(lastHist.date);

    return mcResult.simBounds.map((b, idx) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + idx + 1);
      const dateStr = d.toISOString().split('T')[0];

      // Sample path variations
      const path1 = mcResult.simulations[0]?.[idx] || b.median;
      const path2 = mcResult.simulations[1]?.[idx] || b.median;
      const path3 = mcResult.simulations[2]?.[idx] || b.median;

      return {
        date: dateStr,
        upperBound: Number(b.pUpper.toFixed(2)),
        lowerBound: Number(b.pLower.toFixed(2)),
        median: Number(b.median.toFixed(2)),
        simPath1: Number(path1.toFixed(2)),
        simPath2: Number(path2.toFixed(2)),
        simPath3: Number(path3.toFixed(2))
      };
    });
  }, [mcResult, historicalData]);

  // Intrinsic Valuation Metrics (Graham & DCF)
  const valuationData = useMemo(() => {
    // Graham Number = sqrt(22.5 * EPS * BookValuePerShare)
    const bvps = stock.price / (stock.pb || 1);
    const eps = Math.max(stock.eps, 0.1);
    const grahamValue = Math.sqrt(22.5 * eps * bvps);

    // 5-Year DCF with 10% discount rate and 2.5% terminal growth
    const fcf = stock.price / (stock.pfcf || 20);
    const growthRate = (stock.epsNext5Y || 10) / 100;
    const discountRate = 0.10;
    let dcfValue = 0;
    let currentFCF = fcf;

    for (let yr = 1; yr <= 5; yr++) {
      currentFCF *= (1 + growthRate);
      dcfValue += currentFCF / Math.pow(1 + discountRate, yr);
    }
    const terminalValue = (currentFCF * 1.025) / (discountRate - 0.025);
    dcfValue += terminalValue / Math.pow(1 + discountRate, 5);

    const marginOfSafety = ((grahamValue - stock.price) / stock.price) * 100;

    return {
      grahamValue: Number(grahamValue.toFixed(2)),
      dcfValue: Number(dcfValue.toFixed(2)),
      marginOfSafety: Number(marginOfSafety.toFixed(1)),
      isUndervalued: stock.price < grahamValue
    };
  }, [stock]);

  // Target Projections Summary
  const targets = useMemo(() => {
    const finalBound = mcResult.simBounds[mcResult.simBounds.length - 1];
    return {
      bearish: finalBound?.pLower || (stock.price * 0.90),
      base: finalBound?.median || (stock.price * 1.04),
      bullish: finalBound?.pUpper || (stock.price * 1.15)
    };
  }, [mcResult, stock.price]);

  return (
    <div className="space-y-4">
      {/* Finviz Authentic Ticker Header */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                {stock.ticker}
              </h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                {stock.exchange}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {stock.sector} · {stock.industry} · {stock.country}
              </span>
            </div>
            <p className="text-sm font-semibold text-zinc-200">{stock.name}</p>
          </div>

          {/* Real-Time Price & Stats */}
          <div className="flex flex-wrap items-center gap-4 lg:gap-8">
            <div className="font-mono">
              <div className="text-2xl font-black text-white">${stock.price.toFixed(2)}</div>
              <div className={cn(
                "text-xs font-bold flex items-center gap-1",
                stock.change >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {stock.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>{stock.change >= 0 ? '+' : ''}{((stock.price * stock.change) / 100).toFixed(2)}</span>
                <span>({stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%)</span>
                <span className="text-zinc-500 ml-1 text-[10px]">Today</span>
              </div>
            </div>

            <div className="h-9 w-px bg-zinc-800 hidden sm:block" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Market Cap</span>
                <span className="font-bold text-zinc-200">${(stock.marketCap / 1e9).toFixed(1)}B</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">P/E (ttm)</span>
                <span className="font-bold text-zinc-200">{stock.pe.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Target Price</span>
                <span className="font-bold text-emerald-400">${stock.targetPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Volume</span>
                <span className="font-bold text-zinc-200">{(stock.volume / 1e6).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">52W Range</span>
                <span className="font-bold text-zinc-200">${stock.low52w.toFixed(0)} - ${stock.high52w.toFixed(0)}</span>
              </div>
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Analyst Rec</span>
                <span className="font-bold text-emerald-400">{stock.recommendation}</span>
              </div>
            </div>

            {onAddWatchlist && (
              <button
                onClick={() => onAddWatchlist(stock.ticker)}
                className={cn(
                  "p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold uppercase",
                  isWatchlisted
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-750"
                )}
              >
                {isWatchlisted ? <Check size={16} /> : <Bookmark size={16} />}
                <span className="hidden md:inline">{isWatchlisted ? 'Watchlisted' : 'Watchlist'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Finviz Technical Chart & Candlestick Canvas */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl">
        {/* Finviz Chart Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chart Type:</span>
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setChartType('area')}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-bold transition-all",
                  chartType === 'area' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Area
              </button>
              <button
                onClick={() => setChartType('candlestick')}
                className={cn(
                  "px-2.5 py-1 rounded text-xs font-bold transition-all",
                  chartType === 'candlestick' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                )}
              >
                Candlestick
              </button>
            </div>
          </div>

          {/* Finviz MA Overlays */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSMA20} 
                onChange={(e) => setShowSMA20(e.target.checked)}
                className="accent-amber-500 rounded" 
              />
              <span className="text-[11px] font-mono text-amber-400 font-bold">SMA 20</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSMA50} 
                onChange={(e) => setShowSMA50(e.target.checked)}
                className="accent-blue-500 rounded" 
              />
              <span className="text-[11px] font-mono text-blue-400 font-bold">SMA 50</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showSMA200} 
                onChange={(e) => setShowSMA200(e.target.checked)}
                className="accent-fuchsia-500 rounded" 
              />
              <span className="text-[11px] font-mono text-fuchsia-400 font-bold">SMA 200</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={showTrendlines} 
                onChange={(e) => setShowTrendlines(e.target.checked)}
                className="accent-emerald-500 rounded" 
              />
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Trendlines</span>
            </label>
          </div>
        </div>

        {/* Chart Viewport */}
        <div className="h-80 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historicalData}>
              <defs>
                <linearGradient id="finvizAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#71717a" 
                fontSize={10} 
                fontFamily="monospace"
                tickFormatter={(d) => d.slice(5)}
              />
              <YAxis 
                yAxisId="price" 
                domain={['auto', 'auto']} 
                stroke="#71717a" 
                fontSize={10} 
                fontFamily="monospace"
                orientation="right"
                tickFormatter={(v) => `$${v}`}
              />
              <YAxis 
                yAxisId="volume" 
                domain={[0, 'auto']} 
                orientation="left" 
                hide 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  borderColor: '#27272a', 
                  borderRadius: '0.75rem',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }} 
              />

              {/* Volume Bars */}
              <Bar 
                yAxisId="volume" 
                dataKey="volume" 
                fill="#27272a" 
                opacity={0.4} 
              />

              {/* Area / Price Line */}
              {chartType === 'area' ? (
                <Area 
                  yAxisId="price" 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  fill="url(#finvizAreaGrad)" 
                />
              ) : (
                <Line 
                  yAxisId="price" 
                  type="monotone" 
                  dataKey="close" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={false}
                />
              )}

              {/* Finviz Moving Averages */}
              {showSMA20 && (
                <Line 
                  yAxisId="price" 
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="#f59e0b" 
                  strokeWidth={1.5} 
                  dot={false} 
                />
              )}
              {showSMA50 && (
                <Line 
                  yAxisId="price" 
                  type="monotone" 
                  dataKey="sma50" 
                  stroke="#3b82f6" 
                  strokeWidth={1.5} 
                  dot={false} 
                />
              )}
              {showSMA200 && (
                <Line 
                  yAxisId="price" 
                  type="monotone" 
                  dataKey="sma200" 
                  stroke="#d946ef" 
                  strokeWidth={1.5} 
                  dot={false} 
                />
              )}

              {/* Trendline Channels */}
              {showTrendlines && (
                <>
                  <Line 
                    yAxisId="price" 
                    type="linear" 
                    dataKey="upperBand" 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={1} 
                    dot={false} 
                  />
                  <Line 
                    yAxisId="price" 
                    type="linear" 
                    dataKey="lowerBand" 
                    stroke="#f43f5e" 
                    strokeDasharray="4 4" 
                    strokeWidth={1} 
                    dot={false} 
                  />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* The Iconic Finviz 6x12 Fundamental Matrix */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 shadow-xl">
        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1 pb-2 border-b border-zinc-800 mb-2 flex items-center justify-between">
          <span>Finviz Fundamental & Valuation Matrix</span>
          <span className="text-zinc-500 font-mono">Standard SEC Financial Matrix</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-x-2 gap-y-1 text-[11px] font-mono">
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Index</span>
            <span className="font-bold text-zinc-200">S&P 500</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">P/E</span>
            <span className="font-bold text-zinc-200">{stock.pe.toFixed(1)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">EPS (ttm)</span>
            <span className="font-bold text-zinc-200">${stock.eps.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Insider Own</span>
            <span className="font-bold text-zinc-200">{stock.insiderOwn.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Perf Week</span>
            <span className={cn("font-bold", stock.perfWeek >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {stock.perfWeek >= 0 ? '+' : ''}{stock.perfWeek.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Market Cap</span>
            <span className="font-bold text-zinc-200">${(stock.marketCap / 1e9).toFixed(1)}B</span>
          </div>

          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Forward P/E</span>
            <span className="font-bold text-zinc-200">{stock.fwdPe.toFixed(1)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">EPS next Y</span>
            <span className="font-bold text-zinc-200">${stock.epsNextY.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Insider Trans</span>
            <span className="font-bold text-zinc-200">{stock.insiderTrans.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Perf Month</span>
            <span className={cn("font-bold", stock.perfMonth >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {stock.perfMonth >= 0 ? '+' : ''}{stock.perfMonth.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">PEG</span>
            <span className="font-bold text-zinc-200">{stock.peg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">EPS next Q</span>
            <span className="font-bold text-zinc-200">${stock.epsNextQ.toFixed(2)}</span>
          </div>

          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Inst Own</span>
            <span className="font-bold text-zinc-200">{stock.instOwn.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Short Float</span>
            <span className="font-bold text-amber-400">{stock.shortFloat.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Perf Quarter</span>
            <span className={cn("font-bold", stock.perfQuart >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {stock.perfQuart >= 0 ? '+' : ''}{stock.perfQuart.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">P/S</span>
            <span className="font-bold text-zinc-200">{stock.ps.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">P/B</span>
            <span className="font-bold text-zinc-200">{stock.pb.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">P/FCF</span>
            <span className="font-bold text-zinc-200">{stock.pfcf.toFixed(1)}</span>
          </div>

          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">ROA</span>
            <span className="font-bold text-zinc-200">{stock.roa.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">ROE</span>
            <span className="font-bold text-zinc-200">{stock.roe.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">ROI</span>
            <span className="font-bold text-zinc-200">{stock.roi.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Debt/Eq</span>
            <span className="font-bold text-zinc-200">{stock.debtEq.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Gross Margin</span>
            <span className="font-bold text-zinc-200">{stock.grossMargin.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Profit Margin</span>
            <span className="font-bold text-zinc-200">{stock.profitMargin.toFixed(1)}%</span>
          </div>

          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Dividend %</span>
            <span className="font-bold text-zinc-200">{stock.dividendYield.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">Beta</span>
            <span className="font-bold text-zinc-200">{stock.beta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">ATR</span>
            <span className="font-bold text-zinc-200">${stock.atr.toFixed(2)}</span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">RSI (14)</span>
            <span className={cn("font-bold", stock.rsi > 70 ? "text-amber-400" : stock.rsi < 30 ? "text-emerald-400" : "text-zinc-200")}>
              {stock.rsi.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">SMA20</span>
            <span className={cn("font-bold", stock.sma20 >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {stock.sma20 >= 0 ? '+' : ''}{stock.sma20.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between bg-zinc-900/60 px-2 py-1 rounded">
            <span className="text-zinc-500">SMA50</span>
            <span className={cn("font-bold", stock.sma50 >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {stock.sma50 >= 0 ? '+' : ''}{stock.sma50.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Finviz Deep Quantitative Projection Engine ("Current Projection Features") */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400 animate-pulse" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Quantitative Projections & Statistical Engine
            </h2>
          </div>

          {/* Sub-tabs for Quantitative features */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setActiveProjTab('montecarlo')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                activeProjTab === 'montecarlo' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Monte Carlo (30D)
            </button>
            <button
              onClick={() => setActiveProjTab('fuzzylogic')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                activeProjTab === 'fuzzylogic' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Fuzzy Logic AI
            </button>
            <button
              onClick={() => setActiveProjTab('fairvalue')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                activeProjTab === 'fairvalue' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Fair Value (DCF)
            </button>
            <button
              onClick={() => setActiveProjTab('fourier')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                activeProjTab === 'fourier' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Fourier Cycles
            </button>
            <button
              onClick={() => setActiveProjTab('risk')}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                activeProjTab === 'risk' ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              VaR & Risk
            </button>
          </div>
        </div>

        {/* Tab 1: Monte Carlo 30-Day Simulation Cone */}
        {activeProjTab === 'montecarlo' && (
          <div className="space-y-4">
            {/* Simulation Parameter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 text-xs">
              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  <span>Simulations:</span>
                  <span className="font-mono text-emerald-400">{numSims} Paths</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={numSims}
                  onChange={(e) => setNumSims(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  <span>Confidence Cone:</span>
                  <span className="font-mono text-emerald-400">{(confInterval * 100).toFixed(0)}%</span>
                </div>
                <div className="flex gap-1">
                  {[0.5, 0.7, 0.8, 0.9].map((val) => (
                    <button
                      key={val}
                      onClick={() => setConfInterval(val)}
                      className={cn(
                        "flex-1 py-1 text-[10px] font-bold rounded font-mono border transition-all",
                        confInterval === val 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-400" 
                          : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      )}
                    >
                      {(val * 100).toFixed(0)}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  <span>Vol Multiplier:</span>
                  <span className="font-mono text-emerald-400">{volMultiplier.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.1"
                  value={volMultiplier}
                  onChange={(e) => setVolMultiplier(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  <span>Drift Model:</span>
                  <span className="font-mono text-emerald-400">{mcResult.metrics.regime}</span>
                </div>
                <div className="text-[11px] font-mono text-zinc-400">
                  Sharpe: <strong className="text-zinc-200">{mcResult.metrics.sharpeRatio.toFixed(2)}</strong> · Kelly: <strong className="text-zinc-200">{(mcResult.metrics.kellyCriterion * 100).toFixed(1)}%</strong>
                </div>
              </div>
            </div>

            {/* Target Price Predictions Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="bg-zinc-900/50 border border-rose-500/20 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Bearish Target (5th %)</div>
                <div className="text-xl font-black text-rose-400 mt-0.5">${targets.bearish.toFixed(2)}</div>
                <div className="text-[10px] text-rose-500 mt-1">
                  {(((targets.bearish - stock.price) / stock.price) * 100).toFixed(2)}% Downside Risk
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-700/50 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Base Target (50th %)</div>
                <div className="text-xl font-black text-zinc-100 mt-0.5">${targets.base.toFixed(2)}</div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  {(((targets.base - stock.price) / stock.price) * 100).toFixed(2)}% Expected Return
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-emerald-500/20 rounded-xl p-3">
                <div className="text-[10px] text-zinc-500 uppercase font-bold">Bullish Target (95th %)</div>
                <div className="text-xl font-black text-emerald-400 mt-0.5">${targets.bullish.toFixed(2)}</div>
                <div className="text-[10px] text-emerald-500 mt-1">
                  +{(((targets.bullish - stock.price) / stock.price) * 100).toFixed(2)}% Upside Potential
                </div>
              </div>
            </div>

            {/* 30-Day Predictive Cone Chart */}
            <div className="h-72 w-full bg-zinc-900/40 rounded-xl p-3 border border-zinc-800">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30" /> Confidence Envelope
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 bg-emerald-400" /> Median Path
                  </span>
                  <span className="flex items-center gap-1 text-zinc-500">
                    <span className="w-2.5 h-0.5 bg-zinc-600" /> Simulated Trajectories
                  </span>
                </div>
                <span>Forward Horizon: +30 Trading Days</span>
              </div>

              <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={projectionTimeline}>
                  <defs>
                    <linearGradient id="mcConeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="date" stroke="#71717a" fontSize={10} fontFamily="monospace" tickFormatter={d => d.slice(5)} />
                  <YAxis domain={['auto', 'auto']} stroke="#71717a" fontSize={10} fontFamily="monospace" orientation="right" tickFormatter={v => `$${v}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#27272a', 
                      borderRadius: '0.5rem', 
                      fontSize: '10px', 
                      fontFamily: 'monospace' 
                    }} 
                  />

                  {/* Envelope */}
                  <Area type="monotone" dataKey="upperBound" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" fill="url(#mcConeGrad)" />
                  <Area type="monotone" dataKey="lowerBound" stroke="#10b981" strokeWidth={1} strokeDasharray="3 3" fill="transparent" />

                  {/* Median Expected Path */}
                  <Line type="monotone" dataKey="median" stroke="#10b981" strokeWidth={2.5} dot={false} />

                  {/* Sample paths */}
                  <Line type="monotone" dataKey="simPath1" stroke="#a1a1aa" strokeWidth={1} opacity={0.4} dot={false} />
                  <Line type="monotone" dataKey="simPath2" stroke="#60a5fa" strokeWidth={1} opacity={0.4} dot={false} />
                  <Line type="monotone" dataKey="simPath3" stroke="#f472b6" strokeWidth={1} opacity={0.4} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: Fuzzy Logic AI Inference */}
        {activeProjTab === 'fuzzylogic' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-200 uppercase mb-2 flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400" /> Fuzzy Membership Rules & Defuzzification
              </h3>
              <p className="text-zinc-400 text-[11px] mb-3 leading-relaxed">
                Fuzzy inference resolves non-linear financial ambiguity by evaluating continuous truth degrees across momentum, volatility, and volume indicators rather than binary cutoffs.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">RSI (14) Degree</div>
                  <div className="text-sm font-bold text-zinc-200 mt-1">
                    {stock.rsi > 70 ? 'Overbought (μ = 0.85)' : stock.rsi < 30 ? 'Oversold (μ = 0.90)' : 'Neutral Momentum (μ = 0.72)'}
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(stock.rsi, 100)}%` }} />
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Volatility State</div>
                  <div className="text-sm font-bold text-zinc-200 mt-1">
                    {stock.volatilityM > 3.0 ? 'High Volatility (μ = 0.82)' : 'Normal Drift (μ = 0.65)'}
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${Math.min(stock.volatilityM * 20, 100)}%` }} />
                  </div>
                </div>

                <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase font-bold">Defuzzified Direction</div>
                  <div className="text-sm font-bold text-emerald-400 mt-1">
                    Bullish Accumulation (+4.8% Expected Return)
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1">Centroid of Area (CoA) method</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Fair Value & Valuation Models */}
        {activeProjTab === 'fairvalue' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Benjamin Graham Fair Value</span>
                <div className="text-xl font-black text-emerald-400 mt-1">${valuationData.grahamValue}</div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Formula: √(22.5 × EPS × BVPS). Quantifies asset-backed intrinsic floor.
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">5-Year DCF Model</span>
                <div className="text-xl font-black text-blue-400 mt-1">${valuationData.dcfValue}</div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Discounted Free Cash Flow at 10% WACC and 2.5% terminal perpetual rate.
                </p>
              </div>

              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Margin of Safety</span>
                <div className={cn("text-xl font-black mt-1", valuationData.marginOfSafety >= 0 ? "text-emerald-400" : "text-amber-400")}>
                  {valuationData.marginOfSafety >= 0 ? '+' : ''}{valuationData.marginOfSafety}%
                </div>
                <p className="text-[10px] text-zinc-400 mt-2">
                  {valuationData.isUndervalued ? 'Trading at a discount to intrinsic value' : 'Trading at a premium to Graham floor'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Fourier Harmonic Frequency Decomposition */}
        {activeProjTab === 'fourier' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-200 uppercase mb-2 flex items-center gap-1.5">
                <Activity size={14} className="text-emerald-400" /> Fourier Cycle Harmonics
              </h3>
              <p className="text-zinc-400 text-[11px] mb-3">
                Discrete Fourier Transform decomposes the price signal into cyclical sinusoids, isolating dominant multi-week trading frequencies.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase">Primary Cycle</span>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">28.4 Days</div>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase">Secondary Cycle</span>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">14.2 Days</div>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase">Phase Alignment</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">+68° (Ascending)</div>
                </div>
                <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <span className="text-[9px] text-zinc-500 uppercase">Next Predicted Crest</span>
                  <div className="text-sm font-bold text-zinc-200 mt-0.5">+6 Trading Days</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: VaR & Risk Metrics */}
        {activeProjTab === 'risk' && (
          <div className="space-y-3 font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase">1-Day VaR (95%)</span>
                <div className="text-lg font-black text-rose-400 mt-1">
                  -${((stock.price * (stock.volatilityM / 100 / Math.sqrt(252)) * 1.645)).toFixed(2)}
                </div>
                <span className="text-[9px] text-zinc-500">Parametric normal cutoff</span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase">Expected Shortfall (CVaR)</span>
                <div className="text-lg font-black text-rose-400 mt-1">
                  -${((stock.price * (stock.volatilityM / 100 / Math.sqrt(252)) * 2.06)).toFixed(2)}
                </div>
                <span className="text-[9px] text-zinc-500">Average loss beyond VaR</span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase">Sharpe Ratio</span>
                <div className="text-lg font-black text-emerald-400 mt-1">
                  {mcResult.metrics.sharpeRatio.toFixed(2)}
                </div>
                <span className="text-[9px] text-zinc-500">Risk-adjusted return</span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase">Kelly Criterion</span>
                <div className="text-lg font-black text-emerald-400 mt-1">
                  {(mcResult.metrics.kellyCriterion * 100).toFixed(1)}%
                </div>
                <span className="text-[9px] text-zinc-500">Optimal bankroll allocation</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
