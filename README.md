<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# QuantLab (QuantTrade v13)
### Advanced AI-Driven Quantitative Research & Trading Intelligence Platform

QuantLab is an institutional-grade financial intelligence platform that bridges the gap between traditional quantitative analysis and modern generative AI. Built with **React 19**, **Node.js**, and the **Google Gemini Pro** ecosystem, it provides traders with real-time insights, risk modeling, and predictive analytics.

---

## 🚀 Key Features

### 🧠 Neural Intelligence Core
* **Autonomous AI Thinking Turns:** Utilizes a custom `NeuralBrain` service powered by **Gemini 1.5 Pro** to perform "Learning Turns," analyzing global market states, news sentiment, and technical patterns to update an internal market regime model.
* **Sentiment Engine:** Real-time analysis of market news and social signals using NLP to quantify market fear and greed.
* **RAG-Ready Architecture:** Designed to ingest and analyze SEC filings and financial reports for deep-dive fundamental research.

### 📈 Quantitative Analysis Engine
* **Monte Carlo Simulations:** High-performance stochastic modeling engine that executes thousands of simulations to forecast price paths and calculate confidence intervals.
* **Risk Modeling:** Real-time calculation of **Value at Risk (VaR)**, **Sharpe Ratio**, and **Beta** metrics to optimize portfolio allocation.
* **Pattern Recognition:** Algorithmic identification of technical indicators (Fibonacci Retracements, MACD, RSI) integrated with AI-driven confirmation.

### 🌐 Full-Stack Architecture
* **Real-Time Data Pipeline:** Multi-source data ingestion (Yahoo Finance, WebSockets) with a custom caching layer to ensure low-latency market updates.
* **Cross-Platform Delivery:** Optimized for Web and Mobile using **Capacitor**, providing a seamless experience across desktop and Android devices.
* **Security & Performance:** Implements robust security headers (Helmet), rate limiting, and memory-safe persistence with **Better-SQLite3**.

---

## 🛠 Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Motion (Framer Motion), Recharts, TanStack Query.
- **Backend:** Node.js, Express, WebSocket (WS), Better-SQLite3, tsx, esbuild.
- **AI:** Google Gemini AI SDK, NLP Sentiment Analysis.
- **Mobile:** Capacitor (Android).
- **Tools:** Vite, Vitest, Puppeteer (Testing).

---

## ⚙️ Setup & Deployment

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Configuration:**
   Create a `.env` file and add your `GEMINI_API_KEY`.
3. **Development Mode:**
   ```bash
   npm run dev
   ```
4. **Mobile Build:**
   ```bash
   npm run android:build
   ```
