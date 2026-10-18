/**
 * Finviz Quantitative API & Real-Time Live Streaming Service
 * Connects directly to the high-performance Python Finviz Core engine
 */

import { FinvizStock } from '../../data/finvizData';

export interface FinvizOverviewResponse {
  success: boolean;
  timestamp: string;
  source: string;
  indices: Array<{
    sym: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    type: string;
  }>;
  breadth: {
    advancing: number;
    declining: number;
    unchanged: number;
    newHighs: number;
    newLows: number;
    advanceDeclineRatio: number;
    marketRegime: string;
  };
  signals: {
    gainers: FinvizStock[];
    losers: FinvizStock[];
    newHighs: FinvizStock[];
    unusualVolume: FinvizStock[];
    overbought: FinvizStock[];
    oversold: FinvizStock[];
  };
  sectors: Array<{
    name: string;
    change1d: number;
    change1w: number;
    change1m: number;
    change3m: number;
    changeYtd: number;
    marketCap: string;
  }>;
  news: Array<{
    id: string;
    title: string;
    source: string;
    time: string;
    url: string;
    tickers: string[];
  }>;
}

export interface FinvizScreenerResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stocks: FinvizStock[];
}

export interface FinvizInsiderItem {
  id: string;
  ticker: string;
  company: string;
  insider: string;
  relationship: string;
  date: string;
  transaction: 'Buy' | 'Sale';
  cost: number;
  shares: number;
  value: number;
  sharesTotal: number;
  secForm: string;
}

export interface FinvizInsidersResponse {
  success: boolean;
  timestamp: string;
  count: number;
  insiders: FinvizInsiderItem[];
}

export interface FinvizFuturesResponse {
  success: boolean;
  futures: Array<{
    symbol: string;
    name: string;
    category: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
}

export interface FinvizForexResponse {
  success: boolean;
  forex: Array<{
    ticker: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  }>;
}

export interface FinvizCryptoResponse {
  success: boolean;
  crypto: Array<{
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: string;
    volume24h: string;
  }>;
}

const API_BASE = '/api/finviz';

export async function fetchFinvizOverview(): Promise<FinvizOverviewResponse> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz overview`);
  return res.json();
}

export async function fetchFinvizScreener(params: Record<string, string | number> = {}): Promise<FinvizScreenerResponse> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      query.append(k, String(v));
    }
  });
  const res = await fetch(`${API_BASE}/screener?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz screener`);
  return res.json();
}

export async function fetchFinvizTreemap(universe = 'sp500', timeframe = '1D'): Promise<any> {
  const res = await fetch(`${API_BASE}/treemap?universe=${universe}&timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz treemap`);
  return res.json();
}

export async function fetchFinvizGroups(timeframe = '1D'): Promise<any> {
  const res = await fetch(`${API_BASE}/groups?timeframe=${timeframe}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz groups`);
  return res.json();
}

export async function fetchFinvizInsiders(): Promise<FinvizInsidersResponse> {
  const res = await fetch(`${API_BASE}/insiders`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz insiders`);
  return res.json();
}

export async function fetchFinvizNews(category = 'all'): Promise<{ news: any[] }> {
  const res = await fetch(`${API_BASE}/news?category=${category}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz news`);
  return res.json();
}

export async function fetchFinvizFutures(): Promise<FinvizFuturesResponse> {
  const res = await fetch(`${API_BASE}/futures`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz futures`);
  return res.json();
}

export async function fetchFinvizForex(): Promise<FinvizForexResponse> {
  const res = await fetch(`${API_BASE}/forex`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz forex`);
  return res.json();
}

export async function fetchFinvizCrypto(): Promise<FinvizCryptoResponse> {
  const res = await fetch(`${API_BASE}/crypto`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz crypto`);
  return res.json();
}

export async function fetchFinvizTicker(ticker: string): Promise<{ success: boolean; stock: FinvizStock }> {
  const res = await fetch(`${API_BASE}/ticker/${encodeURIComponent(ticker.toUpperCase())}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz ticker detail`);
  return res.json();
}

export interface StreamEvent {
  type: 'PRICE_TICK' | 'SNAPSHOT' | 'PATTERN_ALERT';
  ticker?: string;
  companyName?: string;
  pattern?: string;
  patternType?: 'ascending_triangle' | 'double_bottom' | 'support_resistance' | 'bull_channel' | 'other';
  confidence?: number;
  bias?: 'bullish' | 'bearish' | 'neutral';
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  targetPrice?: number;
  stopLoss?: number;
  description?: string;
  timestamp?: string;
  data?: any;
}

export interface FinvizPatternScanResult {
  ticker: string;
  companyName: string;
  pattern: string;
  patternType: 'ascending_triangle' | 'double_bottom' | 'support_resistance' | 'bull_channel' | 'other';
  confidence: number;
  currentPrice: number;
  targetPrice: number;
  stopLossPrice: number;
  supportLevel: number;
  resistanceLevel: number;
  status: string;
  bias: 'bullish' | 'bearish' | 'neutral';
  isAscendingTriangle: boolean;
  isDoubleBottom: boolean;
}

export async function fetchFinvizPatterns(ticker: string): Promise<any> {
  const res = await fetch(`${API_BASE}/patterns/${encodeURIComponent(ticker.toUpperCase())}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz patterns for ${ticker}`);
  return res.json();
}

export async function fetchFinvizPatternScan(tickers?: string[]): Promise<{ success: boolean; patterns: FinvizPatternScanResult[] }> {
  const q = tickers && tickers.length > 0 ? `?tickers=${encodeURIComponent(tickers.join(','))}` : '';
  const res = await fetch(`${API_BASE}/pattern-scan${q}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz pattern scan`);
  return res.json();
}

/**
 * Connect to Python Backend Server-Sent Events (SSE) Live Stream
 * Yields continuous real-time market ticks directly from Python Core
 */
export function subscribeFinvizStream(
  onEvent: (event: StreamEvent) => void,
  onError?: (err: any) => void
): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;
  let retryTimeout: any = null;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`${API_BASE}/stream`);

      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          onEvent(parsed);
        } catch (err) {
          console.warn('Finviz Stream parse error:', err);
        }
      };

      eventSource.onerror = (e) => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (onError) onError(e);
        // Automatic reconnection attempt after 3 seconds
        if (!isClosed) {
          retryTimeout = setTimeout(connect, 3000);
        }
      };
    } catch (err) {
      if (onError) onError(err);
      if (!isClosed) {
        retryTimeout = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (retryTimeout) clearTimeout(retryTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
