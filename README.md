# QuantTrade

**AI-powered financial projection platform with Monte Carlo simulation and LLM-driven market analysis.**

QuantTrade is a full-stack fintech application built for quantitative financial analysis. It combines a real-time market data pipeline, a Monte Carlo simulation engine, and Google Gemini AI to deliver institutional-grade insights — available on both web and Android.

---

## Features

- **Monte Carlo Simulation Engine** — Runs thousands of stochastic price paths to forecast price action and calculate dynamic confidence intervals
- **LLM-Powered Analysis** — Integrates Google Gemini 1.5 Pro for natural language financial insights, market regime detection, and signal interpretation
- **Real-Time Data Pipeline** — WebSocket-based streaming using Yahoo Finance APIs with a custom caching layer for low-latency delivery
- **Interactive Dashboards** — Recharts visualizations with fluid Framer Motion animations
- **Persistent Storage** — Better-SQLite3 for local market data caching and session persistence
- **Cross-Platform** — Runs as a web app and a native Android app via Capacitor
- **99% TypeScript** — Strict mode enforced across a 5,000+ line codebase

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| Backend | Express.js, Node.js (tsx), TypeScript |
| AI | Google Gemini 1.5 Pro (`@google/genai`) |
| Data | Yahoo Finance API, WebSockets |
| Database | Better-SQLite3 |
| Charts | Recharts |
| Math | mathjs |
| Mobile | Capacitor (Android) |
| Build | Vite 6, TypeScript 5.8 |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Google Gemini API key — get one free at [aistudio.google.com](https://aistudio.google.com)

### Installation

```bash
git clone https://github.com/BhargavA09/QuantTrade.git
cd QuantTrade
npm install
```

### Environment Setup

Copy the example env file and add your API key:

```bash
cp .env.example .env
```

Open `.env` and set:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the App

```bash
# Development (runs both frontend and backend)
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
QuantTrade/
├── src/                  # React frontend (components, pages, hooks)
├── server.ts             # Express backend (API routes, WebSocket, SQLite)
├── index.html            # Vite entry point
├── vite.config.ts        # Vite + React plugin config
├── tsconfig.json         # TypeScript strict config
├── .env.example          # Environment variable template
└── package.json
```

---

## How It Works

1. **Market data** is fetched via Yahoo Finance APIs and streamed to the client over WebSockets. Responses are cached in SQLite to reduce redundant requests.

2. **Monte Carlo simulation** runs on the server — price paths are generated using stochastic models (geometric Brownian motion), producing probability distributions and confidence intervals for future price levels.

3. **Gemini AI** receives the simulation output and current market data, then returns plain-language analysis: regime classification (trending/ranging/volatile), key risk factors, and trading signals.

4. **The frontend** renders everything as interactive Recharts dashboards with animated transitions via Framer Motion.

---

## Android (Capacitor)

To build and run on Android:

```bash
npm run build
npx cap sync android
npx cap open android
```

Requires Android Studio installed locally.

---

## Roadmap

- [ ] Options pricing (Black-Scholes model)
- [ ] Portfolio-level Monte Carlo (multi-asset correlation)
- [ ] Backtesting engine with historical replay
- [ ] iOS build via Capacitor
- [ ] User authentication and saved watchlists

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**Bhargav Patel**  
Full-Stack Software Engineer — Windsor, ON, Canada  
[linkedin.com/in/bhrgavpatel](https://linkedin.com/in/bhrgavpatel) · [github.com/BhargavA09](https://github.com/BhargavA09)
