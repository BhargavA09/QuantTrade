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
    pair: string;
    rate: number;
    change: number;
    changePercent: number;
    high: number;
    low: number;
  }>;
}

export interface FinvizCryptoResponse {
  success: boolean;
  crypto: Array<{
    symbol: string;
    name: string;
    price: number;
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

export async function fetchFinvizScreener(params: Record<string, any> = {}): Promise<FinvizScreenerResponse> {
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'any') {
      query.set(k, String(v));
    }
  }
  const res = await fetch(`${API_BASE}/screener?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz screener`);
  return res.json();
}

export async function fetchFinvizInsiders(): Promise<FinvizInsidersResponse> {
  const res = await fetch(`${API_BASE}/insiders`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Finviz insider trades`);
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
  type: 'PRICE_TICK' | 'SNAPSHOT';
  ticker?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  timestamp?: string;
  data?: any;
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
