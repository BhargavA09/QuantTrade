/**
 * Pure Mathematical Signal Processing, Fourier Filtering, Technical Indicators,
 * and Calibrated Historical Data Generation.
 * 
 * Follows Single Responsibility Principle (SRP).
 */

import { EXPANDED_STOCK_DATABASE } from "../../data/expandedStockDatabase";
import { StockHistoryCandle, TechnicalIndicators } from "./types";

/**
 * Calibrates realistic simulated historical OHLCV candles based on real asset catalog prices and volatility.
 */
export const generateMockHistory = (ticker: string, days: number = 100): StockHistoryCandle[] => {
  const normalized = ticker.trim().toUpperCase();
  const foundStock = EXPANDED_STOCK_DATABASE.find(s => s.ticker === normalized);
  const targetEndPrice = foundStock 
    ? foundStock.price 
    : (normalized.includes('BTC') ? 66200 : normalized.includes('ETH') ? 2640 : (normalized.startsWith('^') ? 5000 : 150));
  
  const beta = foundStock ? foundStock.beta : 1.0;
  const history: StockHistoryCandle[] = [];
  const now = new Date();
  const isCrypto = normalized.includes('BTC') || normalized.includes('ETH') || normalized.includes('SOL');
  const dailyVol = isCrypto ? 0.025 : 0.012 * beta;

  // Generate backwards from targetEndPrice so the latest candle is EXACTLY targetEndPrice
  const prices: number[] = new Array(days + 1);
  prices[days] = targetEndPrice;

  // Use deterministic seed based on ticker characters to avoid chaotic UI jumps
  let seed = 0;
  for (let c = 0; c < normalized.length; c++) seed += normalized.charCodeAt(c);

  for (let i = days - 1; i >= 0; i--) {
    const cycle = Math.sin((i + seed) * 0.17) * 0.4 + Math.cos((i + seed) * 0.06) * 0.3;
    const stepChange = (cycle * 0.5 + Math.sin(i * 1.2) * 0.5) * dailyVol;
    prices[i] = Math.max(0.5, prices[i + 1] / (1 + stepChange));
  }

  for (let i = 0; i <= days; i++) {
    const dayOffset = days - i;
    const date = new Date(now.getTime() - dayOffset * 86400000);
    const close = Number(prices[i].toFixed(targetEndPrice < 2 ? 4 : 2));
    const prevClose = i > 0 ? prices[i - 1] : close * 0.998;
    const open = Number((prevClose * (1 + Math.sin((i + seed) * 0.5) * dailyVol * 0.3)).toFixed(targetEndPrice < 2 ? 4 : 2));
    const spread = close * dailyVol * 0.7;
    const high = Number((Math.max(open, close) + spread).toFixed(targetEndPrice < 2 ? 4 : 2));
    const low = Number((Math.max(0.01, Math.min(open, close) - spread)).toFixed(targetEndPrice < 2 ? 4 : 2));
    const volume = Math.floor(1500000 + Math.abs(Math.sin((i + seed) * 0.8)) * 8000000);

    history.push({
      date: date.toISOString().split('T')[0],
      price: close,
      open,
      high,
      low,
      close,
      volume
    });
  }
  return history;
};

/**
 * Optimized Discrete Fourier Transform (DFT) Low-Pass Filter for Market Noise Reduction.
 * 
 * @param data Array of numerical time-series prices
 * @param cutoff Fractional cutoff frequency (0.0 to 0.5)
 * @returns Filtered, smoothed price sequence
 */
export const fourierLowPass = (data: number[], cutoff: number = 0.1): number[] => {
  const N = data.length;
  if (N === 0) return [];
  
  const real = new Float64Array(N);
  const imag = new Float64Array(N);
  const angleFactor = (2 * Math.PI) / N;

  // Forward DFT
  for (let k = 0; k < N; k++) {
    let r = 0, i = 0;
    const kAngle = k * angleFactor;
    for (let n = 0; n < N; n++) {
      const angle = kAngle * n;
      r += data[n] * Math.cos(angle);
      i -= data[n] * Math.sin(angle);
    }
    real[k] = r;
    imag[k] = i;
  }

  // Low-pass filter: zero out frequencies above cutoff
  const limit = Math.floor(N * cutoff);
  for (let k = limit; k < N - limit; k++) {
    real[k] = 0;
    imag[k] = 0;
  }

  // Inverse DFT
  const filtered = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    let r = 0;
    const nAngle = n * angleFactor;
    for (let k = 0; k < N; k++) {
      const angle = nAngle * k;
      r += real[k] * Math.cos(angle) - imag[k] * Math.sin(angle);
    }
    filtered[n] = r / N;
  }

  return Array.from(filtered);
};

