export interface RiskData {
  riskScore: number;
  varAssessment: string;
  tailRisks: string[];
  correlationRisks: string;
  mitigation: string[];
  liveRiskAlerts: string[];
  correlationFactors?: { factor: string; impactScore: number; impactLabel: string }[];
}

export interface RiskSummary {
  volatility: number;
  beta: number;
  level: string;
  sharpeRatio: number;
  maxDrawdown: number;
  var95: number;
  factors: string[];
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
  history: { date: string; price: number; volume: number; open?: number; high?: number; low?: number; close?: number }[];
  filtered: number[];
  simulations: number[][];
  neuralFeatures?: { 
    rsi: (number | null)[]; 
    macd: number[]; 
    sma20: (number | null)[]; 
    ema12: number[];
    sma50: (number | null)[];
    sma200: (number | null)[];
    bbUpper: (number | null)[];
    bbLower: (number | null)[];
    stochK?: (number | null)[];
    stochD?: (number | null)[];
    atr?: (number | null)[];
  };
  simBounds?: { min: number; max: number; pLower: number; pUpper: number; median: number; var95?: number; var99?: number }[];
  stressBounds?: { min: number; max: number; pLower: number; pUpper: number; median: number }[];
  metrics?: {
    kellyCriterion: number;
    sharpeRatio: number;
    hurstExponent: number;
    regime: 'Trending' | 'Mean-Reverting' | 'Random Walk';
    annualizedVol: number;
  };
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
  sentiment?: { 
    score: number; 
    label: string;
    bullish: number;
    bearish: number;
    drivers: string[];
    summary: string; 
    tradeImpact: string;
    articles?: { title: string; source: string; time: string; url: string; sentiment: 'positive' | 'neutral' | 'negative' }[];
    trend?: { date: string; score: number }[];
  };
  management?: {
    ceo: string;
    insiderSentiment: string;
    recentInsiderTrades: { insider: string; relation: string; type: string; amount: string; price: string; date: string }[];
    keyExecutives: { name: string; role: string }[];
  };
  profile?: {
    summary: string;
    industry: string;
    sector: string;
    website: string;
    address: string;
    fullTimeEmployees: number | string;
  };
  fairValue?: number;
  riskAnalysis?: RiskData;
  risk?: RiskSummary;
  numSimsCalculated?: number;
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
  globalSimulation: { 
    status: string; 
    news: { title: string; impact: string; severity: 'low' | 'medium' | 'high'; sentiment?: 'positive' | 'neutral' | 'negative' }[]; 
    volumeIndex: number;
    importExport?: { us: number; china: number; eu: number, india: number, japan: number, brazil: number };
  };
  logistics: { 
    shipping: { lane: string; status: string; delayDays: number; congestionLevel?: number; volume?: number }[]; 
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
      lat?: number;
      lng?: number;
    }[];
  };
  resources: { 
    oil: { production: string; trend: 'up' | 'down'; price: number; supplyChainRisk?: string }; 
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
      criticality?: 'low' | 'medium' | 'high';
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

export interface Simulation {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

export type DateRange = '1M' | '3M' | '6M' | 'ALL';
