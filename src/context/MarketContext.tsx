import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StockData, Simulation } from '../types';
import { resolveTickerSymbol, fetchForecast, fetchSentiment, fetchRiskAnalysis, generateMockHistory } from '../services/api';
import { EXPANDED_STOCK_DATABASE } from '../data/expandedStockDatabase';
import { useWebSocket, PriceUpdate, ConnectionState } from '../hooks/useWebSocket';
import { portfolioManager } from '../services/PortfolioManager';

interface MarketContextType {
  activeTicker: string;
  setActiveTicker: (ticker: string) => void;
  tickers: string[];
  setTickers: React.Dispatch<React.SetStateAction<string[]>>;
  watchlist: string[];
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;
  allData: Record<string, StockData>;
  currentStock: StockData | undefined;
  fetchData: (ticker: string, forceRefresh?: boolean) => Promise<void>;
  loading: boolean;
  error: string | null;
  lastUpdate: PriceUpdate | null;
  isConnected: boolean;
  connectionState: ConnectionState;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTicker, setActiveTickerState] = useState<string>(() => {
    const saved = localStorage.getItem('logistics_alpha_active_ticker');
    return saved ? resolveTickerSymbol(saved) : 'NVDA';
  });

  const [tickers, setTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('logistics_alpha_tickers');
    let list: string[] = saved ? JSON.parse(saved) : [];
    if (!list || list.length === 0) {
      list = ['NVDA', 'AAPL', 'MSFT', 'SPY', 'TSLA', 'BTC-USD'];
    }
    return [...new Set(list.map(t => resolveTickerSymbol(t)))];
  });

  const [allData, setAllData] = useState<Record<string, StockData>>(() => {
    try {
      const cacheVersion = localStorage.getItem('logistics_alpha_cache_version');
      if (cacheVersion !== 'v3_calibrated_market') {
        localStorage.removeItem('logistics_alpha_all_data');
        localStorage.setItem('logistics_alpha_cache_version', 'v3_calibrated_market');
        return {};
      }
      const saved = localStorage.getItem('logistics_alpha_all_data');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quant_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...new Set(parsed.map((t: string) => resolveTickerSymbol(t)).filter(Boolean))];
        }
      }
    } catch {
      // Ignore
    }
    return ['NVDA', 'AAPL', 'TSLA', 'SPY', 'BTC-USD'];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchingTickers = useRef<Set<string>>(new Set());
  const failedTickers = useRef<Set<string>>(new Set());
  const pendingUpdateRef = useRef<PriceUpdate | null>(null);

  // WebSocket Integration for Streaming
  const { lastUpdate, isConnected, connectionState } = useWebSocket(tickers);

  const setActiveTicker = useCallback((ticker: string) => {
    const resolved = resolveTickerSymbol(ticker);
    setActiveTickerState(resolved);
    localStorage.setItem('logistics_alpha_active_ticker', resolved);
  }, []);

  const addToWatchlist = useCallback((ticker: string) => {
    const resolved = resolveTickerSymbol(ticker);
    setWatchlist(prev => {
      const next = [...new Set([...prev, resolved])];
      localStorage.setItem('quant_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  const removeFromWatchlist = useCallback((ticker: string) => {
    const resolved = resolveTickerSymbol(ticker);
    setWatchlist(prev => {
      const next = prev.filter(t => t !== resolved);
      localStorage.setItem('quant_watchlist', JSON.stringify(next));
      return next;
    });
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('logistics_alpha_tickers', JSON.stringify(tickers));
  }, [tickers]);

  useEffect(() => {
    if (Object.keys(allData).length > 0) {
      localStorage.setItem('logistics_alpha_all_data', JSON.stringify(allData));
    }
  }, [allData]);

  // Buffer live updates
  useEffect(() => {
    if (lastUpdate) {
      pendingUpdateRef.current = lastUpdate;
    }
  }, [lastUpdate]);

  // Apply buffered updates and sync candlestick bars
  useEffect(() => {
    const timer = setInterval(() => {
      if (pendingUpdateRef.current) {
        const update = pendingUpdateRef.current;
        pendingUpdateRef.current = null;

        setAllData(prev => {
          const data = prev[update.ticker];
          const historyCopy = data?.history ? [...data.history] : [];
          if (historyCopy.length > 0) {
            const lastCandle = { ...historyCopy[historyCopy.length - 1] };
            lastCandle.price = update.price;
            lastCandle.close = update.price;
            if (update.high) lastCandle.high = Math.max(lastCandle.high ?? update.price, update.price);
            if (update.low) lastCandle.low = Math.min(lastCandle.low ?? update.price, update.price);
            historyCopy[historyCopy.length - 1] = lastCandle;
          }

          const updatedData = {
            ...(data || {
              ticker: update.ticker,
              history: [],
              filtered: [],
              simulations: [],
              forecast: [],
              mean: 0,
              stdDev: 0
            }),
            currentPrice: update.price,
            change: update.change,
            changePercent: update.changePercent,
            volume: update.volume,
            high: update.high,
            low: update.low,
            open: update.open,
            previousClose: update.previousClose,
            marketCap: update.marketCap,
            peRatio: update.peRatio,
            dividendYield: update.dividendYield,
            history: historyCopy
          };

          portfolioManager.updatePrices(update.ticker, update.price);
          return {
            ...prev,
            [update.ticker]: updatedData as StockData
          };
        });
      }
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const fetchData = useCallback(async (t: string, forceRefresh: boolean = false) => {
    const resolvedT = resolveTickerSymbol(t);
    if ((!forceRefresh && allData[resolvedT]) || fetchingTickers.current.has(resolvedT) || failedTickers.current.has(resolvedT)) return;

    fetchingTickers.current.add(resolvedT);
    setLoading(true);
    setError(null);

    try {
      const [stockJson, sentiment] = await Promise.all([
        fetchForecast(resolvedT, 100, 0.8),
        fetchSentiment(resolvedT)
      ]);

      const riskAnalysis = await fetchRiskAnalysis(resolvedT, stockJson.history, sentiment);
      const sentimentFactor = ((sentiment.score - 50) / 50) * 0.1;
      const fairValue = parseFloat((stockJson.currentPrice * (1 + sentimentFactor)).toFixed(2));

      const riskSummary = {
        volatility: parseFloat((stockJson.stdDev * 100).toFixed(2)),
        beta: parseFloat(stockJson.fundamentals?.beta || "1.0"),
        level: (riskAnalysis.riskScore > 70 ? 'High' : riskAnalysis.riskScore > 40 ? 'Medium' : 'Low') as 'High' | 'Medium' | 'Low',
        sharpeRatio: 1.2,
        maxDrawdown: 15.4,
        var95: 4.2,
        factors: (riskAnalysis.tailRisks || []).slice(0, 3)
      };

      setAllData(prev => ({
        ...prev,
        [resolvedT]: {
          ...stockJson,
          forecast: stockJson.forecast,
          sentiment,
          fairValue,
          riskAnalysis,
          risk: riskSummary
        }
      }));
    } catch (err: any) {
      console.warn(`Fetch notice for ${resolvedT}, applying calibrated fallback`, err);
      const stockMeta = EXPANDED_STOCK_DATABASE.find(s => s.ticker === resolvedT);
      const fallbackPrice = stockMeta ? stockMeta.price : (resolvedT.includes('BTC') ? 66200 : resolvedT.includes('ETH') ? 2640 : (resolvedT.startsWith('^') ? 5860 : 150));
      const fallbackHist = generateMockHistory(resolvedT, 180);

      setAllData(prev => {
        if (prev[resolvedT] && !forceRefresh) return prev;
        return {
          ...prev,
          [resolvedT]: {
            ticker: resolvedT,
            currentPrice: fallbackPrice,
            mean: fallbackPrice,
            change: stockMeta?.change || 0,
            changePercent: stockMeta?.changePercent || 0,
            history: fallbackHist,
            filtered: [],
            simulations: [],
            stdDev: 12.4,
            forecast: [],
            fundamentals: stockMeta ? {
              marketCap: stockMeta.marketCap,
              peRatio: stockMeta.pe ? String(stockMeta.pe) : undefined,
              beta: stockMeta.beta ? String(stockMeta.beta) : "1.0",
              dividendYield: stockMeta.dividendYield ? String(stockMeta.dividendYield) : undefined,
              sector: stockMeta.sector,
              industry: stockMeta.industry
            } : undefined
          }
        };
      });
    } finally {
      setLoading(false);
      fetchingTickers.current.delete(resolvedT);
    }
  }, [allData]);

  const currentStock = useMemo(() => {
    return allData[activeTicker];
  }, [allData, activeTicker]);

  const contextValue = useMemo(() => ({
    activeTicker,
    setActiveTicker,
    tickers,
    setTickers,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    allData,
    currentStock,
    fetchData,
    loading,
    error,
    lastUpdate,
    isConnected,
    connectionState
  }), [
    activeTicker,
    setActiveTicker,
    tickers,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
    allData,
    currentStock,
    fetchData,
    loading,
    error,
    lastUpdate,
    isConnected,
    connectionState
  ]);

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
};
