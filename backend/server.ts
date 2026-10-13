import express from "express";
import "dotenv/config";
import path from "path";
import http, { createServer } from "http";
import { spawn, ChildProcess } from "child_process";
import cors from "cors";
import helmet from "helmet";

import { PORT, IS_PRODUCTION, corsConfig, generalLimiter } from "./config/appConfig";
import { validateJsonPayload } from "./middleware/validation";
import { errorHandler } from "./middleware/errorHandler";
import { WebSocketManager } from "./services/webSocketManager";

console.log("🚀 QuantLab Initializing Full Python Backend Infrastructure...");

const PYTHON_PORT = 5050;
let pythonProcess: ChildProcess | null = null;

function startPythonBackend() {
  const pythonScript = path.join(process.cwd(), "backend", "server.py");
  console.log(`🐍 Spawning QuantLab Pure Python Backend on port ${PYTHON_PORT}...`);

  pythonProcess = spawn("python3", [pythonScript, "--port", String(PYTHON_PORT)], {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, PYTHONUNBUFFERED: "1" }
  });

  pythonProcess.stdout?.on("data", (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[Python Core] ${text}`);
  });

  pythonProcess.stderr?.on("data", (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[Python Core] ${text}`);
  });

  pythonProcess.on("exit", (code, signal) => {
    console.warn(`[Python Core] Process exited with code ${code}, signal ${signal}`);
  });
}

function proxyToPythonBackend(req: express.Request, res: express.Response) {
  const targetPath = req.originalUrl || (req.url.startsWith('/api') ? req.url : `/api${req.url}`);
  const options: http.RequestOptions = {
    hostname: "127.0.0.1",
    port: PYTHON_PORT,
    path: targetPath,
    method: req.method,
    headers: {
      ...req.headers,
      host: `127.0.0.1:${PYTHON_PORT}`,
    },
  };

  const bodyStr = req.body && Object.keys(req.body).length > 0 
    ? (typeof req.body === "string" ? req.body : JSON.stringify(req.body))
    : null;

  if (bodyStr && (req.method === "POST" || req.method === "PUT" || req.method === "PATCH")) {
    if (options.headers) {
      options.headers["content-type"] = "application/json";
      options.headers["content-length"] = Buffer.byteLength(bodyStr);
    }
  }

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", (err) => {
    res.status(503).json({
      error: "Python Backend initializing",
      details: err.message,
      engine: "Python-QuantLab-Core"
    });
  });

  if (bodyStr) {
    proxyReq.write(bodyStr);
    proxyReq.end();
  } else {
    req.pipe(proxyReq);
  }
}

async function startServer() {
  // 1. Boot up the institutional Python backend daemon
  startPythonBackend();

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

  // Mount entire /api domain onto the Python backend
  app.use("/api", proxyToPythonBackend);

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
    console.log(`🐍 All /api requests routed 100% to Python Backend at 127.0.0.1:${PYTHON_PORT}`);
  });

  // Graceful shutdown handling
  const shutdown = () => {
    console.log("Shutting down QuantLab Server and Python backend...");
    if (pythonProcess) {
      pythonProcess.kill("SIGTERM");
    }
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
  if (pythonProcess) {
    pythonProcess.kill("SIGTERM");
  }
  process.exit(1);
});
