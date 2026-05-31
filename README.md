# QuantTrade

> AI-driven financial analysis and projection platform combining quantitative models with large language intelligence.

QuantTrade is a full-stack web and mobile application that uses mathematical modeling (Monte Carlo simulations, stochastic path analysis) and Google Gemini AI to generate real-time market projections, risk assessments, and sentiment-driven insights. Built for developers and traders who want institutional-grade analytics in a fast, cross-platform interface.

---

## Features

- **AI Market Analysis** — Powered by Google Gemini 1.5 Pro for natural language market insights, sentiment analysis, and regime detection
- **Monte Carlo Simulation Engine** — Executes thousands of stochastic price paths in TypeScript to forecast price action and calculate dynamic confidence intervals
- **Real-Time Data Pipeline** — Streams live market data via Yahoo Finance APIs with a custom caching layer for low-latency updates
- **Interactive Charts** — Rich financial visualizations built with Recharts including candlesticks, projections, and risk overlays
- **Persistent Storage** — Lightweight SQLite database via Better-SQLite3 for session data and historical query caching
- **Cross-Platform** — Runs on Web and Android via Capacitor with fluid UI animations powered by Motion
- **Clean UI** — Responsive, dark-mode-first interface built with React 19 and Tailwind CSS v4

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Backend | Node.js, Express, TypeScript |
| AI / LLM | Google Gemini 1.5 Pro (`@google/genai`) |
| Math Engine | mathjs, custom Monte Carlo implementation |
| Charts | Recharts |
| Animations | Motion |
| Database | Better-SQLite3 |
| Build Tool | Vite 6 |
| Mobile | Capacitor (Web + Android) |

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

### Configuration

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running in Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
QuantTrade/
├── src/                  # React frontend source
│   ├── components/       # UI components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utilities, simulation engine, API clients
├── server.ts             # Express server + Vite middleware
├── index.html            # App entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── .env.example          # Environment variable template
└── package.json
```

---

## How It Works

1. **Data Ingestion** — Yahoo Finance API streams live and historical price data into the frontend with a custom caching layer to minimize redundant requests
2. **Simulation** — The Monte Carlo engine runs thousands of randomized price path simulations using statistical parameters derived from historical volatility
3. **AI Analysis** — Gemini 1.5 Pro processes market context, news sentiment, and simulation output to generate plain-language risk summaries and trade insights
4. **Visualization** — Results are rendered as interactive charts with confidence intervals, projection bands, and risk metrics

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI analysis |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build optimized production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run TypeScript type checking |

---

## Disclaimer

QuantTrade is a personal research and educational project. Nothing in this application constitutes financial advice. All projections are probabilistic models and should not be used as the sole basis for investment decisions.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*Built by [Bhargav Patel](https://github.com/BhargavA09)*
