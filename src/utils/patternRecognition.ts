// Quantitative Chart Pattern Recognition & Dynamic Trendline Engine
// Calculates rolling extrema, linear regression channels, and technical patterns

export interface SwingPoint {
  index: number;
  date: string;
  price: number;
  type: 'high' | 'low';
}

export interface ChartPattern {
  id: string;
  type: 'support_resistance' | 'ascending_triangle' | 'descending_triangle' | 'double_bottom' | 'double_top' | 'head_and_shoulders' | 'bull_channel' | 'bear_channel';
  name: string;
  confidence: number; // 0 to 100%
  description: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  targetPrice: number;
  stopLossPrice: number;
  keyLevels: {
    resistance?: number;
    support?: number;
    neckline?: number;
    upperChannelSlope?: number;
    lowerChannelSlope?: number;
  };
  trendlines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
    type: 'resistance' | 'support' | 'neckline' | 'channel';
  }>;
}

export interface LinearRegressionChannel {
  slope: number;
  intercept: number;
  rSquared: number;
  upperBand: number[];
  midBand: number[];
  lowerBand: number[];
}

export function findLocalExtrema(
  data: Array<{ date: string; high: number; low: number; close: number }>,
  order: number = 3
): SwingPoint[] {
  const extrema: SwingPoint[] = [];
  if (data.length < order * 2 + 1) return extrema;

  for (let i = order; i < data.length - order; i++) {
    const currentHigh = data[i].high;
    const currentLow = data[i].low;

    let isHigh = true;
    let isLow = true;

    for (let j = i - order; j <= i + order; j++) {
      if (j === i) continue;
      if (data[j].high >= currentHigh) isHigh = false;
      if (data[j].low <= currentLow) isLow = false;
    }

    if (isHigh) {
      extrema.push({ index: i, date: data[i].date, price: currentHigh, type: 'high' });
    }
    if (isLow) {
      extrema.push({ index: i, date: data[i].date, price: currentLow, type: 'low' });
    }
  }

  return extrema;
}

