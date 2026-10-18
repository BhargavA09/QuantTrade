import { soundEngine } from '../utils/audioAlerts';
import { patternHistoryService } from './patternHistoryService';

export interface PatternAlert {
  id: string;
  ticker: string;
  companyName: string;
  patternType: 'ascending_triangle' | 'double_bottom' | 'support_resistance' | 'bull_channel' | 'other';
  patternName: string;
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  bias: 'bullish' | 'bearish' | 'neutral';
  description: string;
  timestamp: string;
  read: boolean;
}

export interface PatternRuleConfig {
  ascendingTriangles: boolean;
  doubleBottoms: boolean;
  horizontalChannels: boolean;
  bullChannels: boolean;
  minConfidence: number; // e.g. 80
  soundEnabled: boolean;
}

const DEFAULT_PATTERN_RULES: PatternRuleConfig = {
  ascendingTriangles: true,
  doubleBottoms: true,
  horizontalChannels: true,
  bullChannels: true,
  minConfidence: 80,
  soundEnabled: true
};

const INITIAL_PATTERN_ALERTS: PatternAlert[] = [
  {
    id: 'pa-01',
    ticker: 'NVDA',
    companyName: 'NVIDIA Corporation',
    patternType: 'ascending_triangle',
    patternName: 'Ascending Triangle (Bullish Accumulation)',
    confidence: 91,
    currentPrice: 138.5,
    targetPrice: 152.0,
    stopLossPrice: 134.2,
    bias: 'bullish',
    description: 'Higher lows pressing against horizontal overhead resistance at $144.50. Strong institutional volume expansion indicates imminent upward breakout.',
    timestamp: '2 mins ago',
    read: false
  },
  {
    id: 'pa-02',
    ticker: 'TSLA',
    companyName: 'Tesla, Inc.',
    patternType: 'double_bottom',
    patternName: 'Double Bottom (W-Reversal)',
    confidence: 87,
    currentPrice: 242.8,
    targetPrice: 265.0,
    stopLossPrice: 232.0,
    bias: 'bullish',
    description: 'Two distinct rejection lows at $235.00 formed a confirmed W base. Neckline breakout above $245.00 confirms bullish trend reversal.',
    timestamp: '8 mins ago',
    read: false
  },
  {
    id: 'pa-03',
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    patternType: 'support_resistance',
    patternName: 'Horizontal Trading Channel Breakout',
    confidence: 88,
    currentPrice: 228.4,
    targetPrice: 238.5,
    stopLossPrice: 223.0,
    bias: 'bullish',
    description: 'Price tested resistance at $230.00 three times with declining sell volume. Key accumulation corridor breakout in progress.',
    timestamp: '15 mins ago',
    read: true
  }
];

class PatternAlertManager {
  private alerts: PatternAlert[] = [];
  private listeners: Array<(alert: PatternAlert, allAlerts: PatternAlert[]) => void> = [];
  private config: PatternRuleConfig = DEFAULT_PATTERN_RULES;

  constructor() {
    this.alerts = [...INITIAL_PATTERN_ALERTS];
    try {
      const savedConfig = localStorage.getItem('finviz_pattern_rules');
      if (savedConfig) {
        this.config = { ...DEFAULT_PATTERN_RULES, ...JSON.parse(savedConfig) };
      }
      const savedAlerts = localStorage.getItem('finviz_pattern_alerts');
      if (savedAlerts) {
        const parsed = JSON.parse(savedAlerts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.alerts = parsed;
        }
      }
    } catch {
      // Fallback
    }
  }

  public getAlerts(): PatternAlert[] {
    return this.alerts;
  }

  public getConfig(): PatternRuleConfig {
    return this.config;
  }

