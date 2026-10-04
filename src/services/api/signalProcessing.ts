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
  let price = foundStock 
    ? foundStock.price 
    : (normalized.includes('BTC') ? 66000 : normalized.includes('ETH') ? 2600 : 150 + Math.random() * 200);
  
  const beta = foundStock ? foundStock.beta : 1.0;
  const history: StockHistoryCandle[] = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const vol = (normalized.includes('BTC') || normalized.includes('ETH')) ? 0.025 : 0.012 * beta;
    const change = (Math.sin(i * 0.15) * 0.3 + (Math.random() - 0.48)) * (price * vol);
    price = Math.max(1, price + change);

    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      open: parseFloat((price - change / 2).toFixed(2)),
      high: parseFloat((price + Math.abs(change) * 0.8).toFixed(2)),
      low: parseFloat((price - Math.abs(change) * 0.8).toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1500000
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
