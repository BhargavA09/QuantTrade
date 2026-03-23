export interface RiskData {
  riskScore: number;
  varAssessment: string;
  tailRisks: string[];
  correlationRisks: string;
  mitigation: string[];
  liveRiskAlerts: string[];
  correlationFactors?: { factor: string; impactScore: number; impactLabel: string }[];
}

export interface StockData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  marketCap?: number;
  peRatio?: number;
  dividendYield?: number;
  history: { date: string; price: number; volume: number }[];
  filtered: number[];
  simulations: number[][];
  neuralFeatures?: { rsi: (number | null)[]; macd: number[]; sma20: (number | null)[]; ema12: number[] };
  simBounds?: { min: number; max: number; pLower: number; pUpper: number; median: number }[];
  stressBounds?: { min: number; max: number; pLower: number; pUpper: number; median: number }[];
  fundamentals?: {
    marketCap: string;
    peRatio: string;
    dividendYield: string;
    revenue: string;
    netIncome: string;
    eps: string;
    beta: string;
    fiftyTwoWeekHigh: string;
    fiftyTwoWeekLow: string;
  };
  news?: { title: string; source: string; time: string; url: string; sentiment: string }[];
  forecast: { date: string; price: number }[];
  models?: { name: string; forecast: { date: string; price: number }[]; confidence: string }[];
  mean: number;
  stdDev: number;
  sentiment?: { score: number; summary: string; tradeImpact: string };
  fairValue?: number;
  riskAnalysis?: RiskData;
  backtest?: {
    results: { date: string; actual: number; predicted: number; error: number }[];
    accuracy: number;
  };
}

export interface ModelInsight {
  modelVersion: string;
  learningRate: number;
  lossTrend: 'decreasing' | 'stable' | 'increasing';
  activeFeatures: string[];
  optimizationGoal: string;
  recentEvents: { timestamp: string; event: string; impact: 'positive' | 'neutral' | 'negative' }[];
}

export interface GlobalState {
  globalTrade: { 
    status: string; 
    news: { title: string; impact: string; severity: 'low' | 'medium' | 'high'; sentiment?: 'positive' | 'neutral' | 'negative' }[]; 
    volumeIndex: number;
    importExport?: { us: number; china: number; eu: number, india: number, japan: number, brazil: number };
  };
  logistics: { 
    shipping: { lane: string; status: string; delayDays: number; congestionLevel?: number }[]; 
    bottlenecks: string[];
    ships?: { 
      name: string; 
      type: 'Container' | 'Tanker' | 'Bulk Carrier' | 'Gas Carrier'; 
      capacity: string; 
      origin: string; 
      destination: string; 
      cargo: string; 
      status: 'In Transit' | 'Docked' | 'Delayed' | 'Under Repair';
      progress: number;
    }[];
  };
  resources: { 
    oil: { production: string; trend: 'up' | 'down'; price: number }; 
    commodities: { 
      name: string; 
      status: string; 
      priceTrend?: string;
      importVolume?: string;
      exportVolume?: string;
      topExporter?: string;
      topImporter?: string;
      history?: { date: string; price: number }[];
      supplyDemand?: { supply: number; demand: number; inventory: number };
    }[];
  };
  patterns?: {
    patterns: { sector: string; pattern: string; impact: 'positive' | 'negative' | 'neutral'; impactScore: number; confidence: number }[];
    summary: string;
  };
  learningEngine?: ModelInsight;
  logisticsAlpha?: {
    id: string;
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    affectedSectors: string[];
    confidence: number;
    metric: string;
    value: string;
  }[];
}

export interface PortfolioData {
  allocation: { name: string; value: number }[];
  attribution: { name: string; value: number }[];
  riskReturn: { ticker: string; return: number; volatility: number; sharpe: number }[];
}

export interface Trade {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

export type DateRange = '1M' | '3M' | '6M' | 'ALL';
