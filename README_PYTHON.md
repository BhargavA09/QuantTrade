# QuantLab Python Suite

**Institutional-Grade Quantitative Trading & Financial Intelligence Suite in Pure Python 3**

QuantLab has been ported and expanded into a standalone, pure Python 3 codebase with zero mandatory external dependencies. Every algorithmic and analytical model runs out-of-the-box on standard Python 3.9+.

---

## 📁 Python Architecture

```
├── python/
│   ├── main.py              # Unified CLI orchestrator and command runner
│   ├── server.py            # Multithreaded REST API server (ports 8080 or custom)
│   ├── projection_engine.py # Monte Carlo (GBM + Merton Jumps) + Fuzzy Logic + FFT
│   ├── news_scanner.py      # Real-time Autonomous Global News Scanner & Gemini AI
│   ├── supply_chain.py      # Maritime Open API (Suez, Panama, Malacca, Ports, Vessels)
│   ├── options_pricing.py   # Black-Scholes Greeks, Implied Volatility & Smile
│   ├── backtest_engine.py   # Event-driven backtester, Slippage, Kelly Criterion
│   └── requirements.txt     # Optional extended scientific packages
├── main.py                  # Convenient root CLI shortcut (`python main.py`)
└── requirements.txt         # Root pip requirements file
```

---

## 🚀 Quick Start (Zero Dependencies)

The core algorithms use **Python standard library only** (`math`, `random`, `urllib`, `http.server`, `json`, `datetime`):

```bash
# Check system status
python main.py status

# Run Monte Carlo & Fuzzy Logic Projections for any stock
python main.py project AAPL --price 225.50 --days 30 --simulations 1000

# Autonomous Global News Scanner
python main.py news

# Continuous News Monitoring Daemon
python main.py news --daemon --interval 15

# Global Supply Chain & Maritime Open API
python main.py supply-chain

# Black-Scholes Options Pricing & Greeks
python main.py options SPY --spot 580 --strike 580 --days 30

# Strategy Backtesting with Kelly Sizing & Sharpe Ratio
python main.py backtest NVDA --strategy momentum_crossover --capital 100000

# Start Standalone Python REST API Server
python main.py server --port 8080
```

---

## 📡 Complete Python REST API Endpoints

The QuantLab Python Backend (`backend/server.py` or `python/server.py`) handles 100% of all API routes:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status, active modules, and Python process details |
| `GET` | `/api/stock/quote/<ticker>` | Live Yahoo Finance quote with multi-source fallback |
| `GET` | `/api/stock/quotes?tickers=...` | Multi-ticker batch quotes |
| `GET` | `/api/stock/history/<ticker>` | Historical OHLCV candlestick bars |
| `GET` | `/api/stock/search?q=...` | Live ticker & company search |
| `GET` | `/api/stock/options/<ticker>` | Black-Scholes analytical option chains & Greeks |
| `GET` | `/api/stock/fairvalue/<ticker>` | Intrinsic fair value (DCF + Fuzzy + Multiples) |
| `GET` | `/api/stock/fundamentals/<ticker>`| Company fundamentals, balance sheet & health |
| `GET` | `/api/stock/pennystocks` | Momentum penny stock scanning |
| `GET` | `/api/stock/sentiment/<ticker>` | Sentiment score, credibility & catalysts |
| `POST` | `/api/stock/projection` | Monte Carlo + Jump Diffusion + FFT Fourier filter |
| `POST` | `/api/ai/neural-learn` | Neural bot learning cycle & adaptive memory |
| `POST` | `/api/ai/scan` | Multimodal AI chart pattern recognition |
| `POST` | `/api/ai/resolve-ticker` | AI ticker resolver |
| `GET` | `/api/market/globalstate` | Macro regime, logistics lanes, and catalysts |
| `GET` | `/api/market/supply-chain` | Maritime chokepoints, ports, and vessel fleet |
| `GET` | `/api/market/overview` | Global indices, forex, bonds, commodities |
| `GET` | `/api/market/futures` | Live index & commodity futures |
| `GET` | `/api/market/global-news-scan` | Autonomous news scanner & ticker impact |
| `GET` | `/api/portfolio/data` | Portfolio asset allocations & risk metrics |
| `POST` | `/api/backtest/run` | Event-driven strategy backtester |
| `GET` | `/api/python/files` | Python source code browser |
| `POST` | `/api/python/run` | In-app Python execution sandbox |

---

## 🧠 Algorithmic Details

1. **Monte Carlo Simulation**:
   - Geometric Brownian Motion with Antithetic Variates for variance reduction
   - Merton Jump Diffusion for modeling black swan market shocks
   - 80% and 95% dynamic confidence bands, median trajectory, VaR, and CVaR

2. **Fuzzy Logic Controller**:
   - 27 Mamdani inference rules mapping Momentum (RSI), Volatility, and Trend
   - Centroid defuzzification for adaptive drift adjustments and regime classification

3. **Autonomous Global News Scanner**:
   - Constant scanning of macroeconomic, geopolitical, and central bank developments
   - Sentiment quantification (-1.0 to +1.0) and market urgency classification
   - Direct mapping to impacted stock tickers (NVDA, TSM, ZIM, XOM, SPY, etc.)

4. **Maritime & Supply Chain Open API**:
   - Live telemetry for 8 critical chokepoints (Suez, Panama, Malacca, Bab-el-Mandeb, etc.)
   - 7 Mega container ports with TEU throughput and waiting times
   - Real vessel fleet coordinates, destination, cargo, and correlated equities

5. **Options Pricing**:
   - High-precision analytical Black-Scholes formula using Gauss error function
   - Delta, Gamma, Theta (daily decay), Vega, Rho
   - Volatility smile generator and Newton-Raphson implied volatility solver
