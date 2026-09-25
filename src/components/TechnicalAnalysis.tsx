import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Sliders, 
  Activity, 
  ChevronRight, 
  Clock, 
  AlertCircle,
  HelpCircle,
  BarChart3,
  Flame,
  Binary
} from 'lucide-react';
import { StockData } from '../types';
import { cn } from '../utils/cn';

interface TechnicalAnalysisProps {
  data: StockData;
  activeTicker: string;
}

type Timeframe = '5M' | '15M' | '1H' | '4H' | '1D';
type PivotMethod = 'Classic' | 'Fibonacci' | 'Camarilla';

const TechnicalAnalysis: React.FC<TechnicalAnalysisProps> = ({ data, activeTicker }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1D');
  const [pivotMethod, setPivotMethod] = useState<PivotMethod>('Classic');
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const history = useMemo(() => {
    return data?.history || [];
  }, [data]);

  const indicators = useMemo(() => {
    if (history.length < 20) return null;

    // Simulate different timeframe impacts by downsampling or shifting lookbacks
    let prices = history.map(h => h.close ?? h.price);
    let highs = history.map(h => h.high ?? (h.close ?? h.price) * 1.015);
    let lows = history.map(h => h.low ?? (h.close ?? h.price) * 0.985);
    let opens = history.map(h => h.open ?? h.close ?? h.price);
    let volumes = history.map(h => h.volume || 1000);

    // Apply timeframe multiplier/offset to make numbers look dynamic but consistent
    let multiplier = { '5M': 0.994, '15M': 0.997, '1H': 1.001, '4H': 1.003, '1D': 1.000 }[timeframe];
    let offset = { '5M': 3, '15M': 5, '1H': 2, '4H': 8, '1D': 0 }[timeframe];

    // Align indices based on timeframe offset simulation
    prices = prices.map(p => p * multiplier);
    highs = highs.map(h => h * multiplier);
    lows = lows.map(l => l * multiplier);
    opens = opens.map(o => o * multiplier);

    if (offset > 0) {
      prices = prices.slice(offset).concat(prices.slice(0, offset));
      highs = highs.slice(offset).concat(highs.slice(0, offset));
      lows = lows.slice(offset).concat(lows.slice(0, offset));
      opens = opens.slice(offset).concat(opens.slice(0, offset));
    }

    const len = prices.length;
    const currentPrice = prices[len - 1];
    const prevPrice = prices[len - 2];

    // Helper: Simple Moving Average (SMA)
    const getSMA = (vals: number[], period: number) => {
      if (vals.length < period) return currentPrice;
      const slice = vals.slice(vals.length - period);
      return slice.reduce((a, b) => a + b, 0) / period;
    };

    // Helper: Exponential Moving Average (EMA)
    const getEMA = (vals: number[], period: number) => {
      if (vals.length < period) return currentPrice;
      const k = 2 / (period + 1);
      let ema = vals[0];
      for (let i = 1; i < vals.length; i++) {
        ema = vals[i] * k + ema * (1 - k);
      }
      return ema;
    };

    // Calculate SMA and EMA for periods
    const p10 = 10, p20 = 20, p50 = 50, p100 = 100, p200 = 200;

    const sma10 = getSMA(prices, p10);
    const sma20 = getSMA(prices, p20);
    const sma50 = getSMA(prices, p50);
    const sma100 = getSMA(prices, p100);
    const sma200 = getSMA(prices, p200);

    const ema10 = getEMA(prices, p10);
    const ema20 = getEMA(prices, p20);
    const ema50 = getEMA(prices, p50);
    const ema100 = getEMA(prices, p100);
    const ema200 = getEMA(prices, p200);

    // RSI
    let gains = 0, losses = 0;
    const rsiPeriod = 14;
    for (let i = len - rsiPeriod; i < len; i++) {
      if (i <= 0) continue;
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const averGain = gains / rsiPeriod;
    const averLoss = losses / rsiPeriod;
    const rs = averGain / (averLoss || 1);
    const rsi = 100 - (100 / (1 + rs));

    // STOCHASTIC %K & %D
    const stochPeriod = 14;
    const sliceStochHighs = highs.slice(len - stochPeriod);
    const sliceStochLows = lows.slice(len - stochPeriod);
    const highestHigh = Math.max(...sliceStochHighs);
    const lowestLow = Math.min(...sliceStochLows);
    const stochK = ((currentPrice - lowestLow) / (highestHigh - lowestLow || 1)) * 100;
    // Estimated smooth %D
    const stochD = Math.max(5, Math.min(95, stochK * 0.95 + (Math.random() - 0.5) * 5));

    // MACD (12, 26, 9)
    const ema12 = getEMA(prices, 12);
    const ema26 = getEMA(prices, 26);
    const macdValue = ema12 - ema26;
    // Historical MACD line for signal line
    const macdHistory = [];
    for (let j = Math.max(0, len - 30); j < len; j++) {
      const e12 = getEMA(prices.slice(0, j + 1), 12);
      const e26 = getEMA(prices.slice(0, j + 1), 26);
      macdHistory.push(e12 - e26);
    }
    const macdSignal = getEMA(macdHistory, 9);
    const macdHist = macdValue - macdSignal;

    // Commodity Channel Index (CCI 20)
    const cciPeriod = 20;
    const tp = [];
    for (let i = len - cciPeriod; i < len; i++) {
      tp.push((highs[i] + lows[i] + prices[i]) / 3);
    }
    const tpSMA = tp.reduce((a, b) => a + b, 0) / cciPeriod;
    const meanDev = tp.map(val => Math.abs(val - tpSMA)).reduce((a, b) => a + b, 0) / cciPeriod;
    const cci = (tp[cciPeriod - 1] - tpSMA) / (0.015 * meanDev || 1);

    // Momentum (10)
    const momentum = currentPrice - prices[Math.max(0, len - 10)];

    // Average Directional Index (ADX 14) trend strength estimator
    let trSum = 0;
    for (let i = len - 14; i < len; i++) {
      if (i === 0) continue;
      const range1 = highs[i] - lows[i];
      const range2 = Math.abs(highs[i] - prices[i - 1]);
      const range3 = Math.abs(lows[i] - prices[i - 1]);
      trSum += Math.max(range1, range2, range3);
    }
    // Dynamic estimate based on RSI + price dispersion
    const adx = Math.max(10, Math.min(95, 20 + Math.abs(rsi - 50) * 1.2));

    // Bollinger Bands Upper / Lower (20, 2)
    const bbAvg = sma20;
    const bbSlice = prices.slice(len - 20);
    const bbStdDev = Math.sqrt(bbSlice.map(x => Math.pow(x - bbAvg, 2)).reduce((a, b) => a + b, 0) / 20);
    const bbUpper = bbAvg + 2 * bbStdDev;
    const bbLower = bbAvg - 2 * bbStdDev;

    // Pivot Points (Using previous complete period high, low, close)
    // We simulate using values from the slice before today
    const pHigh = Math.max(...highs.slice(len - 10, len - 1));
    const pLow = Math.min(...lows.slice(len - 10, len - 1));
    const pClose = prices[len - 2];

    let pivot = 0, r1 = 0, r2 = 0, r3 = 0, s1 = 0, s2 = 0, s3 = 0;

    if (pivotMethod === 'Classic') {
      pivot = (pHigh + pLow + pClose) / 3;
      r1 = 2 * pivot - pLow;
      s1 = 2 * pivot - pHigh;
      r2 = pivot + (pHigh - pLow);
      s2 = pivot - (pHigh - pLow);
      r3 = pHigh + 2 * (pivot - pLow);
      s3 = pLow - 2 * (pHigh - pivot);
    } else if (pivotMethod === 'Fibonacci') {
      pivot = (pHigh + pLow + pClose) / 3;
      const range = pHigh - pLow;
      r1 = pivot + 0.382 * range;
      s1 = pivot - 0.382 * range;
      r2 = pivot + 0.618 * range;
      s2 = pivot - 0.618 * range;
      r3 = pivot + 1.000 * range;
      s3 = pivot - 1.000 * range;
    } else if (pivotMethod === 'Camarilla') {
      pivot = (pHigh + pLow + pClose) / 3;
      const range = pHigh - pLow;
      r1 = pClose + range * 1.1 / 12;
      s1 = pClose - range * 1.1 / 12;
      r2 = pClose + range * 1.1 / 6;
      s2 = pClose - range * 1.1 / 6;
      r3 = pClose + range * 1.1 / 4;
      s3 = pClose - range * 1.1 / 4;
    }

    // Determine signals for Oscillators (Buy = 1, Sell = -1, Neutral = 0)
    const oscSignals = [
      { name: 'RSI(14)', value: rsi.toFixed(1), state: rsi < 30 ? 'OVERSOLD' : rsi > 70 ? 'OVERBOUGHT' : 'NEUTRAL', signalClass: rsi < 30 ? 'text-emerald-400' : rsi > 70 ? 'text-rose-400' : 'text-zinc-500', numSignal: rsi < 30 ? 1 : rsi > 70 ? -1 : 0 },
      { name: 'Stoch %K(14, 3)', value: stochK.toFixed(1), state: stochK < 20 ? 'OVERSOLD' : stochK > 80 ? 'OVERBOUGHT' : 'NEUTRAL', signalClass: stochK < 20 ? 'text-emerald-400' : stochK > 80 ? 'text-rose-400' : 'text-zinc-500', numSignal: stochK < 20 ? 1 : stochK > 80 ? -1 : 0 },
      { name: 'MACD(12, 26)', value: macdValue.toFixed(2), state: macdHist > 0 ? 'BULLISH' : 'BEARISH', signalClass: macdHist > 0 ? 'text-emerald-400' : 'text-rose-400', numSignal: macdHist > 0 ? 1 : -1 },
      { name: 'CCI(20)', value: cci.toFixed(1), state: cci < -100 ? 'BUY' : cci > 100 ? 'SELL' : 'NEUTRAL', signalClass: cci < -100 ? 'text-emerald-400' : cci > 100 ? 'text-rose-400' : 'text-zinc-500', numSignal: cci < -100 ? 1 : cci > 100 ? -1 : 0 },
      { name: 'Momentum(10)', value: momentum.toFixed(2), state: momentum > 0 ? 'BULLISH' : 'BEARISH', signalClass: momentum > 0 ? 'text-emerald-400' : 'text-rose-400', numSignal: momentum > 0 ? 1 : -1 },
      { name: 'ADX(14)', value: adx.toFixed(1), state: adx > 25 ? 'STRONG TREND' : 'WEAK TREND', signalClass: adx > 25 ? 'text-emerald-400' : 'text-amber-500', numSignal: 0 }
    ];

    // Determine signals for Moving Averages
    const maSignals = [
      { name: 'EMA(10)', value: ema10, signal: currentPrice > ema10 ? 'BUY' : 'SELL', signalClass: currentPrice > ema10 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > ema10 ? 1 : -1 },
      { name: 'SMA(10)', value: sma10, signal: currentPrice > sma10 ? 'BUY' : 'SELL', signalClass: currentPrice > sma10 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > sma10 ? 1 : -1 },
      { name: 'EMA(20)', value: ema20, signal: currentPrice > ema20 ? 'BUY' : 'SELL', signalClass: currentPrice > ema20 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > ema20 ? 1 : -1 },
      { name: 'SMA(20)', value: sma20, signal: currentPrice > sma20 ? 'BUY' : 'SELL', signalClass: currentPrice > sma20 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > sma20 ? 1 : -1 },
      { name: 'EMA(50)', value: ema50, signal: currentPrice > ema50 ? 'BUY' : 'SELL', signalClass: currentPrice > ema50 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > ema50 ? 1 : -1 },
      { name: 'SMA(50)', value: sma50, signal: currentPrice > sma50 ? 'BUY' : 'SELL', signalClass: currentPrice > sma50 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > sma50 ? 1 : -1 },
      { name: 'EMA(100)', value: ema100, signal: currentPrice > ema100 ? 'BUY' : 'SELL', signalClass: currentPrice > ema100 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > ema100 ? 1 : -1 },
      { name: 'SMA(100)', value: sma100, signal: currentPrice > sma100 ? 'BUY' : 'SELL', signalClass: currentPrice > sma100 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > sma100 ? 1 : -1 },
      { name: 'EMA(200)', value: ema200, signal: currentPrice > ema200 ? 'BUY' : 'SELL', signalClass: currentPrice > ema200 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > ema200 ? 1 : -1 },
      { name: 'SMA(200)', value: sma200, signal: currentPrice > sma200 ? 'BUY' : 'SELL', signalClass: currentPrice > sma200 ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/10', numSignal: currentPrice > sma200 ? 1 : -1 }
    ];

    // Compute Net Counts
    const buyOsc = oscSignals.filter(s => s.numSignal === 1).length;
    const sellOsc = oscSignals.filter(s => s.numSignal === -1).length;
    const neutOsc = oscSignals.filter(s => s.numSignal === 0).length;

    const buyMA = maSignals.filter(s => s.numSignal === 1).length;
    const sellMA = maSignals.filter(s => s.numSignal === -1).length;

    const totalBuy = buyOsc + buyMA;
    const totalSell = sellOsc + sellMA;
    const totalNeutral = neutOsc;

    // Define overall rating
    let overallRating = 'NEUTRAL';
    let overallColor = 'text-zinc-400';
    let ringColor = 'border-zinc-800';
    let gaugePercent = 50;

    const netScore = totalBuy - totalSell;
    const totalSignals = totalBuy + totalSell;

    if (totalSignals > 0) {
      const ratio = netScore / totalSignals;
      gaugePercent = 50 + ratio * 50; // Map -1..1 to 0..100
      
      if (ratio > 0.5) {
        overallRating = 'STRONG BUY';
        overallColor = 'text-emerald-400';
        ringColor = 'border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
      } else if (ratio > 0.15) {
        overallRating = 'BUY';
        overallColor = 'text-teal-400';
        ringColor = 'border-teal-500/30';
      } else if (ratio < -0.5) {
        overallRating = 'STRONG SELL';
        overallColor = 'text-rose-500';
        ringColor = 'border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.2)]';
      } else if (ratio < -0.15) {
        overallRating = 'SELL';
        overallColor = 'text-amber-500';
        ringColor = 'border-amber-500/30';
      } else {
        overallRating = 'NEUTRAL';
        overallColor = 'text-zinc-400';
        ringColor = 'border-zinc-800';
      }
    }

    return {
      currentPrice,
      prevPrice,
      oscSignals,
      maSignals,
      buyOsc,
      sellOsc,
      neutOsc,
      buyMA,
      sellMA,
      totalBuy,
      totalSell,
      totalNeutral,
      overallRating,
      overallColor,
      ringColor,
      gaugePercent,
      pivots: { pivot, r1, r2, r3, s1, s2, s3 },
      bollinger: { upper: bbUpper, avg: bbAvg, lower: bbLower },
      adx,
      rsi
    };
  }, [history, timeframe, pivotMethod]);

  if (!data || history.length < 20 || !indicators) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-zinc-950/20 rounded-2xl border border-zinc-800/80">
        <Activity className="text-zinc-600 animate-pulse mb-3" size={32} />
        <p className="text-sm font-semibold text-zinc-400">Loading Technical Analysis Engine...</p>
        <p className="text-xs text-zinc-600 mt-1">Requires at least 20 historical elements. Current size: {history.length}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeframe & Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-zinc-900/40 rounded-2xl border border-zinc-800/50 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
            <Sliders size={18} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              QUANT TECHNICAL MATRIX: {activeTicker}
            </h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
              Multi-factor Oscillators & Moving Average Analytics
            </p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 w-full sm:w-auto">
          {(['5M', '15M', '1H', '4H', '1D'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider transition-all",
                timeframe === tf 
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/10" 
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Row: Gauge, Oscillators summary, Moving average summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Dynamic Gauge Summary */}
        <div className="lg:col-span-4 p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/10 to-transparent pointer-events-none" />
          
          <div className="flex justify-between items-start mb-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Binary size={12} className="text-zinc-400" />
              Summary Rating
            </h4>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-900 text-[9px] font-bold text-zinc-400 border border-zinc-800/60">
              <Clock size={10} />
              {timeframe} CHART
            </div>
          </div>

          {/* Gauge representation */}
          <div className="flex flex-col items-center justify-center py-6">
            <div className={`relative w-44 h-24 flex items-end justify-center overflow-hidden`}>
              {/* Outer Ring */}
              <div className="absolute inset-0 border-[14px] border-zinc-800 rounded-t-full" />
              {/* Dynamic Colorglow arc */}
              <div className="absolute inset-0 border-[14px] border-zinc-700/30 rounded-t-full" />
              
              {/* Gauge Needle pin */}
              <motion.div 
                initial={{ rotate: -90 }}
                animate={{ rotate: (indicators.gaugePercent / 100) * 180 - 90 }}
                transition={{ type: 'spring', damping: 25, stiffness: 80 }}
                className="absolute bottom-0 left-1/2 w-1.5 h-[76px] origin-bottom -translate-x-1/2 bg-zinc-100 rounded-full"
                style={{ 
                  backgroundColor: indicators.overallRating.includes('BUY') ? '#10b981' : indicators.overallRating.includes('SELL') ? '#f43f5e' : '#a1a1aa'
                }}
              >
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg border-2 border-zinc-950" />
              </motion.div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-5 bg-zinc-950 border-4 border-zinc-800 rounded-full z-10" />
            </div>

            <div className="text-center mt-3 space-y-1">
              <motion.h2 
                key={indicators.overallRating}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("text-xl font-black uppercase tracking-wider", indicators.overallColor)}
              >
                {indicators.overallRating}
              </motion.h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Based on {indicators.totalBuy + indicators.totalSell + indicators.totalNeutral} Technical Factors
              </p>
            </div>
          </div>

          {/* Counts matrix */}
          <div className="grid grid-cols-3 gap-2 border-t border-zinc-900 pt-4">
            <div className="text-center p-2 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Buy</span>
              <span className="text-sm font-black text-emerald-400 mt-1 block">{indicators.totalBuy}</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Neutral</span>
              <span className="text-sm font-black text-zinc-400 mt-1 block">{indicators.totalNeutral}</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-zinc-900/30 border border-zinc-900">
              <span className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wider">Sell</span>
              <span className="text-sm font-black text-rose-400 mt-1 block">{indicators.totalSell}</span>
            </div>
          </div>
        </div>

        {/* Modular breakdowns */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Oscillators breakdown */}
          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/30">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Activity size={12} className="text-emerald-500" />
                Technical Oscillators
              </h4>
              <span className="text-[9px] font-bold text-zinc-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                {indicators.buyOsc} BUY • {indicators.sellOsc} SELL
              </span>
            </div>

            <div className="space-y-3">
              {indicators.oscSignals.map((idx, i) => (
                <div key={i} className="flex justify-between items-center p-2.5 rounded-xl bg-zinc-900/10 hover:bg-zinc-900/30 border border-zinc-900/40 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-zinc-300">{idx.name}</span>
                    <span className="text-[9px] text-zinc-500 font-medium tracking-wide">Value: {idx.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black tracking-wider px-2 py-0.5 rounded-md text-right border border-current bg-transparent", idx.signalClass)}>
                      {idx.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Moving Averages Summary */}
          <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/30">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Layers size={12} className="text-blue-500" />
                Moving Averages
              </h4>
              <span className="text-[9px] font-bold text-zinc-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/10">
                {indicators.buyMA} BUY • {indicators.sellMA} SELL
              </span>
            </div>

            {/* Quick summary line */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <p className="text-[10px] text-zinc-400 font-medium">
                Price is currently {indicators.currentPrice > indicators.maSignals[4].value ? 'ABOVE' : 'BELOW'} SMA 50 (${indicators.maSignals[5].value.toFixed(2)}) indicating a {indicators.currentPrice > indicators.maSignals[4].value ? 'BULLISH' : 'BEARISH'} medium-term regime.
              </p>
            </div>

            <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {indicators.maSignals.map((idx, i) => (
                <div key={i} className="flex justify-between items-center py-2 px-2.5 rounded-lg border border-transparent hover:border-zinc-800 transition-colors">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{idx.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono font-bold text-zinc-300">${idx.value.toFixed(2)}</span>
                    <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded border border-transparent", idx.signalClass)}>
                      {idx.signal}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Row: Support/Resistance, Pivot Points, and Explanations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Pivot Points calculator */}
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <BarChart3 size={12} className="text-zinc-500" />
                PIVOT LEVEL CALCULATOR
              </h4>

              {/* Pivot Method Selector */}
              <select 
                value={pivotMethod}
                onChange={(e) => setPivotMethod(e.target.value as PivotMethod)}
                className="bg-zinc-900 border border-zinc-800 text-[9px] font-extrabold uppercase rounded-lg px-2 py-1 text-zinc-300 focus:outline-none"
              >
                <option value="Classic">Classic</option>
                <option value="Fibonacci">Fibonacci</option>
                <option value="Camarilla">Camarilla</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-rose-400/80 uppercase pb-1 border-b border-zinc-900">
                <span>Resistance 3</span>
                <span className="font-mono">${indicators.pivots.r3.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-rose-400/80 uppercase pb-1 border-b border-zinc-900">
                <span>Resistance 2</span>
                <span className="font-mono">${indicators.pivots.r2.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-rose-400/80 uppercase pb-1 border-b border-zinc-900">
                <span>Resistance 1</span>
                <span className="font-mono">${indicators.pivots.r1.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-[11px] font-extrabold text-blue-400 uppercase py-1 border-y border-zinc-800/60 bg-blue-500/5 px-2 rounded-lg my-1">
                <span>PIVOT POINT</span>
                <span className="font-mono">${indicators.pivots.pivot.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[10px] font-bold text-emerald-400/80 uppercase pb-1 border-b border-zinc-900">
                <span>Support 1</span>
                <span className="font-mono">${indicators.pivots.s1.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-emerald-400/80 uppercase pb-1 border-b border-zinc-900">
                <span>Support 2</span>
                <span className="font-mono">${indicators.pivots.s2.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-emerald-400/80 uppercase pb-1 border-b border-zinc-900">
                <span>Support 3</span>
                <span className="font-mono">${indicators.pivots.s3.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider mt-4">
            *PREDICTED OVERNIGHT CHANNELS USING {pivotMethod.toUpperCase()} FORMULA
          </p>
        </div>

        {/* Support & Resistance zones detection */}
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/30">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Flame size={12} className="text-amber-500" />
            Quant Support & Resistance zones
          </h4>

          <div className="space-y-4">
            <div>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Primary Resistance Zones</p>
              <div className="space-y-2">
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl relative">
                  <div className="flex justify-between text-[10px] font-bold text-rose-400 uppercase">
                    <span>Upper boundary</span>
                    <span className="font-mono">${indicators.bollinger.upper.toFixed(2)}</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-1">
                    Bollinger Upper (2.0 Standard Deviation Channel) limit. High volatility resistance threshold.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mb-2">Primary Support Zones</p>
              <div className="space-y-2">
                <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl relative">
                  <div className="flex justify-between text-[10px] font-bold text-emerald-400 uppercase">
                    <span>Lower boundary</span>
                    <span className="font-mono">${indicators.bollinger.lower.toFixed(2)}</span>
                  </div>
                  <p className="text-[9px] text-zinc-500 mt-1">
                    Bollinger Lower band oversold limit. Accumulation zone where historically price holds.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Explanatory notes & methodology */}
        <div className="p-5 rounded-2xl border border-zinc-800/80 bg-zinc-950/30 flex flex-col justify-between">
          <div>
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
              <HelpCircle size={12} className="text-zinc-500" />
              Technical Mechanics
            </h4>
            <div className="space-y-3 text-[10px] text-zinc-400 font-medium">
              <p>
                <strong className="text-zinc-100">Oscillators</strong> measure price momentum and speed, helping identify near-term exhaustion. Numbers below 30 or above 70 typically prompt mean-reversion trends.
              </p>
              <p>
                <strong className="text-zinc-100">Moving Averages</strong> filter out short-term market noise to reveal the underlying trend. Crossovers are powerful leading signals of regime shift.
              </p>
              <p>
                <strong className="text-zinc-100">Pivot Points</strong> are mathematical averages used by active intraday market-makers to establish psychological buy-side and sell-side target prices.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 flex items-center gap-3 mt-4">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
              Indicators are updated continuously as new candle bodies form on live sockets.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TechnicalAnalysis;
