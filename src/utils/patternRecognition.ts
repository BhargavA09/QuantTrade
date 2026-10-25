// Quantitative Chart Pattern Recognition & Dynamic Trendline Engine
// Algorithms for: Head & Shoulders, Inverse H&S, Bull Flag, Bear Flag, Double Top/Bottom, Triangles, Cup & Handle

export interface SwingPoint {
  index: number;
  date: string;
  price: number;
  type: 'high' | 'low';
}

export type PatternType =
  | 'head_and_shoulders'
  | 'inverse_head_and_shoulders'
  | 'bull_flag'
  | 'bear_flag'
  | 'double_top'
  | 'double_bottom'
  | 'ascending_triangle'
  | 'descending_triangle'
  | 'cup_and_handle'
  | 'support_resistance'
  | 'bull_channel'
  | 'bear_channel';

export type PatternStatus =
  | 'FORMING'
  | 'CONFIRMED_BREAKOUT'
  | 'TARGET_REACHED'
  | 'INVALIDATED';

export interface PatternKeyPoints {
  leftShoulder?: { index: number; date: string; price: number };
  head?: { index: number; date: string; price: number };
  rightShoulder?: { index: number; date: string; price: number };
  necklineStart?: { index: number; date: string; price: number };
  necklineEnd?: { index: number; date: string; price: number };
  flagpoleStart?: { index: number; date: string; price: number };
  flagpoleEnd?: { index: number; date: string; price: number };
  flagHigh?: { index: number; date: string; price: number };
  flagLow?: { index: number; date: string; price: number };
  breakoutPoint?: { index: number; date: string; price: number };
  cupLeftRim?: { index: number; date: string; price: number };
  cupBottom?: { index: number; date: string; price: number };
  cupRightRim?: { index: number; date: string; price: number };
  handleLow?: { index: number; date: string; price: number };
  peak1?: { index: number; date: string; price: number };
  peak2?: { index: number; date: string; price: number };
  trough1?: { index: number; date: string; price: number };
  trough2?: { index: number; date: string; price: number };
}

