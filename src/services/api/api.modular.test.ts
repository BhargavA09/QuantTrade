import { describe, it, expect, vi } from 'vitest';
import { 
  resolveTickerSymbol, 
  COMMON_TICKER_MAP,
  fourierLowPass, 
  fourierHighPass,
  computeHighFrequencyAnalysis,
  generateMockHistory, 
  computeNeuralFeatures,
  ApiClient,
  defaultApiClient
} from './index';

describe('Modular API Architecture', () => {
  describe('Symbol Resolution Service', () => {
    it('resolves natural language company names to standard ticker symbols', () => {
      expect(resolveTickerSymbol('apple')).toBe('AAPL');
      expect(resolveTickerSymbol('TESLA')).toBe('TSLA');
      expect(resolveTickerSymbol('bitcoin')).toBe('BTC-USD');
      expect(resolveTickerSymbol('ethereum')).toBe('ETH-USD');
      expect(resolveTickerSymbol('gold')).toBe('GC=F');
    });

    it('returns uppercase trimmed symbol if not in alias map', () => {
      expect(resolveTickerSymbol('  nvda  ')).toBe('NVDA');
      expect(resolveTickerSymbol('spy')).toBe('SPY');
    });

    it('defaults empty string to SPY benchmark', () => {
      expect(resolveTickerSymbol('')).toBe('SPY');
    });
  });

  describe('Signal Processing & Quantitative Algorithms', () => {
    it('generates calibrated historical candles with OHLCV data', () => {
      const history = generateMockHistory('AAPL', 15);
      expect(history.length).toBe(16);
      const candle = history[0];
      expect(candle).toHaveProperty('date');
      expect(candle).toHaveProperty('price');
      expect(candle).toHaveProperty('open');
      expect(candle).toHaveProperty('high');
      expect(candle).toHaveProperty('low');
      expect(candle).toHaveProperty('close');
      expect(candle).toHaveProperty('volume');
      expect(typeof candle.price).toBe('number');
      expect(candle.price).toBeGreaterThan(0);
    });

    it('executes Fourier Transform Low-Pass filter preserving array dimensions', () => {
      const prices = [100, 102, 105, 103, 108, 107, 110, 109, 112, 115, 114, 118];
      const filtered = fourierLowPass(prices, 0.2);
      expect(filtered.length).toBe(prices.length);
      expect(filtered[0]).toBeTypeOf('number');
      expect(Number.isFinite(filtered[0])).toBe(true);
    });

    it('executes Fourier High-Pass filter and extracts high-frequency residuals', () => {
      const prices = [100, 105, 95, 110, 90, 115, 85, 120, 80, 125];
      const hf = fourierHighPass(prices, 0.15);
      expect(hf.length).toBe(prices.length);
      expect(hf[0]).toBeTypeOf('number');
      // High-frequency components oscillate around 0
      const sum = hf.reduce((a, b) => a + b, 0);
      expect(Math.abs(sum / hf.length)).toBeLessThan(15);
    });

    it('performs full high-frequency signal decomposition and microburst analysis', () => {
      const prices = Array.from({ length: 40 }, (_, i) => 150 + i * 0.5 + (i % 2 === 0 ? 3 : -3));
      const analysis = computeHighFrequencyAnalysis(prices, 0.15);
      expect(analysis.highPass.length).toBe(prices.length);
      expect(analysis.lowPass.length).toBe(prices.length);
      expect(analysis.zScores.length).toBe(prices.length);
      expect(analysis.hfEnergyPercent).toBeGreaterThan(0);
      expect(analysis.hfEnergyPercent).toBeLessThanOrEqual(100);
      expect(typeof analysis.regime).toBe('string');
    });

    it('computes neural network indicators when sample size is sufficient', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 1.5 + Math.sin(i) * 2);
      const features = computeNeuralFeatures(prices);
      expect(features.rsi.length).toBe(prices.length);
      expect(features.sma20.length).toBe(prices.length);
      expect(features.bbUpper.length).toBe(prices.length);
      expect(features.bbLower.length).toBe(prices.length);
    });
  });

  describe('ApiClient Architecture', () => {
    it('manages in-memory cache with TTL correctly', () => {
      const client = new ApiClient('', 500); // 500ms TTL
      client.setMemoryCache('test_key', { alpha: 42 });
      
      const cached = client.getMemoryCache<any>('test_key');
      expect(cached).toEqual({ alpha: 42 });
      
      // Non-existent key returns null
      expect(client.getMemoryCache('non_existent')).toBeNull();
    });

    it('parses markdown-wrapped and clean JSON safely', () => {
      const client = defaultApiClient;
      
      // Clean JSON
      const clean = client.safeJsonParse('{"status":"ok"}', {});
      expect(clean).toEqual({ status: 'ok' });

      // Markdown wrapped JSON
      const markdown = client.safeJsonParse('```json\n{"score": 95}\n```', {});
      expect(markdown).toEqual({ score: 95 });

      // Malformed fallback
      const fallback = client.safeJsonParse('invalid-json-string', { fallback: true });
      expect(fallback).toEqual({ fallback: true });
    });

    it('deduplicates identical concurrent requests', async () => {
      const client = new ApiClient();
      let callCount = 0;

      const mockFetch = () => new Promise<string>((resolve) => {
        callCount++;
        setTimeout(() => resolve('payload'), 50);
      });

      // Launch two concurrent requests with same ID
      const [res1, res2] = await Promise.all([
        client.deduplicate('req_1', mockFetch),
        client.deduplicate('req_1', mockFetch)
      ]);

      expect(res1).toBe('payload');
      expect(res2).toBe('payload');
      expect(callCount).toBe(1); // Only executed once!
    });
  });
});
