import { useEffect, useRef, useState, useCallback } from 'react';

export interface PriceUpdate {
  type: 'PRICE_UPDATE';
  ticker: string;
  price: number;
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
  timestamp: string;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export function useWebSocket(tickers: string[]) {
  const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const [isConnected, setIsConnected] = useState(true);
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected');

  // Polling fallback to ensure continuous real-time quotes even in iframe/proxy environments
  const pollQuotes = useCallback(async () => {
    if (!tickers || tickers.length === 0) return;
    try {
      const tickerQuery = tickers.slice(0, 30).join(',');
      const res = await fetch(`/api/stock/quotes?tickers=${encodeURIComponent(tickerQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.quotes) {
          const quoteList = Object.values(data.quotes) as PriceUpdate[];
          if (quoteList.length > 0) {
            // Update with the most recent quote
            quoteList.forEach((q) => {
              if (q && q.ticker) {
                setLastUpdate(q);
              }
            });
            setIsConnected(true);
            setConnectionState('connected');
          }
        }
      }
    } catch {
      // Quiet catch for transient network failures
    }
  }, [tickers]);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = import.meta.env.VITE_WS_URL || `${protocol}//${host}/ws`;
      
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        setIsConnected(true);
        setConnectionState('connected');
        reconnectAttemptsRef.current = 0;
        
        tickers.forEach(ticker => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'SUBSCRIBE', ticker }));
          }
        });
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PRICE_UPDATE') {
            setLastUpdate(data);
            setIsConnected(true);
            setConnectionState('connected');
          }
        } catch {
          // Ignore parse errors on malformed messages
        }
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
        }

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const backoffTime = Math.min(3000 * Math.pow(1.5, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            connect();
          }, backoffTime);
        }
      };

      socket.onerror = () => {
        // Gracefully fallback to polling without firing error alarms in iframe
        console.warn('WebSocket streaming unavailable; active HTTP polling fallback engaged.');
        try {
          socket.close();
        } catch {
          // Ignore
        }
      };

      socketRef.current = socket;
    } catch {
      console.warn('Unable to initiate WebSocket, relying on HTTP polling.');
    }
  }, [tickers]);

  useEffect(() => {
    // Initial fetch so prices show immediately
    pollQuotes();

    // Start WebSocket
    connect();

    // Setup polling fallback loop (runs every 3 seconds)
    pollIntervalRef.current = setInterval(() => {
      // If WebSocket is not OPEN, poll HTTP quotes endpoint
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        pollQuotes();
      }
    }, 3000);

    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        try {
          socketRef.current.close();
        } catch {
          // Ignore
        }
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [connect, pollQuotes]);

  // Subscribe to new tickers when they are added
  useEffect(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      tickers.forEach(ticker => {
        socketRef.current?.send(JSON.stringify({ type: 'SUBSCRIBE', ticker }));
      });
    }
  }, [tickers]);

  const subscribe = (ticker: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'SUBSCRIBE', ticker }));
    }
  };

  const unsubscribe = (ticker: string) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'UNSUBSCRIBE', ticker }));
    }
  };

  return { lastUpdate, isConnected, connectionState, subscribe, unsubscribe };
}
