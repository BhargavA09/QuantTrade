import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  TrendingUp, 
  BarChart2, 
  Grid, 
  Globe, 
  Layers, 
  Sparkles, 
  Bookmark, 
  ShieldAlert,
  ArrowRight,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Calendar,
  Bell,
  ArrowUpDown,
  Users,
  Coins,
  Radio,
  Play,
  Pause,
  X,
  Activity,
  Target,
  FolderGit2,
  Brain
} from 'lucide-react';
import { patternAlertManager, PatternAlert } from '../../services/patternAlertService';
import { fetchFinvizPatternScan } from '../../services/api/finvizService';
import { FinvizTickerTape } from './FinvizTickerTape';
import { FinvizHome } from './FinvizHome';
import { FinvizScreener } from './FinvizScreener';
import { FinvizMap } from './FinvizMap';
import { FinvizGroups } from './FinvizGroups';
import { FinvizFutures } from './FinvizFutures';
import { FinvizForex } from './FinvizForex';
import { FinvizInsiders } from './FinvizInsiders';
import { FinvizCrypto } from './FinvizCrypto';
import { FinvizChartWithProjections } from './FinvizChartWithProjections';
import { FinvizMultiChartGrid } from './FinvizMultiChartGrid';
import { FinvizCalendar } from './FinvizCalendar';
import { FinvizWhaleRadar } from './FinvizWhaleRadar';
import { FinvizPatternHistory } from './FinvizPatternHistory';
import { QuantPortfolioSuite } from '../quant/QuantPortfolioSuite';
import { FinvizNotificationCenter } from './FinvizNotificationCenter';
import { ContinuousLearningStudio } from '../ContinuousLearningStudio';
import { soundEngine } from '../../utils/audioAlerts';

import { FINVIZ_NEWS, FINVIZ_STOCKS } from '../../data/finvizData';
import { subscribeFinvizStream, StreamEvent } from '../../services/api/finvizService';
import { cn } from '../../utils/cn';

export type FinvizTab = 'home' | 'news' | 'screener' | 'chart' | 'multichart' | 'calendar' | 'whale' | 'patterns' | 'quant_suite' | 'continuous_learning' | 'map' | 'groups' | 'futures' | 'forex' | 'insiders' | 'crypto';

interface FinvizDashboardProps {
  initialTicker?: string;
  onOpenRiskEngine?: () => void;
  watchlist?: string[];
  onToggleWatchlist?: (ticker: string) => void;
  allData?: Record<string, any>;
  lastUpdate?: any;
  fetchData?: (ticker: string) => Promise<void>;
  onSendToQuantLab?: (ticker: string) => void;
}

