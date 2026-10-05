import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { getAccurateQuote, getAccurateBatchQuotes, generateLiveMicroTick } from "./multiSourceMarketEngine";

export class WebSocketManager {
  private wss: WebSocketServer;
  private subscriptions = new Map<WebSocket, Set<string>>();
  private broadcastInterval: NodeJS.Timeout | null = null;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.init();
  }

  private init() {
    // Prime core Stock & Bond market benchmarks on startup for instant zero-latency availability
    const coreBenchmarks = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^TNX', '^TYX', '^FVX', '^IRX', 'TLT', 'IEF', 'BND', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD', 'NVDA', 'AAPL', 'MSFT', 'TSLA'];
    getAccurateBatchQuotes(coreBenchmarks).catch(() => {});

    this.wss.on("connection", (ws: WebSocket) => {
      this.subscriptions.set(ws, new Set());

      ws.on("message", async (message: string) => {
        try {
          if (message.length > 1024) return;
          const data = JSON.parse(message);

          if (data.type === "SUBSCRIBE" && typeof data.ticker === "string") {
            const ticker = data.ticker.trim().toUpperCase();
            if (ticker.length > 20 || !/^[A-Za-z0-9.\-=^]+$/.test(ticker)) return;

            const subs = this.subscriptions.get(ws);
            if (subs && subs.size < 100) {
              subs.add(ticker);
              // Send immediate quote confirmation
              getAccurateQuote(ticker).then(quote => {
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify({ type: "PRICE_UPDATE", ...quote }));
                }
              }).catch(() => {});
            }
          } else if (data.type === "UNSUBSCRIBE" && typeof data.ticker === "string") {
            const subs = this.subscriptions.get(ws);
            if (subs) {
              subs.delete(data.ticker.trim().toUpperCase());
            }
          }
        } catch {
          // Ignore malformed message
        }
      });

      ws.on("close", () => {
        this.subscriptions.delete(ws);
      });
    });

    // 1. High-frequency broadcast loop with Live Preventions (1.5 seconds)
    this.broadcastInterval = setInterval(() => {
      const activeTickers = new Set<string>();
      this.subscriptions.forEach(subs => subs.forEach(t => activeTickers.add(t)));
      if (activeTickers.size === 0) return;

      for (const ticker of activeTickers) {
        const tick = generateLiveMicroTick(ticker);
        if (tick) {
          const payload = JSON.stringify({
            type: "PRICE_UPDATE",
            ticker: tick.ticker,
            price: tick.price,
            change: tick.change,
            changePercent: tick.changePercent,
            volume: tick.volume,
            high: tick.high,
            low: tick.low,
            open: tick.open,
            previousClose: tick.previousClose,
            marketCap: tick.marketCap,
            peRatio: tick.peRatio,
            dividendYield: tick.dividendYield,
            source: tick.source,
            verified: tick.verified,
            preventionApplied: tick.preventionApplied,
            timestamp: tick.timestamp || new Date().toISOString()
          });

          this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              const subs = this.subscriptions.get(client as WebSocket);
              if (subs?.has(ticker)) {
                client.send(payload);
              }
            }
          });
        }
      }
    }, 1500);

    // 2. Background consensus sync (every 20 seconds)
    this.syncInterval = setInterval(async () => {
      const activeTickers = new Set<string>();
      this.subscriptions.forEach(subs => subs.forEach(t => activeTickers.add(t)));
      ['^GSPC', '^DJI', '^IXIC', '^RUT', '^TNX', '^TYX', '^FVX', '^IRX', 'TLT', 'IEF', 'BND', 'SPY', 'QQQ', 'BTC-USD', 'ETH-USD'].forEach(t => activeTickers.add(t));
      if (activeTickers.size > 0) {
        await getAccurateBatchQuotes(Array.from(activeTickers));
      }
    }, 20000);
  }

  public close() {
    if (this.broadcastInterval) clearInterval(this.broadcastInterval);
    if (this.syncInterval) clearInterval(this.syncInterval);
    this.wss.close();
  }
}
