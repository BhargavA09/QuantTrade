/**
 * Domain-specific TypeScript types and contracts for the QuantLab API layer.
 * Enforces Interface Segregation Principle (ISP) with strongly-typed interfaces.
 */

import { GlobalState, StockData } from '../../types';

export interface StockHistoryCandle {
  date: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: (number | null)[];
  macd: (number | null)[];
  sma20: (number | null)[];
  ema12: (number | null)[];
  sma50: (number | null)[];
  sma200: (number | null)[];
  bbUpper: (number | null)[];
  bbLower: (number | null)[];
  stochK?: (number | null)[];
  stochD?: (number | null)[];
  atr?: (number | null)[];
}

export interface ForecastModelPrediction {
  name: string;
  forecast: { date: string; price: number }[];
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
}

export interface BacktestResult {
  date: string;
  actual: number;
  predicted: number;
  error: number;
}

export type ForecastResponse = StockData;

export interface SentimentArticle {
  title: string;
  source: string;
  time: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  author?: string;
}

export interface SentimentResponse {
  score: number;
  label: 'Bullish' | 'Bearish' | 'Neutral';
  bullish: number;
  bearish: number;
  drivers: string[];
  summary: string;
  tradeImpact: string;
  articles: SentimentArticle[];
  trend: { date: string; score: number }[];
}

export interface RiskAnalysisResponse {
  riskScore: number;
  varAssessment: string;
  tailRisks: string[];
  correlationRisks: string;
  mitigation: string[];
  liveRiskAlerts: any[];
  correlationFactors: {
    factor: string;
    impactScore: number;
    impactLabel: string;
  }[];
}

export interface PortfolioDataResponse {
  allocation: { name: string; value: number }[];
  attribution: { name: string; value: number }[];
  riskReturn: { ticker: string; return: number; volatility: number; sharpe: number }[];
}

export interface MarketAssetQuote {
  ticker: string;
  name: string;
  sector: string;
  marketCap: string;
  recentPerformance: number;
  price: number;
  change: number;
  changePercent: number;
  market: string;
}

export interface MarketOverviewResponse {
  us: MarketAssetQuote[];
  canada: MarketAssetQuote[];
  europe: MarketAssetQuote[];
  asia: MarketAssetQuote[];
  crypto: MarketAssetQuote[];
  commodities: MarketAssetQuote[];
  bonds: any[];
  indices: any[];
}

export interface LogisticsIndicator {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  affectedSectors: string[];
  confidence: number;
  metric: string;
  value: string;
}

export type GlobalStateResponse = GlobalState;

export interface DataValidityAuditResult {
  symbol: string;
  timestamp: string;
  dataQualityIndex: number;
  validityGrade: 'A+ PRISTINE' | 'A- SANITIZED' | 'B REVIEW';
  status: 'VERIFIED_PRISTINE' | 'CALIBRATED_WITHIN_TOLERANCE' | 'ANOMALY_FILTERED';
  provenance: {
    primarySource: string;
    verifiedRedundantSources: string[];
    roundTripLatencyMs: number;
    feedProtocol: string;
  };
  integrityChecks: {
    monotonicTimestamps: { passed: boolean; details: string };
    ohlcGeometryCoherent: { passed: boolean; details: string };
    nonZeroNonNanPrice: { passed: boolean; details: string };
    bidAskSpreadSanity: { passed: boolean; details: string };
    nonNegativeVolume: { passed: boolean; details: string };
    outlierSpikeFilter: { passed: boolean; details: string };
    cryptographicChecksum: { passed: boolean; signature: string };
  };
  quoteSnapshot: {
    price: number;
    change: number;
    changePercent: number;
    open: number;
    high: number;
    low: number;
    volume: number;
    previousClose: number;
  };
  preventionsApplied: boolean;
  preventionNotes?: string[];
}

export interface MicroCalibrationSnapshot {
  symbol: string;
  timestampUs: number;
  formattedTimeUs: string;
  kalman: {
    statePrice: number;
    variance: number;
    kalmanGain: number;
    processNoiseQ: number;
    measurementNoiseR: number;
  };
  ofi: {
    instantaneousOFI: number;
    betaOFI: number;
    rSquared: number;
    orderPressure: 'BULLISH_FLOW' | 'BEARISH_FLOW' | 'BALANCED';
  };
  volatilityUs: {
    ewmaVolUs: number;
    annualizedVolPct: number;
    hurstExponent: number;
    regime: 'HIGH_FREQUENCY_MEAN_REVERTING' | 'TRENDING_MICROBURST';
  };
  calibratedParameters: {
    fastPeriod: number;
    slowPeriod: number;
    dynamicStopLossBps: number;
    dynamicTakeProfitBps: number;
    minSpreadCaptureBps: number;
    jitterBufferUs: number;
    kellyFraction: number;
  };
  convergence: {
    status: 'CONVERGED' | 'CALIBRATING';
    residualRSS: number;
    sampleTicks: number;
  };
}

export interface StanfordMedallionPipelineReport {
  ticker: string;
  timestamp: string;
  governanceMaturityLevel: 5;
  maturityScore: number;
  levels: {
    level: number;
    name: string;
    description: string;
    status: 'OPTIMAL' | 'COMPLIANT' | 'IN_PROGRESS';
    score: number;
  }[];
  bronzeLayer: {
    name: string;
    recordsProcessed: number;
    ingestionThroughputPerSec: number;
    immutableHash: string;
    rawPayloadSample: any;
    status: 'ACTIVE_INGEST';
  };
  silverLayer: {
    name: string;
    recordsCleansed: number;
    quarantinedAnomalies: number;
    sanitizationApplied: boolean;
    conformedSchemaValid: boolean;
    appliedQualityRules: {
      rule: string;
      category: 'ACCURACY' | 'COMPLETENESS' | 'CONSISTENCY' | 'TIMELINESS' | 'UNIQUENESS';
      passed: boolean;
      violationsCount: number;
    }[];
  };
  goldLayer: {
    name: string;
    curatedFeaturesCount: number;
    kalmanMicroPrice: number;
    orderFlowImbalanceOFI: number;
    subMillisecondVol: number;
    readyForHFTBacktest: boolean;
    featureTableSchema: string[];
  };
  lineageDAG: {
    nodes: { id: string; label: string; layer: string; status: string }[];
    edges: { source: string; target: string; dataRate: string }[];
  };
  dataContracts: {
    contractVersion: string;
    slaLatencyMs: number;
    actualLatencyMs: number;
    slaCompliancePct: number;
    schemaEnforced: boolean;
  };
}

export interface ImpactedTicker {
  symbol: string;
  name: string;
  expectedMovePct: number;
  baselineTarget: number;
  shockedTarget: number;
  transmissionReason: string;
}

export interface GlobalNewsEvent {
  id: string;
  headline: string;
  summary: string;
  timestamp: string;
  source: string;
  city: string;
  country: string;
  region: 'North America' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Latin America' | 'Global';
  lat: number;
  lng: number;
  category: string;
  severity: 'critical' | 'high' | 'medium';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  impactedTickers: ImpactedTicker[];
  projectionLineShift: {
    baselineSlope: number;
    shockedSlope: number;
    volatilityMultiplier: number;
    horizonDays: number;
    recoveryHalfLifeDays: number;
    meanReversionSpeed?: number;
    liquidityAbsorption?: number;
    jumpIntensity?: number;
  };
  connectedHub: {
    name: string;
    lat: number;
    lng: number;
  };
}

export interface GlobalNewsScanResponse {
  scanTimestamp: string;
  totalActiveScannedNews: number;
  monitoringStations: string[];
  events: GlobalNewsEvent[];
}