/**
 * Discrete Fourier Transform (DFT) High-Pass Filter.
 * Zeros out low frequencies below the cutoff threshold, extracting only the high-frequency
 * micro-oscillations, market noise, and rapid momentum surges.
 * 
 * @param data Array of numerical time-series prices
 * @param cutoff Fractional cutoff frequency (e.g. 0.15 = filter out cycles longer than ~6.6 bars)
 * @param preserveBaseline If true, shifts the signal by mean price so it overlays onto price charts
 * @returns Array of high-frequency price fluctuations
 */
export const fourierHighPass = (
  data: number[], 
  cutoff: number = 0.15, 
  preserveBaseline: boolean = false
): number[] => {
  const N = data.length;
  if (N === 0) return [];
  
  // High-pass in time domain is equivalently data - lowPass(data)
  // or zeroing out the low frequency bins in Fourier space.
  const lowPassSignal = fourierLowPass(data, cutoff);
  const meanPrice = preserveBaseline 
    ? data.reduce((a, b) => a + b, 0) / N 
    : 0;

  return data.map((val, idx) => {
    const highFreqDelta = val - (lowPassSignal[idx] ?? val);
    return Number((highFreqDelta + meanPrice).toFixed(4));
  });
};

/**
 * Discrete Fourier Transform (DFT) Band-Pass Filter.
 * Passes frequencies within a specific spectral window [lowCutoff, highCutoff],
 * isolating medium-term harmonic cycles (e.g., 5-day to 20-day swing cycles).
 */
export const fourierBandPass = (
  data: number[],
  lowCutoff: number = 0.05,
  highCutoff: number = 0.25
): number[] => {
  const N = data.length;
  if (N === 0) return [];

  const real = new Float64Array(N);
  const imag = new Float64Array(N);
  const angleFactor = (2 * Math.PI) / N;

  // Forward DFT
  for (let k = 0; k < N; k++) {
    let r = 0, i = 0;
    const kAngle = k * angleFactor;
    for (let n = 0; n < N; n++) {
      const angle = kAngle * n;
      r += data[n] * Math.cos(angle);
      i -= data[n] * Math.sin(angle);
    }
    real[k] = r;
    imag[k] = i;
  }

  // Band-pass filter: zero out bins outside [lowLimit, highLimit]
  const lowLimit = Math.floor(N * lowCutoff);
  const highLimit = Math.floor(N * highCutoff);

  for (let k = 0; k < N; k++) {
    const kMirror = k > N / 2 ? N - k : k;
    if (kMirror < lowLimit || kMirror > highLimit) {
      real[k] = 0;
      imag[k] = 0;
    }
  }

  // Inverse DFT
  const filtered = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    let r = 0;
    const nAngle = n * angleFactor;
    for (let k = 0; k < N; k++) {
      const angle = nAngle * k;
      r += real[k] * Math.cos(angle) - imag[k] * Math.sin(angle);
    }
    filtered[n] = r / N;
  }

  return Array.from(filtered);
};

export interface SpectralPeak {
  bin: number;
  frequency: number; // cycles per day/bar
  period: number;    // bars per cycle
  power: number;     // spectral density
  amplitude: number;
  isHighFrequency: boolean;
}

/**
 * Computes Discrete Fourier Spectral Decomposition (Power Spectral Density).
 * Decomposes price history into distinct frequency harmonics and identifies high-frequency components.
 */
