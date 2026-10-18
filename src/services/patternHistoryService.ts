/**
 * Finviz Pattern History & Post-Detection Performance Engine
 * Aggregates all historically detected patterns across monitored tickers
 * Tracks target hit rates, max drawdowns, and post-detection returns
 */

export interface HistoricalPatternRecord {
  id: string;
  ticker: string;
  companyName: string;
  patternType: 'ascending_triangle' | 'double_bottom' | 'support_resistance' | 'bull_channel' | 'falling_wedge' | 'other';
  patternName: string;
  detectionDate: string;
  detectionPrice: number;
  currentPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  peakPricePostDetection: number;
  troughPricePostDetection: number;
  performancePct: number; // Current % change since detection
  peakReturnPct: number;  // Max upside return achieved post-detection
  maxDrawdownPct: number; // Max drawdown experienced post-detection
  outcome: 'TARGET_REACHED' | 'STOP_TRIGGERED' | 'ACTIVE_RUNNING';
  confidence: number;
  volumeExpansionRatio: number; // e.g. 2.1x normal volume
  daysElapsed: number;
  keyLevels: {
    resistance: number;
    support: number;
    breakoutLevel: number;
  };
  sparkline: number[];
  notes: string;
}

export interface PatternPerformanceSummary {
  totalCount: number;
  targetReachedCount: number;
  stopTriggeredCount: number;
  activeCount: number;
  winRate: number; // % of closed trades that hit target
  avgReturnPct: number;
  avgPeakReturnPct: number;
  avgMaxDrawdownPct: number;
  profitFactor: number;
  bestPatternType: string;
  bestPerformingTicker: string;
}

