import express from "express";
import "dotenv/config";
import path from "path";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";

import { PORT, IS_PRODUCTION, corsConfig, generalLimiter } from "./config/appConfig";
import { validateJsonPayload } from "./middleware/validation";
import { errorHandler } from "./middleware/errorHandler";
import { stockRouter } from "./routes/stockRoutes";
import { aiRouter } from "./routes/aiRoutes";
import { marketRouter } from "./routes/marketRoutes";
import { portfolioRouter } from "./routes/portfolioRoutes";
import { WebSocketManager } from "./services/webSocketManager";

console.log("🚀 QuantLab Server initializing with clean modular architecture...");

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Trust proxy for accurate IP determination behind load balancers / Cloud Run
  app.set("trust proxy", 1);

  // Security Middlewares
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors(corsConfig));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(validateJsonPayload);

  // General rate limiting
  app.use("/api", generalLimiter);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      port: PORT,
      version: "3.0.0-modular"
    });
  });

  // Mount API Domain Routers (Separation of Concerns / SRP)
  app.use("/api/stock", stockRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/market", marketRouter);
  app.use("/api/portfolio", portfolioRouter);

  // Initialize Real-time Multi-Source WebSocket Manager
  const wsManager = new WebSocketManager(httpServer);
  console.log("⚡ Real-Time Multi-Source WebSocket Manager active at /ws");

  // Development vs Production serving strategy
  if (!IS_PRODUCTION) {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("🛠️ Vite middleware enabled (Development Mode)");
    } catch {
      console.warn("⚠️ Vite middleware not available, falling back to static build.");
      serveStatic(app);
    }
  } else {
    serveStatic(app);
  }

  // Centralized Error Handling Middleware
  app.use(errorHandler);

  function serveStatic(expressApp: express.Express) {
    const distPath = path.join(process.cwd(), "dist");
    expressApp.use(express.static(distPath));
    expressApp.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ QuantLab Server successfully listening on port ${PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("Shutting down QuantLab Server...");
    wsManager.close();
    httpServer.close(() => {
      process.exit(0);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch(err => {
  console.error("❌ CRITICAL: Failed to start server:", err);
  process.exit(1);
});
