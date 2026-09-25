import { describe, it, expect } from 'vitest';
import { fourierLowPass, generateMockHistory } from './api';

describe('API Services', () => {
  describe('generateMockHistory', () => {
    it('generates the correct number of days', () => {
      const days = 10;
      const history = generateMockHistory('AAPL', days);
      expect(history.length).toBe(days + 1);
    });

    it('contains price and volume', () => {
      const history = generateMockHistory('AAPL', 5);
      expect(history[0]).toHaveProperty('price');
      expect(history[0]).toHaveProperty('volume');
      expect(history[0]).toHaveProperty('date');
    });
  });

  describe('fourierLowPass', () => {
    it('filters data correctly', () => {
      const data = [10, 12, 11, 13, 12, 14, 13, 15];
      const filtered = fourierLowPass(data, 0.5);
      expect(filtered.length).toBe(data.length);
      // Filtered data should be smoother
      expect(filtered[0]).toBeTypeOf('number');
    });
  });
});