const INITIAL_HISTORICAL_PATTERNS: HistoricalPatternRecord[] = [
  {
    id: 'hp-01',
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    patternType: 'ascending_triangle',
    patternName: 'Ascending Triangle (Bullish Accumulation)',
    detectionDate: '2026-10-12 10:15',
    detectionPrice: 134.50,
    currentPrice: 139.20,
    targetPrice: 148.50,
    stopLossPrice: 131.00,
    peakPricePostDetection: 149.80,
    troughPricePostDetection: 133.20,
    performancePct: 11.38,
    peakReturnPct: 11.38,
    maxDrawdownPct: -0.97,
    outcome: 'TARGET_REACHED',
    confidence: 94,
    volumeExpansionRatio: 2.35,
    daysElapsed: 5,
    keyLevels: { resistance: 136.00, support: 132.80, breakoutLevel: 136.20 },
    sparkline: [134.5, 135.2, 136.4, 138.8, 142.1, 144.5, 147.2, 149.8, 148.2, 139.2],
    notes: 'Horizontal barrier at $136.00 broken on 2.4x volume following Blackwell Ultra packaging rumors.'
  },
  {
    id: 'hp-02',
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    patternType: 'double_bottom',
    patternName: 'Double Bottom (W-Reversal)',
    detectionDate: '2026-10-10 11:30',
    detectionPrice: 235.00,
    currentPrice: 246.50,
    targetPrice: 258.00,
    stopLossPrice: 228.00,
    peakPricePostDetection: 259.40,
    troughPricePostDetection: 233.80,
    performancePct: 10.38,
    peakReturnPct: 10.38,
    maxDrawdownPct: -0.51,
    outcome: 'TARGET_REACHED',
    confidence: 91,
    volumeExpansionRatio: 2.15,
    daysElapsed: 7,
    keyLevels: { resistance: 245.00, support: 234.50, breakoutLevel: 245.50 },
    sparkline: [235.0, 237.2, 239.5, 244.0, 246.2, 251.0, 255.4, 259.4, 252.0, 246.5],
    notes: 'Classic dual-trough base holding $234.50 firmly. Neckline breakout confirmed with heavy institutional volume.'
  },
  {
    id: 'hp-03',
    ticker: 'PLTR',
    companyName: 'Palantir Technologies Inc.',
    patternType: 'ascending_triangle',
    patternName: 'Ascending Triangle Breakout',
    detectionDate: '2026-10-09 09:45',
    detectionPrice: 42.50,
    currentPrice: 48.80,
    targetPrice: 48.00,
    stopLossPrice: 40.80,
    peakPricePostDetection: 49.50,
    troughPricePostDetection: 41.90,
    performancePct: 14.82,
    peakReturnPct: 16.47,
    maxDrawdownPct: -1.41,
    outcome: 'TARGET_REACHED',
    confidence: 93,
    volumeExpansionRatio: 3.10,
    daysElapsed: 8,
    keyLevels: { resistance: 43.50, support: 41.20, breakoutLevel: 43.80 },
    sparkline: [42.5, 43.1, 44.2, 45.8, 46.5, 47.9, 49.5, 49.0, 48.4, 48.8],
    notes: 'Higher lows compressed under $43.50 ceiling before explosive upside continuation into new multi-year highs.'
  },
  {
    id: 'hp-04',
    ticker: 'AMD',
    companyName: 'Advanced Micro Devices, Inc.',
    patternType: 'double_bottom',
    patternName: 'Double Bottom (W-Reversal)',
    detectionDate: '2026-10-08 13:20',
    detectionPrice: 152.00,
    currentPrice: 164.20,
    targetPrice: 168.00,
    stopLossPrice: 147.50,
    peakPricePostDetection: 169.50,
    troughPricePostDetection: 150.80,
    performancePct: 8.03,
    peakReturnPct: 11.51,
    maxDrawdownPct: -0.79,
    outcome: 'TARGET_REACHED',
    confidence: 89,
    volumeExpansionRatio: 1.95,
    daysElapsed: 9,
    keyLevels: { resistance: 160.00, support: 151.00, breakoutLevel: 160.50 },
    sparkline: [152.0, 153.5, 156.0, 159.2, 161.4, 165.0, 169.5, 167.0, 165.2, 164.2],
    notes: 'Key swing low retest at $151.00 held firmly with bullish RSI divergence followed by 11.5% extension.'
  },
  {
    id: 'hp-05',
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    patternType: 'ascending_triangle',
    patternName: 'Ascending Triangle (Bullish Accumulation)',
    detectionDate: '2026-10-15 14:10',
    detectionPrice: 228.00,
    currentPrice: 231.80,
    targetPrice: 239.00,
    stopLossPrice: 224.50,
    peakPricePostDetection: 232.40,
    troughPricePostDetection: 227.10,
    performancePct: 1.67,
    peakReturnPct: 1.93,
    maxDrawdownPct: -0.39,
    outcome: 'ACTIVE_RUNNING',
    confidence: 88,
    volumeExpansionRatio: 1.70,
    daysElapsed: 2,
    keyLevels: { resistance: 230.50, support: 226.00, breakoutLevel: 230.80 },
    sparkline: [228.0, 227.5, 228.4, 229.2, 230.1, 230.8, 231.5, 232.4, 231.2, 231.8],
    notes: 'Current breakout above $230.50 resistance in progress; coiling pattern active towards $239 target.'
  },
  {
    id: 'hp-06',
    ticker: 'MSFT',
    companyName: 'Microsoft Corporation',
    patternType: 'ascending_triangle',
    patternName: 'Ascending Triangle Compression',
    detectionDate: '2026-10-11 10:00',
    detectionPrice: 418.00,
    currentPrice: 414.20,
    targetPrice: 432.00,
    stopLossPrice: 412.00,
    peakPricePostDetection: 421.50,
    troughPricePostDetection: 411.50,
    performancePct: -0.91,
    peakReturnPct: 0.84,
    maxDrawdownPct: -1.55,
    outcome: 'STOP_TRIGGERED',
    confidence: 86,
    volumeExpansionRatio: 1.15,
    daysElapsed: 6,
    keyLevels: { resistance: 422.00, support: 415.00, breakoutLevel: 422.50 },
    sparkline: [418.0, 419.5, 421.5, 417.0, 414.8, 412.5, 411.5, 413.0, 414.0, 414.2],
    notes: 'Failed to sustain volume on resistance approach; dipped below $412 stop-loss before finding floor.'
  },
  {
    id: 'hp-07',
    ticker: 'SMCI',
    companyName: 'Super Micro Computer, Inc.',
    patternType: 'falling_wedge',
    patternName: 'Falling Wedge (High-Probability Bullish Reversal)',
    detectionDate: '2026-10-06 09:30',
    detectionPrice: 45.80,
    currentPrice: 53.40,
    targetPrice: 54.00,
    stopLossPrice: 42.00,
    peakPricePostDetection: 55.20,
    troughPricePostDetection: 44.90,
    performancePct: 16.59,
    peakReturnPct: 20.52,
    maxDrawdownPct: -1.97,
    outcome: 'TARGET_REACHED',
    confidence: 90,
    volumeExpansionRatio: 2.80,
    daysElapsed: 11,
    keyLevels: { resistance: 48.00, support: 43.50, breakoutLevel: 48.20 },
    sparkline: [45.8, 46.4, 48.5, 50.1, 52.4, 54.0, 55.2, 53.8, 52.9, 53.4],
    notes: 'Converging descending trendlines resolved with 2.8x volume spike, reaching 55.20 peak (+20.5%).'
  },
  {
    id: 'hp-08',
    ticker: 'META',
    companyName: 'Meta Platforms, Inc.',
    patternType: 'bull_channel',
    patternName: 'Channel Up (Bullish Continuation)',
    detectionDate: '2026-10-13 14:45',
    detectionPrice: 582.00,
    currentPrice: 598.50,
    targetPrice: 615.00,
    stopLossPrice: 570.00,
    peakPricePostDetection: 604.20,
    troughPricePostDetection: 579.50,
    performancePct: 2.84,
    peakReturnPct: 3.81,
    maxDrawdownPct: -0.43,
    outcome: 'ACTIVE_RUNNING',
    confidence: 92,
    volumeExpansionRatio: 1.65,
    daysElapsed: 4,
    keyLevels: { resistance: 610.00, support: 575.00, breakoutLevel: 590.00 },
    sparkline: [582.0, 584.5, 588.0, 592.4, 595.0, 599.2, 604.2, 601.5, 597.0, 598.5],
    notes: 'Steady progression within multi-week ascending regression channel. Approaching mid-band extension.'
  },
  {
    id: 'hp-09',
    ticker: 'COIN',
    companyName: 'Coinbase Global, Inc.',
    patternType: 'double_bottom',
    patternName: 'Double Bottom (W-Reversal)',
    detectionDate: '2026-10-14 11:00',
    detectionPrice: 188.00,
    currentPrice: 197.40,
    targetPrice: 208.00,
    stopLossPrice: 180.00,
    peakPricePostDetection: 201.50,
    troughPricePostDetection: 186.20,
    performancePct: 5.00,
    peakReturnPct: 7.18,
    maxDrawdownPct: -0.96,
    outcome: 'ACTIVE_RUNNING',
    confidence: 89,
    volumeExpansionRatio: 2.20,
    daysElapsed: 3,
    keyLevels: { resistance: 196.00, support: 184.00, breakoutLevel: 196.50 },
    sparkline: [188.0, 189.5, 192.0, 194.5, 196.8, 199.2, 201.5, 198.0, 196.2, 197.4],
    notes: 'Confirmed bottom at $184.00 on Bitcoin spot accumulation. Breakout above neckline at $196 holding.'
  },
  {
    id: 'hp-10',
    ticker: 'TSM',
    companyName: 'Taiwan Semiconductor Manufacturing',
    patternType: 'ascending_triangle',
    patternName: 'Ascending Triangle Breakout',
    detectionDate: '2026-10-07 10:20',
    detectionPrice: 181.50,
    currentPrice: 198.80,
    targetPrice: 196.00,
    stopLossPrice: 175.00,
    peakPricePostDetection: 205.80,
    troughPricePostDetection: 180.20,
    performancePct: 9.53,
    peakReturnPct: 13.39,
    maxDrawdownPct: -0.72,
    outcome: 'TARGET_REACHED',
    confidence: 95,
    volumeExpansionRatio: 2.90,
    daysElapsed: 10,
    keyLevels: { resistance: 186.00, support: 178.00, breakoutLevel: 186.50 },
    sparkline: [181.5, 184.0, 187.2, 191.0, 195.4, 198.5, 202.0, 205.8, 201.4, 198.8],
    notes: 'Earnings beat accompanied by packaging capacity expansion drove sustained 13.4% upside surge.'
  },
  {
    id: 'hp-11',
    ticker: 'AMZN',
    companyName: 'Amazon.com, Inc.',
    patternType: 'support_resistance',
    patternName: 'Horizontal Trading Channel Breakout',
    detectionDate: '2026-10-05 13:00',
    detectionPrice: 184.00,
    currentPrice: 193.50,
    targetPrice: 194.00,
    stopLossPrice: 179.00,
    peakPricePostDetection: 195.40,
    troughPricePostDetection: 182.80,
    performancePct: 5.16,
    peakReturnPct: 6.20,
    maxDrawdownPct: -0.65,
    outcome: 'TARGET_REACHED',
    confidence: 87,
    volumeExpansionRatio: 1.85,
    daysElapsed: 12,
    keyLevels: { resistance: 188.00, support: 181.00, breakoutLevel: 188.50 },
    sparkline: [184.0, 185.2, 187.0, 189.4, 191.2, 193.0, 195.4, 194.2, 192.8, 193.5],
    notes: 'Three-week consolidation corridor cleared to the upside; achieved target with tight risk profile.'
  },
  {
    id: 'hp-12',
    ticker: 'GOOGL',
    companyName: 'Alphabet Inc.',
    patternType: 'double_bottom',
    patternName: 'Double Bottom (W-Reversal)',
    detectionDate: '2026-10-14 09:30',
    detectionPrice: 164.50,
    currentPrice: 168.20,
    targetPrice: 174.00,
    stopLossPrice: 160.00,
    peakPricePostDetection: 169.80,
    troughPricePostDetection: 163.80,
    performancePct: 2.25,
    peakReturnPct: 3.22,
    maxDrawdownPct: -0.43,
    outcome: 'ACTIVE_RUNNING',
    confidence: 88,
    volumeExpansionRatio: 1.75,
    daysElapsed: 3,
    keyLevels: { resistance: 167.50, support: 162.00, breakoutLevel: 167.80 },
    sparkline: [164.5, 165.2, 166.0, 167.4, 168.0, 169.8, 169.0, 167.5, 167.9, 168.2],
    notes: 'Support bounce at $162.00 confirmed; testing neckline resistance with accelerating cloud AI momentum.'
  }
];

