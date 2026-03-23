import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);

  app.use(express.json());

  // --- WebSocket Setup ---
  const wss = new WebSocketServer({ server: httpServer });
  const subscriptions = new Map<WebSocket, Set<string>>();
  
  // Cache for the latest real data
  const tickerData = new Map<string, {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    open: number;
    previousClose: number;
    marketCap?: number;
    peRatio?: number;
    dividendYield?: number;
    lastFetch: number;
  }>();

  // Helper to fetch and cache real price
  const fetchRealPrice = async (ticker: string) => {
    try {
      const quote: any = await yahooFinance.quote(ticker);
      if (quote && quote.regularMarketPrice) {
        tickerData.set(ticker, {
          price: quote.regularMarketPrice,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          volume: quote.regularMarketVolume || 0,
          high: quote.regularMarketDayHigh || 0,
          low: quote.regularMarketDayLow || 0,
          open: quote.regularMarketOpen || 0,
          previousClose: quote.regularMarketPreviousClose || 0,
          marketCap: quote.marketCap,
          peRatio: quote.trailingPE || quote.forwardPE,
          dividendYield: quote.trailingAnnualDividendYield || quote.dividendYield,
          lastFetch: Date.now()
        });
        return true;
      }
    } catch (error) {
      console.error(`Error fetching price for ${ticker}:`, error);
    }
    return false;
  };

  // 1. High-frequency simulator loop (every 1 second)
  setInterval(() => {
    const activeTickers = new Set<string>();
    subscriptions.forEach(subs => subs.forEach(t => activeTickers.add(t)));

    if (activeTickers.size === 0) return;

    for (const ticker of activeTickers) {
      const data = tickerData.get(ticker);
      if (data) {
        // Simulate a small tick (random walk)
        const volatility = 0.0005; // 0.05% volatility per tick
        const changeFactor = 1 + (Math.random() * volatility * 2 - volatility);
        const newPrice = data.price * changeFactor;
        
        // Update the simulated price
        data.price = newPrice;
        
        // Calculate new change metrics
        const priceDiff = newPrice - (data.price / changeFactor); // Approximate diff from last tick
        data.change += priceDiff;
        data.changePercent += (priceDiff / data.price) * 100;

        // Broadcast to subscribers
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            const subs = subscriptions.get(client as WebSocket);
            if (subs?.has(ticker)) {
              client.send(JSON.stringify({
                type: 'PRICE_UPDATE',
                ticker,
                price: newPrice,
                change: data.change,
                changePercent: data.changePercent,
                volume: data.volume,
                high: data.high,
                low: data.low,
                open: data.open,
                previousClose: data.previousClose,
                marketCap: data.marketCap,
                peRatio: data.peRatio,
                dividendYield: data.dividendYield,
                timestamp: new Date().toISOString()
              }));
            }
          }
        });
      }
    }
  }, 1000); // 1 second for smooth real-time feel

  // 2. Background sync with Yahoo Finance (every 30 seconds)
  setInterval(async () => {
    const activeTickers = new Set<string>();
    subscriptions.forEach(subs => subs.forEach(t => activeTickers.add(t)));

    if (activeTickers.size === 0) return;

    for (const ticker of activeTickers) {
      await fetchRealPrice(ticker);
    }
  }, 30000); // Sync every 30 seconds

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection");
    subscriptions.set(ws, new Set());

    ws.on("message", async (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "SUBSCRIBE") {
          const subs = subscriptions.get(ws);
          if (subs) {
            subs.add(data.ticker);
            console.log(`Subscribed to ${data.ticker}`);
            
            // Fetch initial price immediately if not cached or cache is old (> 30s)
            const cached = tickerData.get(data.ticker);
            if (!cached || Date.now() - cached.lastFetch > 30000) {
              await fetchRealPrice(data.ticker);
            }
          }
        } else if (data.type === "UNSUBSCRIBE") {
          const subs = subscriptions.get(ws);
          if (subs) {
            subs.delete(data.ticker);
            console.log(`Unsubscribed from ${data.ticker}`);
          }
        }
      } catch (e) {
        console.error("WebSocket message error:", e);
      }
    });

    ws.on("close", () => {
      subscriptions.delete(ws);
      console.log("WebSocket connection closed");
    });
  });

  // --- API Routes ---
  // All Gemini and data fetching routes have been moved to the frontend 
  // to comply with security guidelines and resolve API key issues.

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
