import { Router } from "express";
import fs from "fs";
import path from "path";
import { exec, execFile } from "child_process";

export const pythonRouter = Router();

const PYTHON_DIR = path.join(process.cwd(), "python");

interface PythonFileInfo {
  name: string;
  filename: string;
  description: string;
  category: string;
  sizeBytes: number;
}

const REGISTERED_MODULES: Record<string, { title: string; desc: string; category: string }> = {
  "main.py": {
    title: "Unified CLI & Engine Orchestrator",
    desc: "Single CLI entry point with status, projection, news scan, supply-chain, options, and backtest commands.",
    category: "CLI & Core"
  },
  "server.py": {
    title: "Standalone REST API Server",
    desc: "Multi-threaded zero-dependency HTTP server implementing all market, news, and projection endpoints.",
    category: "Backend Server"
  },
  "projection_engine.py": {
    title: "Monte Carlo & Fuzzy Logic Engine",
    desc: "Geometric Brownian Motion, Merton jump diffusion, Mamdani Fuzzy Logic controller, and FFT harmonic filter.",
    category: "Quantitative Math"
  },
  "news_scanner.py": {
    title: "Autonomous Global News Scanner",
    desc: "Continuous scanner with real-time NLP sentiment quantification, urgency scoring, and stock ticker mapping.",
    category: "AI & Market News"
  },
  "supply_chain.py": {
    title: "Maritime Supply Chain & Open API",
    desc: "Telemetry for 8 critical chokepoints, 7 mega container ports, active vessel fleet, and OSM geocoding.",
    category: "Supply Chain"
  },
  "options_pricing.py": {
    title: "Black-Scholes & Greeks Engine",
    desc: "Analytical European options model, Delta/Gamma/Theta/Vega/Rho, volatility smile, and Newton-Raphson IV.",
    category: "Derivatives"
  },
  "backtest_engine.py": {
    title: "HFT & Strategy Backtester",
    desc: "Event-driven simulation with slippage, commissions, Kelly criterion capital allocation, and Sharpe ratio.",
    category: "Backtesting"
  }
};

// 1. List all available Python modules
pythonRouter.get("/files", (req, res) => {
  try {
    const files = fs.readdirSync(PYTHON_DIR).filter(f => f.endsWith(".py"));
    const fileList: PythonFileInfo[] = files.map(filename => {
      const fullPath = path.join(PYTHON_DIR, filename);
      const stat = fs.statSync(fullPath);
      const meta = REGISTERED_MODULES[filename] || {
        title: filename,
        desc: "Python quantitative module",
        category: "General"
      };
      return {
        name: meta.title,
        filename,
        description: meta.desc,
        category: meta.category,
        sizeBytes: stat.size
      };
    });

    res.json({
      success: true,
      pythonVersion: process.env.PYTHON_VERSION || "3.10+",
      modules: fileList
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to list Python files" });
  }
});

// 2. Get code content of a specific Python module
pythonRouter.get("/file/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    // Sanitize filename to prevent directory traversal
    if (filename.includes("..") || filename.includes("/")) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    const filePath = path.join(PYTHON_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const code = fs.readFileSync(filePath, "utf-8");
    const meta = REGISTERED_MODULES[filename] || {
      title: filename,
      desc: "Python quantitative module",
      category: "General"
    };

    res.json({
      success: true,
      filename,
      name: meta.title,
      description: meta.desc,
      category: meta.category,
      code,
      lines: code.split("\n").length
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to load Python file" });
  }
});

// 3. Execute a Python script in real-time
pythonRouter.post("/run", (req, res) => {
  const { script = "main.py", args = [] } = req.body;
  const sanitizedScript = path.basename(script);
  const scriptPath = path.join(PYTHON_DIR, sanitizedScript);

  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ error: `Script ${sanitizedScript} not found in python/` });
  }

  const startTime = Date.now();
  const safeArgs = Array.isArray(args) ? args.map(String).slice(0, 10) : [];

  execFile("python3", [scriptPath, ...safeArgs], { timeout: 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
    const durationMs = Date.now() - startTime;
    let parsedJson: any = null;
    try {
      parsedJson = JSON.parse(stdout);
    } catch {
      // not JSON or partial JSON
    }

    res.json({
      success: !error,
      exitCode: error ? error.code : 0,
      durationMs,
      script: sanitizedScript,
      args: safeArgs,
      stdout: stdout || "",
      stderr: stderr || "",
      json: parsedJson
    });
  });
});