export const computeFourierSpectrum = (data: number[]): SpectralPeak[] => {
  const N = data.length;
  if (N < 4) return [];

  const mean = data.reduce((a, b) => a + b, 0) / N;
  const detrended = data.map(p => p - mean);
  const halfN = Math.floor(N / 2);
  const angleFactor = (2 * Math.PI) / N;
  const peaks: SpectralPeak[] = [];

  for (let k = 1; k <= halfN; k++) {
    let r = 0, i = 0;
    const kAngle = k * angleFactor;
    for (let n = 0; n < N; n++) {
      const angle = kAngle * n;
      r += detrended[n] * Math.cos(angle);
      i -= detrended[n] * Math.sin(angle);
    }
    const power = (r * r + i * i) / N;
    const amplitude = (2 * Math.sqrt(r * r + i * i)) / N;
    const frequency = k / N;
    const period = Number((1 / frequency).toFixed(1));

    peaks.push({
      bin: k,
      frequency: Number(frequency.toFixed(4)),
      period,
      power: Number(power.toFixed(3)),
      amplitude: Number(amplitude.toFixed(3)),
      isHighFrequency: frequency >= 0.15 // Cycles <= 6.6 days
    });
  }

  return peaks.sort((a, b) => b.power - a.power);
};

export interface HighFrequencyMetrics {
  lowPass: number[];
  highPass: number[];
  highPassPriceOverlay: number[];
  zScores: number[];
  hfVariance: number;
  totalVariance: number;
  hfEnergyPercent: number;
  currentZScore: number;
  dominantHfPeriod: number;
  regime: 'Microstructure Turbulence' | 'Mean-Reverting Noise' | 'Smooth Low-Frequency Drift';
  microBurstSignals: {
    index: number;
    type: 'BUY_SCALP' | 'SELL_SCALP';
    zScore: number;
    price: number;
  }[];
}

/**
 * Performs full Quantitative High-Frequency Signal Decomposition on time-series prices.
 * Returns raw high-frequency residuals, Z-score standardizations, energy distribution,
 * and high-frequency scalping opportunities.
 */
export const computeHighFrequencyAnalysis = (
  data: number[],
  cutoff: number = 0.15
): HighFrequencyMetrics => {
  const N = data.length;
  if (N === 0) {
    return {
      lowPass: [],
      highPass: [],
      highPassPriceOverlay: [],
      zScores: [],
      hfVariance: 0,
      totalVariance: 0,
      hfEnergyPercent: 0,
      currentZScore: 0,
      dominantHfPeriod: 2.0,
      regime: 'Smooth Low-Frequency Drift',
      microBurstSignals: []
    };
  }

  const lowPass = fourierLowPass(data, cutoff);
  const meanPrice = data.reduce((a, b) => a + b, 0) / N;

  // High-frequency residual = data[n] - lowPass[n]
  const highPass: number[] = new Array(N);
  const highPassPriceOverlay: number[] = new Array(N);

  for (let i = 0; i < N; i++) {
    const hf = data[i] - (lowPass[i] ?? data[i]);
    highPass[i] = Number(hf.toFixed(4));
    highPassPriceOverlay[i] = Number((hf + meanPrice).toFixed(2));
  }

  // Calculate HF variance and standard deviation
  let sumHf = 0;
  for (let i = 0; i < N; i++) sumHf += highPass[i];
  const meanHf = sumHf / N;

  let sumHfSqDiff = 0;
  for (let i = 0; i < N; i++) {
    const diff = highPass[i] - meanHf;
    sumHfSqDiff += diff * diff;
  }
  const hfVariance = sumHfSqDiff / N;
  const hfStdDev = Math.sqrt(hfVariance) || 0.0001;

  // Total variance
  let sumTotalSqDiff = 0;
  for (let i = 0; i < N; i++) {
    const diff = data[i] - meanPrice;
    sumTotalSqDiff += diff * diff;
  }
  const totalVariance = sumTotalSqDiff / N || 0.0001;
  const hfEnergyPercent = Number(Math.min(100, (hfVariance / totalVariance) * 100).toFixed(2));

  // Compute Z-scores & Microburst Scalping Signals
  const zScores: number[] = new Array(N);
  const microBurstSignals: HighFrequencyMetrics['microBurstSignals'] = [];

  for (let i = 0; i < N; i++) {
    const z = Number(((highPass[i] - meanHf) / hfStdDev).toFixed(2));
    zScores[i] = z;

    // Detect high-frequency boundary breach (|Z| > 1.8)
    if (z <= -1.8) {
      microBurstSignals.push({
        index: i,
        type: 'BUY_SCALP',
        zScore: z,
        price: data[i]
      });
    } else if (z >= 1.8) {
      microBurstSignals.push({
        index: i,
        type: 'SELL_SCALP',
        zScore: z,
        price: data[i]
      });
    }
  }

  const spectrum = computeFourierSpectrum(data);
  const topHfPeak = spectrum.find(p => p.isHighFrequency);
  const dominantHfPeriod = topHfPeak ? topHfPeak.period : 2.5;

  const currentZ = zScores[zScores.length - 1] || 0;
  let regime: HighFrequencyMetrics['regime'] = 'Smooth Low-Frequency Drift';
  if (hfEnergyPercent > 40) {
    regime = 'Microstructure Turbulence';
  } else if (hfEnergyPercent > 18) {
    regime = 'Mean-Reverting Noise';
  }

  return {
    lowPass: lowPass.map(p => Number(p.toFixed(2))),
    highPass,
    highPassPriceOverlay,
    zScores,
    hfVariance: Number(hfVariance.toFixed(4)),
    totalVariance: Number(totalVariance.toFixed(4)),
    hfEnergyPercent,
    currentZScore: currentZ,
    dominantHfPeriod,
    regime,
    microBurstSignals
  };
};