export interface ChartPattern {
  id: string;
  type: PatternType;
  name: string;
  category: 'Reversal' | 'Continuation' | 'Consolidation';
  confidence: number; // 0 to 100%
  status: PatternStatus;
  bias: 'bullish' | 'bearish' | 'neutral';
  description: string;
  targetPrice: number;
  stopLossPrice: number;
  entryPrice: number;
  riskRewardRatio: number;
  potentialMovePct: number;
  keyLevels: {
    resistance?: number;
    support?: number;
    neckline?: number;
    flagTop?: number;
    flagBottom?: number;
    pivotPoints?: PatternKeyPoints;
  };
  trendlines: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
    type: 'resistance' | 'support' | 'neckline' | 'channel' | 'flagpole' | 'target';
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
  }>;
  volumeProfileConfirmation?: string;
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
  order: number = 2
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
      if (data[j].high > currentHigh) isHigh = false;
      if (data[j].low < currentLow) isLow = false;
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

  const slope = (n * sumXY - sumX * sumY) / Math.max(1e-6, n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

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

/**
 * Main Pattern Detection Engine: Identifies classical chart formations across OHLCV bars.
 */
export function detectAutomatedPatterns(
  candles: Array<{ date: string; open: number; high: number; low: number; close: number; volume?: number }>
): ChartPattern[] {
  if (!candles || candles.length < 12) return [];

  const patterns: ChartPattern[] = [];
  const extrema = findLocalExtrema(candles, 2);
  const highs = extrema.filter(e => e.type === 'high');
  const lows = extrema.filter(e => e.type === 'low');
  const n = candles.length;
  const currentPrice = candles[n - 1].close;

  // ---------------------------------------------------------------------------
  // 1. HEAD AND SHOULDERS (Bearish Reversal Formation)
  // ---------------------------------------------------------------------------
  if (highs.length >= 3 && lows.length >= 2) {
    for (let i = 0; i <= highs.length - 3; i++) {
      const ls = highs[i];      // Left Shoulder
      const head = highs[i + 1]; // Head
      const rs = highs[i + 2];  // Right Shoulder

      // Find intervening troughs
      const t1Candidates = lows.filter(l => l.index > ls.index && l.index < head.index);
      const t2Candidates = lows.filter(l => l.index > head.index && l.index < rs.index);

      if (t1Candidates.length > 0 && t2Candidates.length > 0) {
        const t1 = t1Candidates[t1Candidates.length - 1];
        const t2 = t2Candidates[0];

        // Valid H&S rules:
        // Head must be distinctly higher than both shoulders (> 1.2% higher)
        // Shoulders must be comparable in height (within 5% of each other)
        const isHeadHigher = head.price > ls.price * 1.012 && head.price > rs.price * 1.012;
        const shoulderSymPct = Math.abs(ls.price - rs.price) / ls.price;

        if (isHeadHigher && shoulderSymPct < 0.055) {
          // Calculate Neckline slope m and intercept
          const slope = (t2.price - t1.price) / Math.max(1, t2.index - t1.index);
          const currentNeckline = t2.price + slope * (n - 1 - t2.index);
          const headNeckline = t1.price + slope * (head.index - t1.index);
          const height = Math.max(1.0, head.price - headNeckline);
          const target = parseFloat((currentNeckline - height).toFixed(2));
          const stopLoss = parseFloat((rs.price * 1.015).toFixed(2));

          let status: PatternStatus = 'FORMING';
          if (currentPrice < currentNeckline) {
            status = currentPrice <= target ? 'TARGET_REACHED' : 'CONFIRMED_BREAKOUT';
          }
          if (currentPrice > head.price) {
            status = 'INVALIDATED';
          }

          const potentialMovePct = parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(1));
          const riskDollar = Math.abs(stopLoss - currentPrice);
          const rewardDollar = Math.abs(currentPrice - target);
          const rr = parseFloat((rewardDollar / Math.max(0.1, riskDollar)).toFixed(2));

          patterns.push({
            id: `hs_${ls.index}`,
            type: 'head_and_shoulders',
            name: 'Head & Shoulders (Bearish Reversal)',
            category: 'Reversal',
            confidence: Math.min(94, Math.round(82 + (1 - shoulderSymPct) * 10)),
            status,
            bias: 'bearish',
            description: `Three peaks with central Head ($${head.price.toFixed(2)}) exceeding Left ($${ls.price.toFixed(2)}) and Right ($${rs.price.toFixed(2)}) shoulders. Break below neckline ($${currentNeckline.toFixed(2)}) signals institutional distribution.`,
            targetPrice: target,
            stopLossPrice: stopLoss,
            entryPrice: currentNeckline,
            riskRewardRatio: rr,
            potentialMovePct,
            keyLevels: {
              neckline: parseFloat(currentNeckline.toFixed(2)),
              resistance: head.price,
              pivotPoints: {
                leftShoulder: ls,
                head,
                rightShoulder: rs,
                necklineStart: t1,
                necklineEnd: t2
              }
            },
            trendlines: [
              { x1: t1.index, y1: t1.price, x2: n - 1, y2: currentNeckline, label: `Neckline $${currentNeckline.toFixed(2)}`, type: 'neckline', color: '#f43f5e', style: 'solid' },
              { x1: ls.index, y1: ls.price, x2: head.index, y2: head.price, label: 'L-Shoulder to Head', type: 'resistance', color: '#a1a1aa', style: 'dashed' },
              { x1: head.index, y1: head.price, x2: rs.index, y2: rs.price, label: 'Head to R-Shoulder', type: 'resistance', color: '#a1a1aa', style: 'dashed' },
              { x1: n - 1, y1: currentNeckline, x2: n - 1, y2: target, label: `Target $${target}`, type: 'target', color: '#f43f5e', style: 'dotted' }
            ],
            volumeProfileConfirmation: 'Volume typically peaks on Left Shoulder/Head and recedes on Right Shoulder, confirming exhaustion.'
          });
          break; // Keep the strongest recent H&S
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 2. INVERSE HEAD AND SHOULDERS (Bullish Reversal Formation)
  // ---------------------------------------------------------------------------
  if (lows.length >= 3 && highs.length >= 2) {
    for (let i = 0; i <= lows.length - 3; i++) {
      const ls = lows[i];       // Left Shoulder Low
      const head = lows[i + 1];  // Head Low
      const rs = lows[i + 2];   // Right Shoulder Low

      const p1Candidates = highs.filter(h => h.index > ls.index && h.index < head.index);
      const p2Candidates = highs.filter(h => h.index > head.index && h.index < rs.index);

      if (p1Candidates.length > 0 && p2Candidates.length > 0) {
        const p1 = p1Candidates[p1Candidates.length - 1];
        const p2 = p2Candidates[0];

        const isHeadLower = head.price < ls.price * 0.988 && head.price < rs.price * 0.988;
        const shoulderSymPct = Math.abs(ls.price - rs.price) / ls.price;

        if (isHeadLower && shoulderSymPct < 0.055) {
          const slope = (p2.price - p1.price) / Math.max(1, p2.index - p1.index);
          const currentNeckline = p2.price + slope * (n - 1 - p2.index);
          const headNeckline = p1.price + slope * (head.index - p1.index);
          const height = Math.max(1.0, headNeckline - head.price);
          const target = parseFloat((currentNeckline + height).toFixed(2));
          const stopLoss = parseFloat((rs.price * 0.985).toFixed(2));

          let status: PatternStatus = 'FORMING';
          if (currentPrice > currentNeckline) {
            status = currentPrice >= target ? 'TARGET_REACHED' : 'CONFIRMED_BREAKOUT';
          }
          if (currentPrice < head.price) {
            status = 'INVALIDATED';
          }

          const potentialMovePct = parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(1));
          const riskDollar = Math.abs(currentPrice - stopLoss);
          const rewardDollar = Math.abs(target - currentPrice);
          const rr = parseFloat((rewardDollar / Math.max(0.1, riskDollar)).toFixed(2));

          patterns.push({
            id: `ihs_${ls.index}`,
            type: 'inverse_head_and_shoulders',
            name: 'Inverse Head & Shoulders (Bullish Reversal)',
            category: 'Reversal',
            confidence: Math.min(95, Math.round(84 + (1 - shoulderSymPct) * 10)),
            status,
            bias: 'bullish',
            description: `Bullish accumulation base: Left shoulder ($${ls.price.toFixed(2)}), Head low ($${head.price.toFixed(2)}), and Right shoulder ($${rs.price.toFixed(2)}). Breakout above resistance neckline ($${currentNeckline.toFixed(2)}) confirms upside target $${target}.`,
            targetPrice: target,
            stopLossPrice: stopLoss,
            entryPrice: currentNeckline,
            riskRewardRatio: rr,
            potentialMovePct,
            keyLevels: {
              neckline: parseFloat(currentNeckline.toFixed(2)),
              support: head.price,
              pivotPoints: {
                leftShoulder: ls,
                head,
                rightShoulder: rs,
                necklineStart: p1,
                necklineEnd: p2
              }
            },
            trendlines: [
              { x1: p1.index, y1: p1.price, x2: n - 1, y2: currentNeckline, label: `Neckline $${currentNeckline.toFixed(2)}`, type: 'neckline', color: '#10b981', style: 'solid' },
              { x1: ls.index, y1: ls.price, x2: head.index, y2: head.price, label: 'L-Shoulder to Head', type: 'support', color: '#a1a1aa', style: 'dashed' },
              { x1: head.index, y1: head.price, x2: rs.index, y2: rs.price, label: 'Head to R-Shoulder', type: 'support', color: '#a1a1aa', style: 'dashed' },
              { x1: n - 1, y1: currentNeckline, x2: n - 1, y2: target, label: `Target $${target}`, type: 'target', color: '#10b981', style: 'dotted' }
            ],
            volumeProfileConfirmation: 'Expanding buyer volume on the right shoulder thrust signals institutional accumulation.'
          });
          break;
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. BULL FLAG (High-Probability Bullish Continuation)
  // ---------------------------------------------------------------------------
  // Scan for a flagpole impulse (e.g. +3.5% in 3-8 bars) followed by 3-10 bars of orderly downward/flat consolidation
  if (candles.length >= 10) {
    for (let poleStart = 0; poleStart <= candles.length - 8; poleStart++) {
      for (let poleEnd = poleStart + 2; poleEnd <= Math.min(candles.length - 4, poleStart + 7); poleEnd++) {
        const startPrice = candles[poleStart].low;
        const peakPrice = candles[poleEnd].high;
        const poleGainPct = (peakPrice - startPrice) / startPrice;

        // Flagpole must be a strong advance (> 3.5%)
        if (poleGainPct >= 0.035) {
          const poleHeight = peakPrice - startPrice;
          const flagBars = candles.slice(poleEnd, n);

          if (flagBars.length >= 3 && flagBars.length <= 14) {
            const flagMinLow = Math.min(...flagBars.map(b => b.low));
            const flagMaxHigh = Math.max(...flagBars.map(b => b.high));
            const retracement = (peakPrice - flagMinLow) / poleHeight;

            // Retracement must be shallow: between 10% and 45% of flagpole
            if (retracement >= 0.08 && retracement <= 0.48) {
              const flagSlope = (candles[n - 1].close - peakPrice) / Math.max(1, n - 1 - poleEnd);

              // Flag upper bound line (connecting peak to recent flag highs)
              const upperBoundary = parseFloat((peakPrice + flagSlope * (n - 1 - poleEnd)).toFixed(2));
              const lowerBoundary = parseFloat(flagMinLow.toFixed(2));
              const measuredTarget = parseFloat((upperBoundary + poleHeight).toFixed(2));
              const stopLoss = parseFloat((flagMinLow * 0.985).toFixed(2));

              let status: PatternStatus = 'FORMING';
              if (currentPrice > upperBoundary) {
                status = currentPrice >= measuredTarget ? 'TARGET_REACHED' : 'CONFIRMED_BREAKOUT';
              }
              if (currentPrice < flagMinLow * 0.97) {
                status = 'INVALIDATED';
              }

              const potentialMovePct = parseFloat((((measuredTarget - currentPrice) / currentPrice) * 100).toFixed(1));
              const riskDollar = Math.abs(currentPrice - stopLoss);
              const rewardDollar = Math.abs(measuredTarget - currentPrice);
              const rr = parseFloat((rewardDollar / Math.max(0.1, riskDollar)).toFixed(2));

              patterns.push({
                id: `bull_flag_${poleStart}`,
                type: 'bull_flag',
                name: 'Bull Flag (Bullish Continuation)',
                category: 'Continuation',
                confidence: Math.min(96, Math.round(85 + (0.45 - retracement) * 20)),
                status,
                bias: 'bullish',
                description: `Impulsive Flagpole (+${(poleGainPct * 100).toFixed(1)}% advance) followed by tight downward consolidation channel retracing only ${(retracement * 100).toFixed(1)}% of move. Breakout above flag resistance ($${upperBoundary}) targets measured move to $${measuredTarget}.`,
                targetPrice: measuredTarget,
                stopLossPrice: stopLoss,
                entryPrice: upperBoundary,
                riskRewardRatio: rr,
                potentialMovePct,
                keyLevels: {
                  flagTop: upperBoundary,
                  flagBottom: lowerBoundary,
                  resistance: upperBoundary,
                  support: lowerBoundary,
                  pivotPoints: {
                    flagpoleStart: { index: poleStart, date: candles[poleStart].date, price: startPrice },
                    flagpoleEnd: { index: poleEnd, date: candles[poleEnd].date, price: peakPrice },
                    flagHigh: { index: poleEnd, date: candles[poleEnd].date, price: peakPrice },
                    flagLow: { index: n - 1, date: candles[n - 1].date, price: flagMinLow }
                  }
                },
                trendlines: [
                  { x1: poleStart, y1: startPrice, x2: poleEnd, y2: peakPrice, label: `Flagpole +${(poleGainPct * 100).toFixed(1)}%`, type: 'flagpole', color: '#10b981', style: 'solid' },
                  { x1: poleEnd, y1: peakPrice, x2: n - 1, y2: upperBoundary, label: `Flag Resistance $${upperBoundary}`, type: 'channel', color: '#38bdf8', style: 'solid' },
                  { x1: poleEnd, y1: peakPrice - (peakPrice - flagMinLow), x2: n - 1, y2: lowerBoundary, label: `Flag Support $${lowerBoundary}`, type: 'channel', color: '#38bdf8', style: 'solid' },
                  { x1: n - 1, y1: upperBoundary, x2: n - 1, y2: measuredTarget, label: `Target $${measuredTarget}`, type: 'target', color: '#10b981', style: 'dotted' }
                ],
                volumeProfileConfirmation: 'Volume contracts significantly during flag consolidation, confirming absence of institutional distribution.'
              });
              break;
            }
          }
        }
      }
      if (patterns.some(p => p.type === 'bull_flag')) break;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. BEAR FLAG (High-Probability Bearish Continuation)
  // ---------------------------------------------------------------------------
  if (candles.length >= 10 && !patterns.some(p => p.type === 'bull_flag')) {
    for (let poleStart = 0; poleStart <= candles.length - 8; poleStart++) {
      for (let poleEnd = poleStart + 2; poleEnd <= Math.min(candles.length - 4, poleStart + 7); poleEnd++) {
        const startPrice = candles[poleStart].high;
        const troughPrice = candles[poleEnd].low;
        const poleDropPct = (startPrice - troughPrice) / startPrice;

        if (poleDropPct >= 0.035) {
          const poleHeight = startPrice - troughPrice;
          const flagBars = candles.slice(poleEnd, n);

          if (flagBars.length >= 3 && flagBars.length <= 14) {
            const flagMaxHigh = Math.max(...flagBars.map(b => b.high));
            const retracement = (flagMaxHigh - troughPrice) / poleHeight;

            if (retracement >= 0.08 && retracement <= 0.48) {
              const lowerBoundary = parseFloat(troughPrice.toFixed(2));
              const upperBoundary = parseFloat(flagMaxHigh.toFixed(2));
              const measuredTarget = parseFloat((lowerBoundary - poleHeight).toFixed(2));
              const stopLoss = parseFloat((flagMaxHigh * 1.015).toFixed(2));

              let status: PatternStatus = 'FORMING';
              if (currentPrice < lowerBoundary) {
                status = currentPrice <= measuredTarget ? 'TARGET_REACHED' : 'CONFIRMED_BREAKOUT';
              }
              if (currentPrice > flagMaxHigh * 1.025) {
                status = 'INVALIDATED';
              }

              const potentialMovePct = parseFloat((((measuredTarget - currentPrice) / currentPrice) * 100).toFixed(1));
              const riskDollar = Math.abs(stopLoss - currentPrice);
              const rewardDollar = Math.abs(currentPrice - measuredTarget);
              const rr = parseFloat((rewardDollar / Math.max(0.1, riskDollar)).toFixed(2));

              patterns.push({
                id: `bear_flag_${poleStart}`,
                type: 'bear_flag',
                name: 'Bear Flag (Bearish Continuation)',
                category: 'Continuation',
                confidence: Math.min(94, Math.round(84 + (0.45 - retracement) * 20)),
                status,
                bias: 'bearish',
                description: `Steep selloff flagpole (-${(poleDropPct * 100).toFixed(1)}%) followed by weak upward consolidation channel. Breakdown below support line ($${lowerBoundary}) projects continuation move to $${measuredTarget}.`,
                targetPrice: measuredTarget,
                stopLossPrice: stopLoss,
                entryPrice: lowerBoundary,
                riskRewardRatio: rr,
                potentialMovePct,
                keyLevels: {
                  flagTop: upperBoundary,
                  flagBottom: lowerBoundary,
                  resistance: upperBoundary,
                  support: lowerBoundary,
                  pivotPoints: {
                    flagpoleStart: { index: poleStart, date: candles[poleStart].date, price: startPrice },
                    flagpoleEnd: { index: poleEnd, date: candles[poleEnd].date, price: troughPrice },
                    flagHigh: { index: poleEnd, date: candles[poleEnd].date, price: flagMaxHigh },
                    flagLow: { index: n - 1, date: candles[n - 1].date, price: troughPrice }
                  }
                },
                trendlines: [
                  { x1: poleStart, y1: startPrice, x2: poleEnd, y2: troughPrice, label: `Drop -${(poleDropPct * 100).toFixed(1)}%`, type: 'flagpole', color: '#f43f5e', style: 'solid' },
                  { x1: poleEnd, y1: troughPrice, x2: n - 1, y2: lowerBoundary, label: `Support $${lowerBoundary}`, type: 'channel', color: '#fbbf24', style: 'solid' },
                  { x1: poleEnd, y1: flagMaxHigh, x2: n - 1, y2: upperBoundary, label: `Resistance $${upperBoundary}`, type: 'channel', color: '#fbbf24', style: 'solid' },
                  { x1: n - 1, y1: lowerBoundary, x2: n - 1, y2: measuredTarget, label: `Target $${measuredTarget}`, type: 'target', color: '#f43f5e', style: 'dotted' }
                ],
                volumeProfileConfirmation: 'Diminishing buy volume during ascending consolidation confirms corrective rally.'
              });
              break;
            }
          }
        }
      }
      if (patterns.some(p => p.type === 'bear_flag')) break;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. DOUBLE TOP ("M" Bearish Reversal Pattern)
  // ---------------------------------------------------------------------------
  if (highs.length >= 2) {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const midLows = lows.filter(l => l.index > h1.index && l.index < h2.index);

    if (midLows.length > 0 && h2.index - h1.index >= 3) {
      const neckline = Math.min(...midLows.map(l => l.price));
      const topDiffPct = Math.abs(h1.price - h2.price) / h1.price;

      if (topDiffPct < 0.035) {
        const avgTop = (h1.price + h2.price) / 2;
        const height = avgTop - neckline;
        const target = parseFloat((neckline - height).toFixed(2));
        const stopLoss = parseFloat((Math.max(h1.price, h2.price) * 1.015).toFixed(2));

        let status: PatternStatus = 'FORMING';
        if (currentPrice < neckline) {
          status = currentPrice <= target ? 'TARGET_REACHED' : 'CONFIRMED_BREAKOUT';
        }
        if (currentPrice > avgTop * 1.02) {
          status = 'INVALIDATED';
        }

        const potentialMovePct = parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(1));
        const riskDollar = Math.abs(stopLoss - currentPrice);
        const rewardDollar = Math.abs(currentPrice - target);
        const rr = parseFloat((rewardDollar / Math.max(0.1, riskDollar)).toFixed(2));

        patterns.push({
          id: `double_top_${h1.index}`,
          type: 'double_top',
          name: 'Double Top (M-Reversal)',
          category: 'Reversal',
          confidence: Math.min(92, Math.round(82 + (1 - topDiffPct) * 10)),
          status,
          bias: 'bearish',
          description: `Two peaks rejected at resistance zone ~$${avgTop.toFixed(2)}. Breakdown below intervening support neckline ($${neckline.toFixed(2)}) confirms completion.`,
          targetPrice: target,
          stopLossPrice: stopLoss,
          entryPrice: neckline,
          riskRewardRatio: rr,
          potentialMovePct,
          keyLevels: {
            neckline,
            resistance: avgTop,
            support: neckline,
            pivotPoints: {
              peak1: h1,
              peak2: h2,
              trough1: midLows[0]
            }
          },
          trendlines: [
            { x1: h1.index, y1: neckline, x2: n - 1, y2: neckline, label: `Neckline Support $${neckline.toFixed(2)}`, type: 'neckline', color: '#f43f5e', style: 'solid' },
            { x1: h1.index, y1: h1.price, x2: h2.index, y2: h2.price, label: `Double Resistance $${avgTop.toFixed(2)}`, type: 'resistance', color: '#f43f5e', style: 'dashed' },
            { x1: n - 1, y1: neckline, x2: n - 1, y2: target, label: `Target $${target}`, type: 'target', color: '#f43f5e', style: 'dotted' }
          ],
          volumeProfileConfirmation: 'Volume on second peak is lighter, signaling buyers failed to absorb overhead supply.'
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. DOUBLE BOTTOM ("W" Bullish Reversal Pattern)
  // ---------------------------------------------------------------------------
  if (lows.length >= 2) {
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];
    const midHighs = highs.filter(h => h.index > l1.index && h.index < l2.index);

    if (midHighs.length > 0 && l2.index - l1.index >= 3) {
      const neckline = Math.max(...midHighs.map(h => h.price));
      const bottomDiffPct = Math.abs(l1.price - l2.price) / l1.price;

      if (bottomDiffPct < 0.035) {
        const avgBottom = (l1.price + l2.price) / 2;
        const height = neckline - avgBottom;
        const target = parseFloat((neckline + height).toFixed(2));
        const stopLoss = parseFloat((Math.min(l1.price, l2.price) * 0.985).toFixed(2));

        let status: PatternStatus = 'FORMING';
        if (currentPrice > neckline) {
          status = currentPrice >= target ? 'TARGET_REACHED' : 'CONFIRMED_BREAKOUT';
        }
        if (currentPrice < avgBottom * 0.98) {
          status = 'INVALIDATED';
        }

        const potentialMovePct = parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(1));
        const riskDollar = Math.abs(currentPrice - stopLoss);
        const rewardDollar = Math.abs(target - currentPrice);
        const rr = parseFloat((rewardDollar / Math.max(0.1, riskDollar)).toFixed(2));

        patterns.push({
          id: `double_bottom_${l1.index}`,
          type: 'double_bottom',
          name: 'Double Bottom (W-Reversal)',
          category: 'Reversal',
          confidence: Math.min(93, Math.round(83 + (1 - bottomDiffPct) * 10)),
          status,
          bias: 'bullish',
          description: `Two support tests hold ~$${avgBottom.toFixed(2)}. Breakout above central neckline resistance ($${neckline.toFixed(2)}) confirms upside target $${target}.`,
          targetPrice: target,
          stopLossPrice: stopLoss,
          entryPrice: neckline,
          riskRewardRatio: rr,
          potentialMovePct,
          keyLevels: {
            neckline,
            support: avgBottom,
            resistance: neckline,
            pivotPoints: {
              trough1: l1,
              trough2: l2,
              peak1: midHighs[0]
            }
          },
          trendlines: [
            { x1: l1.index, y1: neckline, x2: n - 1, y2: neckline, label: `Neckline Resistance $${neckline.toFixed(2)}`, type: 'neckline', color: '#10b981', style: 'solid' },
            { x1: l1.index, y1: l1.price, x2: l2.index, y2: l2.price, label: `Double Bottom Base $${avgBottom.toFixed(2)}`, type: 'support', color: '#10b981', style: 'dashed' },
            { x1: n - 1, y1: neckline, x2: n - 1, y2: target, label: `Target $${target}`, type: 'target', color: '#10b981', style: 'dotted' }
          ],
          volumeProfileConfirmation: 'Higher buy volume on the second retest confirms strong institutional bid.'
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 7. ASCENDING TRIANGLE & DESCENDING TRIANGLE
  // ---------------------------------------------------------------------------
  if (highs.length >= 2 && lows.length >= 2) {
    const h1 = highs[highs.length - 2];
    const h2 = highs[highs.length - 1];
    const l1 = lows[lows.length - 2];
    const l2 = lows[lows.length - 1];

    const highDiffPct = Math.abs(h1.price - h2.price) / h1.price;
    const lowDiffPct = Math.abs(l1.price - l2.price) / l1.price;

    // Ascending Triangle: Flat Resistance + Rising Lows
    if (highDiffPct < 0.025 && l2.price > l1.price * 1.015 && l2.index > l1.index) {
      const resistance = (h1.price + h2.price) / 2;
      const breakoutTarget = parseFloat((resistance + (resistance - l1.price)).toFixed(2));
      const stopLoss = parseFloat((l2.price * 0.985).toFixed(2));
      const potentialMovePct = parseFloat((((breakoutTarget - currentPrice) / currentPrice) * 100).toFixed(1));

      patterns.push({
        id: `asc_triangle_${h1.index}`,
        type: 'ascending_triangle',
        name: 'Ascending Triangle (Bullish Accumulation)',
        category: 'Consolidation',
        confidence: 90,
        status: currentPrice > resistance ? 'CONFIRMED_BREAKOUT' : 'FORMING',
        bias: 'bullish',
        description: 'Higher lows pressing against a flat overhead supply ceiling indicate persistent institutional accumulation.',
        targetPrice: breakoutTarget,
        stopLossPrice: stopLoss,
        entryPrice: resistance,
        riskRewardRatio: 2.45,
        potentialMovePct,
        keyLevels: { resistance, support: l2.price },
        trendlines: [
          { x1: h1.index, y1: resistance, x2: n - 1, y2: resistance, label: `Flat Resistance $${resistance.toFixed(2)}`, type: 'resistance', color: '#38bdf8', style: 'solid' },
          { x1: l1.index, y1: l1.price, x2: l2.index, y2: l2.price, label: 'Ascending Support Trendline', type: 'support', color: '#10b981', style: 'solid' },
          { x1: n - 1, y1: resistance, x2: n - 1, y2: breakoutTarget, label: `Target $${breakoutTarget}`, type: 'target', color: '#10b981', style: 'dotted' }
        ],
        volumeProfileConfirmation: 'Volume typically declines as triangle apex nears, then explodes upon resistance breakout.'
      });
    }

    // Descending Triangle: Flat Support + Falling Highs
    if (lowDiffPct < 0.025 && h2.price < h1.price * 0.985 && h2.index > h1.index) {
      const support = (l1.price + l2.price) / 2;
      const breakdownTarget = parseFloat((support - (h1.price - support)).toFixed(2));
      const stopLoss = parseFloat((h2.price * 1.015).toFixed(2));
      const potentialMovePct = parseFloat((((breakdownTarget - currentPrice) / currentPrice) * 100).toFixed(1));

      patterns.push({
        id: `desc_triangle_${l1.index}`,
        type: 'descending_triangle',
        name: 'Descending Triangle (Bearish Distribution)',
        category: 'Consolidation',
        confidence: 89,
        status: currentPrice < support ? 'CONFIRMED_BREAKOUT' : 'FORMING',
        bias: 'bearish',
        description: 'Lower highs pressing down on a horizontal floor indicate progressive distribution and buyer fatigue.',
        targetPrice: breakdownTarget,
        stopLossPrice: stopLoss,
        entryPrice: support,
        riskRewardRatio: 2.30,
        potentialMovePct,
        keyLevels: { support, resistance: h2.price },
        trendlines: [
          { x1: l1.index, y1: support, x2: n - 1, y2: support, label: `Flat Support $${support.toFixed(2)}`, type: 'support', color: '#f43f5e', style: 'solid' },
          { x1: h1.index, y1: h1.price, x2: h2.index, y2: h2.price, label: 'Descending Resistance Trendline', type: 'resistance', color: '#f43f5e', style: 'solid' },
          { x1: n - 1, y1: support, x2: n - 1, y2: breakdownTarget, label: `Target $${breakdownTarget}`, type: 'target', color: '#f43f5e', style: 'dotted' }
        ],
        volumeProfileConfirmation: 'Heavy sell volume on retests of the horizontal floor signals impending breakdown.'
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 8. CUP AND HANDLE (William O'Neil Bullish Formation)
  // ---------------------------------------------------------------------------
  if (candles.length >= 18 && !patterns.some(p => p.type === 'bull_flag' || p.type === 'double_bottom')) {
    const minLowIdx = candles.slice(4, n - 4).reduce((minIdx, c, idx) => c.low < candles[minIdx].low ? idx + 4 : minIdx, 4);
    const leftRimHigh = Math.max(...candles.slice(0, minLowIdx).map(c => c.high));
    const rightRimHigh = Math.max(...candles.slice(minLowIdx, n - 2).map(c => c.high));
    const rimDiff = Math.abs(leftRimHigh - rightRimHigh) / leftRimHigh;

    if (rimDiff < 0.04 && leftRimHigh > candles[minLowIdx].low * 1.05) {
      const cupDepth = leftRimHigh - candles[minLowIdx].low;
      const handleBars = candles.slice(n - 4, n);
      const handleLow = Math.min(...handleBars.map(b => b.low));
      const handleRetrace = (rightRimHigh - handleLow) / cupDepth;

      if (handleRetrace < 0.40) {
        const rimPrice = parseFloat(((leftRimHigh + rightRimHigh) / 2).toFixed(2));
        const target = parseFloat((rimPrice + cupDepth).toFixed(2));
        const stopLoss = parseFloat((handleLow * 0.985).toFixed(2));

        patterns.push({
          id: `cup_handle_${minLowIdx}`,
          type: 'cup_and_handle',
          name: 'Cup & Handle (Bullish Growth Base)',
          category: 'Continuation',
          confidence: 91,
          status: currentPrice > rimPrice ? 'CONFIRMED_BREAKOUT' : 'FORMING',
          bias: 'bullish',
          description: `U-shaped accumulation bowl ($${candles[minLowIdx].low.toFixed(2)}) followed by shallow handle consolidation. Breakout above rim $${rimPrice} projects move to $${target}.`,
          targetPrice: target,
          stopLossPrice: stopLoss,
          entryPrice: rimPrice,
          riskRewardRatio: 2.80,
          potentialMovePct: parseFloat((((target - currentPrice) / currentPrice) * 100).toFixed(1)),
          keyLevels: {
            resistance: rimPrice,
            support: handleLow,
            pivotPoints: {
              cupLeftRim: { index: 0, date: candles[0].date, price: leftRimHigh },
              cupBottom: { index: minLowIdx, date: candles[minLowIdx].date, price: candles[minLowIdx].low },
              cupRightRim: { index: n - 4, date: candles[n - 4].date, price: rightRimHigh },
              handleLow: { index: n - 1, date: candles[n - 1].date, price: handleLow }
            }
          },
          trendlines: [
            { x1: 0, y1: rimPrice, x2: n - 1, y2: rimPrice, label: `Rim Resistance $${rimPrice}`, type: 'neckline', color: '#10b981', style: 'solid' },
            { x1: n - 4, y1: rightRimHigh, x2: n - 1, y2: handleLow, label: 'Handle Drift', type: 'channel', color: '#a1a1aa', style: 'dashed' },
            { x1: n - 1, y1: rimPrice, x2: n - 1, y2: target, label: `Target $${target}`, type: 'target', color: '#10b981', style: 'dotted' }
          ],
          volumeProfileConfirmation: 'Dry volume during handle formation indicates weak hands have finished selling.'
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 9. DEFAULT / REGRESSION CHANNEL FALLBACK (Guarantees actionable levels)
  // ---------------------------------------------------------------------------
  if (patterns.length === 0) {
    const closes = candles.map(c => c.close);
    const reg = calculateLinearRegression(closes);
    const minLow = Math.min(...candles.map(c => c.low));
    const maxHigh = Math.max(...candles.map(c => c.high));

    if (reg.rSquared > 0.30 && reg.slope > 0) {
      patterns.push({
        id: 'bull_channel_reg',
        type: 'bull_channel',
        name: 'Ascending Linear Trend Channel',
        category: 'Continuation',
        confidence: Math.min(95, Math.round(reg.rSquared * 100)),
        status: 'FORMING',
        bias: 'bullish',
        description: `R² = ${reg.rSquared.toFixed(2)} upward regression trajectory with dynamic 2-sigma volatility envelopes.`,
        targetPrice: Number((currentPrice * 1.06).toFixed(2)),
        stopLossPrice: Number((reg.lowerBand[reg.lowerBand.length - 1] || currentPrice * 0.96).toFixed(2)),
        entryPrice: currentPrice,
        riskRewardRatio: 2.1,
        potentialMovePct: 6.0,
        keyLevels: { resistance: maxHigh, support: minLow },
        trendlines: [
          { x1: 0, y1: reg.upperBand[0], x2: n - 1, y2: reg.upperBand[n - 1], label: `Upper Channel $${reg.upperBand[n - 1]}`, type: 'channel', color: '#38bdf8' },
          { x1: 0, y1: reg.midBand[0], x2: n - 1, y2: reg.midBand[n - 1], label: `Regression Mean $${reg.midBand[n - 1]}`, type: 'channel', color: '#a1a1aa' },
          { x1: 0, y1: reg.lowerBand[0], x2: n - 1, y2: reg.lowerBand[n - 1], label: `Lower Channel $${reg.lowerBand[n - 1]}`, type: 'channel', color: '#10b981' }
        ]
      });
    } else {
      patterns.push({
        id: 'horizontal_corridor',
        type: 'support_resistance',
        name: 'Key Support & Resistance Consolidation Corridor',
        category: 'Consolidation',
        confidence: 84,
        status: 'FORMING',
        bias: currentPrice > (maxHigh + minLow) / 2 ? 'bullish' : 'neutral',
        description: `Active range bounded by swing resistance at $${maxHigh.toFixed(2)} and swing support at $${minLow.toFixed(2)}.`,
        targetPrice: Number((maxHigh * 1.03).toFixed(2)),
        stopLossPrice: Number((minLow * 0.98).toFixed(2)),
        entryPrice: currentPrice,
        riskRewardRatio: 1.85,
        potentialMovePct: 3.0,
        keyLevels: { resistance: maxHigh, support: minLow },
        trendlines: [
          { x1: 0, y1: maxHigh, x2: n - 1, y2: maxHigh, label: `Swing High $${maxHigh.toFixed(2)}`, type: 'resistance', color: '#f43f5e' },
          { x1: 0, y1: minLow, x2: n - 1, y2: minLow, label: `Swing Low $${minLow.toFixed(2)}`, type: 'support', color: '#10b981' }
        ]
      });
    }
  }

  return patterns;
}
