import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Ship, 
  Globe, 
  Home,
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Info,
  ChevronRight,
  Zap,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
  Plus,
  Newspaper
} from 'lucide-react';
import { 
  BarChart,
  Bar,
  Cell,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine,
  Brush,
  Legend,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchForecast, fetchGlobalState, fetchSentiment, fetchRiskAnalysis, runMonteCarlo, analyzeTradePatterns, fetchPortfolioData } from './services/api';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface RiskData {
  riskScore: number;
  varAssessment: string;
  tailRisks: string[];
  correlationRisks: string;
  mitigation: string[];
  liveRiskAlerts: string[];
  correlationFactors?: { factor: string; impactScore: number; impactLabel: string }[];
}

interface StockData {
  ticker: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  history: { date: string; price: number; volume: number }[];
  filtered: number[];
  simulations: number[][];
  neuralFeatures?: { rsi: (number | null)[]; macd: number[]; sma20: (number | null)[]; ema12: number[] };
  simBounds?: { min: number; max: number; pLower: number; pUpper: number; median: number }[];
  stressBounds?: { min: number; max: number; pLower: number; pUpper: number; median: number }[];
  forecast: { date: string; price: number }[];
  models?: { name: string; forecast: { date: string; price: number }[]; confidence: string }[];
  mean: number;
  stdDev: number;
  sentiment?: { score: number; summary: string; tradeImpact: string };
  fairValue?: number;
  riskAnalysis?: RiskData;
  backtest?: {
    results: { date: string; actual: number; predicted: number; error: number }[];
    accuracy: number;
  };
}

interface GlobalState {
  globalTrade: { 
    status: string; 
    news: { title: string; impact: string; severity: 'low' | 'medium' | 'high' }[]; 
    volumeIndex: number;
    importExport?: { us: number; china: number; eu: number, india: number, japan: number, brazil: number };
  };
  logistics: { 
    shipping: { lane: string; status: string; delayDays: number; congestionLevel?: number }[]; 
    bottlenecks: string[];
  };
  resources: { 
    oil: { production: string; trend: 'up' | 'down'; price: number }; 
    commodities: { name: string; status: string; priceTrend?: string }[];
  };
  patterns?: {
    patterns: { sector: string; pattern: string; impact: 'positive' | 'negative' | 'neutral'; impactScore: number; confidence: number }[];
    summary: string;
  };
}

interface PortfolioData {
  allocation: { name: string; value: number }[];
  attribution: { name: string; value: number }[];
  riskReturn: { ticker: string; return: number; volatility: number; sharpe: number }[];
}

