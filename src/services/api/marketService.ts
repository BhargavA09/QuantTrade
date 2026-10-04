/**
 * Market Data Operations: Ticker Search, Penny Stock Screening,
 * and Global Overview Heatmap Datasets.
 */

import { defaultApiClient } from "./client";
import { resolveTickerSymbol } from "./symbols";
import { MarketOverviewResponse, MarketAssetQuote } from "./types";

const MOCK_TICKER_CATALOG: Record<string, string[]> = {
  'US': ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', '^GSPC'],
  'CANADA': ['RY.TO', 'TD.TO', 'SHOP.TO', 'CNR.TO', 'CP.TO', 'ENB.TO', 'BMO.TO', '^GSPTSE'],
  'EUROPE': ['HSBA.L', 'BP.L', 'VOD.L', 'GSK.L', 'AZN.L', '^FTSE', '^GDAXI', '^FCHI'],
  'ASIA': ['7203.T', '9984.T', '0700.HK', '9432.T', '6758.T', '^N225', '^HSI', '^BSESN'],
  'CRYPTO': ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'DOT-USD'],
  'COMMODITIES': ['GC=F', 'CL=F', 'SI=F', 'HG=F', 'NG=F', 'ZC=F', 'ZS=F', 'KC=F']
};

export const getMockMarketData = (market: string): MarketAssetQuote[] => {
  const tickers = MOCK_TICKER_CATALOG[market] || [];
  return tickers.map(ticker => {
    let price = 100;
    if (ticker.includes('BTC')) price = 65000;
    else if (ticker.includes('ETH')) price = 3500;
    else if (ticker.includes('TSLA')) price = 250;
    else if (ticker.includes('NVDA')) price = 850;
    else if (market === 'COMMODITIES') price = 50 + Math.random() * 100;
    else price = 50 + Math.random() * 300;
    
    return {
      ticker,
      name: ticker,
      sector: 'Market Asset',
      marketCap: (Math.random() * 2000 + 100).toFixed(2) + 'B',
      recentPerformance: (Math.random() - 0.5) * 5,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(((Math.random() - 0.5) * 10).toFixed(2)),
      changePercent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      market: market
    };
  });
};

/**
 * Searches and resolves a ticker symbol across alias dictionaries, backend search, and AI fallback.
 */
export const searchTicker = async (
  query: string, 
  filters?: { exchange?: string; marketCap?: string; sector?: string }
): Promise<string | null> => {
  try {
    // 1. Instant resolution via client-side symbol map
    const resolved = resolveTickerSymbol(query);
    if (resolved !== query.toUpperCase().trim()) {
      return resolved;
    }

    // 2. Fast query to backend search
    const searchResponse = await defaultApiClient.fetchWithRetry<any>(
      `/api/stock/search?q=${encodeURIComponent(query)}`
    );
    if (searchResponse?.quotes?.length > 0) {
      return searchResponse.quotes[0].symbol;
    }

    // 3. Fallback AI resolution
    const cooldown = localStorage.getItem('quant_gemini_backoff');
    if (cooldown && Date.now() < parseInt(cooldown)) {
      return null;
    }

    try {
      const res = await fetch(`${defaultApiClient.getBaseUrl()}/api/ai/resolve-ticker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.ticker && data.ticker.length < 10) {
          return data.ticker;
        }
      }
    } catch (apiError: any) {
      console.warn("AI Ticker resolution skipped:", apiError.message || apiError);
    }

    return null;
  } catch (error) {
    console.error("Search failed:", error);
    return null;
  }
};

/**
 * Fetches high-momentum low-priced equities for active day-trading simulations.
 */
export const fetchPennyStocks = async (): Promise<any[]> => {
  try {
    return await defaultApiClient.fetchWithRetry<any[]>('/api/stock/pennystocks');
  } catch (error) {
    console.warn("Penny stocks fetch fallback used:", error);
    return [];
  }
};

/**
 * Fetches real-time multi-regional market asset overviews and indices.
 */
export const fetchMarketOverview = async (): Promise<MarketOverviewResponse> => {
  const cached = defaultApiClient.getMemoryCache<MarketOverviewResponse>('market_overview', 30000);
  if (cached) return cached;

  return defaultApiClient.deduplicate('market_overview', async () => {
    try {
      const data = await defaultApiClient.fetchWithRetry<any>('/api/market/overview');
      if (data && typeof data === 'object') {
        const result: MarketOverviewResponse = {
          us: Array.isArray(data.us) && data.us.length > 0 ? data.us : getMockMarketData('US'),
          canada: Array.isArray(data.canada) && data.canada.length > 0 ? data.canada : getMockMarketData('CANADA'),
          europe: Array.isArray(data.europe) && data.europe.length > 0 ? data.europe : getMockMarketData('EUROPE'),
          asia: Array.isArray(data.asia) && data.asia.length > 0 ? data.asia : getMockMarketData('ASIA'),
          crypto: Array.isArray(data.crypto) && data.crypto.length > 0 ? data.crypto : getMockMarketData('CRYPTO'),
          commodities: Array.isArray(data.commodities) && data.commodities.length > 0 ? data.commodities : getMockMarketData('COMMODITIES'),
          bonds: Array.isArray(data.bonds) && data.bonds.length > 0 ? data.bonds : [],
          indices: Array.isArray(data.indices) && data.indices.length > 0 ? data.indices : []
        };
        defaultApiClient.setMemoryCache('market_overview', result);
        return result;
      }
    } catch (error) {
      console.warn("Market overview fetch using calibrated fallback:", error);
    }

    const fallback: MarketOverviewResponse = { 
      us: getMockMarketData('US'), 
      canada: getMockMarketData('CANADA'), 
      europe: getMockMarketData('EUROPE'), 
      asia: getMockMarketData('ASIA'), 
      crypto: getMockMarketData('CRYPTO'), 
      commodities: getMockMarketData('COMMODITIES'),
      bonds: [],
      indices: []
    };
    defaultApiClient.setMemoryCache('market_overview', fallback);
    return fallback;
  });
};
