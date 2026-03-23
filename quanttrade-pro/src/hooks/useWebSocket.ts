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

export function useWebSocket(tickers: string[]) {
  const [lastUpdate, setLastUpdate] = useState<PriceUpdate | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}`);

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      // Subscribe to all current tickers
      tickers.forEach(ticker => {
        socket.send(JSON.stringify({ type: 'SUBSCRIBE', ticker }));
      });
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'PRICE_UPDATE') {
          setLastUpdate(data);
        }
      } catch (e) {
        console.error('WebSocket message error:', e);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket.close();
    };

    socketRef.current = socket;
  }, [tickers]);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []); // Only connect once on mount

  // Subscribe to new tickers when they are added
  useEffect(() => {
    if (isConnected && socketRef.current?.readyState === WebSocket.OPEN) {
      tickers.forEach(ticker => {
        socketRef.current?.send(JSON.stringify({ type: 'SUBSCRIBE', ticker }));
      });
    }
  }, [tickers, isConnected]);

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

  return { lastUpdate, isConnected, subscribe, unsubscribe };
}
