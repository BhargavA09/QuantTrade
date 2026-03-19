# QuantTrade Pro

> **Advanced mobile & web trading platform powered by AI, Monte Carlo simulations, Fuzzy Logic projections, Fourier signal filtering, and global trade tracking.**

[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_AI-Integrated-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Mathematical Models](#mathematical-models)
- [Contributing](#contributing)
- [Author](#author)

---

## Overview

**QuantTrade Pro** is a full-stack, mobile-responsive financial projection platform that combines advanced quantitative mathematical models with the analytical power of Google Gemini AI. It enables traders, analysts, and researchers to generate multi-model financial projections, filter market noise using signal processing techniques, and track global trade activity — all from a single unified interface.

The platform is designed for both web and mobile use, supports geolocation for region-aware market data, and integrates Google Maps for visualising global trade flows.

---

## Features

### 🤖 AI-Powered Analysis
- **Google Gemini AI** integration for natural-language financial analysis and market commentary
- AI-generated narratives complement quantitative model outputs in a unified results view
- Structured prompt engineering ensures consistent, context-aware financial insights

### 📊 Quantitative Financial Models
- **Monte Carlo Simulation** — runs thousands of randomised price-path scenarios to model outcome probability distributions and assess risk across a range of future states
- **Fuzzy Logic Projections** — applies fuzzy inference rules to handle imprecise, real-world financial indicators and generate nuanced trend forecasts where hard thresholds fall short
- **Fourier Signal Filtering** — decomposes market price series into frequency components using Fourier transform techniques, separating meaningful trends from high-frequency noise

### 🌍 Global Trade Tracking
- Track and visualise international trade flows across markets and geographies
- **Google Maps Platform** integration for geographic visualisation of trade activity
- **Geolocation support** for region-aware market context and local market data

### 📈 Interactive Data Visualisation
- **Recharts** dashboards displaying projection outputs, probability distributions, and trend lines
- Animated transitions powered by the **Motion** library for smooth, responsive chart updates
- Mobile-optimised chart layouts for on-the-go analysis

### 💾 Data Persistence
- **SQLite** (via `better-sqlite3`) for local persistence of projection history, saved analyses, and session data
- Date-range filtering with **date-fns** for historical data queries

### 🎨 Modern, Responsive UI
- **Tailwind CSS v4** with utility-first responsive design — works seamlessly on mobile and desktop
- **lucide-react** icons throughout for a clean, consistent visual language
- **react-markdown** for rendering AI-generated analysis with full markdown formatting
- `clsx` + `tailwind-merge` for dynamic, conflict-free class composition

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript (strict), Vite 6 |
| **Styling** | Tailwind CSS v4, Motion (animations) |
| **AI / LLM** | Google Gemini AI (`@google/genai`) |
| **Math Engine** | mathjs — Monte Carlo, Fuzzy Logic, Fourier |
| **Charts** | Recharts |
| **Backend** | Express.js (Node.js) |
| **Database** | SQLite via `better-sqlite3` |
| **Maps** | Google Maps Platform |
| **Utilities** | date-fns, lucide-react, react-markdown, clsx, tailwind-merge |
| **Tooling** | tsx, TypeScript 5.8, ESLint, `tsc --noEmit` |

---

## Architecture

```
QuantTrade Pro
│
├── Frontend (React 19 SPA)
│   ├── Financial projection UI
│   ├── Monte Carlo / Fuzzy Logic / Fourier result views
│   ├── Interactive Recharts dashboards
│   ├── Global trade map (Google Maps Platform)
│   └── AI analysis panel (Google Gemini responses)
│
├── Backend (Express.js — server.ts)
│   ├── Vite dev middleware (development mode — HMR)
│   ├── Static SPA serving (production mode)
│   └── JSON body parsing & API routing
│
├── Data Layer
│   └── SQLite (better-sqlite3) — projection history & sessions
│
└── External APIs
    ├── Google Gemini AI  — GEMINI_API_KEY
    └── Google Maps Platform — GOOGLE_MAPS_PLATFORM_KEY
```

**Dev vs Production:** The Express server runs in two modes — in development it proxies to Vite's HMR dev server; in production it serves the pre-built `dist/` folder as a static SPA with a catch-all route for client-side routing.

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- A **Google Gemini API key** — get one free at [aistudio.google.com](https://aistudio.google.com)
- *(Optional)* A **Google Maps Platform API key** for the global trade map feature

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/BhargavA09/QuantTrade.git
cd QuantTrade

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Then edit .env and add your API keys (see below)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
# Required — Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Optional — Google Maps Platform (enables global trade map)
GOOGLE_MAPS_PLATFORM_KEY=your_google_maps_key_here
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`. Use `.env.example` as the template — it contains no real credentials.

---

## Usage

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR at `localhost:3000` |
| `npm run build` | Build optimised production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run TypeScript type-check (`tsc --noEmit`) |
| `npm start` | Start Express server (production mode) |

### Workflow

1. **Enter a financial instrument or market** — stock ticker, commodity, index, or currency pair
2. **Choose your projection model(s)** — Monte Carlo, Fuzzy Logic, Fourier, or run all three
3. **View quantitative results** — probability distributions, trend projections, and filtered signal charts rendered in Recharts
4. **Read the AI analysis** — Google Gemini provides a natural-language summary contextualising the model outputs
5. **Explore global trade context** — switch to the map view to see related trade flows and geographic market exposure
6. **Save your analysis** — projections are persisted to the local SQLite database for future reference

---

## Project Structure

```
QuantTrade/
├── src/                    # React + TypeScript application source
│   └── main.tsx            # App entry point
├── server.ts               # Express.js backend server
├── index.html              # HTML shell (SPA root)
├── vite.config.ts          # Vite config — React, Tailwind, env vars, aliases
├── tsconfig.json           # TypeScript strict-mode configuration
├── package.json            # Dependencies and npm scripts
├── metadata.json           # App metadata (name, description, permissions)
├── .env.example            # Environment variable template (no real keys)
├── .gitignore              # Excludes .env, dist/, node_modules/
└── test_py.js              # Utility test script
```

---

## Mathematical Models

### Monte Carlo Simulation
Generates thousands of randomised price-path scenarios by sampling from a probability distribution (typically log-normal for returns). The aggregated outcomes form a probability distribution of future prices, enabling confidence interval estimation and risk quantification.

### Fuzzy Logic Projections
Uses fuzzy membership functions to classify market indicators (e.g. momentum, volatility, volume) into linguistic variables (Low / Medium / High) and applies fuzzy inference rules to generate soft, graduated predictions — particularly useful when market signals are ambiguous or overlapping.

### Fourier Signal Filtering
Applies a Discrete Fourier Transform (DFT) to decompose a historical price series into constituent frequency components. High-frequency components (short-term noise) are attenuated, and an inverse transform reconstructs a smoothed trend signal — revealing the underlying direction beneath market volatility.

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request
```

Please ensure `npm run lint` passes before submitting a PR.

---

## Author

**Bhargav Patel**
- GitHub: [@BhargavA09](https://github.com/BhargavA09)
- LinkedIn: [linkedin.com/in/bhrgavpatel](https://www.linkedin.com/in/bhrgavpatel)
- Email: bhrgavpatel04@gmail.com

---

*Built with React 19, Google Gemini AI, and advanced quantitative financial modelling.*
