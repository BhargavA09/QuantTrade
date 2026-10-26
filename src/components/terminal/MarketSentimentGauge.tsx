import React, { useState, useEffect, useMemo } from 'react';
import { 
  Gauge, 
  RotateCw, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Waves, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { 
  sentimentGaugeService, 
  FearGreedData, 
  FourierSentimentConfluence, 
  FearGreedRating 
} from '../../services/api/sentimentGaugeService';
import { HighFrequencyMetrics } from '../../services/api/signalProcessing';

interface MarketSentimentGaugeProps {
  ticker?: string;
  currentPrice?: number;
  fourierMetrics?: HighFrequencyMetrics | null;
  onTradeSignal?: (bias: 'LONG' | 'SHORT', setupName: string) => void;
  compact?: boolean;
}

export const MarketSentimentGauge: React.FC<MarketSentimentGaugeProps> = ({
  ticker = 'NVDA',
  currentPrice = 138.80,
  fourierMetrics = null,
  onTradeSignal,
  compact = false
}) => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'gauge' | 'fourier_confluence' | 'factors'>('gauge');
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await sentimentGaugeService.getFearAndGreedIndex();
      setData(result);
    } catch (e) {
      console.warn('Error loading Fear & Greed index:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  // Compute Fourier & Sentiment Confluence
  const confluence: FourierSentimentConfluence | null = useMemo(() => {
    if (!data) return null;
    return sentimentGaugeService.getFourierSentimentConfluence(fourierMetrics, data, ticker);
  }, [data, fourierMetrics, ticker]);

  if (!data) {
    return (
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 animate-pulse flex items-center justify-center min-h-[220px]">
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-xs">
          <RotateCw className="w-4 h-4 animate-spin text-emerald-400" />
          <span>Synchronizing Real-Time Market Sentiment & Fear/Greed Telemetry...</span>
        </div>
      </div>
    );
  }

  // Calculate needle angle for SVG gauge: 0 score = -90 deg (left), 100 score = +90 deg (right)
  const needleAngle = (data.score / 100) * 180 - 90;

  const getRatingColor = (rating: FearGreedRating) => {
    switch (rating) {
      case 'Extreme Fear': return 'text-rose-400';
      case 'Fear': return 'text-orange-400';
      case 'Neutral': return 'text-amber-400';
      case 'Greed': return 'text-emerald-400';
      case 'Extreme Greed': return 'text-cyan-400';
      default: return 'text-zinc-300';
    }
  };

  const getRatingBg = (rating: FearGreedRating) => {
    switch (rating) {
      case 'Extreme Fear': return 'bg-rose-500/15 border-rose-500/30 text-rose-300';
      case 'Fear': return 'bg-orange-500/15 border-orange-500/30 text-orange-300';
      case 'Neutral': return 'bg-amber-500/15 border-amber-500/30 text-amber-300';
      case 'Greed': return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      case 'Extreme Greed': return 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300';
      default: return 'bg-zinc-800 text-zinc-300';
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/80 border border-zinc-800 overflow-hidden shadow-2xl space-y-4 p-5 lg:p-6 transition-all">
      {/* 1. Header with Mode Tabs and Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-amber-400 shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Market Sentiment & Fear/Greed Index
            </h2>
            <button 
              onClick={() => setShowTooltip(!showTooltip)} 
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Click for index calculation details"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
            <span className="text-emerald-400">Live Telemetry</span>
            <span className="text-zinc-600">·</span>
            <span>Refreshed: {data.lastUpdated}</span>
            <span className="text-zinc-600 hidden sm:inline">·</span>
            <span className="hidden sm:inline">6 Institutional Multi-Factors</span>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono font-medium">
            <button
              onClick={() => setActiveTab('gauge')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'gauge'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Gauge Dial
            </button>
            <button
              onClick={() => setActiveTab('fourier_confluence')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeTab === 'fourier_confluence'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fourier Confluence</span>
            </button>
            <button
              onClick={() => setActiveTab('factors')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'factors'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              6 Drivers
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors disabled:opacity-50"
            title="Refresh Fear & Greed Index"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Explanatory banner if tooltip clicked */}
      {showTooltip && (
        <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 leading-relaxed font-sans space-y-1">
          <p className="font-semibold text-white">How the Market Sentiment Index is Calculated:</p>
          <p className="text-zinc-400">
            Synthesizes 6 institutional drivers: S&P 500 momentum vs 125-day moving average, 52-week stock price highs/lows, VIX 30-day implied volatility, CBOE put/call volume skew, junk bond yield spreads, and stock vs bond safe-haven demand.
          </p>
        </div>
      )}

      {/* 2. Main Content Sections */}
      {activeTab === 'gauge' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left 6 Cols: Semi-Circular Radial Speedometer Gauge */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="relative w-64 h-36 sm:w-72 sm:h-40 flex items-end justify-center">
              <svg viewBox="0 0 200 115" className="w-full h-full overflow-visible">
                <defs>
                  {/* Gauge Arc Gradient */}
                  <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" />    {/* Extreme Fear: Crimson */}
                    <stop offset="25%" stopColor="#f97316" />   {/* Fear: Orange */}
                    <stop offset="50%" stopColor="#eab308" />   {/* Neutral: Yellow */}
                    <stop offset="75%" stopColor="#10b981" />   {/* Greed: Emerald */}
                    <stop offset="100%" stopColor="#06b6d4" />  {/* Extreme Greed: Cyan */}
                  </linearGradient>

                  <filter id="needleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.6"/>
                  </filter>
                </defs>

                {/* Background Track Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* Colored Value Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="url(#fearGreedGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />

                {/* Sub-divider tick marks */}
                {[20, 36, 50, 64, 80].map((pct, idx) => {
                  const angle = (pct / 100) * Math.PI;
                  const x1 = 100 - 72 * Math.cos(angle);
                  const y1 = 100 - 72 * Math.sin(angle);
                  const x2 = 100 - 88 * Math.cos(angle);
                  const y2 = 100 - 88 * Math.sin(angle);
                  return (
                    <line
                      key={idx}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#18181b"
                      strokeWidth="2"
                    />
                  );
                })}

                {/* Needle Pointer */}
                <g 
                  transform={`translate(100, 100) rotate(${needleAngle})`}
                  style={{ transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  filter="url(#needleGlow)"
                >
                  <polygon
                    points="0,-72 -3.5,-12 3.5,-12"
                    fill="#ffffff"
                  />
                  <circle cx="0" cy="0" r="7" fill="#ffffff" />
                  <circle cx="0" cy="0" r="3" fill="#18181b" />
                </g>
              </svg>

              {/* Digital Score Overlay */}
              <div className="absolute bottom-0 text-center pointer-events-none">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white tabular-nums">
                  {data.score}
                </span>
                <span className="text-[10px] uppercase font-bold text-zinc-500 block font-mono">
                  Index Score (0 - 100)
                </span>
              </div>
            </div>

            {/* Rating Tag */}
            <div className="mt-3 text-center space-y-1">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black uppercase font-mono border ${getRatingBg(data.rating)}`}>
                {data.rating}
              </span>
              <p className="text-xs text-zinc-400 max-w-xs text-center line-clamp-2">
                {data.macroSummary}
              </p>
            </div>
          </div>

          {/* Right 6 Cols: Historical Track & Key Context */}
          <div className="lg:col-span-6 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Historical Regime Progression</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Current</span>
                <span className={`text-lg font-black font-mono tabular-nums ${getRatingColor(data.rating)}`}>
                  {data.score}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">{data.rating}</span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">Previous Close</span>
                <span className="text-lg font-black font-mono text-zinc-200 tabular-nums">
                  {data.previousClose}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {sentimentGaugeService.getRating(data.previousClose)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">1 Week Ago</span>
                <span className="text-lg font-black font-mono text-zinc-200 tabular-nums">
                  {data.oneWeekAgo}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {sentimentGaugeService.getRating(data.oneWeekAgo)}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block">1 Month Ago</span>
                <span className="text-lg font-black font-mono text-zinc-200 tabular-nums">
                  {data.oneMonthAgo}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {sentimentGaugeService.getRating(data.oneMonthAgo)}
                </span>
              </div>
            </div>

            {/* Quick Fourier Context Hook */}
            {confluence && (
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white">Fourier Signal Confluence ({ticker})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono ${
                    confluence.signalBias.includes('LONG') ? 'bg-emerald-500/20 text-emerald-300' :
                    (confluence.signalBias.includes('SHORT') ? 'bg-rose-500/20 text-rose-300' : 'bg-zinc-800 text-zinc-300')
                  }`}>
                    {confluence.signalBias.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {confluence.actionableThesis}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-indigo-500/20 text-[11px] font-mono">
                  <span className="text-zinc-400">
                    Fourier Z: <strong className={confluence.fourierZScore < 0 ? 'text-emerald-400' : 'text-amber-400'}>
                      {confluence.fourierZScore >= 0 ? '+' : ''}{confluence.fourierZScore.toFixed(2)}σ
                    </strong>
                  </span>
                  <button
                    onClick={() => setActiveTab('fourier_confluence')}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                  >
                    <span>Full Analysis</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Fourier Signal Filtering Confluence Tab */}
      {activeTab === 'fourier_confluence' && confluence && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-zinc-950 to-zinc-950 border border-indigo-500/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider font-mono">
                  Algorithmic Confluence Synthesis
                </span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Waves className="w-4 h-4 text-cyan-400" />
                  <span>{confluence.regimeTitle}</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-zinc-400">
                  Confluence Edge: <strong className="text-emerald-400 font-bold">{confluence.confluenceScore}%</strong>
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono border ${
                  confluence.signalBias.includes('LONG') ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  (confluence.signalBias.includes('SHORT') ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-zinc-800 text-zinc-300 border-zinc-700')
                }`}>
                  {confluence.signalBias.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
              {confluence.actionableThesis}
            </p>

            {/* Fourier Metrics & Institutional Setup Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 text-xs font-mono">
              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Fourier Residual (Z)</span>
                <span className={`text-base font-black ${confluence.fourierZScore < -1.4 ? 'text-emerald-400' : (confluence.fourierZScore > 1.4 ? 'text-rose-400' : 'text-zinc-200')}`}>
                  {confluence.fourierZScore >= 0 ? '+' : ''}{confluence.fourierZScore.toFixed(2)}σ
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">
                  {confluence.fourierZScore < -1.4 ? 'Micro Oversold Dip' : (confluence.fourierZScore > 1.4 ? 'Micro Overbought' : 'Stationary Noise')}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Macro Fear & Greed</span>
                <span className={`text-base font-black ${getRatingColor(confluence.fearGreedRating)}`}>
                  {confluence.fearGreedScore}/100
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">{confluence.fearGreedRating}</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Dominant Harmonic</span>
                <span className="text-base font-black text-cyan-400">
                  {confluence.dominantPeriodDays.toFixed(1)} Days
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">{confluence.recommendedSetup.cycleStage}</span>
              </div>

              <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase block">Risk:Reward captured</span>
                <span className="text-base font-black text-emerald-400">
                  {confluence.recommendedSetup.riskRewardRatio}
                </span>
                <span className="text-[10px] text-zinc-400 block truncate">{confluence.recommendedSetup.stopBuffer}</span>
              </div>
            </div>

            {/* Caution & Action Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-850 text-xs">
              <div className="flex items-center gap-2 text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{confluence.keyCaution}</span>
              </div>

              {onTradeSignal && (
                <button
                  onClick={() => onTradeSignal(
                    confluence.signalBias.includes('SHORT') ? 'SHORT' : 'LONG',
                    `Fourier Harmonic + ${confluence.fearGreedRating} Confluence`
                  )}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center gap-1.5 shadow-md"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Execute {confluence.signalBias.includes('SHORT') ? 'Short' : 'Long'} Paper Trade</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. 6 Institutional Sub-Drivers Tab */}
      {activeTab === 'factors' && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Decomposition of the 6 fundamental market drivers determining current sentiment positioning:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.indicators.map((ind) => (
              <div key={ind.id} className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{ind.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getRatingBg(ind.rating)}`}>
                    {ind.rating} ({ind.score})
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      ind.score < 25 ? 'bg-rose-500' :
                      (ind.score < 45 ? 'bg-orange-500' :
                      (ind.score <= 55 ? 'bg-amber-500' :
                      (ind.score <= 75 ? 'bg-emerald-500' : 'bg-cyan-500')))
                    }`}
                    style={{ width: `${ind.score}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-300">{ind.value}</span>
                  <span className="text-zinc-500">Weight: {Math.round(ind.weight * 100)}%</span>
                </div>

                <p className="text-[11px] text-zinc-400 leading-snug">
                  {ind.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