/**
 * Computes institutional technical indicators (SMA, EMA, MACD, RSI, Bollinger Bands, Stochastic, ATR)
 * for use in statistical models and machine learning pipelines.
 */
export const computeNeuralFeatures = (prices: number[]): TechnicalIndicators => {
  const n = prices.length;
  if (n < 14) {
    return { rsi: [], macd: [], sma20: [], ema12: [], sma50: [], sma200: [], bbUpper: [], bbLower: [] };
  }

  const calculateSMA = (data: number[], period: number) => {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const slice = data.slice(i - (period - 1), i + 1);
      return slice.reduce((a, b) => a + b, 0) / period;
    });
  };

  const sma20 = calculateSMA(prices, 20);
  const sma50 = calculateSMA(prices, 50);
  const sma200 = calculateSMA(prices, 200);

  // Bollinger Bands (20, 2)
  const bbUpper = sma20.map((avg, i) => {
    if (avg === null) return null;
    const slice = prices.slice(i - 19, i + 1);
    const stdDev = Math.sqrt(slice.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / 20);
    return avg + 2 * stdDev;
  });

  const bbLower = sma20.map((avg, i) => {
    if (avg === null) return null;
    const slice = prices.slice(i - 19, i + 1);
    const stdDev = Math.sqrt(slice.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / 20);
    return avg - 2 * stdDev;
  });

  // Stochastic Oscillator (14, 3)
  const stochK = prices.map((_, i) => {
    if (i < 13) return null;
    const slice = prices.slice(i - 13, i + 1);
    const low = Math.min(...slice);
    const high = Math.max(...slice);
    return ((prices[i] - low) / (high - low || 1)) * 100;
  });

  const stochD = stochK.map((_, i) => {
    if (i < 2 || stochK[i] === null || stochK[i-1] === null || stochK[i-2] === null) return null;
    return (stochK[i]! + stochK[i-1]! + stochK[i-2]!) / 3;
  });

  // ATR (14)
  const tr = prices.map((p, i) => {
    if (i === 0) return 0;
    const high = p;
    const low = p;
    const prevClose = prices[i-1];
    return Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  });

  const atr = tr.map((_, i) => {
    if (i < 13) return null;
    const slice = tr.slice(i - 13, i + 1);
    return slice.reduce((a, b) => a + b, 0) / 14;
  });

  // Exponential Moving Average
  const calculateEMA = (data: number[], period: number) => {
    const k = 2 / (period + 1);
    let ema = [data[0]];
    for (let i = 1; i < data.length; i++) {
      ema.push(data[i] * k + ema[i - 1] * (1 - k));
    }
    return ema;
  };

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12.map((e, i) => e - ema26[i]);

  // Relative Strength Index (RSI 14)
  const rsi = prices.map((_, i) => {
    if (i < 14) return null;
    let gains = 0;
    let losses = 0;
    for (let j = i - 13; j <= i; j++) {
      const diff = prices[j] - prices[j - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }
    const rs = (gains / 14) / (losses / 14 || 1);
    return 100 - (100 / (1 + rs));
  });

  return { rsi, macd, sma20, ema12, sma50, sma200, bbUpper, bbLower, stochK, stochD, atr };
};