export function calculateLinearRegression(prices: number[]): LinearRegressionChannel {
  const n = prices.length;
  if (n < 2) {
    return { slope: 0, intercept: prices[0] || 0, rSquared: 0, upperBand: [], midBand: [], lowerBand: [] };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  let sumYY = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = prices[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
    sumYY += y * y;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Residual variance and Standard Error
  let ssRes = 0;
  let ssTot = 0;
  const meanY = sumY / n;

  const midBand: number[] = [];
  for (let i = 0; i < n; i++) {
    const pred = slope * i + intercept;
    midBand.push(pred);
    ssRes += Math.pow(prices[i] - pred, 2);
    ssTot += Math.pow(prices[i] - meanY, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  const stdError = Math.sqrt(ssRes / Math.max(1, n - 2));

  const upperBand = midBand.map(v => Number((v + 2 * stdError).toFixed(2)));
  const lowerBand = midBand.map(v => Number((v - 2 * stdError).toFixed(2)));

  return {
    slope,
    intercept,
    rSquared,
    upperBand,
    midBand: midBand.map(v => Number(v.toFixed(2))),
    lowerBand
  };
}

export function detectAutomatedPatterns(
  candles: Array<{ date: string; open: number; high: number; low: number; close: number; volume?: number }>
): ChartPattern[] {
  if (!candles || candles.length < 15) return [];

  const patterns: ChartPattern[] = [];
  const extrema = findLocalExtrema(candles, 3);
  const highs = extrema.filter(e => e.type === 'high');
  const lows = extrema.filter(e => e.type === 'low');
  const n = candles.length;
  const currentPrice = candles[n - 1].close;

  // 1. Key Horizontal Support & Resistance Channels
  if (highs.length >= 2 && lows.length >= 2) {
    const recentHighs = highs.slice(-4);
    const recentLows = lows.slice(-4);
    const avgHigh = recentHighs.reduce((a, b) => a + b.price, 0) / recentHighs.length;
    const avgLow = recentLows.reduce((a, b) => a + b.price, 0) / recentLows.length;

    const highVariance = Math.max(...recentHighs.map(h => Math.abs(h.price - avgHigh))) / (avgHigh || 1);
    const lowVariance = Math.max(...recentLows.map(l => Math.abs(l.price - avgLow))) / (avgLow || 1);

    if (highVariance < 0.03 && lowVariance < 0.03 && avgHigh > avgLow) {
      patterns.push({
        id: 'horizontal_channel',
        type: 'support_resistance',
        name: 'Horizontal Trading Channel',
        confidence: 88,
        description: `Consolidation corridor between Resistance $${avgHigh.toFixed(2)} and Support $${avgLow.toFixed(2)}.`,
        bias: currentPrice > (avgHigh + avgLow) / 2 ? 'bullish' : 'neutral',
        targetPrice: Number((avgHigh + (avgHigh - avgLow) * 0.7).toFixed(2)),
        stopLossPrice: Number((avgLow * 0.98).toFixed(2)),
        keyLevels: { resistance: avgHigh, support: avgLow },
        trendlines: [
          { x1: recentHighs[0].index, y1: avgHigh, x2: n - 1, y2: avgHigh, label: `Resistance $${avgHigh.toFixed(2)}`, type: 'resistance' },
          { x1: recentLows[0].index, y1: avgLow, x2: n - 1, y2: avgLow, label: `Support $${avgLow.toFixed(2)}`, type: 'support' }
        ]
      });
    }
  }

  // 2. Ascending Triangle (Flat resistance + rising lows)
  if (highs.length >= 2 && lows.length >= 2) {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];

    const highDiffPct = Math.abs(h1.price - h2.price) / (h1.price || 1);
    const lowSlope = (l2.price - l1.price) / Math.max(1, l2.index - l1.index);

    if (highDiffPct < 0.025 && lowSlope > 0.02 && l2.price > l1.price) {
      const resistance = (h1.price + h2.price) / 2;
      const breakoutTarget = resistance + (resistance - l1.price);
      patterns.push({
        id: 'asc_triangle',
        type: 'ascending_triangle',
        name: 'Ascending Triangle (Bullish Accumulation)',
        confidence: 91,
        description: 'Higher lows pressing against horizontal overhead resistance indicates institutional buying pressure.',
        bias: 'bullish',
        targetPrice: Number(breakoutTarget.toFixed(2)),
        stopLossPrice: Number((l2.price * 0.985).toFixed(2)),
        keyLevels: { resistance, support: l2.price },
        trendlines: [
          { x1: h1.index, y1: resistance, x2: n - 1, y2: resistance, label: `Flat Resistance $${resistance.toFixed(2)}`, type: 'resistance' },
          { x1: l1.index, y1: l1.price, x2: l2.index, y2: l2.price, label: 'Ascending Support Trendline', type: 'support' }
        ]
      });
    }
  }

  // 3. Double Bottom (W Reversal Pattern)
  if (lows.length >= 2) {
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];
    const midHighs = highs.filter(h => h.index > l1.index && h.index < l2.index);

    if (midHighs.length > 0) {
      const neckline = Math.max(...midHighs.map(h => h.price));
      const bottomDiffPct = Math.abs(l1.price - l2.price) / (l1.price || 1);

      if (bottomDiffPct < 0.03 && l2.index - l1.index >= 4) {
        const height = neckline - (l1.price + l2.price) / 2;
        patterns.push({
          id: 'double_bottom',
          type: 'double_bottom',
          name: 'Double Bottom (W-Reversal)',
          confidence: 86,
          description: `Two distinct rejection lows at $${((l1.price + l2.price) / 2).toFixed(2)} confirm strong base formation.`,
          bias: 'bullish',
          targetPrice: Number((neckline + height).toFixed(2)),
          stopLossPrice: Number((Math.min(l1.price, l2.price) * 0.98).toFixed(2)),
          keyLevels: { neckline, support: (l1.price + l2.price) / 2 },
          trendlines: [
            { x1: l1.index, y1: neckline, x2: n - 1, y2: neckline, label: `Neckline Breakout $${neckline.toFixed(2)}`, type: 'neckline' },
            { x1: l1.index, y1: l1.price, x2: l2.index, y2: l2.price, label: `Double Bottom Base $${l1.price.toFixed(2)}`, type: 'support' }
          ]
        });
      }
    }
  }

  // 4. Bull Flag / Ascending Linear Regression Channel
  const closes = candles.map(c => c.close);
  const reg = calculateLinearRegression(closes);
  if (reg.rSquared > 0.35 && reg.slope > 0) {
    patterns.push({
      id: 'bull_channel',
      type: 'bull_channel',
      name: 'Ascending Linear Trend Channel',
      confidence: Math.min(95, Math.round(reg.rSquared * 100)),
      description: `R² = ${reg.rSquared.toFixed(2)} upward regression trajectory with dynamic 2-sigma volatility envelopes.`,
      bias: 'bullish',
      targetPrice: Number((currentPrice * 1.08).toFixed(2)),
      stopLossPrice: Number((reg.lowerBand[reg.lowerBand.length - 1] || currentPrice * 0.95).toFixed(2)),
      keyLevels: {
        upperChannelSlope: reg.slope,
        lowerChannelSlope: reg.slope
      },
      trendlines: [
        { x1: 0, y1: reg.upperBand[0], x2: n - 1, y2: reg.upperBand[n - 1], label: `Upper Channel $${reg.upperBand[n - 1]}`, type: 'channel' },
        { x1: 0, y1: reg.midBand[0], x2: n - 1, y2: reg.midBand[n - 1], label: `Regression Mean $${reg.midBand[n - 1]}`, type: 'channel' },
        { x1: 0, y1: reg.lowerBand[0], x2: n - 1, y2: reg.lowerBand[n - 1], label: `Lower Channel $${reg.lowerBand[n - 1]}`, type: 'channel' }
      ]
    });
  }

  // Fallback pattern if none triggered to ensure user always sees technical levels
  if (patterns.length === 0 && candles.length > 5) {
    const minLow = Math.min(...candles.map(c => c.low));
    const maxHigh = Math.max(...candles.map(c => c.high));
    patterns.push({
      id: 'range_levels',
      type: 'support_resistance',
      name: 'Dynamic Key Support & Resistance Corridor',
      confidence: 82,
      description: `Active range bounded by swing resistance at $${maxHigh.toFixed(2)} and swing support at $${minLow.toFixed(2)}.`,
      bias: 'neutral',
      targetPrice: Number((maxHigh * 1.03).toFixed(2)),
      stopLossPrice: Number((minLow * 0.98).toFixed(2)),
      keyLevels: { resistance: maxHigh, support: minLow },
      trendlines: [
        { x1: 0, y1: maxHigh, x2: n - 1, y2: maxHigh, label: `Swing High $${maxHigh.toFixed(2)}`, type: 'resistance' },
        { x1: 0, y1: minLow, x2: n - 1, y2: minLow, label: `Swing Low $${minLow.toFixed(2)}`, type: 'support' }
      ]
    });
  }

  return patterns;
}
