/**
 * Portfolio Data Operations: Sector Allocations, Alpha Attribution,
 * and Asset Risk-Return Characteristics.
 */

import { defaultApiClient } from "./client";
import { PortfolioDataResponse } from "./types";

const FALLBACK_PORTFOLIO_DATA: PortfolioDataResponse = {
  allocation: [
    { name: 'Tech', value: 35 },
    { name: 'Energy', value: 15 },
    { name: 'Healthcare', value: 20 },
    { name: 'Finance', value: 10 },
    { name: 'Consumer', value: 10 },
    { name: 'Industrials', value: 10 }
  ],
  attribution: [
    { name: 'Selection', value: 45 },
    { name: 'Allocation', value: -12 },
    { name: 'Currency', value: 8 },
    { name: 'Timing', value: 15 }
  ],
  riskReturn: [
    { ticker: 'AAPL', return: 12, volatility: 18, sharpe: 0.6 },
    { ticker: 'NVDA', return: 45, volatility: 35, sharpe: 1.2 },
    { ticker: 'TSLA', return: 25, volatility: 45, sharpe: 0.5 },
    { ticker: 'GOLD', return: 8, volatility: 12, sharpe: 0.4 },
    { ticker: 'BTC', return: 60, volatility: 70, sharpe: 0.8 }
  ]
};

/**
 * Fetches institutional simulated portfolio allocations, factors, and risk metrics.
 */
export const fetchPortfolioData = async (): Promise<PortfolioDataResponse> => {
  const cached = defaultApiClient.getMemoryCache<PortfolioDataResponse>('portfolio_data');
  if (cached) return cached;

  return defaultApiClient.deduplicate('portfolio_data', async () => {
    try {
      const data = await defaultApiClient.fetchWithRetry<PortfolioDataResponse>('/api/portfolio/data');
      defaultApiClient.setMemoryCache('portfolio_data', data);
      return data;
    } catch (e) {
      console.warn("Portfolio fetch fallback used:", e);
      return FALLBACK_PORTFOLIO_DATA;
    }
  });
};
