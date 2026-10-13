# QuantTrade

Monte Carlo stock price forecasting with Gemini LLM market analysis. A full-stack React/TypeScript web app with an Express backend, an Android build via Capacitor, and a standalone Python quant suite.

Live demo: https://quant-trade-neon.vercel.app

## Features

- **Monte Carlo projections**: price-path simulation based on geometric Brownian motion (the Python suite adds Merton jumps, fuzzy-logic regime classification and FFT filtering).
- **Gemini analysis**: market commentary, regime classification, risk factors and signals via Google Gemini (`@google/genai`).
- **Live market data**: Yahoo Finance data (`yahoo-finance2`) streamed over WebSockets, cached in SQLite.
- **Dashboards and charts**: Recharts and TradingView `lightweight-charts`, animated with `motion`.
- **News sentiment**: headline scoring with `sentiment`.
- **Maps and 3D**: Leaflet (`react-leaflet`) and Three.js visualisations.
- **Persistence**: `better-sqlite3`.
- **Android app**: packaged with Capacitor.
- **Windows executable**: optional single-file build with `pkg`.
- **Python suite**: options pricing, backtesting, news scanning, supply-chain data and a REST API (see below).

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript 5.8, Vite 6, Tailwind CSS v4, TanStack Query, Recharts, lightweight-charts, Leaflet, Three.js, motion, react-markdown |
| Backend | Node.js 20+, Express 4, `tsx`, `ws`, `helmet`, `cors`, `express-rate-limit`, `multer` |
| AI | `@google/genai`, `@google/generative-ai` |
| Data | `yahoo-finance2`, `better-sqlite3`, `mathjs` |
| Mobile | Capacitor 8 (Android) |
| Testing | Vitest, Testing Library, jsdom, Puppeteer |
| Python | Python 3.9+ standard library (no mandatory dependencies) |

## Getting started

### Prerequisites

- Node.js 20 or newer (the production build targets Node 20)
- A Google Gemini API key

### Install and run

```bash
git clone https://github.com/BhargavA09/QuantTrade.git
cd QuantTrade
npm install
cp .env.example .env      # then set GEMINI_API_KEY in .env
npm run dev               # starts the backend (backend/server.ts); the URL is printed in the console
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Run the dev server with `tsx backend/server.ts` |
| `npm run build` | Build the frontend with Vite and bundle the server to `dist/server.js` |
| `npm start` | Run the production bundle (`node dist/server.js`) |
| `npm run preview` | Preview the Vite build |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm test` | Run the test suite with Vitest |
| `npm run clean` | Remove `dist` |
| `npm run android:build` | Build, then sync to the Android project |
| `npm run android:open` | Open the Android project in Android Studio |
| `npm run build:exe` | Build a Windows executable (`QuantLab.exe`) |

## Python suite

A pure-Python toolkit lives in `python/` (details in [README_PYTHON.md](README_PYTHON.md)). It needs only Python 3.9+; `requirements.txt` adds optional scientific packages.

| Module | Purpose |
| --- | --- |
| `python/main.py` | Unified CLI |
| `python/server.py` | Multithreaded REST API |
| `python/projection_engine.py` | Monte Carlo (GBM with Merton jumps), fuzzy logic, FFT filtering |
| `python/news_scanner.py` | News scanning with Gemini integration |
| `python/supply_chain.py` | Maritime chokepoints, ports and vessels |
| `python/options_pricing.py` | Black-Scholes, Greeks, implied volatility and smile |
| `python/backtest_engine.py` | Event-driven backtester with slippage and Kelly sizing |

Examples (the root `main.py` is a shortcut to the same CLI):

```bash
python main.py status
python main.py project AAPL --price 190 --days 90 --simulations 10000
python main.py options AAPL --spot 190 --strike 200 --days 30
python main.py backtest AAPL --strategy <name> --capital 100000
python main.py news --daemon --interval 300
python main.py supply-chain
python main.py server --port 8080
```

The REST server exposes endpoints for quotes, history, options, fair value, fundamentals, sentiment, projections, AI analysis, market overview, news, portfolio, backtests and a Python sandbox.

## Android

```bash
npm run android:build
npm run android:open
```

Requires Android Studio. Helper scripts for release builds are in the repo root (`build_android_release.sh`, `build_android_release.bat`, `build-apk.ts`, `build_aab.ts`).

## Project structure

```
android/        Capacitor Android project
backend/        Express server (entry point: backend/server.ts)
server/         Additional server-side code
python/         Python quant suite
src/            React/TypeScript frontend
public/         Static assets
main.py         Python CLI shortcut
capacitor.config.ts, vite.config.ts, tsconfig.json, package.json
.env.example    Environment variable template
```

## Roadmap

- [x] Black-Scholes options pricing (Python suite)
- [x] Event-driven backtesting (Python suite)
- [ ] Surface options pricing and backtesting in the web UI
- [ ] Portfolio-level Monte Carlo
- [ ] iOS build
- [ ] User authentication and watchlists

## License

MIT

## Author

Bhargav Patel, Full-Stack Software Engineer, Windsor, ON.
