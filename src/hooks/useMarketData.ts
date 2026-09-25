import { useQuery } from "@tanstack/react-query";
import { StockData } from "../types";

export function useMarketData(category?: string) {
  return useQuery({
    queryKey: ["market-data", category],
    queryFn: async () => {
      // In a real app, this would fetch from a market data provider
      // For this demo, we'll return some curated tickers
      const tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX"];
      return tickers;
    },
  });
}

export function useHistoricalData(ticker: string, period: string = "1Y") {
  return useQuery({
    queryKey: ["historical-data", ticker, period],
    queryFn: async () => {
      // This would fetch historical data for backtesting
      // Mocking for now
      return [];
    },
    enabled: !!ticker,
  });
}
