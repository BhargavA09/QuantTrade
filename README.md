# QuantTrade

> AI-powered financial projection platform — combining quantitative models with Google Gemini LLM analysis to generate market forecasts in natural language.

[![TypeScript](https://img.shields.io/badge/TypeScript-99%25-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

---

## Overview

**QuantTrade** is a full-stack financial projection web application that blends real-time quantitative financial modeling with LLM-powered narrative analysis. Users can input financial parameters and receive both interactive chart projections and AI-generated market insights from Google Gemini — all in a single, unified view.

The entire codebase is written in **TypeScript (99%+)** and runs on a unified Express + Vite server, serving the React SPA in both development and production modes.

---

## Features

- **AI-Powered Analysis** — Integrates Google Gemini (`@google/genai`) to generate natural-language financial narratives alongside quantitative outputs
- **Quantitative Financial Models** — Uses `mathjs` for projection calculations including trend analysis and forecasting
- **Interactive Dashboards** — Recharts-powered charts with smooth animations via the Motion library
- **Projection History** — SQLite persistence layer (`better-sqlite3`) stores and retrieves past projections and session data
- **Secure Configuration** — All API keys managed exclusively via `.env`; no hardcoded credentials anywhere in the codebase
- **Responsive UI** — Mobile-first layout with Tailwind CSS v4, `lucide-react` icons, and `react-markdown` for rendered AI output
- **Strict TypeScript** — `tsc --noEmit` linting enforced across the full codebase; strict mode enabled

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v4 |
| Build Tool | Vite 6 with `@vitejs/plugin-react` |
| Backend | Express 4, Node.js, TypeScript (tsx) |
| AI Integration | Google Gemini (`@google/genai`) |
| Database | SQLite via `better-sqlite3` |
| Charts | Recharts 3 |
| Animation | Motion 12 |
| Utilities | mathjs, date-fns, react-markdown, lucide-react |

---

## Project Structure

```
QuantTrade/
├── src/                    # React frontend (TypeScript)
├── server.ts               # Express server (dev: Vite middleware, prod: static SPA)
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config (strict mode)
├── index.html              # SPA entry point
├── .env.example            # Environment variable template
├── package.json            # Scripts and dependencies
└── metadata.json           # App metadata
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A [Google AI Studio](https://aistudio.google.com/) API key for Gemini

### Installation

```bash
# Clone the repository
git clone https://github.com/BhargavA09/QuantTrade.git
cd QuantTrade

# Install dependencies
npm install
```

### Configuration

Copy the environment template and add your API key:

```bash
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

### Running in Development

```bash
npm run dev
```

Starts the Express server with Vite middleware at `http://localhost:3000`. Hot Module Replacement (HMR) is active.

### Building for Production

```bash
npm run build
```

Outputs the compiled SPA to `dist/`. The Express server will serve static files from this folder in production mode.

### Running in Production

```bash
npm start
```

### Linting

```bash
npm run lint
```

Runs `tsc --noEmit` to type-check the entire codebase without emitting files.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Vite HMR |
| `npm run build` | Build production SPA to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | TypeScript type-check (no emit) |
| `npm run clean` | Remove the `dist/` directory |
| `npm start` | Start production Express server |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API key for AI analysis |
| `APP_URL` | Optional | Deployed app URL (used for self-referential links) |

---

## Architecture Notes

The server (`server.ts`) acts as a unified host for both environments:

- **Development**: Vite runs as middleware inside Express, enabling HMR and fast refresh.
- **Production**: Express serves the compiled static `dist/` folder and falls back to `index.html` for all routes (SPA routing support).

All Gemini API calls are made directly from the frontend using environment variables injected at build time — keeping the server layer lightweight.

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

Please ensure your code passes TypeScript linting before submitting:

```bash
npm run lint
```

---

## License

This project is licensed under the **MIT License**.

---

## Author

**Bhargav Patel**
- GitHub: [@BhargavA09](https://github.com/BhargavA09)
- LinkedIn: [linkedin.com/in/bhrgavpatel](https://linkedin.com/in/bhrgavpatel)

---

*Built with TypeScript, React 19, Google Gemini AI, and Express.js*