class PatternHistoryService {
  private records: HistoricalPatternRecord[] = [];
  private listeners: Array<(records: HistoricalPatternRecord[]) => void> = [];

  constructor() {
    this.records = [...INITIAL_HISTORICAL_PATTERNS];
    try {
      const saved = localStorage.getItem('finviz_pattern_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge custom live records on top of defaults
          const existingIds = new Set(INITIAL_HISTORICAL_PATTERNS.map(p => p.id));
          const customOnly = parsed.filter((p: HistoricalPatternRecord) => !existingIds.has(p.id));
          this.records = [...customOnly, ...INITIAL_HISTORICAL_PATTERNS];
        }
      }
    } catch {
      // Fallback to initial
    }
  }

  public getHistory(): HistoricalPatternRecord[] {
    return this.records;
  }

  public subscribe(cb: (records: HistoricalPatternRecord[]) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public addLiveRecord(alert: {
    ticker: string;
    companyName: string;
    patternType: HistoricalPatternRecord['patternType'];
    patternName: string;
    confidence: number;
    currentPrice: number;
    targetPrice: number;
    stopLossPrice: number;
    bias?: 'bullish' | 'bearish' | 'neutral';
    description?: string;
  }): HistoricalPatternRecord {
    const price = alert.currentPrice || 150.0;
    const target = alert.targetPrice || price * 1.10;
    const stop = alert.stopLossPrice || price * 0.96;
    
    // Simulate initial post-detection trajectory
    const step1 = price;
    const step2 = price * (1 + (Math.random() * 0.015));
    const step3 = price * (1 + (Math.random() * 0.025));

    const newRecord: HistoricalPatternRecord = {
      id: `hp-${Date.now()}`,
      ticker: alert.ticker.toUpperCase(),
      companyName: alert.companyName || alert.ticker,
      patternType: alert.patternType,
      patternName: alert.patternName,
      detectionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
      detectionPrice: Number(price.toFixed(2)),
      currentPrice: Number(step3.toFixed(2)),
      targetPrice: Number(target.toFixed(2)),
      stopLossPrice: Number(stop.toFixed(2)),
      peakPricePostDetection: Number((price * 1.03).toFixed(2)),
      troughPricePostDetection: Number((price * 0.995).toFixed(2)),
      performancePct: Number((((step3 - price) / price) * 100).toFixed(2)),
      peakReturnPct: 3.00,
      maxDrawdownPct: -0.50,
      outcome: 'ACTIVE_RUNNING',
      confidence: alert.confidence,
      volumeExpansionRatio: Number((1.5 + Math.random() * 1.2).toFixed(2)),
      daysElapsed: 0,
      keyLevels: {
        resistance: target,
        support: stop,
        breakoutLevel: Number((price * 1.01).toFixed(2))
      },
      sparkline: [step1, step2, step3],
      notes: alert.description || `Real-time detection triggered by quant engine.`
    };

    this.records = [newRecord, ...this.records];
    this.save();
    this.notify();
    return newRecord;
  }

  public calculateMetrics(data: HistoricalPatternRecord[]): PatternPerformanceSummary {
    const totalCount = data.length;
    if (totalCount === 0) {
      return {
        totalCount: 0,
        targetReachedCount: 0,
        stopTriggeredCount: 0,
        activeCount: 0,
        winRate: 0,
        avgReturnPct: 0,
        avgPeakReturnPct: 0,
        avgMaxDrawdownPct: 0,
        profitFactor: 0,
        bestPatternType: 'N/A',
        bestPerformingTicker: 'N/A'
      };
    }

    const targetReachedCount = data.filter(d => d.outcome === 'TARGET_REACHED').length;
    const stopTriggeredCount = data.filter(d => d.outcome === 'STOP_TRIGGERED').length;
    const activeCount = data.filter(d => d.outcome === 'ACTIVE_RUNNING').length;

    const closed = targetReachedCount + stopTriggeredCount;
    const winRate = closed > 0 ? Number(((targetReachedCount / closed) * 100).toFixed(1)) : 0;

    const totalReturn = data.reduce((acc, d) => acc + d.performancePct, 0);
    const avgReturnPct = Number((totalReturn / totalCount).toFixed(2));

    const totalPeak = data.reduce((acc, d) => acc + d.peakReturnPct, 0);
    const avgPeakReturnPct = Number((totalPeak / totalCount).toFixed(2));

    const totalDD = data.reduce((acc, d) => acc + d.maxDrawdownPct, 0);
    const avgMaxDrawdownPct = Number((totalDD / totalCount).toFixed(2));

    // Calculate profit factor
    const gains = data.filter(d => d.performancePct > 0).reduce((acc, d) => acc + d.performancePct, 0);
    const losses = Math.abs(data.filter(d => d.performancePct < 0).reduce((acc, d) => acc + d.performancePct, 0));
    const profitFactor = losses > 0 ? Number((gains / losses).toFixed(2)) : 9.99;

    // Best pattern type by win rate / return
    const byType: Record<string, { count: number; wins: number; totalReturn: number }> = {};
    data.forEach(d => {
      if (!byType[d.patternType]) {
        byType[d.patternType] = { count: 0, wins: 0, totalReturn: 0 };
      }
      byType[d.patternType].count += 1;
      if (d.outcome === 'TARGET_REACHED') byType[d.patternType].wins += 1;
      byType[d.patternType].totalReturn += d.performancePct;
    });

    let bestType = 'ascending_triangle';
    let highestWinRate = -1;
    Object.entries(byType).forEach(([type, stats]) => {
      const wr = stats.count > 0 ? stats.wins / stats.count : 0;
      if (wr > highestWinRate) {
        highestWinRate = wr;
        bestType = type;
      }
    });

    const typeNames: Record<string, string> = {
      ascending_triangle: 'Ascending Triangle',
      double_bottom: 'Double Bottom (W)',
      support_resistance: 'Horizontal Breakout',
      bull_channel: 'Channel Up',
      falling_wedge: 'Falling Wedge'
    };

    // Best ticker by peak return
    let bestTicker = data[0]?.ticker || 'NVDA';
    let maxRet = -999;
    data.forEach(d => {
      if (d.peakReturnPct > maxRet) {
        maxRet = d.peakReturnPct;
        bestTicker = `${d.ticker} (+${d.peakReturnPct}%)`;
      }
    });

    return {
      totalCount,
      targetReachedCount,
      stopTriggeredCount,
      activeCount,
      winRate,
      avgReturnPct,
      avgPeakReturnPct,
      avgMaxDrawdownPct,
      profitFactor,
      bestPatternType: typeNames[bestType] || bestType,
      bestPerformingTicker: bestTicker
    };
  }

  private save() {
    try {
      localStorage.setItem('finviz_pattern_history', JSON.stringify(this.records));
    } catch {
      // Ignore
    }
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.records));
  }
}

export const patternHistoryService = new PatternHistoryService();