  public updateConfig(newConfig: Partial<PatternRuleConfig>) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('finviz_pattern_rules', JSON.stringify(this.config));
    } catch {
      // Ignore
    }
  }

  public subscribe(cb: (alert: PatternAlert, allAlerts: PatternAlert[]) => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  public emitAlert(alert: PatternAlert) {
    // Check config filter
    if (alert.confidence < this.config.minConfidence) return;
    if (alert.patternType === 'ascending_triangle' && !this.config.ascendingTriangles) return;
    if (alert.patternType === 'double_bottom' && !this.config.doubleBottoms) return;
    if (alert.patternType === 'support_resistance' && !this.config.horizontalChannels) return;
    if (alert.patternType === 'bull_channel' && !this.config.bullChannels) return;

    this.alerts = [alert, ...this.alerts.filter(a => a.id !== alert.id)].slice(0, 30);
    try {
      patternHistoryService.addLiveRecord(alert);
    } catch {
      // Ignore
    }
    try {
      localStorage.setItem('finviz_pattern_alerts', JSON.stringify(this.alerts));
    } catch {
      // Ignore
    }

    if (this.config.soundEnabled) {
      if (alert.bias === 'bullish') {
        soundEngine.playBullishBreakout();
      } else if (alert.bias === 'bearish') {
        soundEngine.playBearishBreakdown();
      } else {
        soundEngine.playNotificationTap();
      }
    }

    this.listeners.forEach(cb => cb(alert, this.alerts));
  }

  public markAsRead(id: string) {
    this.alerts = this.alerts.map(a => a.id === id ? { ...a, read: true } : a);
    try {
      localStorage.setItem('finviz_pattern_alerts', JSON.stringify(this.alerts));
    } catch {
      // Ignore
    }
  }

  public markAllAsRead() {
    this.alerts = this.alerts.map(a => ({ ...a, read: true }));
    try {
      localStorage.setItem('finviz_pattern_alerts', JSON.stringify(this.alerts));
    } catch {
      // Ignore
    }
  }

  public clearAll() {
    this.alerts = [];
    try {
      localStorage.removeItem('finviz_pattern_alerts');
    } catch {
      // Ignore
    }
  }

  public simulateDetection(patternType: 'ascending_triangle' | 'double_bottom' | 'support_resistance' = 'ascending_triangle', tickerOverride?: string): PatternAlert {
    const templates = {
      ascending_triangle: {
        ticker: tickerOverride || 'NVDA',
        companyName: 'NVIDIA Corporation',
        patternType: 'ascending_triangle' as const,
        patternName: 'Ascending Triangle (Bullish Accumulation)',
        confidence: 93,
        currentPrice: 139.2,
        targetPrice: 154.5,
        stopLossPrice: 133.8,
        bias: 'bullish' as const,
        description: 'Quant swing-high clustering confirms horizontal resistance test at $144.50 with progressive higher lows.'
      },
      double_bottom: {
        ticker: tickerOverride || 'TSLA',
        companyName: 'Tesla, Inc.',
        patternType: 'double_bottom' as const,
        patternName: 'Double Bottom (W-Reversal)',
        confidence: 89,
        currentPrice: 246.5,
        targetPrice: 268.0,
        stopLossPrice: 236.0,
        bias: 'bullish' as const,
        description: 'Confirmed double bottom rejection wick with neckline breakout above $245.00 on heavy volume.'
      },
      support_resistance: {
        ticker: tickerOverride || 'AMD',
        companyName: 'Advanced Micro Devices',
        patternType: 'support_resistance' as const,
        patternName: 'Horizontal Channel Breakout',
        confidence: 86,
        currentPrice: 164.2,
        targetPrice: 178.0,
        stopLossPrice: 158.0,
        bias: 'bullish' as const,
        description: 'Multi-week price consolidation corridor resolved upward with 2-sigma volatility expansion.'
      }
    };

    const chosen = templates[patternType] || templates.ascending_triangle;
    const newAlert: PatternAlert = {
      id: `pa-${Date.now()}`,
      ...chosen,
      timestamp: 'Just now',
      read: false
    };

    this.emitAlert(newAlert);
    return newAlert;
  }
}

export const patternAlertManager = new PatternAlertManager();