export const FinvizDashboard: React.FC<FinvizDashboardProps> = ({
  initialTicker = 'NVDA',
  onOpenRiskEngine,
  watchlist = ['AAPL', 'NVDA', 'MSFT', 'TSLA'],
  onToggleWatchlist,
  allData = {},
  lastUpdate,
  fetchData,
  onSendToQuantLab
}) => {
  const [activeTab, setActiveTab] = useState<FinvizTab>('home');
  const [selectedTicker, setSelectedTicker] = useState<string>(initialTicker);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<typeof FINVIZ_STOCKS>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadPatternAlerts, setUnreadPatternAlerts] = useState<number>(() => patternAlertManager.getAlerts().filter(a => !a.read).length);
  const [liveToastAlert, setLiveToastAlert] = useState<PatternAlert | null>(null);
  const [isScanningPatterns, setIsScanningPatterns] = useState<boolean>(false);

  // Subscribe to real-time pattern alerts from PatternAlertManager
  useEffect(() => {
    const unsub = patternAlertManager.subscribe((newAlert, all) => {
      setUnreadPatternAlerts(all.filter(a => !a.read).length);
      if (newAlert) {
        setLiveToastAlert(newAlert);
      }
    });
    return () => unsub();
  }, []);

  // Auto-dismiss live toast alert after 9 seconds
  useEffect(() => {
    if (!liveToastAlert) return;
    const timer = setTimeout(() => {
      setLiveToastAlert(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [liveToastAlert]);

  // Active Market Pattern Scanner across key tech/growth universe
  const handleRunPatternScan = async () => {
    setIsScanningPatterns(true);
    soundEngine.playNotificationTap();
    try {
      const res = await fetchFinvizPatternScan(['NVDA', 'TSLA', 'AAPL', 'AMD', 'MSFT', 'META', 'GOOGL', 'AMZN', 'PLTR', 'SMCI']);
      if (res.success && res.patterns.length > 0) {
        // Pick best pattern matching Ascending Triangle or Double Bottom
        const targetPattern = res.patterns.find(p => p.isAscendingTriangle || p.isDoubleBottom) || res.patterns[0];
        if (targetPattern) {
          const newAlert: PatternAlert = {
            id: `scan-${Date.now()}-${targetPattern.ticker}`,
            ticker: targetPattern.ticker,
            companyName: targetPattern.companyName,
            patternType: targetPattern.patternType,
            patternName: targetPattern.pattern,
            confidence: targetPattern.confidence,
            currentPrice: targetPattern.currentPrice,
            targetPrice: targetPattern.targetPrice,
            stopLossPrice: targetPattern.stopLossPrice,
            bias: targetPattern.bias,
            description: `${targetPattern.status}. Technical bounds: Resistance $${targetPattern.resistanceLevel.toFixed(2)}, Support $${targetPattern.supportLevel.toFixed(2)}.`,
            timestamp: 'Just now',
            read: false
          };
          patternAlertManager.emitAlert(newAlert);
        }
      }
    } catch (err) {
      patternAlertManager.simulateDetection('ascending_triangle', 'NVDA');
    } finally {
      setIsScanningPatterns(false);
    }
  };

  // Real-time live streaming state from Python backend
  const [streamActive, setStreamActive] = useState<boolean>(true);
  const [streamConnected, setStreamConnected] = useState<boolean>(false);
  const [tickCount, setTickCount] = useState<number>(0);
  const [lastTick, setLastTick] = useState<{ ticker: string; price: number; changePercent: number } | null>(null);

  // Subscribe to Python Server-Sent Events (SSE) Live Stream
  useEffect(() => {
    if (!streamActive) {
      setStreamConnected(false);
      return;
    }

    const unsubscribe = subscribeFinvizStream(
      (event: StreamEvent) => {
        setStreamConnected(true);
        if (event.type === 'PRICE_TICK' && event.ticker) {
          setTickCount(c => c + 1);
          setLastTick({
            ticker: event.ticker,
            price: event.price || 0,
            changePercent: event.changePercent || 0
          });
        } else if (event.type === 'PATTERN_ALERT' && event.ticker) {
          const alertItem: PatternAlert = {
            id: `stream-alert-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            ticker: event.ticker,
            companyName: event.companyName || event.ticker,
            patternType: event.patternType || 'ascending_triangle',
            patternName: event.pattern || 'Pattern Detected',
            confidence: event.confidence || 90,
            currentPrice: event.price || 0,
            targetPrice: event.targetPrice || 0,
            stopLossPrice: event.stopLoss || 0,
            bias: event.bias || 'bullish',
            description: event.description || 'Quant engine technical pattern signal confirmed.',
            timestamp: 'Just now',
            read: false
          };
          patternAlertManager.emitAlert(alertItem);
        }
      },
      (err) => {
        setStreamConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [streamActive]);

  const handleSelectTicker = (ticker: string) => {
    const upper = ticker.toUpperCase();
    setSelectedTicker(upper);
    setActiveTab('chart');
    setIsSearching(false);
    setSearchQuery('');
    if (fetchData) {
      fetchData(upper);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const q = val.toLowerCase();
      const filtered = FINVIZ_STOCKS.filter(s => 
        s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
      ).slice(0, 6);
      setSuggestions(filtered);
      setIsSearching(true);
    } else {
      setSuggestions([]);
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSelectTicker(searchQuery.trim());
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* 1. Finviz Live Ticker Marquee with real-time Stock & Bond Market Streaming */}
      <FinvizTickerTape allData={allData} lastUpdate={lastUpdate} />

      {/* 2. Authentic Finviz Navigation & Branding Bar */}
      <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2.5 gap-3">
            
            {/* Logo and Brand */}
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('home')}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="bg-emerald-600 text-white font-black text-lg px-2 py-0.5 rounded tracking-tighter shadow-md group-hover:bg-emerald-500 transition-colors">
                  FINVIZ
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                    QUANT TRADE <span className="bg-emerald-500/20 text-emerald-300 text-[8px] px-1 rounded">PRO</span>
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono -mt-0.5">
                    Stock Screener & Projections
                  </span>
                </div>
              </div>

              {/* Mobile search toggle & alert bell */}
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={() => {
                    setIsNotificationsOpen(true);
                    soundEngine.playNotificationTap();
                  }}
                  className="relative p-1.5 text-xs rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300"
                  title="Alerts"
                >
                  <Bell size={14} className={unreadPatternAlerts > 0 ? "text-cyan-400 animate-bounce" : "text-zinc-400"} />
                  {unreadPatternAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 px-1 rounded-full text-[8px] font-mono font-black bg-cyan-500 text-black">
                      {unreadPatternAlerts}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('chart')}
                  className="px-2 py-1 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/30"
                >
                  {selectedTicker}
                </button>
              </div>
            </div>

            {/* Finviz Global Search Box */}
            <div className="relative flex-1 max-w-md mx-auto md:mx-6">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={15} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={() => searchQuery && setIsSearching(true)}
                    placeholder="Search ticker, company (e.g. AAPL, NVDA, TSLA)..."
                    className="w-full bg-zinc-950 border border-zinc-700/80 rounded-lg py-1.5 pl-9 pr-20 text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-mono font-bold uppercase transition-all"
                  >
                    Quote
                  </button>
                </div>
              </form>

              {/* Autocomplete dropdown */}
              <AnimatePresence>
                {isSearching && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden"
                  >
                    {suggestions.map(s => (
                      <div
                        key={s.ticker}
                        onClick={() => handleSelectTicker(s.ticker)}
                        className="px-3 py-2 hover:bg-zinc-800 cursor-pointer flex items-center justify-between text-xs border-b border-zinc-800 last:border-b-0 font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-emerald-400">{s.ticker}</span>
                          <span className="text-zinc-300 font-sans text-[11px] truncate max-w-[180px]">{s.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-zinc-100">${s.price.toFixed(2)}</span>
                          <span className={cn("ml-2 font-bold", s.change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                            {s.change >= 0 ? '+' : ''}{s.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Tickers & Risk Button */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {['SPY', 'QQQ', 'NVDA', 'AAPL', 'TSLA'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleSelectTicker(t)}
                    className={cn(
                      "px-2 py-0.5 rounded transition-all font-bold",
                      selectedTicker === t && activeTab === 'chart'
                        ? "bg-emerald-600 text-white"
                        : "bg-zinc-950 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {onOpenRiskEngine && (
                <button
                  onClick={onOpenRiskEngine}
                  className="ml-2 flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-750 transition-all"
                >
                  <ShieldAlert size={13} className="text-amber-400" />
                  <span>Risk Engine</span>
                </button>
              )}

              {/* Quant Engine Pattern Scanner Quick Action */}
              <button
                onClick={handleRunPatternScan}
                disabled={isScanningPatterns}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-all disabled:opacity-50 shadow-sm"
                title="Trigger real-time scan for Ascending Triangles & Double Bottoms"
              >
                <Sparkles size={12} className={cn("text-emerald-400", isScanningPatterns && "animate-spin")} />
                <span>{isScanningPatterns ? "Scanning..." : "Scan Patterns"}</span>
              </button>

              {/* Real-Time Pattern Radar & Notification Center Button */}
              <button
                onClick={() => {
                  setIsNotificationsOpen(true);
                  soundEngine.playNotificationTap();
                }}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shadow-sm",
                  unreadPatternAlerts > 0
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-750"
                )}
                title="Open Real-Time Notification Radar"
              >
                <Bell size={13} className={unreadPatternAlerts > 0 ? "text-cyan-400 animate-bounce" : "text-zinc-400"} />
                <span className="font-mono">Alerts</span>
                {unreadPatternAlerts > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black bg-cyan-500 text-black animate-pulse">
                    {unreadPatternAlerts}
                  </span>
                )}
              </button>

              {/* Continuous Learning Engine Button */}
              <button
                onClick={() => setActiveTab('continuous_learning')}
                className={cn(
                  "relative flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition-all shadow-sm",
                  activeTab === 'continuous_learning'
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/40"
                )}
                title="Continuous Daily & News Learning Core"
              >
                <Brain size={13} className="text-indigo-400" />
                <span className="font-mono">AI Learning</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>

          </div>

          {/* Finviz Secondary Menu Tabs */}
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-1 border-t border-zinc-800/60 scrollbar-none text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('home')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                activeTab === 'home'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab('screener')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'screener'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <SlidersHorizontal size={13} />
              Screener
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'map'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Grid size={13} />
              Maps (Treemap)
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'groups'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <BarChart2 size={13} />
              Groups
            </button>
            <button
              onClick={() => setActiveTab('futures')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'futures'
                  ? "bg-zinc-800 text-amber-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Flame size={13} className="text-amber-400" />
              Futures
            </button>
            <button
              onClick={() => setActiveTab('forex')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'forex'
                  ? "bg-zinc-800 text-cyan-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <ArrowUpDown size={13} className="text-cyan-400" />
              Forex
            </button>
            <button
              onClick={() => setActiveTab('insiders')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'insiders'
                  ? "bg-zinc-800 text-purple-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Users size={13} className="text-purple-400" />
              Insiders
            </button>
            <button
              onClick={() => setActiveTab('crypto')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'crypto'
                  ? "bg-zinc-800 text-amber-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Coins size={13} className="text-amber-400" />
              Crypto
            </button>
            <button
              onClick={() => setActiveTab('multichart')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'multichart'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Grid size={13} />
              Tile Matrix (4/6/9)
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'calendar'
                  ? "bg-zinc-800 text-cyan-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Calendar size={13} className="text-cyan-400" />
              Calendar (EPS/Macro)
            </button>
            <button
              onClick={() => setActiveTab('whale')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'whale'
                  ? "bg-zinc-800 text-purple-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <ShieldAlert size={13} className="text-purple-400" />
              Whale & Dark Pool
            </button>
            <button
              onClick={() => setActiveTab('patterns')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'patterns'
                  ? "bg-zinc-800 text-cyan-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Target size={13} className="text-cyan-400" />
              Pattern History
            </button>
            <button
              onClick={() => setActiveTab('quant_suite')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5",
                activeTab === 'quant_suite'
                  ? "bg-zinc-800 text-cyan-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <FolderGit2 size={13} className="text-cyan-400" />
              <span>Quant Portfolio (5 Models)</span>
            </button>
            <button
              onClick={() => setActiveTab('continuous_learning')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border relative group",
                activeTab === 'continuous_learning'
                  ? "bg-indigo-600 text-white font-black border-indigo-500 shadow-sm"
                  : "border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"
              )}
            >
              <Brain size={13} className="text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>Continuous Learning</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border",
                activeTab === 'chart'
                  ? "bg-emerald-600 text-white font-black border-emerald-500 shadow-sm"
                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              )}
            >
              <Sparkles size={13} />
              Quant Chart ({selectedTicker})
            </button>
            <button
              onClick={() => setActiveTab('news')}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all flex items-center gap-1",
                activeTab === 'news'
                  ? "bg-zinc-800 text-emerald-400 font-black shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850"
              )}
            >
              <Globe size={13} />
              News
            </button>

            {/* Live SSE Stream Pulse Indicator */}
            <div className="ml-auto hidden lg:flex items-center gap-2 pl-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border bg-zinc-900 border-zinc-800 shadow-inner">
                <span className={cn("w-2 h-2 rounded-full", streamConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400/80")} />
                <span className={streamConnected ? "text-emerald-400 font-bold tracking-tight" : "text-zinc-400 font-medium"}>
                  {streamConnected ? `LIVE STREAM • ${tickCount} ticks` : "CONNECTING STREAM"}
                </span>
                {lastTick && (
                  <span className="text-zinc-400 ml-1 font-bold">
                    ({lastTick.ticker} ${lastTick.price.toFixed(2)})
                  </span>
                )}
                <button
                  onClick={() => setStreamActive(s => !s)}
                  className="ml-1 text-zinc-400 hover:text-white p-0.5"
                  title={streamActive ? "Pause stream" : "Resume stream"}
                >
                  {streamActive ? <Pause size={10} /> : <Play size={10} />}
                </button>
              </div>
            </div>
          </nav>
        </div>
      </header>

      {/* 3. Main Dashboard Workspace Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="finviz-home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizHome
                onSelectTicker={handleSelectTicker}
                onNavigateToMap={() => setActiveTab('map')}
                onNavigateToScreener={() => setActiveTab('screener')}
                allData={allData}
              />
            </motion.div>
          )}

          {activeTab === 'screener' && (
            <motion.div
              key="finviz-screener"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizScreener onSelectTicker={handleSelectTicker} allData={allData} />
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div
              key="finviz-map"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizMap onSelectTicker={handleSelectTicker} allData={allData} />
            </motion.div>
          )}

          {activeTab === 'groups' && (
            <motion.div
              key="finviz-groups"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizGroups allData={allData} />
            </motion.div>
          )}

          {activeTab === 'futures' && (
            <motion.div
              key="finviz-futures"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizFutures 
                allData={allData} 
                onSelectTicker={handleSelectTicker} 
                lastUpdate={lastUpdate} 
              />
            </motion.div>
          )}

          {activeTab === 'forex' && (
            <motion.div
              key="finviz-forex"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizForex 
                allData={allData} 
                onSelectTicker={handleSelectTicker} 
              />
            </motion.div>
          )}

          {activeTab === 'insiders' && (
            <motion.div
              key="finviz-insiders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizInsiders onSelectTicker={handleSelectTicker} />
            </motion.div>
          )}

          {activeTab === 'crypto' && (
            <motion.div
              key="finviz-crypto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizCrypto onSelectTicker={handleSelectTicker} />
            </motion.div>
          )}

                    {activeTab === 'multichart' && (
            <motion.div
              key="finviz-multichart"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <FinvizMultiChartGrid
                allData={allData}
                onSelectTicker={handleSelectTicker}
                onSendToQuantLab={onSendToQuantLab}
              />
            </motion.div>
          )}

          {activeTab === 'calendar' && (
            <motion.div
              key="finviz-calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <FinvizCalendar
                onSelectTicker={handleSelectTicker}
                onSendToQuantLab={onSendToQuantLab}
              />
            </motion.div>
          )}

          {activeTab === 'whale' && (
            <motion.div
              key="finviz-whale"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <FinvizWhaleRadar
                onSelectTicker={handleSelectTicker}
                onSendToQuantLab={onSendToQuantLab}
              />
            </motion.div>
          )}

          {activeTab === 'patterns' && (
            <motion.div
              key="finviz-patterns"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <FinvizPatternHistory
                onSelectTicker={handleSelectTicker}
                onSendToQuantLab={onSendToQuantLab}
                allData={allData}
              />
            </motion.div>
          )}

          {activeTab === 'quant_suite' && (
            <motion.div
              key="finviz-quant-suite"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <QuantPortfolioSuite
                initialTicker={selectedTicker}
                onSelectTicker={handleSelectTicker}
                onOpenRiskEngine={onOpenRiskEngine}
                onSendToQuantLab={onSendToQuantLab}
              />
            </motion.div>
          )}

          {activeTab === 'continuous_learning' && (
            <motion.div
              key="finviz-continuous-learning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ContinuousLearningStudio
                onNavigateToNews={() => setActiveTab('news')}
                onNavigateToScreener={() => setActiveTab('screener')}
              />
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div
              key={`finviz-chart-${selectedTicker}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <FinvizChartWithProjections
                ticker={selectedTicker}
                onSelectTicker={handleSelectTicker}
                onAddWatchlist={onToggleWatchlist}
                isWatchlisted={watchlist.includes(selectedTicker)}
                allData={allData}
                lastUpdate={lastUpdate}
                fetchData={fetchData}
                onBack={() => setActiveTab('home')}
              />
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div
              key="finviz-news"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Globe className="text-emerald-400" size={18} />
                <h2 className="text-base font-black uppercase tracking-wider text-white">
                  Real-Time Global Financial News Wire
                </h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">Curated from Bloomberg, Reuters, WSJ, CNBC</span>
            </div>

            <div className="divide-y divide-zinc-850 space-y-3">
              {FINVIZ_NEWS.map(n => (
                <div key={n.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-1">
                      <span className="font-bold text-zinc-300">{n.source}</span>
                      <span>·</span>
                      <span>{n.time}</span>
                    </div>
                    <div className="text-sm font-semibold text-zinc-100 hover:text-emerald-400 cursor-pointer transition-colors">
                      {n.title}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {n.tickers.map(t => (
                      <button
                        key={t}
                        onClick={() => handleSelectTicker(t)}
                        className="px-2 py-0.5 text-xs font-mono font-bold rounded bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </main>

      {/* 4. Finviz-Style Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-4 mt-8 text-center text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-400">FINVIZ QUANT TRADE</span>
            <span>·</span>
            <span>Quotes delayed 15 min · Mathematical Projections Generated via Monte Carlo & Fuzzy Inference</span>
          </div>
          <div className="text-zinc-600 text-[11px]">
            Hedge Fund Grade Analytics
          </div>
        </div>
      </footer>
      {/* Sound & Notification Center Modal */}
      <FinvizNotificationCenter
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectTicker={handleSelectTicker}
        onSendToQuantLab={onSendToQuantLab}
        onNavigateToHistory={() => {
          setActiveTab('patterns');
          setIsNotificationsOpen(false);
          soundEngine.playNotificationTap();
        }}
      />

      {/* Real-Time Floating Toast Alert HUD */}
      <AnimatePresence>
        {liveToastAlert && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-full p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all",
              liveToastAlert.patternType === 'ascending_triangle'
                ? "bg-zinc-950/95 border-cyan-500/60 shadow-cyan-950/80"
                : liveToastAlert.patternType === 'double_bottom'
                ? "bg-zinc-950/95 border-emerald-500/60 shadow-emerald-950/80"
                : "bg-zinc-950/95 border-zinc-700 shadow-2xl"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "p-2 rounded-xl border flex items-center justify-center",
                  liveToastAlert.patternType === 'ascending_triangle'
                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : liveToastAlert.patternType === 'double_bottom'
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300"
                )}>
                  {liveToastAlert.patternType === 'ascending_triangle' ? (
                    <Zap size={18} className="animate-pulse text-cyan-400" />
                  ) : liveToastAlert.patternType === 'double_bottom' ? (
                    <Activity size={18} className="animate-pulse text-emerald-400" />
                  ) : (
                    <Bell size={18} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                      QUANT PATTERN RADAR
                    </span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded text-[9px] font-mono font-black uppercase",
                      liveToastAlert.patternType === 'ascending_triangle'
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    )}>
                      {liveToastAlert.patternType === 'ascending_triangle' ? 'Ascending Triangle' : liveToastAlert.patternType === 'double_bottom' ? 'Double Bottom (W)' : 'Pattern Detected'}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 mt-0.5">
                    <span>{liveToastAlert.ticker}</span>
                    <span className="text-zinc-400 font-normal text-xs font-sans truncate max-w-[160px]">
                      {liveToastAlert.companyName}
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {liveToastAlert.confidence}% Conf
                </span>
                <button
                  onClick={() => setLiveToastAlert(null)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            <p className="mt-2 text-xs text-zinc-300 font-sans leading-relaxed line-clamp-2">
              {liveToastAlert.description}
            </p>

            <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-3">
                {liveToastAlert.currentPrice > 0 && (
                  <div>
                    <span className="text-zinc-500 text-[10px]">Price: </span>
                    <span className="text-zinc-200 font-bold">${liveToastAlert.currentPrice.toFixed(2)}</span>
                  </div>
                )}
                {liveToastAlert.targetPrice > 0 && (
                  <div>
                    <span className="text-emerald-500 text-[10px]">Target: </span>
                    <span className="text-emerald-400 font-bold">${liveToastAlert.targetPrice.toFixed(2)}</span>
                  </div>
                )}
                {liveToastAlert.stopLossPrice > 0 && (
                  <div>
                    <span className="text-rose-500 text-[10px]">Stop: </span>
                    <span className="text-rose-400 font-bold">${liveToastAlert.stopLossPrice.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => {
                  handleSelectTicker(liveToastAlert.ticker);
                  setLiveToastAlert(null);
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <span>Inspect Chart</span>
                <ArrowRight size={13} />
              </button>
              <button
                onClick={() => {
                  setActiveTab('patterns');
                  setLiveToastAlert(null);
                  soundEngine.playNotificationTap();
                }}
                className="py-1.5 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 font-bold font-mono text-xs flex items-center justify-center gap-1 transition-all"
                title="View in Pattern History matrix"
              >
                <Target size={12} />
                <span>History</span>
              </button>
              {onSendToQuantLab && (
                <button
                  onClick={() => {
                    onSendToQuantLab(liveToastAlert.ticker);
                    soundEngine.playBullishBreakout();
                  }}
                  className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-emerald-500/30 font-bold font-mono text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <Sparkles size={12} />
                  <span>QuantLab</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};