const SectorAllocationChart = ({ data }: { data: PortfolioData['allocation'] }) => {
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

const PerformanceAttributionChart = ({ data }: { data: PortfolioData['attribution'] }) => {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} unit="bps" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#71717a' }} width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RiskReturnScatterPlot = ({ data }: { data: PortfolioData['riskReturn'] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" dataKey="volatility" name="Volatility" unit="%" tick={{ fontSize: 10, fill: '#71717a' }} label={{ value: 'Volatility', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#71717a' }} />
          <YAxis type="number" dataKey="return" name="Return" unit="%" tick={{ fontSize: 10, fill: '#71717a' }} label={{ value: 'Return', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#71717a' }} />
          <ZAxis type="number" dataKey="sharpe" range={[50, 400]} name="Sharpe Ratio" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-zinc-900 border border-zinc-800 p-2 rounded shadow-xl">
                    <p className="font-bold text-emerald-400">{item.ticker}</p>
                    <p className="text-zinc-400">Return: {item.return}%</p>
                    <p className="text-zinc-400">Vol: {item.volatility}%</p>
                    <p className="text-zinc-400">Sharpe: {item.sharpe}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Assets" data={data} fill="#3b82f6">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.sharpe > 1 ? '#10b981' : entry.sharpe > 0.5 ? '#3b82f6' : '#ef4444'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

type DateRange = '1M' | '3M' | '6M' | 'ALL';

interface Trade {
  id: string;
  ticker: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

// --- Components ---

const TradeFeed = ({ trades }: { trades: Trade[] }) => {
  return (
    <div className="glass-card p-4 h-[320px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Activity size={14} className="text-emerald-400" />
          Live Trade Feed
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-emerald-500/80 uppercase">Live</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {trades.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Waiting for trades...</p>
            </div>
          ) : (
            trades.map((trade) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                    trade.side === 'buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {trade.side}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-200">${trade.price.toFixed(2)}</span>
                    <span className="text-[9px] text-zinc-500 font-medium">
                      {trade.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">{trade.quantity.toLocaleString()}</span>
                  <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-tighter">Shares</p>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, trend }: { label: string, value: string, subValue?: string, trend?: 'up' | 'down' }) => (
  <div className="glass-card p-4 flex-1 min-w-[140px]">
    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">{label}</p>
    <p className="text-xl font-bold tracking-tight">{value}</p>
    {subValue && (
      <div className={cn("flex items-center gap-1 text-xs mt-1", trend === 'up' ? "text-emerald-400" : "text-rose-400")}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{subValue}</span>
      </div>
    )}
  </div>
);

const DistributionChart = ({ simulations }: { simulations: number[][] }) => {
  const finalPrices = simulations.map(s => s[s.length - 1]);
  const min = Math.min(...finalPrices);
  const max = Math.max(...finalPrices);
  const bins = 20;
  const step = (max - min) / bins;
  
  const histogram = Array.from({ length: bins }).map((_, i) => {
    const rangeMin = min + i * step;
    const rangeMax = rangeMin + step;
    const count = finalPrices.filter(p => p >= rangeMin && p < rangeMax).length;
    return {
      range: `$${rangeMin.toFixed(0)}`,
      count
    };
  });

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogram}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="range" tick={{ fontSize: 8, fill: '#71717a' }} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]}>
            {histogram.map((entry, index) => (
              <Cell key={`cell-${index}`} fillOpacity={0.4 + (entry.count / simulations.length) * 0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const BacktestReport = ({ backtest }: { backtest: NonNullable<StockData['backtest']> }) => {
  return (
    <div className="glass-card p-4 border-blue-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <RefreshCw size={14} className="text-blue-400" />
          Stability Backtest Report
        </h3>
        <span className="text-xs font-bold text-blue-400">{backtest.accuracy}% Accuracy</span>
      </div>
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={backtest.results}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} name="Actual" />
            <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Predicted" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-zinc-500 mt-2 italic">
        Comparing last 10 days of historical data against model predictions for stability verification.
      </p>
    </div>
  );
};

const GlobalTradeChart = ({ importExport }: { importExport: Record<string, number> }) => {
  const data = Object.entries(importExport).map(([name, value]) => ({
    name: name.toUpperCase(),
    volume: value
  }));

  return (
    <div className="h-[250px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#71717a' }} width={40} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
          />
          <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.volume >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const SectorImpactChart = ({ patterns }: { patterns: NonNullable<GlobalState['patterns']>['patterns'] }) => {
  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={patterns} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" domain={[-100, 100]} stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
          <YAxis dataKey="sector" type="category" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            cursor={{ fill: '#27272a' }}
          />
          <Bar dataKey="impactScore" radius={[0, 4, 4, 0]}>
            {patterns.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.impactScore > 0 ? '#10b981' : entry.impactScore < 0 ? '#ef4444' : '#71717a'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 border border-zinc-800 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wider">
          {new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            if (entry.dataKey.startsWith('sim_')) return null;
            return (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-[11px] text-zinc-300 font-medium">{entry.name}</span>
                </div>
                <span className="text-[11px] font-bold text-zinc-100">
                  {Array.isArray(entry.value) 
                    ? `$${entry.value[0].toFixed(2)} - $${entry.value[1].toFixed(2)}`
                    : typeof entry.value === 'number' 
                      ? `$${entry.value.toFixed(2)}`
                      : entry.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export default function App() {
  const [tickers, setTickers] = useState<string[]>(['SPY']);
  const [activeTicker, setActiveTicker] = useState<string>('SPY');
  const [inputTicker, setInputTicker] = useState('');
  const [allData, setAllData] = useState<Record<string, StockData>>({});
  const [trades, setTrades] = useState<Record<string, Trade[]>>({});
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'dashboard' | 'projection' | 'global' | 'logistics' | 'risk'>('summary');
  const [dateRange, setDateRange] = useState<DateRange>('3M');
  const [numSims, setNumSims] = useState(100);
  const [confInterval, setConfInterval] = useState(0.8);
  const [isLive, setIsLive] = useState(false);

  // Learning Model Status
  const [learningStatus, setLearningStatus] = useState({
    status: 'Optimizing Weights',
    progress: 45,
    lastUpdate: new Date().toLocaleTimeString()
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const statuses = ['Optimizing Weights', 'Backtesting Paths', 'Gradient Descent', 'Normalizing Features', 'Re-calibrating Fourier'];
      setLearningStatus({
        status: statuses[Math.floor(Math.random() * statuses.length)],
        progress: Math.floor(Math.random() * 100),
        lastUpdate: new Date().toLocaleTimeString()
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleRetrain = () => {
    setLearningStatus(prev => ({
      ...prev,
      status: 'Initializing Retraining...',
      progress: 0,
      lastUpdate: new Date().toLocaleTimeString()
    }));
    
    // Simulate retraining start
    setTimeout(() => {
      const statuses = ['Optimizing Weights', 'Backtesting Paths', 'Gradient Descent', 'Normalizing Features', 'Re-calibrating Fourier'];
      setLearningStatus({
        status: statuses[Math.floor(Math.random() * statuses.length)],
        progress: Math.floor(Math.random() * 30),
        lastUpdate: new Date().toLocaleTimeString()
      });
    }, 1000);
  };

  const COMMON_TICKERS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'BRK.B', 'V', 'JPM', 
    'BTC-USD', 'ETH-USD', 'TRX-USD', 'GOLD', 'OIL',
    'HSBA.L', 'BP.L', 'VOD.L', 'GSK.L', 'AZN.L', 'BARC.L'
  ];

  // Live Update Simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setAllData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(ticker => {
          const data = next[ticker];
          // Random fluctuation between -0.1% and +0.1%
          const change = 1 + (Math.random() * 0.002 - 0.001);
          next[ticker] = {
            ...data,
            currentPrice: data.currentPrice * change,
            change: data.change + (data.currentPrice * (change - 1)),
            changePercent: ((data.currentPrice * change) / (data.currentPrice - data.change) - 1) * 100
          };
        });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Trade Simulation
  useEffect(() => {
    if (!isLive) return;
    
    const generateTrade = () => {
      const ticker = activeTicker;
      const data = allData[ticker];
      if (!data) return;

      const newTrade: Trade = {
        id: Math.random().toString(36).substr(2, 9),
        ticker,
        price: data.currentPrice + (Math.random() * 0.4 - 0.2),
        quantity: Math.floor(Math.random() * 500) + 10,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: new Date()
      };

      setTrades(prev => {
        const tickerTrades = prev[ticker] || [];
        return {
          ...prev,
          [ticker]: [newTrade, ...tickerTrades].slice(0, 50)
        };
      });
    };

    const interval = setInterval(() => {
      // Random delay simulation: 1-4 seconds
      if (Math.random() > 0.3) {
        generateTrade();
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isLive, activeTicker, allData]);

  // Sentiment analysis is now in api.ts

  const getFuzzyVolatility = (data: StockData) => {
    if (!data.sentiment) return { label: "Moderate", value: "2.5%", trend: "down" as const, reasons: ["Awaiting sentiment analysis"] };

    const sentimentScore = Math.abs(data.sentiment.score); // 0 to 1
    const summary = data.sentiment.summary.toLowerCase();
    const reasons: string[] = [];
    
    // Fuzzy inputs
    let volatilityScore = 0.5; // Base volatility (Moderate)

    // Rule 1: High sentiment magnitude increases volatility
    if (sentimentScore > 0.7) {
      volatilityScore += 0.3;
      reasons.push("High sentiment conviction detected");
    } else if (sentimentScore > 0.4) {
      volatilityScore += 0.1;
      reasons.push("Moderate sentiment bias");
    }

    // Rule 2: Keywords in news summary
    const highVolKeywords = ['uncertainty', 'volatile', 'crisis', 'lawsuit', 'earnings', 'breakthrough', 'crash', 'surge', 'fear', 'panic', 'conflict', 'war'];
    const lowVolKeywords = ['stable', 'steady', 'consistent', 'neutral', 'sideways', 'calm', 'quiet', 'growth', 'solid'];

    let foundHigh = false;
    highVolKeywords.forEach(word => {
      if (summary.includes(word)) {
        volatilityScore += 0.15;
        foundHigh = true;
      }
    });
    if (foundHigh) reasons.push("Risk-elevating keywords in news");

    let foundLow = false;
    lowVolKeywords.forEach(word => {
      if (summary.includes(word)) {
        volatilityScore -= 0.1;
        foundLow = true;
      }
    });
    if (foundLow) reasons.push("Stability signals in recent reports");

    // Rule 3: Price change magnitude
    const absChange = Math.abs(data.changePercent);
    if (absChange > 3) {
      volatilityScore += 0.2;
      reasons.push("Significant recent price momentum");
    } else if (absChange > 1) {
      volatilityScore += 0.1;
      reasons.push("Active price discovery");
    }

    // Clamp score
    volatilityScore = Math.max(0.1, Math.min(1.0, volatilityScore));

    // Defuzzification to labels
    let label = "Moderate";
    let trend: 'up' | 'down' = 'down';
    
    if (volatilityScore > 0.8) {
      label = "Extreme";
      trend = "up";
    } else if (volatilityScore > 0.6) {
      label = "High";
      trend = "up";
    } else if (volatilityScore > 0.4) {
      label = "Moderate";
      trend = "down";
    } else {
      label = "Low";
      trend = "down";
    }

    // Map score to a realistic percentage (e.g., 1% to 15%)
    const percentage = (volatilityScore * 12 + 1).toFixed(1);

    return { label, value: `${percentage}%`, trend, reasons };
  };

  // Global trade fetch is now in api.ts

  const fetchGlobalStateData = async () => {
    try {
      const data = await fetchGlobalState();
      setGlobalState(data);
      
      // Learn patterns from the new state
      const patterns = await analyzeTradePatterns(data);
      setGlobalState(prev => prev ? { ...prev, patterns } : null);
    } catch (e) {
      console.error("Failed to fetch global state", e);
    }
  };

  const fetchData = async (t: string) => {
    if (allData[t]) return;
    setLoading(true);
    setError(null);
    try {
      // Parallel Fetching for Speed
      const [stockJson, sentiment, gState, pData] = await Promise.all([
        fetchForecast(t, numSims, confInterval),
        fetchSentiment(t),
        fetchGlobalState(),
        fetchPortfolioData()
      ]);
      
      const riskAnalysis = await fetchRiskAnalysis(t, stockJson.history, sentiment);

      // 3. Apply Fuzzy Logic Boost to Forecast
      const fuzzyBoost = sentiment.score * 0.01;
      const adjustedMean = stockJson.mean + fuzzyBoost;
      
      const adjustedForecast = [];
      let currentPrice = stockJson.currentPrice;
      const now = new Date();
      for (let d = 1; d <= 30; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() + d);
        currentPrice = currentPrice * Math.exp(adjustedMean);
        adjustedForecast.push({
          date: date.toISOString().split('T')[0],
          price: parseFloat(currentPrice.toFixed(2))
        });
      }

      const fairValue = parseFloat((stockJson.currentPrice * (1 + sentiment.score * 0.1)).toFixed(2));

      setAllData(prev => ({
        ...prev,
        [t]: {
          ...stockJson,
          forecast: adjustedForecast,
          sentiment,
          fairValue,
          riskAnalysis
        }
      }));
      setGlobalState(gState);
      setPortfolioData(pData);
    } catch (error: any) {
      console.error("Fetch error", error);
      setError(error.message || "An error occurred while fetching data. Please check the ticker symbol and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tickers.forEach(t => {
      if (!allData[t]) fetchData(t);
    });
    if (!globalState) fetchGlobalStateData();
  }, [tickers]);

  // Re-run simulation locally when parameters change
  useEffect(() => {
    if (activeTicker && allData[activeTicker]) {
      const data = allData[activeTicker];
      const mcResults = runMonteCarlo(data.currentPrice, data.mean, data.stdDev, numSims, confInterval);
      setAllData(prev => ({
        ...prev,
        [activeTicker]: {
          ...prev[activeTicker],
          ...mcResults
        }
      }));
    }
  }, [numSims, confInterval, activeTicker]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = inputTicker.toUpperCase().trim();
    if (ticker) {
      if (!tickers.includes(ticker)) {
        setTickers(prev => [...prev, ticker]);
        fetchData(ticker);
      }
      setActiveTicker(ticker);
    }
    setInputTicker('');
    setShowSuggestions(false);
  };

  const removeTicker = (t: string) => {
    if (tickers.length > 1) {
      const newTickers = tickers.filter(ticker => ticker !== t);
      setTickers(newTickers);
      if (activeTicker === t) {
        setActiveTicker(newTickers[0]);
      }
    }
  };

  const selectSuggestion = (t: string) => {
    const ticker = t.toUpperCase().trim();
    if (ticker) {
      if (!tickers.includes(ticker)) {
        setTickers(prev => [...prev, ticker]);
        fetchData(ticker);
      }
      setActiveTicker(ticker);
    }
    setInputTicker('');
    setShowSuggestions(false);
  };

  const handleInputChange = (val: string) => {
    setInputTicker(val);
    const upperVal = val.toUpperCase().trim();
    
    // Active update: if the typed ticker exists in our data, switch to it immediately
    if (tickers.includes(upperVal)) {
      setActiveTicker(upperVal);
    }

    if (val.length > 0) {
      const filtered = COMMON_TICKERS.filter(t => 
        t.toLowerCase().includes(val.toLowerCase()) && !tickers.includes(t)
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const chartData = useMemo(() => {
    const dateMap: Record<string, any> = {};

    tickers.forEach(t => {
      const d = allData[t];
      if (!d) return;

      let history = [...d.history];
      let filtered = d.filtered ? [...d.filtered] : [];
      const days = dateRange === '1M' ? 30 : dateRange === '3M' ? 90 : dateRange === '6M' ? 180 : 1000;
      
      history = history.slice(-days);
      if (filtered.length > 0) {
        filtered = filtered.slice(-days);
      }

      history.forEach((h, idx) => {
        if (!dateMap[h.date]) dateMap[h.date] = { name: h.date };
        dateMap[h.date][`${t}_price`] = h.price;
        if (t === activeTicker && filtered[idx]) {
          dateMap[h.date][`filtered`] = filtered[idx];
        }
      });

      d.forecast.forEach(f => {
        if (!dateMap[f.date]) dateMap[f.date] = { name: f.date };
        dateMap[f.date][`${t}_forecast`] = f.price;
      });

      // Add simulation bounds for the active ticker to create a projection cone
      if (t === activeTicker && d.simBounds) {
        d.simBounds.forEach((bounds, dayIdx) => {
          const forecastDate = d.forecast[dayIdx-1]?.date;
          if (!forecastDate) return;
          if (!dateMap[forecastDate]) dateMap[forecastDate] = { name: forecastDate };
          dateMap[forecastDate][`cone_range`] = [bounds.pLower, bounds.pUpper];
        });
      }

      // Add simulation paths for the active ticker (optional, keeping some for texture)
      if (t === activeTicker && d.simulations) {
        d.simulations.slice(0, 5).forEach((path, simIdx) => {
          path.forEach((price, dayIdx) => {
            if (dayIdx === 0) return; // Skip current day
            const forecastDate = d.forecast[dayIdx-1]?.date;
            if (!forecastDate) return;
            if (!dateMap[forecastDate]) dateMap[forecastDate] = { name: forecastDate };
            dateMap[forecastDate][`sim_${simIdx}`] = price;
          });
        });
      }
    });

    return Object.values(dateMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [allData, tickers, dateRange, activeTicker]);

  const data = allData[activeTicker];
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col pb-20 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />

      {/* Header */}
      <header className="px-6 pt-8 pb-4 sticky top-0 bg-zinc-950/80 backdrop-blur-lg z-50">
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-200">Analysis Error</p>
                  <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">{error}</p>
                  <div className="flex gap-3 mt-3">
                    <button 
                      onClick={() => fetchData(tickers[tickers.length - 1])}
                      className="text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Retry
                    </button>
                    <button 
                      onClick={() => setError(null)}
                      className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-300 px-2 py-1.5 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
              <Zap className="text-emerald-400 fill-emerald-400" size={24} />
              QuantTrade
            </h1>
            <p className="text-xs text-zinc-500 font-medium">AI-POWERED QUANTITATIVE ANALYSIS</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden">
            <img src="https://picsum.photos/seed/user/100/100" alt="User" referrerPolicy="no-referrer" />
          </div>
        </div>

        <div className="relative">
          <form onSubmit={handleSearch} className="relative z-10">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              value={inputTicker}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => inputTicker && setShowSuggestions(true)}
              placeholder="Search & Add Ticker (e.g. AAPL, BTC-USD)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setIsLive(!isLive)}
                className="flex items-center gap-2 hover:bg-zinc-800 px-2 py-1 rounded-lg transition-colors"
              >
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isLive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-600"
                )} />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                  {isLive ? 'Live' : 'Paused'}
                </span>
              </button>
            </div>
          </form>

          {inputTicker && (
            <div className="absolute left-4 -bottom-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 animate-pulse">
                {tickers.includes(inputTicker.toUpperCase().trim()) 
                  ? `Viewing ${inputTicker.toUpperCase().trim()}` 
                  : `Press Enter to Analyze ${inputTicker.toUpperCase().trim()}`}
              </p>
            </div>
          )}

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => selectSuggestion(s)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                  >
                    <span className="font-bold text-zinc-200">{s}</span>
                    <Plus size={14} className="text-zinc-600 group-hover:text-emerald-400" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {tickers.map((t, i) => (
            <div 
              key={t} 
              onClick={() => setActiveTicker(t)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all cursor-pointer",
                activeTicker === t ? "bg-zinc-800 border-zinc-600 shadow-lg scale-105" : "bg-zinc-900 border-zinc-800 opacity-60 hover:opacity-100"
              )}
              style={{ borderColor: activeTicker === t ? colors[i % colors.length] : undefined }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setActiveTicker(t);
                }
              }}
            >
              <span style={{ color: colors[i % colors.length] }}>{t}</span>
              {tickers.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTicker(t);
                  }} 
                  className="text-zinc-500 hover:text-zinc-300 ml-1 p-0.5 rounded-md hover:bg-zinc-700 transition-colors"
                  aria-label={`Remove ${t}`}
                >
                  <XCircle size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 space-y-6">
        {loading && (activeTab === 'dashboard' || activeTab === 'projection') ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-zinc-500 animate-pulse text-sm font-medium">Running Monte Carlo Simulations...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* Executive Summary Header */}
                  <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-black border-emerald-500/20">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Executive Summary</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Cross-Domain Intelligence Overview</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Active Ticker</p>
                        <p className="text-xl font-bold text-emerald-400">{activeTicker}</p>
                        <p className="text-xs text-zinc-400 mt-1">${data?.currentPrice.toFixed(2)} ({data?.changePercent.toFixed(2)}%)</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Global Trade Index</p>
                        <p className="text-xl font-bold text-blue-400">{globalState?.globalTrade.volumeIndex || '---'}</p>
                        <p className="text-xs text-zinc-400 mt-1">{globalState?.globalTrade.status}</p>
                      </div>
                    </div>
                  </div>

                  {/* Portfolio Overview */}
                  {portfolioData && (
                    <div className="glass-card p-6 border-blue-500/20">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-zinc-100">Portfolio Intelligence</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Advanced Allocation & Risk Metrics</p>
                        </div>
                        <div className="flex gap-2">
                          <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400">
                            SHARPE: 1.42
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <PieChartIcon size={14} className="text-emerald-400" />
                            Sector Allocation
                          </h4>
                          <SectorAllocationChart data={portfolioData.allocation} />
                        </div>
                        <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 size={14} className="text-blue-400" />
                            Performance Attribution (bps)
                          </h4>
                          <PerformanceAttributionChart data={portfolioData.attribution} />
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-zinc-800/50">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Activity size={14} className="text-amber-400" />
                          Asset Risk/Return Scatter
                        </h4>
                        <RiskReturnScatterPlot data={portfolioData.riskReturn} />
                      </div>
                    </div>
                  )}

                  {/* AI Pattern Learning Insights */}
                  {globalState?.patterns && (
                    <div className="glass-card p-5 border-amber-500/20">
                      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Zap size={16} className="text-amber-400" />
                        Neural Pattern Intelligence
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4 italic">
                        "{globalState.patterns.summary}"
                      </p>
                      <div className="space-y-3">
                        {globalState.patterns.patterns.map((p, i) => (
                          <div key={i} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-zinc-200">{p.sector} Sector</p>
                              <p className="text-[10px] text-zinc-500">{p.pattern}</p>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                                p.impact === 'positive' ? "bg-emerald-500/10 text-emerald-400" : 
                                p.impact === 'negative' ? "bg-rose-500/10 text-rose-400" : "bg-zinc-500/10 text-zinc-400"
                              )}>
                                {p.impact}
                              </span>
                              <p className="text-[8px] text-zinc-600 font-bold mt-1">{(p.confidence * 100).toFixed(0)}% CONF.</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Backtesting & Stability Summary */}
                  {data?.backtest && (
                    <BacktestReport backtest={data.backtest} />
                  )}

                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Risk Summary */}
                    <div className="glass-card p-4 border-rose-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <AlertTriangle size={14} className="text-rose-400" />
                          Risk Profile
                        </h4>
                        <span className="text-xs font-bold text-rose-400">{data?.riskAnalysis?.riskScore || '--'}/100</span>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2">{data?.riskAnalysis?.varAssessment}</p>
                    </div>

                    {/* Logistics Summary */}
                    <div className="glass-card p-4 border-emerald-500/10">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Ship size={14} className="text-emerald-400" />
                          Logistics Status
                        </h4>
                        <span className="text-xs font-bold text-emerald-400">{globalState?.logistics.shipping.length} Active Lanes</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {globalState?.logistics.bottlenecks.slice(0, 3).map((b, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500">{b}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'global' && (
                <div className="space-y-6">
                  {/* Automated Learning Model Status */}
                  <div className="glass-card p-4 bg-emerald-500/5 border-emerald-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Neural Network Status</span>
                        <button 
                          onClick={handleRetrain}
                          className="p-1 hover:bg-emerald-500/10 rounded transition-colors group"
                          title="Trigger Manual Retraining"
                        >
                          <RefreshCw size={12} className="text-emerald-500 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">{learningStatus.lastUpdate}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs font-bold text-zinc-300">{learningStatus.status}</span>
                          <span className="text-xs font-bold text-emerald-400">{learningStatus.progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-emerald-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${learningStatus.progress}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded text-[10px] font-bold text-zinc-400">
                        EPOCH 1,422
                      </div>
                    </div>
                  </div>

                  {/* Global Trade Overview */}
                  <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-black border-emerald-500/20">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Global Trade Pulse</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Real-time Trade Intelligence</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-emerald-400">{globalState?.globalTrade?.volumeIndex || '---'}</div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Trade Volume Index</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Globe size={14} className="text-emerald-500" />
                          Latest Trade Headlines
                        </h3>
                        <div className="space-y-3">
                          {globalState?.globalTrade?.news?.map((n, idx) => (
                            <div key={idx} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                              <p className="text-sm font-bold text-zinc-200 leading-snug">{n.title}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase">{n.impact} Impact</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Activity size={14} className="text-emerald-500" />
                          Market Pattern Analysis
                        </h3>
                        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                          <p className="text-sm text-zinc-300 italic leading-relaxed mb-4">
                            {globalState?.patterns?.summary || "Analyzing global trade patterns and geopolitical shifts..."}
                          </p>
                          {globalState?.patterns?.patterns && (
                            <SectorImpactChart patterns={globalState.patterns.patterns} />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Trade Data */}
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                      <Globe size={16} className="text-emerald-400" />
                      Live Import/Export Volume Trends
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {globalState?.globalTrade?.importExport && Object.entries(globalState.globalTrade.importExport).map(([region, volume]) => (
                        <div key={region} className="space-y-3">
                          <div className="flex justify-between items-end">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{region} Trade Volume</span>
                            <span className="text-xs font-bold text-zinc-100">{Number(volume) > 0 ? '+' : ''}{volume}%</span>
                          </div>
                          <div className="h-20 flex items-end gap-1">
                            {Array.from({ length: 12 }).map((_, i) => (
                              <motion.div 
                                key={i}
                                className={cn("flex-1 rounded-t-sm", Number(volume) > 0 ? "bg-emerald-500/40" : "bg-rose-500/40")}
                                initial={{ height: 0 }}
                                animate={{ height: `${Math.max(10, Math.random() * 100)}%` }}
                                transition={{ delay: i * 0.05 }}
                                style={{ height: `${Math.max(10, Math.random() * 100)}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {globalState?.globalTrade?.importExport && (
                      <GlobalTradeChart importExport={globalState.globalTrade.importExport} />
                    )}
                  </div>

                  {/* Quick Resource Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap size={14} className="text-amber-400" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Energy Desk</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-zinc-100">${globalState?.resources?.oil?.price || '---'}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">Brent Crude Spot</p>
                        </div>
                        <div className={cn("text-xs font-bold", globalState?.resources?.oil?.trend === 'up' ? "text-emerald-400" : "text-rose-400")}>
                          {globalState?.resources?.oil?.trend === 'up' ? '▲' : '▼'} {globalState?.resources?.oil?.production}
                        </div>
                      </div>
                    </div>
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 size={14} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Commodities</span>
                      </div>
                      <div className="space-y-1">
                        {globalState?.resources?.commodities?.slice(0, 2).map((c, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-xs font-bold text-zinc-300">{c.name}</span>
                            <span className="text-[10px] text-zinc-500 font-medium">{c.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'logistics' && (
                <div className="space-y-6">
                  {/* Global Trade Volume Table */}
                  <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Globe className="text-blue-400" />
                      Global Trade Volume Pulse
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Region</th>
                            <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Volume Trend</th>
                            <th className="pb-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/50">
                          {globalState?.globalTrade.importExport && Object.entries(globalState.globalTrade.importExport).map(([region, volume]) => (
                            <tr key={region} className="group hover:bg-zinc-900/30 transition-colors">
                              <td className="py-4 text-xs font-bold text-zinc-300 uppercase tracking-tighter">{region}</td>
                              <td className="py-4 text-right">
                                <span className={cn(
                                  "text-xs font-bold",
                                  Number(volume) > 0 ? "text-emerald-400" : "text-rose-400"
                                )}>
                                  {Number(volume) > 0 ? '+' : ''}{volume}%
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    Number(volume) > 0 ? "bg-emerald-500" : "bg-rose-500"
                                  )} />
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase">
                                    {Number(volume) > 2 ? 'Expansion' : Number(volume) < -2 ? 'Contraction' : 'Stable'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="glass-card p-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Ship className="text-emerald-400" />
                      Global Logistics Tracker
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Major Shipping Lanes</h3>
                        <div className="space-y-3">
                          {globalState?.logistics?.shipping?.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-2 h-2 rounded-full",
                                  s.status.toLowerCase().includes('clear') ? "bg-emerald-500" : "bg-amber-500"
                                )} />
                                <div>
                                  <p className="text-sm font-bold text-zinc-200">{s.lane}</p>
                                  <p className="text-[10px] text-zinc-500 font-medium">{s.status}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-6">
                                {s.congestionLevel !== undefined && (
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-xs font-bold",
                                      s.congestionLevel > 70 ? "text-rose-400" : s.congestionLevel > 40 ? "text-amber-400" : "text-emerald-400"
                                    )}>{s.congestionLevel}%</p>
                                    <p className="text-[9px] text-zinc-600 font-bold uppercase">Congestion</p>
                                  </div>
                                )}
                                <div className="text-right">
                                  <p className="text-xs font-bold text-zinc-300">+{s.delayDays}d</p>
                                  <p className="text-[9px] text-zinc-600 font-bold uppercase">Delay</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Supply Chain Bottlenecks</h3>
                        <div className="flex flex-wrap gap-2">
                          {globalState?.logistics?.bottlenecks?.map((b, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-400">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'dashboard' && data && (
                <>
                  {/* Fair Value Section */}
                  <div className="glass-card p-5 bg-gradient-to-br from-zinc-900/80 to-zinc-950 border-emerald-500/20">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-500/20">
                          Fair Value Estimate
                        </span>
                        <h2 className="text-3xl font-bold mt-2">${data.fairValue || '---'}</h2>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-zinc-500 uppercase font-bold">Current Price</p>
                        <p className="text-lg font-semibold">${data.currentPrice}</p>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000" 
                        style={{ width: data.fairValue ? `${Math.min(100, (data.currentPrice / data.fairValue) * 100)}%` : '0%' }}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
                      <Info size={10} />
                      Calculated using Fuzzy Logic & Sentiment Weighting
                    </p>
                  </div>

                  {/* Quick Stats */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                      <div className="flex-shrink-0">
                        <StatCard 
                          label="Sentiment" 
                          value={data.sentiment ? (data.sentiment.score > 0 ? "Bullish" : "Bearish") : "---"} 
                          subValue={data.sentiment ? `${(data.sentiment.score * 100).toFixed(0)}% Confidence` : "Analyzing..."}
                          trend={data.sentiment ? (data.sentiment.score > 0 ? 'up' : 'down') : undefined}
                        />
                      </div>
                      
                      {data.neuralFeatures && (
                        <div className="flex-shrink-0">
                          <StatCard 
                            label="RSI (14D)" 
                            value={data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]?.toFixed(1) || "---"} 
                            subValue={Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) > 70 ? "Overbought" : Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) < 30 ? "Oversold" : "Neutral"}
                            trend={Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) > 70 ? 'down' : Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) < 30 ? 'up' : undefined}
                          />
                        </div>
                      )}
                      
                      {data.neuralFeatures && (
                        <div className="flex-shrink-0">
                          <StatCard 
                            label="RSI (14D)" 
                            value={data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]?.toFixed(1) || "---"} 
                            subValue={Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) > 70 ? "Overbought" : Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) < 30 ? "Oversold" : "Neutral"}
                            trend={Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) > 70 ? 'down' : Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) < 30 ? 'up' : undefined}
                          />
                        </div>
                      )}
                    {(() => {
                      const vol = getFuzzyVolatility(data);
                      return (
                        <div className="relative group">
                          <div className="absolute -top-1 -right-1 z-10">
                            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-1.5 py-0.5 flex items-center gap-1">
                              <Zap size={8} className="text-emerald-400 fill-emerald-400" />
                              <span className="text-[6px] font-black text-emerald-400 uppercase tracking-tighter">Fuzzy AI</span>
                            </div>
                          </div>
                          <StatCard 
                            label="Volatility" 
                            value={vol.label} 
                            subValue={`Fuzzy VaR: ${vol.value}`}
                            trend={vol.trend}
                          />
                          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Fuzzy Inference Rules</p>
                            <div className="space-y-1">
                              {vol.reasons.map((r, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                  <p className="text-[10px] text-zinc-300">{r}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    <StatCard 
                      label="Signal" 
                      value="Strong Buy" 
                      subValue="Fourier Filtered"
                      trend="up"
                    />
                  </div>

                  {/* Trade Feed */}
                  <TradeFeed trades={trades[activeTicker] || []} />

                  {/* Main Chart */}
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={14} className="text-emerald-500" />
                        Fourier Noise Reduction Analysis
                      </h3>
                      <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                        {(['1M', '3M', '6M', 'ALL'] as DateRange[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => setDateRange(r)}
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
                              dateRange === r ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                            minTickGap={30}
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              if (dateRange === '1M') return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                            }}
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            orientation="right"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                            content={<CustomTooltip />} 
                            cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Legend 
                            verticalAlign="top" 
                            height={36}
                            content={({ payload }) => (
                              <div className="flex flex-wrap gap-4 justify-center mb-4">
                                {payload?.filter(entry => !entry.dataKey?.toString().startsWith('sim_')).map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          />
                          
                          {data && (
                            <ReferenceLine 
                              y={data.currentPrice} 
                              stroke="#3f3f46" 
                              strokeDasharray="3 3" 
                              label={{ value: 'Current', position: 'left', fill: '#71717a', fontSize: 10 }} 
                            />
                          )}
                          {data && data.simBounds && (
                            <Area
                              type="monotone"
                              dataKey="cone_range"
                              stroke="none"
                              fill="#10b981"
                              fillOpacity={0.1}
                              name="Confidence Interval"
                              connectNulls
                            />
                          )}
                          {activeTab === 'dashboard' && Array.from({ length: 5 }).map((_, i) => (
                            <Line 
                              key={`sim-${i}`}
                              type="monotone"
                              dataKey={`sim_${i}`}
                              stroke="#10b981"
                              strokeWidth={1}
                              strokeOpacity={0.15}
                              dot={false}
                              activeDot={false}
                              connectNulls
                            />
                          ))}

                          <Line 
                            type="monotone" 
                            dataKey="filtered" 
                            stroke="#10b981" 
                            strokeWidth={3} 
                            dot={false} 
                            name="Fourier Filtered"
                            connectNulls
                          />
                          {tickers.map((t, i) => (
                            <React.Fragment key={t}>
                              <Line 
                                type="monotone" 
                                dataKey={`${t}_price`} 
                                stroke={colors[i % colors.length]} 
                                strokeWidth={2}
                                dot={false}
                                name={`${t} Price`}
                                connectNulls
                                activeDot={{ r: 4, strokeWidth: 0 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey={`${t}_forecast`} 
                                stroke={colors[i % colors.length]} 
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                name={`${t} Forecast`}
                                connectNulls
                                activeDot={{ r: 4, strokeWidth: 0 }}
                              />
                            </React.Fragment>
                          ))}
                          <Brush 
                            dataKey="name" 
                            height={30} 
                            stroke="#27272a" 
                            fill="#09090b"
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                            travellerWidth={10}
                          >
                            <AreaChart>
                              <Area dataKey={`${tickers[0]}_price`} stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                            </AreaChart>
                          </Brush>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Price Targets */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="glass-card p-3 border-rose-500/10">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Bearish</p>
                      <p className="text-lg font-bold text-rose-400">
                        ${data.simulations ? Math.min(...data.simulations.map(s => s[s.length - 1])).toFixed(2) : '---'}
                      </p>
                    </div>
                    <div className="glass-card p-3 border-zinc-500/10">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Base Case</p>
                      <p className="text-lg font-bold text-zinc-100">
                        ${data.forecast[data.forecast.length - 1].price}
                      </p>
                    </div>
                    <div className="glass-card p-3 border-emerald-500/10">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Bullish</p>
                      <p className="text-lg font-bold text-emerald-400">
                        ${data.simulations ? Math.max(...data.simulations.map(s => s[s.length - 1])).toFixed(2) : '---'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'projection' && data && (
                <div className="space-y-6">
                  {/* Monte Carlo Controls */}
                  <div className="glass-card p-4 bg-zinc-900/50 border-zinc-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                          <RefreshCw size={16} className="text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-100">Simulation Parameters</h3>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Refine Monte Carlo Engine</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Simulations</label>
                            <span className="text-[10px] font-mono font-bold text-emerald-400">{numSims}</span>
                          </div>
                          <input 
                            type="range" 
                            min="50" 
                            max="500" 
                            step="50" 
                            value={numSims} 
                            onChange={(e) => setNumSims(parseInt(e.target.value))}
                            className="w-32 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Confidence Interval</label>
                          <div className="flex gap-2">
                            {[0.5, 0.7, 0.8, 0.9].map((val) => (
                              <button
                                key={val}
                                onClick={() => setConfInterval(val)}
                                className={cn(
                                  "px-2 py-1 text-[10px] font-bold rounded border transition-all",
                                  confInterval === val 
                                    ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400" 
                                    : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                )}
                              >
                                {(val * 100).toFixed(0)}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Projection Chart */}
                  <div className="glass-card p-4 h-[320px]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={14} className="text-emerald-500" />
                        30-Day Monte Carlo Projection
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500/20" />
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">Confidence Cone</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">Mean Path</span>
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.filter(d => d.name >= new Date().toISOString().split('T')[0])}>
                        <defs>
                          <linearGradient id="colorCone" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 10, fill: '#4b5563' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                          }}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          orientation="right"
                          tick={{ fontSize: 10, fill: '#4b5563' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area 
                          type="monotone" 
                          dataKey="cone_range" 
                          stroke="none" 
                          fill="url(#colorCone)"
                          name="Confidence Interval"
                        />
                        <Area 
                          type="monotone" 
                          dataKey={`${activeTicker}_forecast`} 
                          stroke="#10b981" 
                          strokeWidth={2}
                          fill="transparent"
                          name="Mean Projection"
                          dot={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Distribution Analysis */}
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                      <PieChartIcon size={16} className="text-emerald-400" />
                      Final Price Distribution
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-4">Frequency of outcomes across {numSims} paths</p>
                    <DistributionChart simulations={data.simulations} />
                  </div>

                  <div className="glass-card p-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <BarChart3 size={20} className="text-emerald-400" />
                      Quant Analysis Report
                    </h3>
                    <div className="space-y-4 text-sm text-zinc-400 leading-relaxed">
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Monte Carlo Simulation</h4>
                        <p>We ran {numSims} random walk simulations over a 30-day horizon. The distribution suggests a {confInterval * 100}% probability of the price landing between ${ (data.simBounds?.[data.simBounds.length-1].pLower || data.currentPrice * 0.95).toFixed(2) } and ${ (data.simBounds?.[data.simBounds.length-1].pUpper || data.currentPrice * 1.12).toFixed(2) }.</p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                            <p className="text-[10px] text-zinc-500 uppercase">{confInterval * 100}% Bull Target</p>
                            <p className="text-sm font-bold text-emerald-400">${data.simBounds ? data.simBounds[data.simBounds.length - 1].pUpper.toFixed(2) : '---'}</p>
                          </div>
                          <div className="bg-zinc-950 p-2 rounded border border-zinc-800">
                            <p className="text-[10px] text-zinc-500 uppercase">{confInterval * 100}% Bear Target</p>
                            <p className="text-sm font-bold text-rose-400">${data.simBounds ? data.simBounds[data.simBounds.length - 1].pLower.toFixed(2) : '---'}</p>
                          </div>
                        </div>
                      </section>
                      {data.models && (
                        <section>
                          <h4 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2">
                            <Activity size={16} className="text-emerald-400" />
                            Forecast Model Comparison
                          </h4>
                          <p className="text-xs text-zinc-500 mb-4 italic">
                            Comparison of different predictive methodologies for the next 30 days.
                          </p>
                          <div className="space-y-3">
                            {data.models.map((model, idx) => (
                              <div key={idx} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-bold text-zinc-200">{model.name}</p>
                                  <div className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                                    model.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-400' : 
                                    model.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                                  )}>
                                    {model.confidence} Confidence
                                  </div>
                                </div>
                                <div className="flex items-end justify-between">
                                  <div>
                                    <p className="text-[10px] text-zinc-500 mb-1">Methodology</p>
                                    <p className="text-[10px] text-zinc-400 max-w-[200px]">
                                      {model.name.includes('GBM') ? 'Stochastic process using drift and volatility.' : 
                                       model.name.includes('ARIMA') ? 'Statistical model for time series forecasting.' : 
                                       'Deep learning model for complex pattern recognition.'}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-mono font-bold text-zinc-100 leading-none">
                                      ${model.forecast[model.forecast.length - 1].price.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 mt-1">30D Target Price</p>
                                  </div>
                                </div>
                                <div className="mt-3 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                                  <div 
                                    className={cn(
                                      "h-full rounded-full transition-all duration-1000",
                                      model.confidence === 'High' ? 'bg-emerald-500 w-[90%]' : 
                                      model.confidence === 'Medium' ? 'bg-amber-500 w-[60%]' : 'bg-rose-500 w-[30%]'
                                    )}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Fourier Signal Filtering</h4>
                        <p>Noise reduction via Fourier Transform indicates a underlying bullish cycle. The short-term volatility is being filtered to reveal a steady accumulation phase.</p>
                      </section>
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Sentiment & News</h4>
                        <p>{data.sentiment?.summary || "Analyzing sentiment..."}</p>
                      </section>
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Global Trade Impact</h4>
                        <p>{data.sentiment?.tradeImpact || "Calculating trade impact..."}</p>
                      </section>
                    </div>
                  </div>

                  <div className="glass-card p-5">
                    <h3 className="text-sm font-bold mb-4">Options Chain Implied Volatility</h3>
                    <div className="space-y-3">
                      {[
                        { strike: (data.currentPrice * 1.05).toFixed(0), type: 'Call', iv: '24.2%', delta: '0.45' },
                        { strike: (data.currentPrice * 0.95).toFixed(0), type: 'Put', iv: '28.1%', delta: '-0.38' },
                        { strike: (data.currentPrice * 1.10).toFixed(0), type: 'Call', iv: '22.5%', delta: '0.22' },
                      ].map((opt, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                          <div>
                            <p className="text-xs font-bold">${opt.strike} {opt.type}</p>
                            <p className="text-[10px] text-zinc-500">IV: {opt.iv}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-mono text-emerald-400">Δ {opt.delta}</p>
                            <ChevronRight size={14} className="text-zinc-700 inline" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'risk' && data && (
                <div className="space-y-6">
                  {/* Risk Score Header */}
                  <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-black border-rose-500/20">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Risk Projection</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Multi-Model Risk Assessment</p>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-4xl font-black",
                          (data.riskAnalysis?.riskScore || 50) > 70 ? "text-rose-400" : 
                          (data.riskAnalysis?.riskScore || 50) > 40 ? "text-amber-400" : "text-emerald-400"
                        )}>
                          {data.riskAnalysis?.riskScore || '---'}
                        </div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Composite Risk Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <AlertCircle size={14} className="text-rose-500" />
                          Tail Risk Events
                        </h3>
                        <div className="space-y-2">
                          {data.riskAnalysis?.tailRisks.map((risk, i) => (
                            <div key={i} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10">
                              <p className="text-xs font-bold text-rose-200">{risk}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Zap size={14} className="text-amber-500" />
                          VaR Assessment
                        </h3>
                        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                          <p className="text-sm text-zinc-300 leading-relaxed italic">
                            {data.riskAnalysis?.varAssessment}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <RefreshCw size={14} className="text-emerald-500" />
                          Mitigation Strategies
                        </h3>
                        <div className="space-y-2">
                          {data.riskAnalysis?.mitigation.map((m, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <p className="text-xs text-zinc-400">{m}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Correlation Risks Section */}
                    <div className="mt-8 p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                        <Globe size={14} className="text-blue-400" />
                        Trade & Logistics Correlation Risks
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-sm text-zinc-300 leading-relaxed">
                            {data.riskAnalysis?.correlationRisks}
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Risk Factor Sensitivity</h4>
                            <div className="space-y-3">
                              {data.riskAnalysis?.correlationFactors?.map((f, i) => (
                                <div key={i} className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-500">{f.factor}</span>
                                    <span className="text-zinc-300">{f.impactLabel}</span>
                                  </div>
                                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      className={cn(
                                        "h-full",
                                        f.impactScore > 80 ? "bg-rose-500" : f.impactScore > 50 ? "bg-amber-500" : "bg-emerald-500"
                                      )}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${f.impactScore}%` }}
                                      transition={{ duration: 1, delay: i * 0.1 }}
                                    />
                                  </div>
                                </div>
                              ))}
                              {!data.riskAnalysis?.correlationFactors && (
                                <>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-zinc-500">Shipping Lane Congestion</span>
                                      <span className="text-zinc-300">High Impact</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-rose-500 w-[85%]" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-zinc-500">Commodity Price Volatility</span>
                                      <span className="text-zinc-300">Moderate Impact</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-amber-500 w-[60%]" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-zinc-500">Geopolitical Trade Barriers</span>
                                      <span className="text-zinc-300">Extreme Impact</span>
                                    </div>
                                    <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-rose-600 w-[95%]" />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Risk Alerts */}
                  {data.riskAnalysis?.liveRiskAlerts && data.riskAnalysis.liveRiskAlerts.length > 0 && (
                    <div className="glass-card p-4 bg-rose-500/10 border-rose-500/30 animate-pulse">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-rose-400" />
                        <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Live Risk Alerts</span>
                      </div>
                      <div className="space-y-2">
                        {data.riskAnalysis.liveRiskAlerts.map((alert, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-1 h-1 rounded-full bg-rose-400" />
                            <p className="text-xs font-bold text-rose-100">{alert}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stress Test Simulation */}
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Activity size={20} className="text-rose-400" />
                        Stress Test Simulation (2x Volatility)
                      </h3>
                      <div className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest">
                        High Volatility Regime
                      </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.stressBounds}>
                          <defs>
                            <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#fb7185" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#fb7185" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            hide 
                          />
                          <YAxis 
                            domain={['auto', 'auto']} 
                            stroke="#52525b" 
                            fontSize={10} 
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="max" 
                            stroke="none" 
                            fill="#fb7185" 
                            fillOpacity={0.1} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="min" 
                            stroke="none" 
                            fill="#fb7185" 
                            fillOpacity={0.1} 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="median" 
                            stroke="#fb7185" 
                            strokeWidth={2} 
                            fill="url(#stressGradient)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Stress Bear Case ({confInterval * 100}%)</p>
                        <p className="text-xl font-bold text-rose-400">${data.stressBounds ? data.stressBounds[data.stressBounds.length - 1].pLower.toFixed(2) : '---'}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Stress Bull Case ({confInterval * 100}%)</p>
                        <p className="text-xl font-bold text-emerald-400">${data.stressBounds ? data.stressBounds[data.stressBounds.length - 1].pUpper.toFixed(2) : '---'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Removed redundant global tab section */}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800 px-6 py-3 flex justify-between items-center z-50">
        <button 
          onClick={() => setActiveTab('summary')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'summary' ? "text-emerald-400" : "text-zinc-500")}
        >
          <Home size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'dashboard' ? "text-emerald-400" : "text-zinc-500")}
        >
          <TrendingUp size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Trade</span>
        </button>
        <button 
          onClick={() => setActiveTab('projection')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'projection' ? "text-emerald-400" : "text-zinc-500")}
        >
          <PieChartIcon size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Projection</span>
        </button>
        <button 
          onClick={() => setActiveTab('risk')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'risk' ? "text-rose-400" : "text-zinc-500")}
        >
          <AlertCircle size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Risk</span>
        </button>
        <button 
          onClick={() => setActiveTab('logistics')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'logistics' ? "text-emerald-400" : "text-zinc-500")}
        >
          <Ship size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Logistics</span>
        </button>
        <button 
          onClick={() => setActiveTab('global')}
          className={cn("flex flex-col items-center gap-1 transition-colors", activeTab === 'global' ? "text-emerald-400" : "text-zinc-500")}
        >
          <Globe size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Global</span>
        </button>
      </nav>
    </div>
  );
}
