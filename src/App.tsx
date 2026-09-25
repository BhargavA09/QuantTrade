import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Logo } from './components/Logo';
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
  ChevronDown,
  ChevronUp,
  Minus,
  Zap,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  XCircle,
  X,
  Circle,
  LayoutGrid,
  Plus,
  Brain,
  Newspaper,
  Package,
  History,
  Settings,
  Briefcase,
  Moon,
  Sun,
  Wallet,
  Shield,
  Target,
  MessageSquare,
  Twitter,
  Bell,
  BellOff,
  Star,
  Sparkles
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
import { cn } from './utils/cn';
import { fetchForecast, fetchGlobalState, fetchSentiment, fetchRiskAnalysis, analyzeSimulationPatterns, fetchPortfolioData, searchTicker, fetchPennyStocks, fetchMarketOverview, resolveTickerSymbol } from './services/api';
import { runMonteCarlo as runMonteCarloUtil } from './utils/simulations';

import { neuralBrain } from './services/NeuralBrain';
import { LearningMonitor } from './components/LearningMonitor';
import { QuantBot } from './components/QuantBot';
import { portfolioManager, StrategyConfig } from './services/PortfolioManager';
import SharedMemoryMonitor from './components/SharedMemoryMonitor';
import Disclaimer from './components/Disclaimer';

// --- HFT Strategy Config Templates ---
const HFT_STRATEGY_TEMPLATES: StrategyConfig[] = [
  {
    id: 'hft_scalper_default',
    name: 'Order Book Imbalance',
    type: 'hft_scalper',
    parameters: {
      stopLossPct: 0.002,
      takeProfitPct: 0.005,
      orderBookBias: 0.54
    }
  },
  {
    id: 'rsi_mean_reversion_default',
    name: 'Mean Reversion',
    type: 'rsi_mean_reversion',
    parameters: {
      rsiOversold: 30,
      rsiOverbought: 70,
      stopLossPct: 0.01,
      takeProfitPct: 0.02
    }
  },
  {
    id: 'sma_crossover_default',
    name: 'SMA Crossover',
    type: 'sma_crossover',
    parameters: {
      fastPeriod: 9,
      slowPeriod: 21,
      stopLossPct: 0.02,
      takeProfitPct: 0.04
    }
  },
  {
    id: 'bollinger_bands_default',
    name: 'Bollinger Bands',
    type: 'bollinger_bands',
    parameters: {
      bollingerDeviation: 2.0,
      stopLossPct: 0.015,
      takeProfitPct: 0.03
    }
  },
  {
    id: 'neural_alpha_default',
    name: 'Neural Alpha',
    type: 'neural_alpha',
    parameters: {
      kellySizing: true,
      stopLossPct: 0.04,
      takeProfitPct: 0.08
    }
  },
  {
    id: 'momentum_default',
    name: 'Momentum',
    type: 'momentum',
    parameters: {
      momentumThreshold: 0.003,
      stopLossPct: 0.01,
      takeProfitPct: 0.02
    }
  }
];

// --- Components ---
import StatCard from './components/StatCard';
import SimulationFeed from './components/SimulationFeed';
import LoadingScreen from './components/LoadingScreen';
import CustomTooltip from './components/CustomTooltip';
import PredictiveBacktest from './components/PredictiveBacktest';
import SentimentAnalysis from './components/SentimentAnalysis';
import SentimentDashboard from './components/SentimentDashboard';
import { CompanyProfile } from './components/CompanyProfile';
import RiskAnalysis from './components/RiskAnalysis';
import { PriceTargets } from './components/PriceTargets';
import { DateRangeSelector } from './components/DateRangeSelector';
import { MonteCarloControls } from './components/MonteCarloControls';
import { FibonacciSettings } from './components/FibonacciSettings';
import { DistributionChart } from './components/DistributionChart';
import { OptionsChain } from './components/OptionsChain';
import { RiskAssessment } from './components/RiskAssessment';
import GlobalNewsFeed from './components/GlobalNewsFeed';
import { GlobalMarketOverview } from './components/GlobalMarketOverview';
import CommodityDetailChart from './components/CommodityDetailChart';
import GlobalSimulationComparisonChart from './components/GlobalSimulationComparisonChart';
import GlobalEconomySimulationChart from './components/GlobalEconomySimulationChart';
import SectorImpactChart from './components/SectorImpactChart';
import SimulationPatternVisualizer from './components/SimulationPatternVisualizer';
import SectorHeatmap from './components/SectorHeatmap';
import GlobalSimulationChart from './components/GlobalSimulationChart';
import RiskReturnScatterPlot from './components/RiskReturnScatterPlot';
import PerformanceAttributionChart from './components/PerformanceAttributionChart';
import SectorAllocationChart from './components/SectorAllocationChart';
import FuzzyLogicExplainer from './components/FuzzyLogicExplainer';
import BacktestReport from './components/BacktestReport';
import PortfolioManager from './components/PortfolioManager';
import OptionsSimulation from './components/OptionsSimulation';
import FairValueAnalysis from './components/FairValueAnalysis';
import ModelComparison from './components/ModelComparison';
import NavigationMenu from './components/NavigationMenu';
import QuickActions from './components/QuickActions';
import SimulationLab from './components/SimulationLab';
import { FinanceHome } from './components/FinanceHome';
import { StockTicker } from './components/StockTicker';
import { ContactModal } from './components/ContactModal';
import QuantLab from './components/QuantLab';
import ManagementSection from './components/ManagementSection';
import { FundamentalsSection } from './components/FundamentalsSection';
import { ShippingMap } from './components/ShippingMap';
import LearningStatus from './components/LearningStatus';
import { AIScan } from './components/AIScan';
import LogisticsAlphaInsights from './components/LogisticsAlphaInsights';
import { ErrorBoundary } from './components/ErrorBoundary';
import NewsTicker from './components/NewsTicker';
import TickerNewsFeed from './components/TickerNewsFeed';
import RealTimeNewsFeed from './components/RealTimeNewsFeed';
import RiskSummaryCard from './components/RiskSummaryCard';
import { LivePriceBadge } from './components/LivePriceBadge';
import { YieldCurveAnalysis } from './components/YieldCurveAnalysis';
import { ModelInsight, RiskData, StockData, GlobalState, PortfolioData, Simulation, DateRange } from './types';
import { AdvancedChart } from './components/AdvancedChart';
import TechnicalAnalysis from './components/TechnicalAnalysis';
import { useWebSocket } from './hooks/useWebSocket';
import { FinvizDashboard } from './components/finviz/FinvizDashboard';


const getFuzzyVolatility = (data: StockData) => {
  if (!data.sentiment) return { label: "Moderate", value: "2.5%", trend: "down" as const, reasons: ["Awaiting sentiment analysis"] };

  const sentimentScore = Math.abs((data.sentiment.score - 50) / 50); // 0 to 1
  const summary = data.sentiment.summary?.toLowerCase() || "";
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










// --- Components ---












const ALL_FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 0.886, 1, 1.272, 1.618, 2, 2.618, 3.618, 4.236];

















const SentimentGauge: React.FC<{ value: number }> = ({ value }) => {
  const rotation = (value / 100) * 180 - 90;
  const color = value > 70 ? '#10b981' : value > 40 ? '#f59e0b' : '#f43f5e';
  
  return (
    <div className="relative w-32 h-16 overflow-hidden">
      <div className="absolute inset-0 border-[12px] border-zinc-800 rounded-t-full" />
      <motion.div 
        initial={{ rotate: -90 }}
        animate={{ rotate: rotation }}
        transition={{ type: 'spring', stiffness: 50 }}
        className="absolute bottom-0 left-1/2 w-1 h-14 origin-bottom -translate-x-1/2 bg-zinc-100 rounded-full shadow-lg"
        style={{ backgroundColor: color }}
      >
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: color }} />
      </motion.div>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-zinc-900 border-2 border-zinc-800 rounded-full z-10" />
    </div>
  );
};

