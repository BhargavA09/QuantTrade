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