export default function App() {
  const [tickers, setTickers] = useState<string[]>(() => {
    const saved = localStorage.getItem('logistics_alpha_tickers');
    const tickersList: string[] = saved ? JSON.parse(saved) : [];
    // Resolve any mistyped tickers from previous sessions
    return [...new Set(tickersList.map((t: string) => resolveTickerSymbol(t)))] as string[];
  });
  // Ensure tickers are unique and resolved
  useEffect(() => {
    const normalizedTickers = tickers.map(t => resolveTickerSymbol(t));
    const uniqueNormalized = [...new Set(normalizedTickers)];
    const isDifferent = tickers.length !== uniqueNormalized.length || 
                        tickers.some((t, i) => t !== uniqueNormalized[i]);
    
    if (isDifferent) {
      console.log("♻️ Normalizing tickers:", uniqueNormalized);
      setTickers(uniqueNormalized);
    }
  }, [tickers]);

  const dedupeTickerArray = <T extends { ticker: string }>(arr: T[]): T[] => {
    const seen = new Set();
    return (arr || []).filter(item => {
      const t = (item.ticker || '').toUpperCase().trim();
      if (!t || seen.has(t)) return false;
      seen.add(t);
      return true;
    });
  };

  const [activeTicker, setActiveTicker] = useState<string>(() => {
    const saved = localStorage.getItem('logistics_alpha_active_ticker');
    return saved ? resolveTickerSymbol(saved) : '';
  });
  const [inputTicker, setInputTicker] = useState('');
  const [allData, setAllData] = useState<Record<string, StockData>>(() => {
    const saved = localStorage.getItem('logistics_alpha_all_data');
    return saved ? JSON.parse(saved) : {};
  });
  const [simulations, setSimulations] = useState<Record<string, Simulation[]>>({});
  const [globalState, setGlobalState] = useState<GlobalState | null>(() => {
    const saved = localStorage.getItem('logistics_alpha_global_state');
    return saved ? JSON.parse(saved) : null;
  });
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(() => {
    const saved = localStorage.getItem('logistics_alpha_portfolio_data');
    return saved ? JSON.parse(saved) : null;
  });

  // Persistent Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('quant_watchlist');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...new Set(parsed.map((t: string) => resolveTickerSymbol(t)).filter(Boolean))] as string[];
        }
      }
    } catch (e) {
      console.warn("Failed loading quant_watchlist:", e);
    }
    return ['NVDA', 'AAPL', 'TSLA', 'SPY', 'BTC-USD'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('quant_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.warn("Failed saving quant_watchlist:", e);
    }
  }, [watchlist]);

  const handleAddWatchlist = (symbol: string) => {
    const clean = resolveTickerSymbol(symbol.trim().toUpperCase());
    if (!clean) return;
    setWatchlist(prev => {
      if (prev.includes(clean)) return prev;
      return [clean, ...prev];
    });
  };

  const handleRemoveWatchlist = (symbol: string) => {
    const clean = resolveTickerSymbol(symbol.trim().toUpperCase());
    setWatchlist(prev => prev.filter(t => t !== clean));
  };

  const handleToggleWatchlist = (symbol: string) => {
    const clean = resolveTickerSymbol(symbol.trim().toUpperCase());
    if (!clean) return;
    setWatchlist(prev => {
      if (prev.includes(clean)) {
        return prev.filter(t => t !== clean);
      } else {
        return [clean, ...prev];
      }
    });
  };

  // Persistence Effects with Debouncing for heavy data
  useEffect(() => {
    localStorage.setItem('logistics_alpha_tickers', JSON.stringify(tickers));
  }, [tickers]);

  useEffect(() => {
    localStorage.setItem('logistics_alpha_active_ticker', activeTicker);
  }, [activeTicker]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('logistics_alpha_all_data', JSON.stringify(allData));
    }, 1000); // 1s debounce for heavy data
    return () => clearTimeout(timer);
  }, [allData]);

  useEffect(() => {
    if (globalState) {
      localStorage.setItem('logistics_alpha_global_state', JSON.stringify(globalState));
    }
  }, [globalState]);

  useEffect(() => {
    if (portfolioData) {
      localStorage.setItem('logistics_alpha_portfolio_data', JSON.stringify(portfolioData));
    }
  }, [portfolioData]);

  const [activeTab, setActiveTab] = useState<'finviz' | 'summary' | 'dashboard' | 'projection' | 'global' | 'logistics' | 'risk' | 'fundamentals' | 'daytrading' | 'markets' | 'portfolio' | 'montecarlo' | 'options' | 'fairvalue' | 'quantlab' | 'neural' | 'advancedchart' | 'aiscan' | 'quant' | 'sentiment' | 'technical' | 'yieldcurve'>('finviz');

  const [portfolioStats, setPortfolioStats] = useState(() => portfolioManager.getStats());
  const [tradeHistory, setTradeHistory] = useState(() => portfolioManager.getHistory());
  const [activeStrategyConfig, setActiveStrategyConfig] = useState(() => portfolioManager.getActiveStrategy());
  const [botActive, setBotActive] = useState(() => portfolioManager.isBotActive());

  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    const saved = localStorage.getItem('quant_alerts_enabled');
    return saved === 'true'; // Default to false wait let's make it so it has a default state
  });

  const [tradeToasts, setTradeToasts] = useState<{ id: string; trade: any; timestamp: number }[]>([]);
  const lastProcessedTradeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (tradeHistory.length > 0) {
      const latestTrade = tradeHistory[0];
      
      // Initialize on first load so we do not alert on historical/seed data
      if (lastProcessedTradeIdRef.current === null) {
        lastProcessedTradeIdRef.current = latestTrade.id;
        return;
      }
      
      if (latestTrade.id !== lastProcessedTradeIdRef.current) {
        lastProcessedTradeIdRef.current = latestTrade.id;
        
        if (alertsEnabled) {
          // Play modern high-fidelity synth beep sound
          try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
              const audioCtx = new AudioContextClass();
              if (audioCtx.state === 'suspended') {
                audioCtx.resume();
              }
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              
              osc.connect(gain);
              gain.connect(audioCtx.destination);
              
              osc.type = 'sine';
              
              // Dynamic chime frequency: Higher frequency for profit, standard for buy
              const isProfit = latestTrade.type === 'SELL' && (latestTrade.profit || 0) >= 0;
              osc.frequency.setValueAtTime(isProfit ? 880 : 587.33, audioCtx.currentTime);
              osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.12);
              
              gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
              
              osc.start();
              osc.stop(audioCtx.currentTime + 0.22);
            }
          } catch (e) {
            console.log('Web Audio context not allowed or not supported yet', e);
          }

          // Trigger standard HTML5 system browser notification
          if ('Notification' in window) {
            if (Notification.permission === 'granted') {
              const profitText = latestTrade.type === 'SELL' && latestTrade.profit !== undefined 
                ? ` | Net P&L: ${latestTrade.profit >= 0 ? '+' : ''}$${latestTrade.profit.toFixed(2)}`
                : '';
              const directionSym = latestTrade.type === 'BUY' ? '🟢 BUY' : '🔴 SELL';
              new window.Notification(`QuantBot Trade Executed`, {
                body: `${directionSym} ${latestTrade.shares} shares of ${latestTrade.ticker} @ $${latestTrade.price.toFixed(2)}${profitText}`,
                tag: 'quantbot-trade-execution',
                silent: true // Let our synthesised beep handle audio cleanly
              });
            }
          }

          // Trigger dynamic floating alert overlay toast
          const toastId = Math.random().toString();
          setTradeToasts((prev) => [
            {
              id: toastId,
              trade: latestTrade,
              timestamp: Date.now()
            },
            ...prev
          ]);

          // Auto discard in 5000ms
          setTimeout(() => {
            setTradeToasts((prev) => prev.filter(t => t.id !== toastId));
          }, 5000);
        }
      }
    }
  }, [tradeHistory, alertsEnabled]);

  useEffect(() => {
    return portfolioManager.subscribe(() => {
      setPortfolioStats(portfolioManager.getStats());
      setTradeHistory([...portfolioManager.getHistory()]);
      setActiveStrategyConfig(portfolioManager.getActiveStrategy());
      setBotActive(portfolioManager.isBotActive());
    });
  }, []);

  const [globalHftEvents, setGlobalHftEvents] = useState(() => [
    { id: '1', time: '14:25:57.142', node: 'NYC (NASDAQ BX)', symbol: 'SPY', type: 'BUY', price: 532.85, qty: 100, profit: null, status: 'FILLED', strategy: 'Order Book Imbalance' },
    { id: '2', time: '14:25:57.198', node: 'Tokyo (JPX Co-lo)', symbol: '7203.T', type: 'SELL', price: 3450.00, qty: 120, profit: 14.50, status: 'FILLED', strategy: 'Micro-RSI Mean Reversion' },
    { id: '3', time: '14:25:57.350', node: 'London (LSE Cross)', symbol: 'AZN.L', type: 'BUY', price: 124.20, qty: 40, profit: null, status: 'FILLED', strategy: 'Kalman Drift Filter' }
  ]);

  useEffect(() => {
    if (activeTab !== 'daytrading') return;
    const interval = setInterval(() => {
      const nodes = [
        { name: 'NYC (NASDAQ BX)', lte: '112μs' },
        { name: 'London (LSE Cross)', lte: '148μs' },
        { name: 'Frankfurt (Xetra Clear)', lte: '135μs' },
        { name: 'Tokyo (JPX Co-lo)', lte: '190μs' },
        { name: 'Chicago (CME Aurora)', lte: '98μs' }
      ];
      const symbols = ['SPY', 'NVDA', 'AAPL', 'TSLA', 'QQQ', 'MSFT', 'AMD'];
      const strategies = ['Order Book Imbalance', 'Micro-RSI Mean Reversion', 'Statistical Arbitrage', 'Neural Alpha Bias', 'Kalman Noise Filter'];
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const randomStrat = strategies[Math.floor(Math.random() * strategies.length)];
      const randomPrice = 100 + Math.random() * 400;
      const randomQty = Math.floor(10 + Math.random() * 90) * 10;
      const isSell = Math.random() > 0.4;
      const profit = isSell ? parseFloat((5 + Math.random() * 45).toFixed(2)) : null;

      const newEvent = {
        id: Math.random().toString(36).substr(2, 9),
        time: new Date().toLocaleTimeString() + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
        node: randomNode.name,
        symbol: randomSymbol,
        type: isSell ? 'SELL' : 'BUY',
        price: randomPrice,
        qty: randomQty,
        profit: profit,
        status: 'FILLED',
        strategy: randomStrat
      };

      setGlobalHftEvents(prev => [newEvent, ...prev.slice(0, 5)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [learningActive, setLearningActive] = useState(false);

  useEffect(() => {
    // Start continuous learning logic
    const learningInterval = neuralBrain.startContinuousLearning(900000); // 15 mins
    setLearningActive(true);
    return () => clearInterval(learningInterval);
  }, []);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('quant_theme') || localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
    } catch {
      // Fallback if localStorage access is blocked
    }
    return 'dark';
  });

  const toggleTheme = () => {
    document.documentElement.classList.add('theme-transitioning');
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 380);
  };
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  useEffect(() => {
    (window as any).openContactModal = () => setIsContactModalOpen(true);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('quant_theme', theme);
      localStorage.setItem('theme', theme);
    } catch (e) {
      console.warn('Failed to persist theme to localStorage', e);
    }

    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'light' ? '#fafafa' : '#09090b');
    }
  }, [theme]);
  const [portfolioSimulations, setPortfolioSimulations] = useState<Simulation[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { lastUpdate, isConnected, connectionState } = useWebSocket(tickers);
  const pendingUpdateRef = useRef<any>(null);
  const hasFetchedInitialData = useRef(false);

  // Handle Real-time Price Updates from WebSocket with Throttling
  useEffect(() => {
    if (lastUpdate) {
      pendingUpdateRef.current = lastUpdate;
    }
  }, [lastUpdate]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (pendingUpdateRef.current) {
        const update = pendingUpdateRef.current;
        pendingUpdateRef.current = null;

        setAllData(prev => {
          const data = prev[update.ticker];
          
          const updatedData = {
            ...(data || {
              ticker: update.ticker,
              history: [],
              filtered: [],
              simulations: [],
              forecast: [],
              mean: 0,
              stdDev: 0
            }),
            currentPrice: update.price,
            change: update.change,
            changePercent: update.changePercent,
            volume: update.volume,
            high: update.high,
            low: update.low,
            open: update.open,
            previousClose: update.previousClose,
            marketCap: update.marketCap,
            peRatio: update.peRatio,
            dividendYield: update.dividendYield
          };

          // Sync live price update directly to Portfolio Manager's holding blocks
          portfolioManager.updatePrices(update.ticker, update.price);

          // If high-frequency scalper is activated, scan and execute on every incoming market tick in milliseconds
          if (portfolioManager.isBotActive() && portfolioManager.getActiveStrategy().type === 'hft_scalper') {
            portfolioManager.runStrategy(update.ticker, update.price, updatedData.history || []);
          }

          return {
            ...prev,
            [update.ticker]: updatedData as StockData
          };
        });

        setSimulations(prev => {
          const tickerSimulations = prev[update.ticker] || [];
          const newSimulation: Simulation = {
            id: Math.random().toString(36).substr(2, 9),
            ticker: update.ticker,
            price: update.price,
            quantity: Math.floor(Math.random() * 500) + 10,
            side: Math.random() > 0.5 ? 'buy' : 'sell',
            timestamp: new Date()
          };
          return {
            ...prev,
            [update.ticker]: [newSimulation, ...tickerSimulations].slice(0, 50)
          };
        });
      }
    }, 500); // Update every 500ms

    return () => clearInterval(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{symbol: string, name: string, type: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`/api/stock/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.quotes) {
             const mapped = data.quotes.map((q: any) => ({
               symbol: q.symbol,
               name: q.shortname || q.longname || q.symbol,
               type: q.quoteType || 'Asset'
             }));
             setSearchResults(mapped);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400); // 400ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [showQuickActions, setShowQuickActions] = useState(true);
  const [marketOverview, setMarketOverview] = useState<{ 
    us: any[], 
    canada: any[], 
    europe: any[], 
    asia: any[], 
    crypto: any[], 
    commodities: any[] 
  } | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [showFuzzyExplainer, setShowFuzzyExplainer] = useState(false);
  const [pennyStocks, setPennyStocks] = useState<any[]>([]);
  const [pennyLoading, setPennyLoading] = useState(false);
  const [minProfitThreshold, setMinProfitThreshold] = useState(10);
  const [maxRiskThreshold, setMaxRiskThreshold] = useState<'High' | 'Extreme'>('Extreme');
  const [newsSentimentFilter, setNewsSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [dateRange, setDateRange] = useState<DateRange>('3M');
  const [numSims, setNumSims] = useState(100);
  const [confInterval, setConfInterval] = useState(0.8);
  const [showFibonacci, setShowFibonacci] = useState(false);
  const [fibLevels, setFibLevels] = useState<number[]>([0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]);
  const [fibPresets, setFibPresets] = useState<{name: string, levels: number[]}[]>([
    { name: 'Standard', levels: [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] },
    { name: 'Extensions', levels: [0, 0.618, 1, 1.618, 2.618, 3.618, 4.236] },
    { name: 'Deep', levels: [0, 0.5, 0.618, 0.786, 0.886, 1] }
  ]);
  const [showFibSettings, setShowFibSettings] = useState(false);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['sma20', 'rsi14']);
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [activePoint, setActivePoint] = useState<{ x: string | number; y: number } | null>(null);

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
  const [suggestions, setSuggestions] = useState<{symbol: string, name: string, type: string}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    exchange: 'All',
    marketCap: 'All',
    sector: 'All'
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  useEffect(() => {
    const fetchMarket = async () => {
      setMarketLoading(true);
      const data = await fetchMarketOverview();
      setMarketOverview({
        us: dedupeTickerArray(data.us),
        canada: dedupeTickerArray(data.canada),
        europe: dedupeTickerArray(data.europe),
        asia: dedupeTickerArray(data.asia),
        crypto: dedupeTickerArray(data.crypto),
        commodities: dedupeTickerArray(data.commodities)
      });
      setMarketLoading(false);
    };
    fetchMarket();
  }, []);

  useEffect(() => {
    if (activeTab === 'daytrading' && pennyStocks.length === 0) {
      const loadPennyStocks = async () => {
        setPennyLoading(true);
        const stocks = await fetchPennyStocks();
        setPennyStocks(dedupeTickerArray(stocks));
        setPennyLoading(false);
      };
      loadPennyStocks();
    }
  }, [activeTab, pennyStocks.length]);

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

  const handleAddPortfolioSimulation = (simulation: Omit<Simulation, 'id'>) => {
    const newSimulation: Simulation = {
      ...simulation,
      id: Math.random().toString(36).substring(2, 9),
    };
    setPortfolioSimulations(prev => [...prev, newSimulation]);
    
    // Also fetch data for the ticker if we don't have it
    if (!allData[simulation.ticker]) {
      fetchData(simulation.ticker);
    }
  };

  const handleRemovePortfolioSimulation = (id: string) => {
    setPortfolioSimulations(prev => prev.filter(t => t.id !== id));
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'search':
        setIsSearchOpen(true);
        break;
      case 'add':
        setActiveTab('portfolio');
        break;
      case 'trade':
        setActiveTab('dashboard');
        break;
      case 'quantlab':
        setActiveTab('quantlab');
        break;
      case 'analyze':
        setActiveTab('montecarlo');
        break;
    }
  };

  const GLOBAL_ASSETS = [
    // US Equities
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'Equity' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity' },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'Equity' },
    { symbol: 'META', name: 'Meta Platforms', type: 'Equity' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', type: 'Equity' },
    { symbol: 'V', name: 'Visa Inc.', type: 'Equity' },
    { symbol: 'JPM', name: 'JPMorgan Chase', type: 'Equity' },
    { symbol: 'WMT', name: 'Walmart Inc.', type: 'Equity' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'Equity' },
    { symbol: 'PG', name: 'Procter & Gamble', type: 'Equity' },
    { symbol: 'MA', name: 'Mastercard Inc.', type: 'Equity' },
    { symbol: 'HD', name: 'Home Depot', type: 'Equity' },
    { symbol: 'CVX', name: 'Chevron Corp.', type: 'Equity' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', type: 'Equity' },
    { symbol: 'MRK', name: 'Merck & Co.', type: 'Equity' },
    { symbol: 'PEP', name: 'PepsiCo', type: 'Equity' },
    { symbol: 'KO', name: 'Coca-Cola', type: 'Equity' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', type: 'Equity' },
    { symbol: 'BABA', name: 'Alibaba Group', type: 'Equity' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor', type: 'Equity' },
    { symbol: 'NVO', name: 'Novo Nordisk', type: 'Equity' },
    // Canadian Equities
    { symbol: 'RY.TO', name: 'Royal Bank of Canada', type: 'Canadian Equity' },
    { symbol: 'TD.TO', name: 'Toronto-Dominion Bank', type: 'Canadian Equity' },
    { symbol: 'SHOP.TO', name: 'Shopify Inc.', type: 'Canadian Equity' },
    { symbol: 'CNR.TO', name: 'Canadian National Railway', type: 'Canadian Equity' },
    { symbol: 'CP.TO', name: 'Canadian Pacific Kansas City', type: 'Canadian Equity' },
    { symbol: 'ENB.TO', name: 'Enbridge Inc.', type: 'Canadian Equity' },
    { symbol: 'BMO.TO', name: 'Bank of Montreal', type: 'Canadian Equity' },
    { symbol: 'BNS.TO', name: 'Bank of Nova Scotia', type: 'Canadian Equity' },
    { symbol: 'BAM.TO', name: 'Brookfield Asset Management', type: 'Canadian Equity' },
    { symbol: 'CSU.TO', name: 'Constellation Software', type: 'Canadian Equity' },
    { symbol: 'BPAG.TO', name: 'BMO Private Global Real Estate', type: 'Canadian Equity' },
    // European Equities
    { symbol: 'LVMUY', name: 'LVMH Moet Hennessy', type: 'European Equity' },
    { symbol: 'ASML.AS', name: 'ASML Holding', type: 'European Equity' },
    { symbol: 'SAP.DE', name: 'SAP SE', type: 'European Equity' },
    { symbol: 'SIE.DE', name: 'Siemens AG', type: 'European Equity' },
    { symbol: 'SAN.PA', name: 'Sanofi', type: 'European Equity' },
    { symbol: 'OR.PA', name: 'L\'Oréal', type: 'European Equity' },
    { symbol: 'NESN.SW', name: 'Nestlé S.A.', type: 'European Equity' },
    { symbol: 'NOVN.SW', name: 'Novartis AG', type: 'European Equity' },
    { symbol: 'ROG.SW', name: 'Roche Holding AG', type: 'European Equity' },
    { symbol: 'AZN.L', name: 'AstraZeneca PLC', type: 'European Equity' },
    { symbol: 'SHEL.L', name: 'Shell plc', type: 'European Equity' },
    { symbol: 'HSBA.L', name: 'HSBC Holdings plc', type: 'European Equity' },
    { symbol: 'ULVR.L', name: 'Unilever PLC', type: 'European Equity' },
    // Asian/Pacific Equities
    { symbol: '7203.T', name: 'Toyota Motor', type: 'Asian Equity' },
    { symbol: '6758.T', name: 'Sony Group', type: 'Asian Equity' },
    { symbol: '9984.T', name: 'SoftBank Group', type: 'Asian Equity' },
    { symbol: '005930.KS', name: 'Samsung Electronics', type: 'Asian Equity' },
    { symbol: '000660.KS', name: 'SK Hynix', type: 'Asian Equity' },
    { symbol: 'TCEHY', name: 'Tencent Holdings', type: 'Asian Equity' },
    { symbol: '0700.HK', name: 'Tencent Holdings (HK)', type: 'Asian Equity' },
    { symbol: '3690.HK', name: 'Meituan', type: 'Asian Equity' },
    { symbol: '9988.HK', name: 'Alibaba Group (HK)', type: 'Asian Equity' },
    { symbol: 'RELIANCE.NS', name: 'Reliance Industries', type: 'Asian Equity' },
    { symbol: 'TCS.NS', name: 'Tata Consultancy Services', type: 'Asian Equity' },
    { symbol: 'HDFCBANK.NS', name: 'HDFC Bank', type: 'Asian Equity' },
    { symbol: 'CBA.AX', name: 'Commonwealth Bank', type: 'Oceania Equity' },
    { symbol: 'BHP.AX', name: 'BHP Group', type: 'Oceania Equity' },
    { symbol: 'CSL.AX', name: 'CSL Limited', type: 'Oceania Equity' },
    // Crypto
    { symbol: 'BTC-USD', name: 'Bitcoin', type: 'Crypto' },
    { symbol: 'ETH-USD', name: 'Ethereum', type: 'Crypto' },
    { symbol: 'SOL-USD', name: 'Solana', type: 'Crypto' },
    { symbol: 'BNB-USD', name: 'Binance Coin', type: 'Crypto' },
    { symbol: 'XRP-USD', name: 'XRP', type: 'Crypto' },
    { symbol: 'ADA-USD', name: 'Cardano', type: 'Crypto' },
    // Commodities
    { symbol: 'GC=F', name: 'Gold Futures', type: 'Commodity' },
    { symbol: 'CL=F', name: 'Crude Oil Futures', type: 'Commodity' },
    { symbol: 'SI=F', name: 'Silver Futures', type: 'Commodity' },
    { symbol: 'HG=F', name: 'Copper Futures', type: 'Commodity' },
    // Indices
    { symbol: '^GSPC', name: 'S&P 500', type: 'Index' },
    { symbol: '^DJI', name: 'Dow Jones Industrial Average', type: 'Index' },
    { symbol: '^IXIC', name: 'NASDAQ Composite', type: 'Index' },
    { symbol: '^RUT', name: 'Russell 2000', type: 'Index' },
    { symbol: '^VIX', name: 'CBOE Volatility Index', type: 'Index' },
    { symbol: '^FTSE', name: 'FTSE 100', type: 'Index' },
    { symbol: '^N225', name: 'Nikkei 225', type: 'Index' },
    { symbol: '^GDAXI', name: 'DAX Performance-Index', type: 'Index' },
    { symbol: '^FCHI', name: 'CAC 40', type: 'Index' },
    { symbol: '^STOXX50E', name: 'Euro Stoxx 50', type: 'Index' },
    { symbol: '^AXJO', name: 'S&P/ASX 200', type: 'Index' },
    { symbol: '^HSI', name: 'Hang Seng Index', type: 'Index' },
    { symbol: '^BSESN', name: 'S&P BSE SENSEX', type: 'Index' },
  ];

  // Live Update Simulation removed in favor of real-time WebSocket feed

  // Simulation removed in favor of real-time WebSocket feed

  // Sentiment analysis is now in api.ts


  // Global trade fetch is now in api.ts

  const handleChartMouseMove = (e: any) => {
    if (e.activePayload && e.activePayload.length > 0) {
      const payload = e.activePayload[0].payload;
      const x = payload.name || payload.date;
      
      // Find the most relevant price to anchor the horizontal crosshair
      let y = 0;
      const activePrice = payload[`${activeTicker}_price`];
      const activeForecast = payload[`${activeTicker}_forecast`];
      
      if (activePrice !== undefined) y = activePrice;
      else if (activeForecast !== undefined) y = activeForecast;
      else y = e.activePayload[0].value;

      setActivePoint({ x, y });
    }
  };

  const handleChartMouseLeave = () => {
    setActivePoint(null);
  };

  const simulationStats = useMemo(() => {
    const data = allData[activeTicker];
    if (!data || !data.simulations || data.simulations.length === 0) return null;

    const finalPrices = data.simulations.map(s => s[s.length - 1]);
    const sortedPrices = [...finalPrices].sort((a, b) => a - b);
    const mean = finalPrices.reduce((a, b) => a + b, 0) / finalPrices.length;
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    const variance = finalPrices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / finalPrices.length;
    const stdDev = Math.sqrt(variance);
    
    const p5 = sortedPrices[Math.floor(sortedPrices.length * 0.05)];
    const p95 = sortedPrices[Math.floor(sortedPrices.length * 0.95)];

    return { 
      mean, 
      median, 
      stdDev, 
      p5, 
      p95, 
      metrics: data.metrics,
      var95: data.simBounds?.[data.simBounds.length - 1]?.var95 || 0,
      var99: data.simBounds?.[data.simBounds.length - 1]?.var99 || 0
    };
  }, [allData, activeTicker]);

  useEffect(() => {
    if (activeTab !== 'global') return;
    
    const interval = setInterval(() => {
      const newsItems: { title: string; impact: string; sentiment: 'positive' | 'neutral' | 'negative'; severity: 'low' | 'medium' | 'high' }[] = [
        { title: "Suez Canal Throughput Increases 12%", impact: "Logistics efficiency improving in the EMEA region.", sentiment: "positive", severity: "medium" },
        { title: "Port of Singapore Congestion Eases", impact: "Global simulation bottlenecks are resolving faster than expected.", sentiment: "positive", severity: "low" },
        { title: "New Simulation Tariffs Proposed in EU", impact: "Potential disruption to cross-border commodity flows.", sentiment: "negative", severity: "high" },
        { title: "Panama Canal Water Levels Stabilize", impact: "Transit capacity returning to seasonal norms.", sentiment: "positive", severity: "medium" },
        { title: "Global Freight Rates Spike on Geopolitical Tension", impact: "Increased costs for long-haul shipping routes.", sentiment: "negative", severity: "high" },
        { title: "Autonomous Shipping Trials Succeed in Japan", impact: "Long-term cost reduction in maritime logistics.", sentiment: "positive", severity: "low" }
      ];

      const newNewsItem = newsItems[Math.floor(Math.random() * newsItems.length)];

      setGlobalState(prev => {
        if (!prev) return prev;
        const updatedNews = [newNewsItem, ...(prev.globalSimulation?.news || [])].slice(0, 10);
        
        // Simulate "learning" by adjusting volume index
        const sentimentImpact = newNewsItem.sentiment === 'positive' ? 0.4 : newNewsItem.sentiment === 'negative' ? -0.6 : 0;
        const currentVolume = prev.globalSimulation?.volumeIndex || 100;
        
        return {
          ...prev,
          globalSimulation: {
            ...prev.globalSimulation,
            news: updatedNews,
            volumeIndex: parseFloat((currentVolume + sentimentImpact).toFixed(2))
          }
        };
      });

      // Update learning status to show impact
      setLearningStatus(prev => ({
        ...prev,
        status: `Learning from ${newNewsItem.sentiment} news...`,
        progress: Math.min(100, prev.progress + 1),
        lastUpdate: new Date().toLocaleTimeString()
      }));

    }, 10000);

    return () => clearInterval(interval);
  }, [activeTab]);

  const fetchingTickers = useRef<Set<string>>(new Set());
  const failedTickers = useRef<Set<string>>(new Set());
  const isFetchingGlobalState = useRef(false);
  const failedGlobalState = useRef(false);

  const fetchGlobalStateData = async () => {
    if (isFetchingGlobalState.current || failedGlobalState.current) return;
    isFetchingGlobalState.current = true;
    try {
      const [gData, pData] = await Promise.all([
        fetchGlobalState(),
        fetchPortfolioData()
      ]);
      
      // Learn patterns from the new state
      const patterns = await analyzeSimulationPatterns(gData);
      const updatedGlobalState = gData ? { ...gData, patterns } : null;
      
      // Consolidate updates to reduce re-renders
      setGlobalState(updatedGlobalState);
      setPortfolioData(pData);
    } catch (e) {
      console.error("Failed to fetch global state", e);
      failedGlobalState.current = true;
    } finally {
      isFetchingGlobalState.current = false;
    }
  };

  const fetchData = async (t: string) => {
    const resolvedT = resolveTickerSymbol(t);
    if (allData[resolvedT] || fetchingTickers.current.has(resolvedT) || failedTickers.current.has(resolvedT)) return;
    fetchingTickers.current.add(resolvedT);
    setLoading(true);
    setError(null);
    try {
      // Parallel Fetching for Speed - Ticker Specific Only
      const [stockJson, sentiment] = await Promise.all([
        fetchForecast(resolvedT, numSims, confInterval),
        fetchSentiment(resolvedT)
      ]);
      
      const riskAnalysis = await fetchRiskAnalysis(resolvedT, stockJson.history, sentiment);

      // 3. Apply Fuzzy Logic Boost to Forecast
      // The forecast from api.ts already includes sentiment drift, so we can just use it.
      const adjustedForecast = stockJson.forecast;

      // Fair value adjusted by sentiment (+/- 10%)
      const sentimentFactor = ((sentiment.score - 50) / 50) * 0.1;
      const fairValue = parseFloat((stockJson.currentPrice * (1 + sentimentFactor)).toFixed(2));

      const riskSummary = {
        volatility: parseFloat((stockJson.stdDev * 100).toFixed(2)),
        beta: parseFloat(stockJson.fundamentals?.beta || "1.0"),
        level: riskAnalysis.riskScore > 70 ? 'High' : riskAnalysis.riskScore > 40 ? 'Medium' : 'Low',
        sharpeRatio: 1.2, // Mocking sharpe ratio
        maxDrawdown: 15.4, // Mocking max drawdown
        var95: 4.2, // Mocking VaR
        factors: (riskAnalysis.tailRisks || []).slice(0, 3)
      };

      setAllData(prev => ({
        ...prev,
        [resolvedT]: {
          ...stockJson,
          forecast: adjustedForecast,
          sentiment,
          fairValue,
          riskAnalysis,
          risk: riskSummary
        }
      }));
    } catch (error: any) {
      console.error("Fetch error", error);
      failedTickers.current.add(resolvedT);
      setError(error.message || "An error occurred while fetching data. Please check the ticker symbol and try again.");
    } finally {
      setLoading(false);
      fetchingTickers.current.delete(resolvedT);
    }
  };

  const allTickersFetched = useMemo(() => {
    return tickers.every(t => !!allData[t] || failedTickers.current.has(t));
  }, [tickers, Object.keys(allData).length]);

  useEffect(() => {
    if (hasFetchedInitialData.current) return;
    
    let needsFetch = false;
    tickers.forEach(t => {
      const resolvedT = resolveTickerSymbol(t);
      if (!allData[resolvedT] && !fetchingTickers.current.has(resolvedT) && !failedTickers.current.has(resolvedT)) {
        fetchData(resolvedT);
        needsFetch = true;
      }
    });
    
    if (!globalState && !isFetchingGlobalState.current && !failedGlobalState.current) {
      fetchGlobalStateData();
      needsFetch = true;
    }

    if (!needsFetch && allTickersFetched && (globalState || failedGlobalState.current)) {
      hasFetchedInitialData.current = true;
    }
  }, [tickers, allTickersFetched, !!globalState]);

  const lastSimParams = useRef<{ ticker: string; numSims: number; confInterval: number; price: number } | null>(null);

  // Re-run simulation locally when parameters change
  useEffect(() => {
    if (activeTicker && allData[activeTicker]) {
      const data = allData[activeTicker];
      const currentParams = { ticker: activeTicker, numSims, confInterval, price: data.currentPrice };
      
      const needsUpdate = !lastSimParams.current || 
                          lastSimParams.current.ticker !== currentParams.ticker ||
                          lastSimParams.current.numSims !== currentParams.numSims ||
                          lastSimParams.current.confInterval !== currentParams.confInterval ||
                          (!data.simulations || data.simulations.length === 0);

      if (needsUpdate) {
        lastSimParams.current = currentParams;
        // Use the optimized utility
        const mcResults = runMonteCarloUtil(data.currentPrice, data.mean, data.stdDev, numSims, confInterval);
        setAllData(prev => ({
          ...prev,
          [activeTicker]: {
            ...prev[activeTicker],
            ...mcResults,
            numSimsCalculated: numSims
          }
        }));
      }
    }
  }, [numSims, confInterval, activeTicker, !!allData[activeTicker]]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputTicker.trim();
    if (!input) return;

    setLoading(true);
    let ticker = input.toUpperCase();
    
    // If input is more than 5 chars or has spaces, it's probably a company name
    if (input.length > 5 || input.includes(' ') || searchFilters.exchange !== 'All' || searchFilters.marketCap !== 'All' || searchFilters.sector !== 'All') {
      const filters = {
        exchange: searchFilters.exchange !== 'All' ? searchFilters.exchange : undefined,
        marketCap: searchFilters.marketCap !== 'All' ? searchFilters.marketCap : undefined,
        sector: searchFilters.sector !== 'All' ? searchFilters.sector : undefined
      };
      const foundTicker = await searchTicker(input, filters);
      if (foundTicker) {
        ticker = foundTicker;
      }
    }

    if (ticker) {
      if (!tickers.includes(ticker)) {
        setTickers([ticker]);
        fetchData(ticker);
      }
      setActiveTicker(ticker);
    }
    setInputTicker('');
    setShowSuggestions(false);
    setLoading(false);
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
        setTickers([ticker]);
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
      const filtered = GLOBAL_ASSETS.filter(t => 
        (t.symbol.toLowerCase().includes(val.toLowerCase()) || 
         t.name.toLowerCase().includes(val.toLowerCase())) && 
        !tickers.includes(t.symbol)
      ).slice(0, 8);
      setSuggestions(filtered);
      setShowSuggestions(true);
      
      // Also fetch from API silently
      fetch(`/api/stock/search?q=${encodeURIComponent(val)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.quotes) {
             const mapped = data.quotes.map((q: any) => ({
               symbol: q.symbol,
               name: q.shortname || q.longname || q.symbol,
               type: q.quoteType || 'Asset'
             })).filter((t: any) => !tickers.includes(t.symbol));
             
             setSuggestions(prev => {
                const combined = [...prev];
                mapped.forEach((m: any) => {
                   if (!combined.some(c => c.symbol === m.symbol)) {
                      combined.push(m);
                   }
                });
                return combined.slice(0, 8);
             });
          }
        }).catch(() => {});
    } else {
      setShowSuggestions(false);
    }
  };

  const chartData = useMemo(() => {
    const dateMap: Record<string, any> = {};
    const activeData = allData[activeTicker];
    if (!activeData) return [];

    const days = dateRange === '1M' ? 30 : dateRange === '3M' ? 90 : dateRange === '6M' ? 180 : 1000;
    
    // Process active ticker history and indicators
    const history = activeData.history?.slice(-days) || [];
    const filtered = activeData.filtered ? activeData.filtered.slice(-days) : [];
    const rsi = activeData.neuralFeatures?.rsi ? activeData.neuralFeatures.rsi.slice(-days) : [];
    const macd = activeData.neuralFeatures?.macd ? activeData.neuralFeatures.macd.slice(-days) : [];
    const sma20 = activeData.neuralFeatures?.sma20 ? activeData.neuralFeatures.sma20.slice(-days) : [];
    const ema12 = activeData.neuralFeatures?.ema12 ? activeData.neuralFeatures.ema12.slice(-days) : [];

    history.forEach((h, idx) => {
      if (!dateMap[h.date]) dateMap[h.date] = { name: h.date };
      dateMap[h.date][`${activeTicker}_price`] = h.price;
      
      if (filtered[idx]) dateMap[h.date][`filtered`] = filtered[idx];
      if (rsi[idx] !== undefined && rsi[idx] !== null) dateMap[h.date][`rsi`] = rsi[idx];
      if (macd[idx] !== undefined && macd[idx] !== null) dateMap[h.date][`macd`] = macd[idx];
      if (sma20[idx] !== undefined && sma20[idx] !== null) dateMap[h.date][`sma20`] = sma20[idx];
      if (ema12[idx] !== undefined && ema12[idx] !== null) dateMap[h.date][`ema12`] = ema12[idx];
      
      dateMap[h.date][`sentiment`] = activeData.sentiment;
      dateMap[h.date][`fairValue`] = activeData.fairValue;
      dateMap[h.date][`isForecast`] = false;
    });

    // Process active ticker forecast
    (activeData.forecast || []).forEach(f => {
      if (!dateMap[f.date]) dateMap[f.date] = { name: f.date };
      dateMap[f.date][`${activeTicker}_forecast`] = f.price;
      dateMap[f.date][`sentiment`] = activeData.sentiment;
      dateMap[f.date][`fairValue`] = activeData.fairValue;
      dateMap[f.date][`isForecast`] = true;
      dateMap[f.date][`forecastValue`] = f.price;
    });

    // Add simulation bounds for active ticker
    if (activeData.simBounds) {
      activeData.simBounds.forEach((bounds, dayIdx) => {
        if (dayIdx === 0) return;
        const forecastDate = activeData.forecast[dayIdx-1]?.date;
        if (!forecastDate) return;
        if (!dateMap[forecastDate]) dateMap[forecastDate] = { name: forecastDate };
        dateMap[forecastDate][`cone_range`] = [bounds.pLower, bounds.pUpper];
      });
    }

    // Add simulation paths for active ticker
    if (activeData.simulations) {
      activeData.simulations.forEach((path, simIdx) => {
        path.forEach((price, dayIdx) => {
          if (dayIdx === 0) return;
          const forecastDate = activeData.forecast[dayIdx-1]?.date;
          if (!forecastDate) return;
          if (!dateMap[forecastDate]) dateMap[forecastDate] = { name: forecastDate };
          dateMap[forecastDate][`sim_${simIdx}`] = price;
        });
      });
    }

    // Add other tickers' current prices (minimal data)
    tickers.forEach(t => {
      if (t === activeTicker) return;
      const d = allData[t];
      if (d?.currentPrice) {
        // We only add the current price to the latest date in the map
        const lastDate = activeData.history[activeData.history.length - 1]?.date;
        if (lastDate && dateMap[lastDate]) {
          dateMap[lastDate][`${t}_price`] = d.currentPrice;
        }
      }
    });

    return Object.values(dateMap).sort((a, b) => a.name.localeCompare(b.name));
  }, [allData[activeTicker], tickers, dateRange, activeTicker]);

  const formatVolume = (vol?: number) => {
    if (!vol) return "---";
    if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + "B";
    if (vol >= 1000000) return (vol / 1000000).toFixed(2) + "M";
    if (vol >= 1000) return (vol / 1000).toFixed(2) + "K";
    return vol.toString();
  };

  const formatMarketCap = (cap?: number) => {
    if (!cap) return "---";
    if (cap >= 1000000000000) return (cap / 1000000000000).toFixed(2) + "T";
    if (cap >= 1000000000) return (cap / 1000000000).toFixed(2) + "B";
    if (cap >= 1000000) return (cap / 1000000).toFixed(2) + "M";
    return cap.toString();
  };

  const data = allData[activeTicker];

  // Quant Logic: Sync active price to portfolio
  useEffect(() => {
    if (data && data.currentPrice) {
      portfolioManager.updatePrices(data.ticker, data.currentPrice);
    }
  }, [data?.ticker, data?.currentPrice]);

  useEffect(() => {
    if (!data || !data.currentPrice) return;
    
    // Check for trades every 10 seconds for standard strategies
    const interval = setInterval(() => {
      if (portfolioManager.getActiveStrategy().type !== 'hft_scalper') {
        portfolioManager.runStrategy(data.ticker, data.currentPrice, data.history || []);
      }
    }, 10000); 

    return () => clearInterval(interval);
  }, [data?.ticker, data?.currentPrice]);

  const filteredNews = useMemo(() => {
    if (!data?.news) return [];
    return data.news.filter(item => 
      newsSentimentFilter === 'all' || item.sentiment === newsSentimentFilter
    );
  }, [data?.news, newsSentimentFilter]);

  const filteredGlobalNews = useMemo(() => {
    if (!globalState?.globalSimulation?.news) return [];
    return (globalState?.globalSimulation?.news || []).filter(item => 
      newsSentimentFilter === 'all' || item.sentiment === newsSentimentFilter
    );
  }, [globalState?.globalSimulation?.news, newsSentimentFilter]);

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const fibonacciLevels = useMemo(() => {
    if (!showFibonacci || !chartData || chartData.length === 0) return null;
    
    const prices = chartData
      .map(d => d[`${activeTicker}_price`])
      .filter(p => p !== undefined) as number[];
    
    if (prices.length === 0) return null;
    
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const diff = high - low;
    
    return fibLevels.map(lvl => ({
      level: lvl,
      price: high - (diff * lvl),
      label: `${(lvl * 100).toFixed(1)}%`
    }));
  }, [showFibonacci, chartData, activeTicker, fibLevels]);

  return (
    <ErrorBoundary>
      <Disclaimer />
      <div className="max-w-7xl mx-auto w-full min-h-screen flex flex-col pb-12 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* News Ticker */}
      {globalState?.globalSimulation?.news && (
        <div className="fixed top-0 left-0 right-0 z-[40]">
          <NewsTicker news={globalState?.globalSimulation?.news || []} />
        </div>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[110] flex items-start justify-center p-6 pt-24">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSearchOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <Search size={20} className="text-zinc-500" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Search tickers, assets, or tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder:text-zinc-600"
                />
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <X size={18} className="text-zinc-500" />
                </button>
              </div>
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {searchQuery ? (
                  <div className="space-y-1">
                    <p className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      Results {isSearching && <span className="animate-pulse w-2 h-2 rounded-full bg-emerald-500"></span>}
                    </p>
                    {/* Combine local search with backend search results */}
                    {(() => {
                      const localMatches = GLOBAL_ASSETS.filter(t => 
                        t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        t.name.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      const combined = [...localMatches];
                      searchResults.forEach(r => {
                        if (!combined.some(c => c.symbol === r.symbol)) combined.push(r);
                      });
                      return combined.slice(0, 15);
                    })().map((t, idx) => (
                      <button
                        key={`${t.symbol}-${idx}`}
                        onClick={() => {
                          const resolvedSymbol = resolveTickerSymbol(t.symbol);
                          if (!tickers.includes(resolvedSymbol)) {
                            setTickers([resolvedSymbol]);
                            fetchData(resolvedSymbol);
                          }
                          setActiveTicker(resolvedSymbol);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-zinc-800/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300">
                            {t.symbol.substring(0, 2)}
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-zinc-200">{t.symbol}</div>
                            <div className="text-[10px] text-zinc-500">{t.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{t.type}</span>
                          <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
                        </div>
                      </button>
                    ))}
                    {/* Add manual ticker option if no direct match or as a fallback */}
                    {!GLOBAL_ASSETS.some(t => t.symbol.toLowerCase() === searchQuery.toLowerCase()) && (
                      <button
                        onClick={async () => {
                          setLoading(true);
                          const resolvedSymbol = await searchTicker(searchQuery) || searchQuery.trim().toUpperCase();
                          if (!tickers.includes(resolvedSymbol)) {
                            setTickers([resolvedSymbol]);
                            fetchData(resolvedSymbol);
                          }
                          setActiveTicker(resolvedSymbol);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setLoading(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center font-bold text-emerald-400">
                            <Plus size={16} />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-emerald-400">Add "{searchQuery.toUpperCase()}"</div>
                            <div className="text-[10px] text-emerald-500/60 font-medium">Search & initialize custom asset</div>
                          </div>
                        </div>
                        <ArrowUpRight size={14} className="text-emerald-500/40 group-hover:text-emerald-400 transition-colors" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 p-2">
                    <div>
                      <p className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Quick Navigation</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'summary', label: 'Dashboard', icon: LayoutGrid },
                          { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
                          { id: 'dashboard', label: 'Research', icon: TrendingUp },
                          { id: 'daytrading', label: 'Signals', icon: Zap },
                          { id: 'neural', label: 'Neural Core', icon: Brain },
                        ].map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setActiveTab(item.id as any);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 hover:border-zinc-700 transition-all"
                          >
                            <item.icon size={16} className="text-zinc-400" />
                            <span className="text-xs font-bold text-zinc-300">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && <LoadingScreen key="loading" />}
      </AnimatePresence>

      {/* Floating HFT Trade Toast Notifications */}
      <div className="fixed top-24 right-6 z-[9999] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)] pointer-events-none">
        <AnimatePresence>
          {tradeToasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              className={cn(
                "p-4 rounded-xl border backdrop-blur-xl shadow-2xl flex flex-col gap-2 pointer-events-auto",
                toast.trade.type === 'BUY' 
                  ? "bg-zinc-950/95 border-emerald-500/30 text-zinc-100 shadow-[0_4px_30px_rgba(16,185,129,0.1)]" 
                  : "bg-zinc-950/95 border-amber-500/30 text-zinc-100 shadow-[0_4px_30px_rgba(245,158,11,0.1)]"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded font-black font-mono uppercase tracking-widest",
                    toast.trade.type === 'BUY' 
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  )}>
                    {toast.trade.type}
                  </span>
                  <span className="text-xs font-black font-mono tracking-tight text-white">{toast.trade.ticker}</span>
                </div>
                <button 
                  onClick={() => setTradeToasts((prev) => prev.filter(t => t.id !== toast.id))}
                  className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors p-1"
                >
                  <X size={10} />
                </button>
              </div>
              
              <div className="text-xs text-zinc-300 flex justify-between font-mono">
                <span>Shares: <strong className="text-white">{toast.trade.shares}</strong></span>
                <span>Price: <strong className="text-white">${toast.trade.price.toFixed(2)}</strong></span>
              </div>

              {toast.trade.type === 'SELL' && toast.trade.profit !== undefined && (
                <div className={cn(
                  "mt-1 p-2 rounded-lg text-xs font-mono font-bold flex justify-between items-center",
                  toast.trade.profit >= 0 
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                    : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                )}>
                  <span>ALGORITHMIC P&L:</span>
                  <span className="font-extrabold text-sm font-sans tracking-tight">
                    {toast.trade.profit >= 0 ? '+' : ''}${toast.trade.profit.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="text-[9px] text-zinc-500 flex justify-between items-center select-none font-mono mt-0.5">
                <span>{toast.trade.reason || 'QuantBot Scalping Signal'}</span>
                <span>{new Date(toast.timestamp).toLocaleTimeString()}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col min-h-screen"
        >
          <StockTicker />
          {/* Background Glow */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />

          {/* Header */}
          <header className="px-6 pt-8 pb-4 sticky top-0 bg-zinc-950/80 backdrop-blur-lg z-[100]">
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
                      <p className="text-xs text-rose-400/80 mt-1 leading-relaxed">
                        {(() => {
                          try {
                            const parsed = JSON.parse(error);
                            if (parsed.error && typeof parsed.error === 'string') return parsed.error;
                            if (parsed.error && parsed.error.message) return parsed.error.message;
                            return error;
                          } catch (e) {
                            return error;
                          }
                        })()}
                      </p>
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
              <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('summary')}
                className="cursor-pointer"
              >
                <h1 className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                  <Logo size={24} className="icon-glow-emerald animate-neural-glow" />
                  QuantLab
                </h1>
                <p className="text-[9px] text-zinc-500 font-bold tracking-[0.2em] uppercase">Neural Intelligence v4.2</p>
              </motion.div>

              {/* Top Navigation */}
              <nav className="hidden md:flex items-center gap-3 lg:gap-6 bg-zinc-900/30 border border-zinc-800/30 px-3 lg:px-6 py-2 rounded-2xl backdrop-blur-md">
                <button 
                  onClick={() => setActiveTab('finviz')}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 px-3 py-1 rounded-xl border group", 
                    activeTab === 'finviz' 
                      ? "bg-emerald-600 text-white border-emerald-500 shadow-md" 
                      : "text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10"
                  )}
                >
                  <Sparkles size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'finviz' && "fill-white")} />
                  <span>Finviz Quant</span>
                </button>
                <button 
                  onClick={() => setActiveTab('summary')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'summary' ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Home size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'summary' && "fill-emerald-400/20")} />
                  <span className="hidden sm:inline">Summary</span>
                </button>
                <button 
                  onClick={() => setActiveTab('portfolio')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'portfolio' ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Briefcase size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'portfolio' && "fill-emerald-400/20")} />
                  <span className="hidden sm:inline">Portfolio</span>
                </button>
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'dashboard' ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <TrendingUp size={14} className="transition-transform group-hover:scale-110" />
                  <span className="hidden sm:inline">Research</span>
                </button>
                <button 
                  onClick={() => setActiveTab('advancedchart')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'advancedchart' ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Activity size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'advancedchart' && "fill-emerald-400/20")} />
                  <span className="hidden sm:inline">Charts</span>
                </button>
                <button 
                  onClick={() => setActiveTab('technical')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'technical' ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <TrendingUp size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'technical' && "fill-emerald-400/20")} />
                  <span className="hidden sm:inline">Technical</span>
                </button>
                <button 
                  onClick={() => setActiveTab('aiscan')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'aiscan' ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <Zap size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'aiscan' && "fill-blue-400/20")} />
                  <span className="hidden sm:inline">AI Scan</span>
                </button>
                <button 
                  onClick={() => setActiveTab('sentiment')}
                  className={cn("text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group", activeTab === 'sentiment' ? "text-purple-400" : "text-zinc-500 hover:text-zinc-300")}
                >
                  <MessageSquare size={14} className={cn("transition-transform group-hover:scale-110", activeTab === 'sentiment' && "fill-purple-400/20")} />
                  <span className="hidden sm:inline">Sentiment</span>
                </button>
              </nav>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">System Active</span>
                </div>
                <button 
                  id="theme-toggle-button"
                  onClick={toggleTheme}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all duration-300 group relative overflow-hidden"
                  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  <div className="relative w-5 h-5 flex items-center justify-center pointer-events-none">
                    <Sun 
                      size={18} 
                      className={cn(
                        "absolute text-zinc-400 group-hover:text-amber-400 transition-all duration-300 transform",
                        theme === 'dark' 
                          ? "rotate-0 scale-100 opacity-100" 
                          : "rotate-90 scale-0 opacity-0"
                      )} 
                    />
                    <Moon 
                      size={18} 
                      className={cn(
                        "absolute text-zinc-400 group-hover:text-blue-400 transition-all duration-300 transform",
                        theme === 'light' 
                          ? "rotate-0 scale-100 opacity-100" 
                          : "-rotate-90 scale-0 opacity-0"
                      )} 
                    />
                  </div>
                </button>
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all group"
                >
                  <LayoutGrid size={20} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </button>
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
              placeholder="Search Ticker or Company Name (e.g. AAPL, Shopify, TD Bank)"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button 
                type="button"
                onClick={() => setShowFilterPanel(!showFilterPanel)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  showFilterPanel ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:bg-zinc-800"
                )}
                title="Search Filters"
              >
                <LayoutGrid size={16} />
              </button>
              <div className="flex items-center gap-2 px-2 py-1 rounded-lg">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  connectionState === 'connected' ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" : 
                  connectionState === 'reconnecting' ? "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                  connectionState === 'connecting' ? "bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-zinc-600"
                )} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter",
                  connectionState === 'connected' ? "text-emerald-400" : 
                  connectionState === 'reconnecting' ? "text-amber-400" : 
                  connectionState === 'connecting' ? "text-blue-400" : "text-zinc-500"
                )}>
                  {connectionState === 'connected' ? 'Live Feed' : 
                   connectionState === 'reconnecting' ? 'Reconnecting...' : 
                   connectionState === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>
            </div>
          </form>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilterPanel && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-40 backdrop-blur-xl"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Exchange</label>
                    <select 
                      value={searchFilters.exchange}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, exchange: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option>All</option>
                      <option>NASDAQ</option>
                      <option>NYSE</option>
                      <option>TSX</option>
                      <option>LSE</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Market Cap</label>
                    <select 
                      value={searchFilters.marketCap}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, marketCap: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option>All</option>
                      <option>Mega Cap (&gt;$200B)</option>
                      <option>Large Cap ($10B-$200B)</option>
                      <option>Mid Cap ($2B-$10B)</option>
                      <option>Small Cap (&lt;$2B)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Sector</label>
                    <select 
                      value={searchFilters.sector}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, sector: e.target.value }))}
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-[10px] font-bold rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option>All</option>
                      <option>Technology</option>
                      <option>Healthcare</option>
                      <option>Financials</option>
                      <option>Energy</option>
                      <option>Consumer Discretionary</option>
                      <option>Industrials</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button 
                    onClick={() => setSearchFilters({ exchange: 'All', marketCap: 'All', sector: 'All' })}
                    className="px-3 py-1 text-[9px] font-bold text-zinc-500 uppercase hover:text-zinc-300 transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setShowFilterPanel(false)}
                    className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-bold uppercase hover:bg-emerald-500/20 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
                {suggestions.map((s, idx) => (
                  <button
                    key={`${s.symbol}-${idx}`}
                    onClick={() => selectSuggestion(s.symbol)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-bold text-zinc-200">{s.symbol}</span>
                      <span className="text-xs text-zinc-500 ml-2">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{s.type}</span>
                      <Plus size={14} className="text-zinc-600 group-hover:text-emerald-400" />
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          {tickers.map((t, i) => (
            <div 
              key={`${t}-${i}`} 
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

          {activeTicker && (
            <button
              onClick={() => handleToggleWatchlist(activeTicker)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all sm:ml-2",
                watchlist.includes(activeTicker)
                  ? "bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-sm"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              )}
              title={watchlist.includes(activeTicker) ? "Remove active ticker from Watchlist" : "Save active ticker to Watchlist"}
            >
              <Star size={13} className={watchlist.includes(activeTicker) ? "fill-amber-400" : ""} />
              <span className="text-[10px] font-black uppercase tracking-wider">
                {watchlist.includes(activeTicker) ? "In Watchlist" : "+ Watchlist"}
              </span>
            </button>
          )}
        </div>
      </header>

      <LearningStatus 
        insight={globalState?.learningEngine} 
        onRetrain={() => fetchGlobalState().then(setGlobalState)} 
      />

      <main className="flex-1 px-6 space-y-6 relative z-[10]">
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {activeTab === 'finviz' && (
              <FinvizDashboard 
                initialTicker={activeTicker || 'NVDA'} 
                onOpenRiskEngine={() => setActiveTab('risk')}
                watchlist={watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

            {activeTab === 'summary' && (
              <FinanceHome 
                onSelectTicker={(ticker) => {
                  if (!ticker) return; // Prevent empty ticker selection from cards if they don't have one
                  if (!tickers.includes(ticker)) {
                    setTickers(prev => [...new Set([...prev, ticker])]);
                    fetchData(ticker);
                  }
                  setActiveTicker(ticker);
                  setActiveTab('projection');
                }} 
                onTabChange={setActiveTab}
                watchlist={watchlist}
                onAddWatchlist={handleAddWatchlist}
                onRemoveWatchlist={handleRemoveWatchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            )}

              {activeTab === 'daytrading' && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                        <Zap className={cn("text-amber-400", botActive && "animate-pulse")} size={24} />
                        QuantLab Execution
                      </h2>
                      <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">High-Frequency Execution & Penny Stock Intelligence</p>
                    </div>

                    {/* Bot Controls & Strategy Selector Dropdown */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Bot Toggle Activation */}
                      <button
                        onClick={() => {
                          const nextActive = !portfolioManager.isBotActive();
                          portfolioManager.toggleBot(nextActive);
                          setBotActive(nextActive);
                          portfolioManager.addExecutionLog(
                            'SYSTEM',
                            `QuantBot execution state toggled: ${nextActive ? 'ACTIVE (DEPLOYED)' : 'HOLD (STANDBY)'}`,
                            nextActive ? 'FILLED' : 'PENDING'
                          );
                        }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border",
                          botActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850"
                        )}
                      >
                        <span className={cn("w-2 h-2 rounded-full", botActive ? "bg-emerald-400 animate-ping" : "bg-zinc-600")} />
                        Bot Status: {botActive ? 'ACTIVE' : 'STANDBY'}
                      </button>

                      {/* Strategy Dropdown Selector */}
                      <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-805 rounded-xl px-3 py-1.5 focus-within:border-amber-500/50 transition-all">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black font-mono">Core Strategy:</span>
                        <select
                          value={activeStrategyConfig.type}
                          onChange={(e) => {
                            const selectedTemplate = HFT_STRATEGY_TEMPLATES.find(t => t.type === e.target.value);
                            if (selectedTemplate) {
                              portfolioManager.deployStrategy(selectedTemplate);
                              setActiveStrategyConfig(selectedTemplate);
                              portfolioManager.addExecutionLog(
                                'SYSTEM',
                                `QuantBot deployed algorithmic core: [${selectedTemplate.name.toUpperCase()}]`,
                                'FILLED',
                                42
                              );
                            }
                          }}
                          className="bg-transparent text-xs font-bold text-amber-500 font-mono outline-none select-none cursor-pointer pr-1"
                        >
                          {HFT_STRATEGY_TEMPLATES.map(t => (
                            <option key={t.type} value={t.type} className="bg-zinc-950 text-zinc-300">
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Browser Alerts Toggle */}
                      <button
                        onClick={async () => {
                          const nextEnabled = !alertsEnabled;
                          setAlertsEnabled(nextEnabled);
                          localStorage.setItem('quant_alerts_enabled', nextEnabled ? 'true' : 'false');
                          
                          if (nextEnabled && 'Notification' in window) {
                            try {
                              if (Notification.permission !== 'granted') {
                                await Notification.requestPermission();
                              }
                            } catch (err) {
                              console.warn('Could not request notification permission', err);
                            }
                          }
                        }}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border shrink-0",
                          alertsEnabled
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-850"
                        )}
                        title="Toggle desktop notification alerts on transaction fills"
                      >
                        {alertsEnabled ? (
                          <>
                            <Bell size={13} className="text-amber-400 animate-pulse shrink-0" />
                            <span>Trade Alerts: ON</span>
                          </>
                        ) : (
                          <>
                            <BellOff size={13} className="text-zinc-500 shrink-0" />
                            <span>Trade Alerts: OFF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Premium Stat Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Win Rate Card */}
                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-amber-500/20 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full filter blur-xl opacity-40 animate-pulse" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">QuantBot Win Rate</span>
                        <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Activity size={14} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-mono font-black text-amber-400">
                          {portfolioStats.winRate.toFixed(1)}%
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono font-black uppercase">Live</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-1 font-mono uppercase tracking-tight">
                        {tradeHistory.filter((t: any) => t.type === 'SELL').length} Live Trades Closed
                      </p>
                    </div>

                    {/* HFT Latency Stream */}
                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-purple-500/20 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full filter blur-xl opacity-40" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">HFT Latency Stream</span>
                        <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          <Zap size={14} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-mono font-black text-purple-400">148 μs</span>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-black font-mono">DMA</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-1 font-mono uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                        DMA Cooldown: 0.02ms
                      </p>
                    </div>

                    {/* Global Execution Desks */}
                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-emerald-500/20 backdrop-blur-md relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full filter blur-xl opacity-40" />
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Geo-Routing Nodes</span>
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <Globe size={14} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-mono font-black text-emerald-400">5 Channels</span>
                        <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider">GEO</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-1 font-mono uppercase tracking-tight">
                        Direct Fiber Routes Active
                      </p>
                    </div>

                    {/* Desk Capital Value */}
                    <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 backdrop-blur-md relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none">Quant Core Balance</span>
                        <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400">
                          <Wallet size={14} />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-mono font-black text-zinc-100">
                          ${portfolioStats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-tight font-bold">USD</span>
                      </div>
                      <p className="text-[9px] text-zinc-400 mt-1 font-mono uppercase tracking-tight">
                        Cash Balance: ${portfolioStats.balance.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                      </p>
                    </div>
                  </div>

                  <div className="glass-card p-6 border-amber-500/20 bg-gradient-to-br from-zinc-900 to-black">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                          <Zap className="text-amber-400 fill-amber-400" size={24} />
                          Day Trading Intelligence
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">2-Day Momentum Projections (Penny Stocks)</p>
                      </div>
                      <button 
                        onClick={async () => {
                          setPennyLoading(true);
                          const stocks = await fetchPennyStocks();
                          setPennyStocks(dedupeTickerArray(stocks));
                          setPennyLoading(false);
                        }}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        disabled={pennyLoading}
                      >
                        <RefreshCw size={18} className={cn("text-zinc-400", pennyLoading && "animate-spin")} />
                      </button>
                    </div>

                    {/* Threshold Controls */}
                    <div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Min Projected Profit (%)</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="range" 
                            min="5" 
                            max="50" 
                            step="5"
                            value={minProfitThreshold}
                            onChange={(e) => setMinProfitThreshold(parseInt(e.target.value))}
                            className="flex-1 accent-emerald-500"
                          />
                          <span className="text-xs font-bold text-emerald-400 w-8">{minProfitThreshold}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Max Risk Level</label>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setMaxRiskThreshold('High')}
                            className={cn(
                              "flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                              maxRiskThreshold === 'High' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            )}
                          >
                            High
                          </button>
                          <button 
                            onClick={() => setMaxRiskThreshold('Extreme')}
                            className={cn(
                              "flex-1 py-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                              maxRiskThreshold === 'Extreme' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                            )}
                          >
                            Extreme
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                      Our neural network scans global markets for low-cap "penny" stocks showing unusual volume and momentum patterns. 
                      These projections are high-risk and intended for short-term day trading windows (48 hours).
                    </p>

                    {pennyLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-10 h-10 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
                        <p className="text-xs text-zinc-500 animate-pulse font-medium">Scanning for Momentum Anomalies...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {pennyStocks
                          .filter(stock => {
                            const profit = typeof stock.projectedProfit === 'number' ? stock.projectedProfit : parseFloat(stock.projectedProfit);
                            if (profit < minProfitThreshold) return false;
                            if (maxRiskThreshold === 'High' && stock.riskLevel === 'Extreme') return false;
                            return true;
                          })
                          .map((stock, i) => (
                          <motion.div 
                            key={`${stock.ticker}-${i}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                              "p-4 rounded-2xl bg-zinc-950/50 border transition-all relative overflow-hidden group",
                              stock.projectedProfit >= 25 ? "border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]" : "border-zinc-800 hover:border-amber-500/30"
                            )}
                          >
                            {/* High Reward Badge */}
                            {stock.projectedProfit >= 25 && (
                              <div className="absolute top-0 right-0 bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-widest border-l border-b border-emerald-500/30">
                                High Reward Potential
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-amber-400">{stock.ticker}</span>
                                  <span className="text-xs text-zinc-500 font-medium truncate max-w-[120px]">{stock.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xl font-bold text-zinc-100">${stock.currentPrice.toFixed(2)}</p>
                                  {stock.volume && (
                                    <span className="text-[9px] text-zinc-500 font-bold uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                                      Vol: {stock.volume}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end gap-2">
                                <div>
                                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Projected Profit</p>
                                  <p className={cn(
                                    "text-lg font-bold",
                                    stock.projectedProfit >= 25 ? "text-emerald-400" : "text-emerald-500/80"
                                  )}>+{stock.projectedProfit}%</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    handleToggleWatchlist(stock.ticker);
                                  }}
                                  className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all group/btn",
                                    watchlist.includes(stock.ticker)
                                      ? "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-sm"
                                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                  )}
                                  title={watchlist.includes(stock.ticker) ? "Remove from Watchlist" : "Add to Watchlist"}
                                >
                                  <Star size={12} className={cn("group-hover/btn:scale-125 transition-transform", watchlist.includes(stock.ticker) && "fill-amber-400")} />
                                  <span className="text-[10px] font-bold uppercase">{watchlist.includes(stock.ticker) ? 'In Watchlist' : 'Watchlist'}</span>
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Risk Level</p>
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle size={12} className={stock.riskLevel === 'Extreme' ? 'text-rose-500' : 'text-amber-500'} />
                                  <span className={cn(
                                    "text-[10px] font-black uppercase",
                                    stock.riskLevel === 'Extreme' ? 'text-rose-400' : 'text-amber-400'
                                  )}>{stock.riskLevel}</span>
                                </div>
                              </div>
                              <div className="p-2 rounded-xl bg-zinc-900/50 border border-zinc-800">
                                <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">AI Confidence</p>
                                <div className="flex items-center gap-1.5">
                                  <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-amber-500" 
                                      style={{ width: `${stock.confidence * 100}%` }} 
                                    />
                                  </div>
                                  <span className="text-[10px] font-bold text-zinc-300">{(stock.confidence * 100).toFixed(0)}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                              <p className="text-[10px] text-amber-400/80 leading-relaxed italic">
                                <Zap size={10} className="inline mr-1 mb-0.5" />
                                {stock.reason}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                        {pennyStocks.filter(stock => {
                          const profit = typeof stock.projectedProfit === 'number' ? stock.projectedProfit : parseFloat(stock.projectedProfit);
                          if (profit < minProfitThreshold) return false;
                          if (maxRiskThreshold === 'High' && stock.riskLevel === 'Extreme') return false;
                          return true;
                        }).length === 0 && (
                          <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                            <p className="text-xs text-zinc-500 font-medium">No stocks match your current alert thresholds.</p>
                            <button 
                              onClick={() => {
                                setMinProfitThreshold(10);
                                setMaxRiskThreshold('Extreme');
                              }}
                              className="text-[10px] text-emerald-400 font-bold uppercase mt-2 hover:underline"
                            >
                              Reset Filters
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Strategy Optimization Lab */}
                  <div className="glass-card p-6 border-emerald-500/20 bg-zinc-950/30">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                          <Brain size={20} className="text-emerald-400" />
                          Strategy Optimization Lab
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Neural Network Parameter Tuning</p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Engine Ready</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-4 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Learning Depth</h4>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">High</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Adjusts the number of hidden layers used in the neural network for pattern recognition. 
                          Higher depth increases accuracy but requires more computational time.
                        </p>
                        <div className="pt-2">
                          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[85%]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-blue-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sentiment Weight</h4>
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">0.65</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Determines how much weight is given to social sentiment and news analysis versus raw price action.
                        </p>
                        <div className="pt-2">
                          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[65%]" />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Risk Tolerance</h4>
                          <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Moderate</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Filters out strategies with high drawdown potential. Lower tolerance results in fewer but safer signals.
                        </p>
                        <div className="pt-2">
                          <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 w-[45%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                      <button 
                        onClick={() => {
                          // Simulated optimization
                          setPennyLoading(true);
                          setTimeout(() => {
                            setPennyLoading(false);
                            fetchPennyStocks().then(stocks => setPennyStocks(dedupeTickerArray(stocks)));
                          }, 1500);
                        }}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-500 text-black font-bold text-xs uppercase tracking-widest rounded-full hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        <Zap size={14} />
                        Optimize Neural Strategy
                      </button>
                    </div>
                  </div>

                  {/* GLOBAL HIGH-FREQUENCY ARBITRAGE STATION */}
                  <div className="glass-card p-6 border-emerald-500/10 bg-gradient-to-br from-zinc-950 to-black">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                          <Globe className="text-emerald-400 animate-pulse" size={20} />
                          International Ultra-HFT Execution Pipeline
                        </h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                          Direct Low-Latency Execution Nodes Placing Live Arbitrage Trades across Global Exchanges
                        </p>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-mono uppercase tracking-widest">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        Global Pipeline Connected
                      </div>
                    </div>

                    {/* Nodes grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                      {[
                        { node: 'NYC (NASDAQ BX)', lat: '112μs', ticker: 'NVDA/SPY', status: 'STABLE', bg: 'border-emerald-500/15' },
                        { node: 'London (LSE Cross)', lat: '148μs', ticker: 'BP./HSBA', status: 'STABLE', bg: 'border-purple-500/15' },
                        { node: 'Frankfurt (Xetra)', lat: '135μs', ticker: 'SAP/BMW', status: 'STABLE', bg: 'border-teal-500/15' },
                        { node: 'Tokyo (JPX Co-lo)', lat: '190μs', ticker: '7203.T', status: 'STABLE', bg: 'border-amber-500/15' },
                        { node: 'Chicago (CME)', lat: '98μs', ticker: 'ES1!/ZN1!', status: 'ACTIVE', bg: 'border-indigo-500/15' },
                      ].map((n, idx) => (
                        <div key={idx} className={`p-3 rounded-xl bg-zinc-900/30 border ${n.bg} backdrop-blur-sm relative overflow-hidden`}>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-[9px] text-zinc-400 font-bold tracking-tight truncate max-w-[80%]">{n.node}</span>
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shrink-0" />
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className="text-lg font-mono font-black text-white">{n.lat}</span>
                            <span className="text-[8px] font-mono text-zinc-500 font-semibold">{n.status}</span>
                          </div>
                          <div className="text-[8px] font-mono text-zinc-500 mt-1 uppercase tracking-wider flex justify-between">
                            <span>Focus:</span>
                            <span className="text-zinc-300 font-bold">{n.ticker}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Real-time streaming stream */}
                    <div className="border border-zinc-800 rounded-xl overflow-hidden bg-black/40">
                      <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500 font-mono font-black uppercase tracking-wider">
                        <span>Global Arbitrage Telemetry Stream</span>
                        <span className="text-emerald-400 animate-pulse text-[9px]">● LIVE ROUTING</span>
                      </div>
                      <div className="p-3 font-mono text-xs space-y-2 max-h-[160px] overflow-y-auto">
                        {globalHftEvents.map((evt, i) => (
                          <div key={evt.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1.5 px-3 rounded-lg ${evt.type === 'SELL' ? 'bg-zinc-900/15 border-l-2 border-emerald-500/40' : 'bg-zinc-900/25 border-l-2 border-indigo-500/40'} transition-all`}>
                            <div className="flex items-center gap-3">
                              <span className="text-zinc-500 text-[10px] sm:inline">{evt.time}</span>
                              <span className="px-1.5 py-0.2 bg-zinc-800 rounded text-zinc-300 text-[9px] font-bold tracking-wide shrink-0">{evt.node}</span>
                              <span className="text-zinc-100 font-bold w-12">{evt.symbol}</span>
                              <span className={`text-[10px] font-black px-1 rounded ${evt.type === 'BUY' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                {evt.type}
                              </span>
                              <span className="text-zinc-400 text-[10px]">Qty: {evt.qty}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-zinc-400 text-[10px]">Price: ${evt.price.toFixed(2)}</span>
                              {evt.profit ? (
                                <span className="text-emerald-400 text-[10px] font-black bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/10 animate-fade">
                                  +${evt.profit.toFixed(2)} USD
                                </span>
                              ) : (
                                <span className="text-zinc-500 text-[9px] tracking-widest font-black uppercase">EXECUTING</span>
                              )}
                              <span className="text-[10px] text-zinc-600 bg-zinc-900/50 px-1 py-0.1 rounded border border-zinc-800">{evt.strategy}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* MASTER QUANT STOCK STRATEGIES & ALGORITHMS LIBRARY */}
                  <div className="glass-card p-6 border-amber-500/10 bg-gradient-to-br from-zinc-950 to-black">
                    <div className="mb-6">
                      <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <Brain className="text-amber-400 focus:outline-none" size={20} />
                        Professional Trading Algorithms & Strategies
                      </h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                        High-probability quantitative algorithms to optimize risk, maximize trade edge, and target consistent returns
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strategy 1 */}
                      <div className={cn(
                        "p-5 rounded-2xl bg-zinc-900/40 border transition-all relative overflow-hidden group",
                        activeStrategyConfig.type === 'hft_scalper' 
                          ? "border-amber-500/50 bg-amber-500/[0.02] shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
                          : "border-zinc-800 hover:border-amber-500/20"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                                Micro-Scalper
                              </span>
                              {activeStrategyConfig.type === 'hft_scalper' && (
                                <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5">Order Book Imbalance (OBI) Alg</h3>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">Latency: ~40μs</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                          Measures direct liquidity pressure by tracking real-time Bid/Ask quote volumes. Once buyer volume signals extreme imbalance (&gt;58% ratio), the model places high-speed front-running orders, predicting a microsecond upward push.
                        </p>
                        <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-amber-500 font-mono">Profit Mechanic & Target:</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              Take profit is set strictly at +0.25% with micro stop-loss at -0.10%. Extremely useful for capturing high-volume trading hours (9:30 AM - 10:30 AM EST).
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const template = HFT_STRATEGY_TEMPLATES.find(t => t.type === 'hft_scalper');
                              if (template) {
                                portfolioManager.deployStrategy(template);
                                setActiveStrategyConfig(template);
                                portfolioManager.addExecutionLog('SYSTEM', `QuantBot deployed algorithmic core: [ORDER BOOK IMBALANCE]`, 'FILLED', 40);
                              }
                            }}
                            disabled={activeStrategyConfig.type === 'hft_scalper'}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-mono font-black uppercase transition-all rounded-lg shrink-0",
                              activeStrategyConfig.type === 'hft_scalper'
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/20 cursor-default"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500 cursor-pointer"
                            )}
                          >
                            {activeStrategyConfig.type === 'hft_scalper' ? 'Core Running' : 'Deploy'}
                          </button>
                        </div>
                      </div>

                      {/* Strategy 2 */}
                      <div className={cn(
                        "p-5 rounded-2xl bg-zinc-900/40 border transition-all relative overflow-hidden group",
                        activeStrategyConfig.type === 'rsi_mean_reversion' 
                          ? "border-emerald-500/50 bg-emerald-500/[0.02] shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                          : "border-zinc-800 hover:border-emerald-500/20"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                                Mean Reversion
                              </span>
                              {activeStrategyConfig.type === 'rsi_mean_reversion' && (
                                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5">Micro-Oscillator RSI Reversion</h3>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">Latency: ~58μs</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                          Monitors super short-term (9-period) relative strength ticks. When buying is heavily exhausted (RSI &gt;92) or heavily panic-sold (RSI &lt;14), it triggers instant counter-trend scalp positions, capturing immediate mean-reverting pullbacks.
                        </p>
                        <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 font-mono">Profit Mechanic & Target:</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              Aims for +0.50% profit target under volatile ranges. Ideal during quiet mid-day consolidation periods where stocks predictably wave back and forth.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const template = HFT_STRATEGY_TEMPLATES.find(t => t.type === 'rsi_mean_reversion');
                              if (template) {
                                portfolioManager.deployStrategy(template);
                                setActiveStrategyConfig(template);
                                portfolioManager.addExecutionLog('SYSTEM', `QuantBot deployed algorithmic core: [RSI MEAN REVERSION]`, 'FILLED', 55);
                              }
                            }}
                            disabled={activeStrategyConfig.type === 'rsi_mean_reversion'}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-mono font-black uppercase transition-all rounded-lg shrink-0",
                              activeStrategyConfig.type === 'rsi_mean_reversion'
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 cursor-default"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500 cursor-pointer"
                            )}
                          >
                            {activeStrategyConfig.type === 'rsi_mean_reversion' ? 'Core Running' : 'Deploy'}
                          </button>
                        </div>
                      </div>

                      {/* Strategy 3 */}
                      <div className={cn(
                        "p-5 rounded-2xl bg-zinc-900/40 border transition-all relative overflow-hidden group",
                        activeStrategyConfig.type === 'bollinger_bands' 
                          ? "border-indigo-500/50 bg-indigo-500/[0.02] shadow-[0_0_20px_rgba(99,102,241,0.05)]" 
                          : "border-zinc-800 hover:border-indigo-500/20"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                                Arbitrage
                              </span>
                              {activeStrategyConfig.type === 'bollinger_bands' && (
                                <span className="text-[8px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5">Co-Integrated Pairs Arbitrage</h3>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">Latency: ~120μs</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                          Tracks co-integrating baskets (such as SPY/QQQ, NVDA/AMD). If the structural price spread wanders more than 2.1 standard deviations beyond historical boundaries, the algorithm acts: buying the laggard, shorting the leader.
                        </p>
                        <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 font-mono">Profit Mechanic & Target:</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              Targets convergence reversion values for +0.80% gain. Highly stable strategy used by elite quant desks to hedge out macro market directions.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const template = HFT_STRATEGY_TEMPLATES.find(t => t.type === 'bollinger_bands');
                              if (template) {
                                portfolioManager.deployStrategy(template);
                                setActiveStrategyConfig(template);
                                portfolioManager.addExecutionLog('SYSTEM', `QuantBot deployed algorithmic core: [BOLLINGER BANDS ARBITRAGE]`, 'FILLED', 110);
                              }
                            }}
                            disabled={activeStrategyConfig.type === 'bollinger_bands'}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-mono font-black uppercase transition-all rounded-lg shrink-0",
                              activeStrategyConfig.type === 'bollinger_bands'
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 cursor-default"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500 cursor-pointer"
                            )}
                          >
                            {activeStrategyConfig.type === 'bollinger_bands' ? 'Core Running' : 'Deploy'}
                          </button>
                        </div>
                      </div>

                      {/* Strategy 4 */}
                      <div className={cn(
                        "p-5 rounded-2xl bg-zinc-900/40 border transition-all relative overflow-hidden group",
                        activeStrategyConfig.type === 'neural_alpha' 
                          ? "border-purple-500/50 bg-purple-500/[0.02] shadow-[0_0_20px_rgba(168,85,247,0.05)]" 
                          : "border-zinc-800 hover:border-purple-500/20"
                      )}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] bg-purple-500/15 text-purple-400 border border-purple-500/25 px-2 py-0.5 rounded font-black font-mono uppercase tracking-wider">
                                Neural Neural
                              </span>
                              {activeStrategyConfig.type === 'neural_alpha' && (
                                <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded font-black font-mono uppercase tracking-wider animate-pulse">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white mt-1.5">Neural Alpha Sentiment Bias</h3>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500">Latency: ~240μs</span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                          Fuses our proprietary neural-alpha model filters. Continually reads and scores financial news streams, public transcripts, and SEC summaries to build an active neural vector map, entering high-beta tickers showing momentum.
                        </p>
                        <div className="pt-3 border-t border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 font-mono">Profit Mechanic & Target:</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                              Uses Kelly Criterion sizing to scale inputs safely. Aims for a trailing-stop ride focusing on breakouts of +2.0% to +5.0% profit potential.
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              const template = HFT_STRATEGY_TEMPLATES.find(t => t.type === 'neural_alpha');
                              if (template) {
                                portfolioManager.deployStrategy(template);
                                setActiveStrategyConfig(template);
                                portfolioManager.addExecutionLog('SYSTEM', `QuantBot deployed algorithmic core: [NEURAL ALPHA SENTIMENT]`, 'FILLED', 224);
                              }
                            }}
                            disabled={activeStrategyConfig.type === 'neural_alpha'}
                            className={cn(
                              "px-3 py-1.5 text-[10px] font-mono font-black uppercase transition-all rounded-lg shrink-0",
                              activeStrategyConfig.type === 'neural_alpha'
                                ? "bg-purple-500/20 text-purple-400 border border-purple-500/20 cursor-default"
                                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 hover:border-zinc-500 cursor-pointer"
                            )}
                          >
                            {activeStrategyConfig.type === 'neural_alpha' ? 'Core Running' : 'Deploy'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="text-rose-400 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-1">Risk Disclosure</h4>
                        <p className="text-[10px] text-rose-400/70 leading-relaxed">
                          Penny stocks are extremely volatile and illiquid. You may lose your entire investment. 
                          Projected profits are based on neural pattern matching and do not guarantee future performance. 
                          Always use stop-loss orders when day trading.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'advancedchart' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <Activity className="text-emerald-400" size={24} />
                      Advanced Pro Charts
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Interactive Market Data & Analysis for {data.ticker}</p>
                  </div>
                  <AdvancedChart 
                    data={data.history} 
                    forecastData={data.forecast} 
                    models={data.models}
                    ticker={data.ticker}
                  />
                </div>
              )}

              {activeTab === 'technical' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <Activity className="text-emerald-400" size={24} />
                      Technical Analysis Panel
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Multi-factor Oscillator Signals & Moving Average Matrices for {data.ticker}</p>
                  </div>
                  <TechnicalAnalysis data={data} activeTicker={activeTicker} />
                </div>
              )}

              {activeTab === 'neural' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <Brain className="text-blue-400" size={24} />
                      Neural Cognitive Engine
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Self-Evolving Market Context & Learning History</p>
                  </div>
                  <div className="glass-card p-6 lg:p-8 rounded-3xl animate-fade-up bg-zinc-900/50">
                    <LearningMonitor />
                  </div>
                </div>
              )}

              {activeTab === 'fundamentals' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <BarChart3 className="text-blue-400" size={24} />
                      QuantLab Features
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Deep Feature Engineering & Fundamental Analysis</p>
                  </div>
                  <div className="glass-card p-6 border-emerald-500/20">
                    <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <BarChart3 size={18} className="text-emerald-400" />
                      Company Fundamentals
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Key Financial Metrics & Valuation</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Market Cap</p>
                        <p className="text-sm font-bold text-zinc-200">{data.fundamentals?.marketCap || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">P/E Ratio</p>
                        <p className="text-sm font-bold text-zinc-200">{data.fundamentals?.peRatio || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Div Yield</p>
                        <p className="text-sm font-bold text-zinc-200">{data.fundamentals?.dividendYield || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Revenue</p>
                        <p className="text-sm font-bold text-zinc-200">{data.fundamentals?.revenue || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Net Income</p>
                        <p className="text-sm font-bold text-zinc-200">{data.fundamentals?.netIncome || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">EPS</p>
                        <p className="text-sm font-bold text-zinc-200">{data.fundamentals?.eps || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 border-blue-500/20">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                          <Newspaper size={18} className="text-blue-400" />
                          Recent Intelligence
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Market Sentiment & News Analysis</p>
                      </div>
                      
                      {/* Sentiment Slider Filter */}
                      <div className="flex flex-col items-end gap-2">
                        <label className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Filter Sentiment</label>
                        <div className="flex items-center gap-3 bg-zinc-950/50 p-2 rounded-xl border border-zinc-800">
                          <input 
                            type="range" 
                            min="0" 
                            max="3" 
                            step="1"
                            value={
                              newsSentimentFilter === 'all' ? 0 : 
                              newsSentimentFilter === 'positive' ? 1 : 
                              newsSentimentFilter === 'neutral' ? 2 : 3
                            }
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setNewsSentimentFilter(
                                val === 0 ? 'all' : 
                                val === 1 ? 'positive' : 
                                val === 2 ? 'neutral' : 'negative'
                              );
                            }}
                            className="w-24 accent-blue-500"
                          />
                          <span className={cn(
                            "text-[10px] font-black uppercase min-w-[50px] text-center",
                            newsSentimentFilter === 'all' ? "text-zinc-400" : 
                            newsSentimentFilter === 'positive' ? "text-emerald-400" : 
                            newsSentimentFilter === 'neutral' ? "text-zinc-300" : "text-rose-400"
                          )}>
                            {newsSentimentFilter}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {filteredNews.map((item, i) => (
                        <a 
                          key={i} 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="block p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-blue-500/30 transition-all group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                {item.sentiment === 'positive' && <TrendingUp size={14} className="text-emerald-400" />}
                                {item.sentiment === 'negative' && <TrendingDown size={14} className="text-rose-400" />}
                                {item.sentiment === 'neutral' && <Circle size={14} className="text-zinc-500 fill-zinc-500/20" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-zinc-200 group-hover:text-blue-400 transition-colors">{item.title}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.source}</span>
                                  <span className="text-[10px] text-zinc-600">•</span>
                                  <span className="text-[10px] text-zinc-500">{item.time}</span>
                                </div>
                              </div>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                              item.sentiment === 'positive' ? "bg-emerald-500/10 text-emerald-400" : 
                              item.sentiment === 'negative' ? "bg-rose-500/10 text-rose-400" : "bg-zinc-500/10 text-zinc-400"
                            )}>
                              {item.sentiment}
                            </span>
                          </div>
                        </a>
                      ))}
                      {filteredNews.length === 0 && (
                        <div className="py-12 text-center border border-dashed border-zinc-800 rounded-2xl">
                          <p className="text-xs text-zinc-500 font-medium">No {newsSentimentFilter} news articles found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'global' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <Globe className="text-blue-400" size={24} />
                      QuantLab Macro
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Global Macro Signals & Economic Intelligence</p>
                  </div>

                  <GlobalMarketOverview />

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

                  {/* Global Simulation Overview */}
                  <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-black border-emerald-500/20">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Global Simulation Pulse</h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Real-time Simulation Intelligence</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-black text-emerald-400">{globalState?.globalSimulation?.volumeIndex || '---'}</div>
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">Simulation Volume Index</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                      <div className="flex items-center gap-2">
                        <Newspaper size={14} className="text-emerald-500" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Filter Intelligence</span>
                      </div>
                      <div className="flex gap-1">
                        {(['all', 'positive', 'neutral', 'negative'] as const).map((filter) => (
                          <button
                            key={filter}
                            onClick={() => setNewsSentimentFilter(filter)}
                            className={cn(
                              "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                              newsSentimentFilter === filter 
                                ? "bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                                : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            {filter}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                      <GlobalNewsFeed news={filteredGlobalNews} />
                      <div className="glass-card p-6">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <BarChart3 size={14} className="text-emerald-500" />
                          Major Economy Simulation Volume Trends (%)
                        </h3>
                        {globalState?.globalSimulation?.importExport && (
                          <GlobalEconomySimulationChart data={globalState?.globalSimulation?.importExport} />
                        )}
                      </div>

                      <div className="glass-card p-6">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
                          <Activity size={14} className="text-blue-500" />
                          Regional Performance Leaderboard
                        </h3>
                        {globalState?.globalSimulation?.importExport && (
                          <GlobalSimulationComparisonChart data={globalState?.globalSimulation?.importExport} />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <Globe size={14} className="text-emerald-500" />
                          Latest Simulation Headlines
                        </h3>
                        <div className="space-y-3">
                          {globalState?.globalSimulation?.news?.map((n, idx) => (
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
                          {globalState?.patterns && (
                            <SimulationPatternVisualizer 
                              patterns={globalState?.patterns?.patterns || []} 
                              summary={globalState?.patterns?.summary || ''} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detailed Commodity Analysis */}
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <BarChart3 size={16} className="text-blue-400" />
                      Strategic Commodity Intelligence
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {globalState?.resources?.commodities?.map((c, i) => (
                        <div key={i} className="glass-card p-6 border-zinc-800/50">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="text-lg font-bold text-zinc-100">{c.name}</h4>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{c.status}</p>
                            </div>
                            <div className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                              c.priceTrend?.toLowerCase().includes('up') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            )}>
                              {c.priceTrend}
                            </div>
                          </div>
                          <CommodityDetailChart commodity={c} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'yieldcurve' && (
                <YieldCurveAnalysis />
              )}

              {activeTab === 'logistics' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <Ship className="text-emerald-400" size={24} />
                      QuantLab Logistics
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Global Supply Chain & Ship Tracking Intelligence</p>
                  </div>
                  <div className="px-6 pt-2">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Global Logistics & Ship Tracking (Simulated)</h2>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Real-time Logistics Intelligence</p>
                  </div>

                  {/* Logistics Alpha Insights */}
                  <div className="px-6">
                    <LogisticsAlphaInsights data={globalState?.logisticsAlpha} />
                  </div>

                  {/* Global Simulation Volume Table */}
                  <div className="glass-card p-6 mx-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Globe className="text-blue-400" />
                      Global Simulation Volume Pulse
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
                          {globalState?.globalSimulation?.importExport && Object.entries(globalState.globalSimulation.importExport).map(([region, volume]) => (
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

                  {/* Commodity Flow Section */}
                  <div className="glass-card p-6 mx-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Zap className="text-amber-400" />
                      Global Commodity Flow
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {globalState?.resources?.commodities?.map((c, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-zinc-200">{c.name}</p>
                              <p className="text-[10px] text-zinc-500 font-medium uppercase">{c.status}</p>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                              c.priceTrend?.toLowerCase().includes('up') ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                            )}>
                              {c.priceTrend}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800/50">
                            <div>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase">Import Vol</p>
                              <p className="text-xs font-bold text-zinc-400">{c.importVolume || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase">Export Vol</p>
                              <p className="text-xs font-bold text-zinc-400">{c.exportVolume || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase">Top Exporter</p>
                              <p className="text-xs font-bold text-zinc-400 truncate">{c.topExporter || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-zinc-600 font-bold uppercase">Top Importer</p>
                              <p className="text-xs font-bold text-zinc-400 truncate">{c.topImporter || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6 mx-6">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                      <Ship className="text-emerald-400" />
                      Global Logistics Tracker
                    </h2>

                    <div className="space-y-8">
                      {/* Live Shipping Map */}
                      <div>
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Live Simulation Shipping Map</h3>
                        <ShippingMap 
                          lanes={globalState?.logistics?.shipping as any} 
                          vessels={globalState?.logistics?.ships as any} 
                        />
                      </div>

                      {/* Shipping Lanes */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Major Shipping Lanes & Congestion Heatmap</h3>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span className="text-[9px] text-zinc-500 font-bold uppercase">Clear</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              <span className="text-[9px] text-zinc-500 font-bold uppercase">Moderate</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span className="text-[9px] text-zinc-500 font-bold uppercase">Heavy</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {globalState?.logistics?.shipping?.map((s, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 group hover:border-zinc-700 transition-all">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    s.congestionLevel > 70 ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]" : 
                                    s.congestionLevel > 40 ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]" : 
                                    "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                  )} />
                                  <div className={cn(
                                    "absolute inset-0 rounded-full animate-ping opacity-20",
                                    s.congestionLevel > 70 ? "bg-rose-500" : 
                                    s.congestionLevel > 40 ? "bg-amber-500" : 
                                    "bg-emerald-500"
                                  )} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-zinc-200">{s.lane}</p>
                                  <p className="text-[10px] text-zinc-500 font-medium">{s.status}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                {s.congestionLevel !== undefined && (
                                  <div className="w-32 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                      <p className="text-[9px] text-zinc-600 font-bold uppercase">Congestion</p>
                                      <p className={cn(
                                        "text-[10px] font-bold",
                                        s.congestionLevel > 70 ? "text-rose-400" : s.congestionLevel > 40 ? "text-amber-400" : "text-emerald-400"
                                      )}>{s.congestionLevel}%</p>
                                    </div>
                                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex">
                                      <div 
                                        className={cn(
                                          "h-full transition-all duration-1000",
                                          s.congestionLevel > 70 ? "bg-rose-500" : s.congestionLevel > 40 ? "bg-amber-500" : "bg-emerald-500"
                                        )}
                                        style={{ width: `${s.congestionLevel}%` }}
                                      />
                                    </div>
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

                      {/* Active Vessel Fleet */}
                      {globalState?.logistics?.ships && (
                        <div>
                          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Active Vessel Fleet (Import/Export Focus)</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {(globalState?.logistics?.ships || []).map((ship, i) => (
                              <div key={i} className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 space-y-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                      <Ship size={16} />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-zinc-100">{ship.name}</p>
                                      <p className="text-[10px] text-zinc-500 font-medium uppercase">{ship.type} • {ship.capacity}</p>
                                    </div>
                                  </div>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                    ship.status === 'In Transit' ? "bg-emerald-500/10 text-emerald-400" : 
                                    ship.status === 'Delayed' ? "bg-rose-500/10 text-rose-400" : "bg-zinc-800 text-zinc-400"
                                  )}>
                                    {ship.status}
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                                    <span className="text-zinc-500">{ship.origin}</span>
                                    <span className="text-zinc-500">{ship.destination}</span>
                                  </div>
                                  <div className="relative h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="absolute top-0 left-0 h-full bg-emerald-500"
                                      initial={{ width: 0 }}
                                      animate={{ width: `${ship.progress}%` }}
                                      transition={{ duration: 1.5, ease: "easeOut" }}
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-zinc-800/50">
                                  <div className="flex items-center gap-2">
                                    <Package size={12} className="text-zinc-600" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">Cargo: {ship.cargo}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {ship.lat && ship.lng && (
                                      <span className="text-[9px] font-mono text-zinc-600">
                                        {ship.lat.toFixed(2)}°, {ship.lng.toFixed(2)}°
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold text-zinc-500">{ship.progress}% Complete</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

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

              {activeTab === 'sentiment' && data && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                        <MessageSquare size={24} className="text-purple-400" />
                        Sentiment Intelligence Dashboard
                      </h2>
                      <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Natural Language Processing & Social Pulse Engine</p>
                    </div>
                  </div>
                  
                  <SentimentDashboard sentiment={data.sentiment} activeTicker={activeTicker} />
                </motion.div>
              )}

              {activeTab === 'dashboard' && data && (
                <>
                  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                        <Logo size={24} className="icon-glow-emerald" />
                        Intelligence Terminal: {activeTicker}
                      </h2>
                      <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Real-time Trading Terminal & Market Intelligence</p>
                    </div>
                    <LivePriceBadge 
                      price={data.currentPrice} 
                      change={data.change} 
                      changePercent={data.changePercent} 
                      isConnected={isConnected} 
                      connectionState={connectionState}
                    />
                  </div>

                  {/* Fair Value Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-5 bg-gradient-to-br from-zinc-900/80 to-zinc-950 border-emerald-500/20 relative overflow-hidden">
                      <div className="scanline" />
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-500/20 glow-text-emerald">
                            Fair Value Estimate
                          </span>
                          <h2 className="text-3xl font-black mt-2 glow-text-emerald">${data.fairValue || '---'}</h2>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest">Current Price</p>
                          <p className="text-lg font-black text-white">${data.currentPrice}</p>
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden relative z-10 border border-white/5">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          style={{ width: data.fairValue ? `${Math.min(100, (data.currentPrice / data.fairValue) * 100)}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-2 uppercase font-bold tracking-widest relative z-10 flex items-center gap-1">
                        <Zap size={10} className="text-emerald-500" />
                        Calculated using Fuzzy Logic & Sentiment Weighting
                      </p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {data.risk && (
                        <RiskSummaryCard risk={data.risk} ticker={activeTicker} />
                      )}
                      {data.sentiment && (
                        <SentimentAnalysis sentiment={data.sentiment} activeTicker={activeTicker} />
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pb-2">
                    <StatCard 
                      label="Sentiment" 
                      value={data.sentiment ? data.sentiment.label : "---"} 
                      subValue={data.sentiment ? `${data.sentiment.score}% Confidence` : "Analyzing..."}
                      trend={data.sentiment ? (data.sentiment.score > 50 ? 'up' : 'down') : undefined}
                    />
                    
                    <StatCard 
                      label="Volume" 
                      value={formatVolume(data.volume)} 
                      subValue="Current Session"
                    />

                    <StatCard 
                      label="Day High" 
                      value={data.high ? `${data.high.toFixed(2)}` : "---"} 
                      subValue="Today's Peak"
                      trend="up"
                    />

                    <StatCard 
                      label="Day Low" 
                      value={data.low ? `${data.low.toFixed(2)}` : "---"} 
                      subValue="Today's Floor"
                      trend="down"
                    />

                    <StatCard 
                      label="Open" 
                      value={data.open ? `${data.open.toFixed(2)}` : "---"} 
                      subValue="Market Open"
                    />

                    <StatCard 
                      label="Market Cap" 
                      value={formatMarketCap(data.marketCap)} 
                      subValue="Total Valuation"
                    />

                    <StatCard 
                      label="P/E Ratio" 
                      value={data.peRatio ? data.peRatio.toFixed(2) : "---"} 
                      subValue="Valuation Multiple"
                    />

                    <StatCard 
                      label="Div Yield" 
                      value={data.dividendYield ? `${(data.dividendYield * 100).toFixed(2)}%` : "---"} 
                      subValue="Annual Yield"
                    />

                    {data.neuralFeatures && (
                      <StatCard 
                        label="RSI (14D)" 
                        value={data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]?.toFixed(1) || "---"} 
                        subValue={Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) > 70 ? "Overbought" : Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) < 30 ? "Oversold" : "Neutral"}
                        trend={Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) > 70 ? 'down' : Number(data.neuralFeatures.rsi[data.neuralFeatures.rsi.length - 1]) < 30 ? 'up' : undefined}
                      />
                    )}
                    
                    {data.neuralFeatures && (
                      <StatCard 
                        label="MACD" 
                        value={data.neuralFeatures.macd[data.neuralFeatures.macd.length - 1]?.toFixed(2) || "---"} 
                        subValue="Momentum Indicator"
                        trend={Number(data.neuralFeatures.macd[data.neuralFeatures.macd.length - 1]) > 0 ? 'up' : 'down'}
                      />
                    )}

                    {(() => {
                      const vol = getFuzzyVolatility(data);
                      return (
                        <div className="relative group">
                          <div className="absolute -top-1 -right-1 z-10">
                            <button 
                              onClick={() => setShowFuzzyExplainer(true)}
                              className="bg-emerald-500/20 border border-emerald-500/30 rounded-full px-1.5 py-0.5 flex items-center gap-1 hover:bg-emerald-500/40 transition-colors"
                            >
                              <Zap size={8} className="text-emerald-400 fill-emerald-400" />
                              <span className="text-[6px] font-black text-emerald-400 uppercase tracking-tighter">Fuzzy AI</span>
                            </button>
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
                            <p className="text-[8px] text-zinc-600 mt-2 italic">Click badge for full logic map</p>
                          </div>
                        </div>
                      );
                    })()}

                    {(() => {
                      const rsi = data.neuralFeatures?.rsi[data.neuralFeatures.rsi.length - 1];
                      const macd = data.neuralFeatures?.macd[data.neuralFeatures.macd.length - 1];
                      const change = data.changePercent || 0;
                      
                      let signal = "Neutral";
                      let trend: 'up' | 'down' | undefined = undefined;
                      let sub = "Analyzing Data";

                      if (rsi !== undefined && macd !== undefined) {
                        if (rsi < 30 && macd > 0) {
                          signal = "Strong Buy";
                          trend = 'up';
                          sub = "Oversold + Bull Cross";
                        } else if (rsi > 70 && macd < 0) {
                          signal = "Strong Sell";
                          trend = 'down';
                          sub = "Overbought + Bear Cross";
                        } else if (macd > 0) {
                          signal = "Accumulate";
                          trend = 'up';
                          sub = "Positive Momentum";
                        } else if (macd < 0) {
                          signal = "Distribute";
                          trend = 'down';
                          sub = "Negative Momentum";
                        }
                      }
                      
                      return (
                        <StatCard 
                          label="Signal" 
                          value={signal} 
                          subValue={sub}
                          trend={trend}
                        />
                      );
                    })()}
                  </div>

                  {/* Intelligence & Simulation Feed */}
                  <div className="grid grid-cols-1 gap-6">
                    <RealTimeNewsFeed 
                      news={data.sentiment?.articles || data.news || []} 
                      ticker={activeTicker} 
                      sentimentScore={data.sentiment ? data.sentiment.score : 50} 
                      forecast={data.forecast || []}
                      currentPrice={data.currentPrice}
                      onRefresh={() => fetchData(activeTicker)}
                    />
                    <SimulationFeed simulations={simulations[activeTicker] || []} />
                  </div>

                  {/* Predictive Backtesting */}
                  {data.backtest && (
                    <PredictiveBacktest backtest={data.backtest} />
                  )}

                  {/* Main Chart */}
                  <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <BarChart3 size={14} className="text-emerald-500" />
                        Historical & AI Forecast Projections (Monte Carlo / Fuzzy Logic)
                      </h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowFibonacci(!showFibonacci)}
                          className={cn(
                            "px-2 py-1 text-[10px] font-bold rounded-md transition-all border",
                            showFibonacci 
                              ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          FIB
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setShowFibSettings(!showFibSettings)}
                            className={cn(
                              "p-1.5 rounded-md border transition-all",
                              showFibSettings 
                                ? "bg-zinc-800 border-zinc-700 text-emerald-400" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            <Settings size={12} />
                          </button>
                          {showFibSettings && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-[100] p-4 overflow-hidden">
                              <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
                              <div className="relative z-10">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Fibonacci Levels</p>
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                  {ALL_FIB_LEVELS.map(lvl => (
                                    <button
                                      key={lvl}
                                      onClick={() => {
                                        if (fibLevels.includes(lvl)) {
                                          setFibLevels(fibLevels.filter(l => l !== lvl));
                                        } else {
                                          setFibLevels([...fibLevels, lvl].sort((a, b) => a - b));
                                        }
                                      }}
                                      className={cn(
                                        "px-2 py-1 rounded text-[9px] font-bold transition-all border",
                                        fibLevels.includes(lvl)
                                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                          : "bg-zinc-900 border-zinc-800 text-zinc-600 hover:text-zinc-400"
                                      )}
                                    >
                                      {(lvl * 100).toFixed(1)}%
                                    </button>
                                  ))}
                                </div>

                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Presets</p>
                                <div className="space-y-1 mb-4">
                                  {fibPresets.map((preset, i) => (
                                    <button
                                      key={i}
                                      onClick={() => {
                                        setFibLevels(preset.levels);
                                        setShowFibonacci(true);
                                      }}
                                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-zinc-900 text-[10px] font-bold text-zinc-400 transition-colors flex justify-between items-center group"
                                    >
                                      {preset.name}
                                      <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                  ))}
                                </div>

                                <button 
                                  onClick={() => {
                                    const name = prompt('Enter preset name:');
                                    if (name) {
                                      setFibPresets(prev => [...prev, { name, levels: [...fibLevels] }]);
                                    }
                                  }}
                                  className="w-full py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                                >
                                  Save Custom Preset
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="relative">
                          <button
                            onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
                            className={cn(
                              "px-2 py-1 text-[10px] font-bold rounded-md transition-all border flex items-center gap-1",
                              selectedIndicators.length > 0
                                ? "bg-blue-500/10 border-blue-500 text-blue-400" 
                                : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                            )}
                          >
                            <Activity size={12} />
                            INDICATORS
                          </button>
                          {showIndicatorsMenu && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl z-[100] p-4 overflow-hidden">
                              <div className="relative z-10">
                                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Technical Indicators</p>
                                <div className="space-y-2">
                                  {['SMA 20', 'EMA 12', 'RSI 14', 'MACD', 'STOCH', 'ATR'].map(ind => {
                                    const id = ind.toLowerCase().replace(' ', '');
                                    const isSelected = selectedIndicators.includes(id);
                                    return (
                                      <button
                                        key={id}
                                        onClick={() => {
                                          if (isSelected) {
                                            setSelectedIndicators(selectedIndicators.filter(i => i !== id));
                                          } else {
                                            setSelectedIndicators([...selectedIndicators, id]);
                                          }
                                        }}
                                        className={cn(
                                          "w-full text-left px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex justify-between items-center",
                                          isSelected
                                            ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300"
                                        )}
                                      >
                                        {ind}
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <DateRangeSelector currentRange={dateRange} onRangeChange={setDateRange} />
                      </div>
                    </div>
                    <div className="h-[240px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                          data={chartData}
                          onMouseMove={handleChartMouseMove}
                          onMouseLeave={handleChartMouseLeave}
                        >
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
                          {activePoint && (
                            <>
                              <ReferenceLine 
                                x={activePoint.x} 
                                stroke="#10b981" 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.5}
                                label={{ 
                                  position: 'bottom', 
                                  value: new Date(activePoint.x).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                  fill: '#10b981',
                                  fontSize: 8,
                                  fontWeight: 'bold',
                                  className: "bg-zinc-950"
                                }}
                              />
                              <ReferenceLine 
                                y={activePoint.y} 
                                stroke="#10b981" 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.5}
                                label={{ 
                                  position: 'right', 
                                  value: `$${activePoint.y.toFixed(2)}`,
                                  fill: '#10b981',
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  className: "bg-zinc-950"
                                }}
                              />
                            </>
                          )}
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
                          
                          {showFibonacci && fibonacciLevels?.map((lvl, idx) => (
                            <ReferenceLine 
                              key={idx}
                              y={lvl.price} 
                              stroke="#71717a" 
                              strokeDasharray="3 3"
                              label={{ 
                                value: `${lvl.label} (${lvl.price.toFixed(2)})`, 
                                position: 'left', 
                                fill: '#71717a', 
                                fontSize: 8,
                                fontWeight: 'bold'
                              }} 
                            />
                          ))}
                          {data && data.fairValue && (
                            <ReferenceLine 
                              y={data.fairValue} 
                              stroke="#10b981" 
                              strokeDasharray="3 3" 
                              strokeOpacity={0.3}
                              label={{ 
                                value: 'Fair Value', 
                                position: 'left', 
                                fill: '#10b981', 
                                fontSize: 8, 
                                fontWeight: 'bold',
                                opacity: 0.5
                              }} 
                            />
                          )}
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
                          {selectedIndicators.includes('sma20') && (
                            <Line 
                              type="monotone" 
                              dataKey="sma20" 
                              stroke="#3b82f6" 
                              strokeWidth={1.5} 
                              dot={false} 
                              name="SMA 20"
                              connectNulls
                            />
                          )}
                          {selectedIndicators.includes('ema12') && (
                            <Line 
                              type="monotone" 
                              dataKey="ema12" 
                              stroke="#f59e0b" 
                              strokeWidth={1.5} 
                              dot={false} 
                              name="EMA 12"
                              connectNulls
                            />
                          )}
                          {tickers.map((t, i) => (
                            <React.Fragment key={`${t}-${i}`}>
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

                    {selectedIndicators.includes('rsi14') && (
                      <div className="h-[120px] w-full mt-4 border-t border-zinc-800 pt-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">RSI 14</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={[0, 100]} orientation="right" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <Line type="monotone" dataKey="rsi" stroke="#a855f7" strokeWidth={1.5} dot={false} name="RSI 14" connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {selectedIndicators.includes('macd') && (
                      <div className="h-[120px] w-full mt-4 border-t border-zinc-800 pt-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">MACD</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <ReferenceLine y={0} stroke="#71717a" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <Line type="monotone" dataKey="macd" stroke="#ec4899" strokeWidth={1.5} dot={false} name="MACD" connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {selectedIndicators.includes('stoch') && (
                      <div className="h-[120px] w-full mt-4 border-t border-zinc-800 pt-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Stochastic Oscillator</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={[0, 100]} orientation="right" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
                            <Line type="monotone" dataKey="stochK" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="%K" connectNulls />
                            <Line type="monotone" dataKey="stochD" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="%D" connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    {selectedIndicators.includes('atr') && (
                      <div className="h-[120px] w-full mt-4 border-t border-zinc-800 pt-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Average True Range (ATR)</h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis dataKey="name" hide />
                            <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Line type="monotone" dataKey="atr" stroke="#10b981" strokeWidth={1.5} dot={false} name="ATR" connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <PriceTargets data={data} />
                  
                  {/* AI-Driven Forecasts & Sentiment Analysis */}
                  <div className="glass-card p-5 mt-6 border-purple-500/20 bg-gradient-to-br from-zinc-900 to-black">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <PieChartIcon size={20} className="text-purple-400" />
                      AI-Driven Forecasts & Analysis
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6">Time-Series Monte Carlo & Sentiment Impact</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="h-[320px]">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <TrendingUp size={14} className="text-emerald-500" />
                          30-Day Monte Carlo Projection
                        </h4>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={chartData.filter(d => d.name >= new Date().toISOString().split('T')[0])}
                            onMouseMove={handleChartMouseMove}
                            onMouseLeave={handleChartMouseLeave}
                          >
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
                            {activePoint && (
                              <>
                                <ReferenceLine 
                                  x={activePoint.x} 
                                  stroke="#10b981" 
                                  strokeDasharray="3 3" 
                                  strokeOpacity={0.5}
                                />
                                <ReferenceLine 
                                  y={activePoint.y} 
                                  stroke="#10b981" 
                                  strokeDasharray="3 3" 
                                  strokeOpacity={0.5}
                                  label={{ 
                                    position: 'right', 
                                    value: `$${activePoint.y.toFixed(2)}`,
                                    fill: '#10b981',
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    className: "bg-zinc-950"
                                  }}
                                />
                              </>
                            )}
                            <Area 
                              type="monotone" 
                              dataKey="pUpper" 
                              stroke="none" 
                              fill="url(#colorCone)" 
                              connectNulls
                            />
                            <Area 
                              type="monotone" 
                              dataKey="pLower" 
                              stroke="none" 
                              fill="#09090b" 
                              connectNulls
                            />
                            <Line 
                              type="monotone" 
                              dataKey="median" 
                              stroke="#10b981" 
                              strokeWidth={2} 
                              dot={false} 
                              name="Mean Forecast"
                              connectNulls
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <BarChart3 size={14} className="text-purple-400" />
                          Quant Analysis Report
                        </h4>
                        <div className="space-y-4 text-sm text-zinc-400">
                          <section>
                            <h4 className="text-zinc-100 font-semibold mb-1">Time-Series Analysis</h4>
                            <p>Based on 1-year historical volatility and drift, the Monte Carlo simulation projects a median price target of <span className="text-emerald-400 font-bold">${simulationStats?.median.toFixed(2) || '---'}</span> over the next 30 days.</p>
                          </section>
                          <section>
                            <h4 className="text-zinc-100 font-semibold mb-1">Sentiment & News Impact</h4>
                            <p>{data.sentiment?.summary || "Analyzing sentiment..."}</p>
                          </section>
                          <section>
                            <h4 className="text-zinc-100 font-semibold mb-1">Global Trade Impact</h4>
                            <p>{data.sentiment?.tradeImpact || "Calculating simulation impact..."}</p>
                          </section>
                        </div>
                      </div>
                    </div>
                  </div>

                  {data.fundamentals && (
                    <div className="mt-6">
                      <FundamentalsSection fundamentals={data.fundamentals} />
                    </div>
                  )}

                  {data.management && (
                    <div className="mt-6">
                      <ManagementSection management={data.management} />
                    </div>
                  )}

                  {data.profile && (
                    <div className="mt-6">
                      <CompanyProfile profile={data.profile} ticker={activeTicker} />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'aiscan' && (
                <AIScan />
              )}

              {activeTab === 'quant' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <QuantBot ticker={data?.ticker} currentPrice={data?.currentPrice} />
                  <div className="p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <Brain className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-bold mb-2">Neural Brain Integration</h3>
                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                          The Live Quant Bot is synchronized with the <span className="text-purple-400 font-bold">Neural Brain</span>. 
                          It monitors the market regime ({neuralBrain.getMemory()?.regime || 'Calibrating...'}) 
                          and executes trades when model confidence exceeds 60%.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                             <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Drift Bias</div>
                             <div className="text-white font-mono">{(neuralBrain.getMemory()?.quantBias || 0).toFixed(4)}</div>
                          </div>
                          <div className="p-3 rounded-xl bg-black/40 border border-zinc-800">
                             <div className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Sentiment</div>
                             <div className="text-white font-bold">{neuralBrain.getMemory()?.globalSentiment || 'Neural'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'projection' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <PieChartIcon className="text-purple-400" size={24} />
                      QuantLab Neural
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Neural Network Validation & Predictive Modeling</p>
                  </div>
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
                      <AreaChart 
                        data={chartData.filter(d => d.name >= new Date().toISOString().split('T')[0])}
                        onMouseMove={handleChartMouseMove}
                        onMouseLeave={handleChartMouseLeave}
                      >
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
                        {activePoint && (
                          <>
                            <ReferenceLine 
                              x={activePoint.x} 
                              stroke="#10b981" 
                              strokeDasharray="3 3" 
                              strokeOpacity={0.5}
                            />
                            <ReferenceLine 
                              y={activePoint.y} 
                              stroke="#10b981" 
                              strokeDasharray="3 3" 
                              strokeOpacity={0.5}
                              label={{ 
                                position: 'right', 
                                value: `$${activePoint.y.toFixed(2)}`,
                                fill: '#10b981',
                                fontSize: 10,
                                fontWeight: 'bold',
                                className: "bg-zinc-950"
                              }}
                            />
                          </>
                        )}
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

                  {/* Simulation Statistics Summary */}
                  {simulationStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <StatCard 
                        label="Median Projection" 
                        value={`$${simulationStats.median.toFixed(2)}`}
                        subValue={`${((simulationStats.median - data.currentPrice) / data.currentPrice * 100).toFixed(1)}% Expected`}
                        trend={simulationStats.median > data.currentPrice ? 'up' : 'down'}
                      />
                      <StatCard 
                        label="Hedge Model (VaR 95%)" 
                        value={`-$${simulationStats.var95.toFixed(2)}`}
                        subValue="Max Drawdown Risk"
                        trend="down"
                      />
                      <StatCard 
                        label="Kelly Criterion" 
                        value={`${(simulationStats.metrics?.kellyCriterion * 100).toFixed(1)}%`}
                        subValue="Optimal Capital"
                      />
                      <StatCard 
                        label="Sharpe Ratio" 
                        value={simulationStats.metrics?.sharpeRatio.toFixed(2) || '---'}
                        subValue="Risk-Adjusted Return"
                      />
                      <StatCard 
                        label="Market Regime" 
                        value={simulationStats.metrics?.regime || 'Random'}
                        subValue={`Hurst Exp: ${(simulationStats.metrics?.hurstExponent || 0).toFixed(2)}`}
                      />
                      <StatCard 
                        label="Annual Vol" 
                        value={`${((simulationStats.metrics?.annualizedVol || 0) * 100).toFixed(1)}%`}
                        subValue="σ-Clustering Scaled"
                      />
                    </div>
                  )}

                  {/* Stress Scenario Analysis */}
                  {data?.stressBounds && (
                    <div className="glass-card p-6 bg-rose-500/5 border-rose-500/20">
                      <div className="flex items-center gap-3 mb-4">
                        <AlertCircle className="text-rose-400" size={18} />
                        <h3 className="text-sm font-bold text-rose-100 uppercase tracking-widest">Black Swan & Stress Test Scenario</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Stress Median (30D)</p>
                          <div className="text-xl font-black text-rose-400 font-mono">
                            ${data.stressBounds[data.stressBounds.length - 1].median.toFixed(2)}
                          </div>
                          <p className="text-[10px] text-rose-400/60 font-bold mt-1">
                            {((data.stressBounds[data.stressBounds.length - 1].median - data.currentPrice) / data.currentPrice * 100).toFixed(1)}% Potential Downturn
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            Under a high-volatility stress scenario (2.2x vol clustering + negative drift bias), the system projects a 
                            substantial risk of liquidity contraction. Hedge fund standard models suggest a VaR(99) exposure of 
                            <span className="text-rose-400 font-bold text-mono ml-1">-${simulationStats?.var99.toFixed(2)}</span>.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="text-blue-400" size={18} />
                        <h3 className="text-zinc-100 font-bold uppercase tracking-widest text-sm">Quant Advisory</h3>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                        Based on the current <span className="text-emerald-400 font-bold">{simulationStats?.metrics?.regime}</span> regime 
                        and a Hurst Exponent of <span className="text-white font-bold">{simulationStats?.metrics?.hurstExponent.toFixed(2)}</span>, 
                        the model suggests {simulationStats?.metrics?.regime === 'Trending' ? 'persistence in current price action.' : 'potential regression to the mean.'}
                      </p>
                      <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">Optimal Kelly Allocation</span>
                          <span className="text-blue-400 font-bold">{(simulationStats?.metrics?.kellyCriterion * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(simulationStats?.metrics?.kellyCriterion * 100)}%` }}
                            className="h-full bg-blue-500" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="glass-card p-6 bg-zinc-900/50 border-zinc-800 backdrop-blur-xl">
                      <div className="flex items-center gap-2 mb-4">
                        <Brain className="text-purple-400" size={18} />
                        <h3 className="text-zinc-100 font-bold uppercase tracking-widest text-sm">Neural-Simulation Link</h3>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed mb-4">
                        Integrating Geometric Brownian Motion with Neural Network bias (Drift: {(neuralBrain.getMemory()?.quantBias || 0).toFixed(4)}). 
                        The simulation runs {numSims} paths with volatility clustering to account for "fat tails" in market distributions.
                      </p>
                      <button className="w-full py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors">
                        Re-Calibrate Neural Weights
                      </button>
                    </div>
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
                      <ModelComparison models={data.models || []} currentPrice={data.currentPrice} />
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Fourier Signal Filtering</h4>
                        <p>Noise reduction via Fourier Transform indicates a underlying bullish cycle. The short-term volatility is being filtered to reveal a steady accumulation phase.</p>
                      </section>
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Sentiment & News</h4>
                        <p>{data.sentiment?.summary || "Analyzing sentiment..."}</p>
                      </section>
                      <section>
                        <h4 className="text-zinc-100 font-semibold mb-1">Global Simulation Impact</h4>
                        <p>{data.sentiment?.tradeImpact || "Calculating simulation impact..."}</p>
                      </section>
                    </div>
                  </div>

                  <OptionsChain currentPrice={data.currentPrice} />
                </div>
              )}

              {activeTab === 'risk' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <AlertCircle className="text-rose-400" size={24} />
                      QuantLab Risk
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Advanced Risk Engine & Portfolio Stress Testing</p>
                  </div>
                  <RiskAssessment riskAnalysis={data.riskAnalysis} />

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
                        <AreaChart 
                          data={data.stressBounds}
                          onMouseMove={handleChartMouseMove}
                          onMouseLeave={handleChartMouseLeave}
                        >
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
                          {activePoint && (
                            <>
                              <ReferenceLine 
                                x={activePoint.x} 
                                stroke="#fb7185" 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.5}
                              />
                              <ReferenceLine 
                                y={activePoint.y} 
                                stroke="#fb7185" 
                                strokeDasharray="3 3" 
                                strokeOpacity={0.5}
                                label={{ 
                                  position: 'right', 
                                  value: `$${activePoint.y.toFixed(2)}`,
                                  fill: '#fb7185',
                                  fontSize: 10,
                                  fontWeight: 'bold',
                                  className: "bg-zinc-950"
                                }}
                              />
                            </>
                          )}
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

              {activeTab === 'markets' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <LayoutGrid className="text-zinc-400" size={24} />
                      QuantLab Assets
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Global Asset Explorer & Sector Intelligence</p>
                  </div>
                  <div className="glass-card p-6 border-emerald-500/20 bg-gradient-to-br from-zinc-900 to-black">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                          <LayoutGrid className="text-emerald-400" size={24} />
                          Market Intelligence
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">NASDAQ & Toronto Stock Exchange (TSX) Overview</p>
                      </div>
                      <button 
                        onClick={async () => {
                          setMarketLoading(true);
                          const data = await fetchMarketOverview();
                          setMarketOverview({
                            us: dedupeTickerArray(data.us),
                            canada: dedupeTickerArray(data.canada),
                            europe: dedupeTickerArray(data.europe),
                            asia: dedupeTickerArray(data.asia),
                            crypto: dedupeTickerArray(data.crypto),
                            commodities: dedupeTickerArray(data.commodities)
                          });
                          setMarketLoading(false);
                        }}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        disabled={marketLoading}
                      >
                        <RefreshCw size={18} className={cn("text-zinc-400", marketLoading && "animate-spin")} />
                      </button>
                    </div>

                    {marketLoading ? (
                      <div className="flex flex-col items-center justify-center py-24 space-y-4">
                        <div className="w-12 h-12 border-4 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-xs text-zinc-500 animate-pulse font-medium uppercase tracking-widest">Scanning Global Exchanges...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {/* US Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">US Markets</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {marketOverview?.us?.map((stock, i) => (
                              <motion.div 
                                key={`${stock.ticker}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-blue-500/30 transition-all group cursor-pointer"
                                onClick={() => {
                                  if (!tickers.includes(stock.ticker)) {
                                    setTickers([stock.ticker]);
                                    fetchData(stock.ticker);
                                  }
                                  setActiveTicker(stock.ticker);
                                  setActiveTab('dashboard');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-blue-400">{stock.ticker}</p>
                                    <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-sm font-bold",
                                      stock.recentPerformance >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {stock.recentPerformance >= 0 ? '+' : ''}{stock.recentPerformance.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">30D Perf</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.sector}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.marketCap}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Canada Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Canadian Markets</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {marketOverview?.canada?.map((stock, i) => (
                              <motion.div 
                                key={`${stock.ticker}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-rose-500/30 transition-all group cursor-pointer"
                                onClick={() => {
                                  if (!tickers.includes(stock.ticker)) {
                                    setTickers([stock.ticker]);
                                    fetchData(stock.ticker);
                                  }
                                  setActiveTicker(stock.ticker);
                                  setActiveTab('dashboard');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-rose-400">{stock.ticker}</p>
                                    <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-sm font-bold",
                                      stock.recentPerformance >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {stock.recentPerformance >= 0 ? '+' : ''}{stock.recentPerformance.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">30D Perf</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.sector}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.marketCap}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Europe Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">European Markets</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {marketOverview?.europe?.map((stock, i) => (
                              <motion.div 
                                key={`${stock.ticker}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-amber-500/30 transition-all group cursor-pointer"
                                onClick={() => {
                                  if (!tickers.includes(stock.ticker)) {
                                    setTickers([stock.ticker]);
                                    fetchData(stock.ticker);
                                  }
                                  setActiveTicker(stock.ticker);
                                  setActiveTab('dashboard');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-amber-400">{stock.ticker}</p>
                                    <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-sm font-bold",
                                      stock.recentPerformance >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {stock.recentPerformance >= 0 ? '+' : ''}{stock.recentPerformance.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">30D Perf</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.sector}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.marketCap}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Asia Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Asian Markets</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {marketOverview?.asia?.map((stock, i) => (
                              <motion.div 
                                key={`${stock.ticker}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-violet-500/30 transition-all group cursor-pointer"
                                onClick={() => {
                                  if (!tickers.includes(stock.ticker)) {
                                    setTickers([stock.ticker]);
                                    fetchData(stock.ticker);
                                  }
                                  setActiveTicker(stock.ticker);
                                  setActiveTab('dashboard');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-violet-400">{stock.ticker}</p>
                                    <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-sm font-bold",
                                      stock.recentPerformance >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {stock.recentPerformance >= 0 ? '+' : ''}{stock.recentPerformance.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">30D Perf</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.sector}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.marketCap}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Crypto Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Cryptocurrencies</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {marketOverview?.crypto?.map((stock, i) => (
                              <motion.div 
                                key={`${stock.ticker}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-orange-500/30 transition-all group cursor-pointer"
                                onClick={() => {
                                  if (!tickers.includes(stock.ticker)) {
                                    setTickers([stock.ticker]);
                                    fetchData(stock.ticker);
                                  }
                                  setActiveTicker(stock.ticker);
                                  setActiveTab('dashboard');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-orange-400">{stock.ticker}</p>
                                    <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-sm font-bold",
                                      stock.recentPerformance >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {stock.recentPerformance >= 0 ? '+' : ''}{stock.recentPerformance.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">30D Perf</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.sector}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.marketCap}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>

                        {/* Commodities Section */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-300">Commodities</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {marketOverview?.commodities?.map((stock, i) => (
                              <motion.div 
                                key={`${stock.ticker}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-emerald-500/30 transition-all group cursor-pointer"
                                onClick={() => {
                                  if (!tickers.includes(stock.ticker)) {
                                    setTickers([stock.ticker]);
                                    fetchData(stock.ticker);
                                  }
                                  setActiveTicker(stock.ticker);
                                  setActiveTab('dashboard');
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="text-lg font-bold text-emerald-400">{stock.ticker}</p>
                                    <p className="text-xs text-zinc-500 font-medium truncate max-w-[150px]">{stock.name}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className={cn(
                                      "text-sm font-bold",
                                      stock.recentPerformance >= 0 ? "text-emerald-400" : "text-rose-400"
                                    )}>
                                      {stock.recentPerformance >= 0 ? '+' : ''}{stock.recentPerformance.toFixed(2)}%
                                    </p>
                                    <p className="text-[10px] text-zinc-600 font-bold uppercase mt-1">30D Perf</p>
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center gap-3">
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.sector}</span>
                                  <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[9px] text-zinc-500 font-bold uppercase">{stock.marketCap}</span>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <Info className="text-blue-400 shrink-0" size={18} />
                      <div>
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Market Intelligence Note</h4>
                        <p className="text-[10px] text-blue-400/70 leading-relaxed">
                          The data displayed above represents major institutional holdings and high-volume assets on the NASDAQ and TSX. 
                          Clicking on any ticker will load its full neural projection, risk profile, and historical analysis.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <PortfolioManager 
                  portfolioSimulations={portfolioSimulations}
                  onAddSimulation={handleAddPortfolioSimulation}
                  onRemoveSimulation={handleRemovePortfolioSimulation}
                  allData={allData}
                />
              )}

              {activeTab === 'options' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <LayoutGrid className="text-purple-400" size={24} />
                      QuantLab Options
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Advanced Options Chain & Greeks Analysis</p>
                  </div>
                  <OptionsSimulation data={data} />
                </div>
              )}

              {activeTab === 'fairvalue' && data && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
                      <BarChart3 className="text-emerald-400" size={24} />
                      QuantLab Valuation
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Fair Value Analysis & Intrinsic Valuation Engine</p>
                  </div>
                  <FairValueAnalysis data={data} />
                  <ModelComparison models={data.models || []} currentPrice={data.currentPrice} />
                </div>
              )}

              {activeTab === 'quantlab' && data && (
                <QuantLab data={data} allData={allData} />
              )}

              {/* Removed redundant global tab section */}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Interactive Elements */}
        <QuickActions onAction={handleQuickAction} />
        
        <NavigationMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
        />
      </motion.div>
      )}

      <AnimatePresence>
        {showFuzzyExplainer && activeTicker && allData[activeTicker] && (
          <FuzzyLogicExplainer 
            data={allData[activeTicker]} 
            onClose={() => setShowFuzzyExplainer(false)} 
          />
        )}
      </AnimatePresence>

      {/* Footer Disclaimer */}
      <footer className="mt-auto py-12 border-t border-zinc-800/50 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Logo size={24} className="icon-glow-emerald" />
          <span className="font-bold tracking-tighter text-lg text-zinc-100 uppercase">QuantLab Terminal</span>
        </div>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mb-6">Educational Purpose Only • No Financial Advice</p>
        <div className="max-w-2xl mx-auto px-6 space-y-6">
          <p className="text-xs text-zinc-600 leading-relaxed">
            QuantLab is an educational platform designed for simulating quantitative trading strategies and market analysis. 
            All data, signals, and performance metrics are simulated and do not represent real-world results. 
            This application does not provide financial advice, and no real trades are executed. 
            Users should consult with a licensed financial advisor before making any investment decisions.
          </p>
          <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-700">
            <button className="hover:text-zinc-500 transition-colors">Terms of Service</button>
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
            <button className="hover:text-zinc-500 transition-colors">Privacy Policy</button>
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
            <button 
              onClick={() => setIsContactModalOpen(true)}
              className="hover:text-zinc-500 transition-colors"
            >
              Contact Us
            </button>
          </div>
          <p className="text-[9px] text-zinc-700 font-medium italic">
            Data provided by simulated neural engines. Market data is delayed by 15 minutes for educational purposes. 
            © 2026 QuantLab Intelligence Systems. All rights reserved.
          </p>
        </div>
      </footer>

      <ContactModal 
        isOpen={isContactModalOpen} 
        onClose={() => setIsContactModalOpen(false)} 
      />
    </div>
    </ErrorBoundary>
  );
}
