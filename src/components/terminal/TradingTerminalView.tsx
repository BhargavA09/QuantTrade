import React, { useState, useMemo, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Area 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Brain, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  Sliders, 
  Target, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Search,
  BarChart3,
  Cpu,
  Globe,
  Layers,
  ShieldCheck,
  RefreshCw,
  Coins,
  Flame,
  Clock,
  Play
} from 'lucide-react';
import { 
  quantTraderBrain, 
  TraderBrainState, 
  ActiveTrade,
  QuantStrategyParameters 
} from '../../services/QuantTraderBrain';
import { EXPANDED_STOCK_DATABASE } from '../../data/expandedStockDatabase';
import { FINVIZ_STOCKS } from '../../data/finvizData';
import OptionsSimulation from '../OptionsSimulation';

interface TradingTerminalViewProps {
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onNavigateToBrain?: () => void;
}

export const TradingTerminalView: React.FC<TradingTerminalViewProps> = ({
  selectedTicker,
  onSelectTicker,
  onNavigateToBrain
}) => {
  const [brainState, setBrainState] = useState<TraderBrainState>(() => quantTraderBrain.getState());
  
  // Terminal Sub-Tabs
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'strategy' | 'global_radar' | 'options'>('chart');

  // Chart state
  const [showIndicators, setShowIndicators] = useState({
    ema20: true,
    ema50: true,
    bollinger: false,
    volume: true
  });
  const [tradeMessage, setTradeMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Strategy RL Reset State
  const [rlResetFeedback, setRlResetFeedback] = useState<{
    message: string;
    reward: number;
    reinforcedAlpha: string;
    prevParams: QuantStrategyParameters;
    newParams: QuantStrategyParameters;
  } | null>(null);
  const [isResettingRl, setIsResettingRl] = useState(false);

  // Global Market & Commodities Filter
  const [marketCategoryFilter, setMarketCategoryFilter] = useState<'all' | 'commodity' | 'global_stock' | 'index' | 'forex_crypto'>('all');
  const [inspectedGlobalAsset, setInspectedGlobalAsset] = useState<string>('GLD');

  useEffect(() => {
    return quantTraderBrain.subscribe(setBrainState);
  }, []);

  // Global universe from QuantTraderBrain
  const globalUniverse = useMemo(() => {
    return quantTraderBrain.getGlobalMarketUniverse();
  }, []);

  // Resolve current active stock/asset information
  const stockMeta = useMemo(() => {
    // 1. Check Global Universe first (Commodities, Indices, International)
    const glob = globalUniverse.find(g => g.ticker.toUpperCase() === selectedTicker.toUpperCase());
    if (glob) {
      return {
        ticker: glob.ticker,
        name: glob.name,
        sector: glob.assetType,
        price: glob.price,
        change: glob.change,
        changePercent: glob.changePercent,
        pe: glob.category === 'commodity' ? 0 : 28.5,
        category: glob.category
      };
    }

    // 2. Check Finviz Stocks
    const fin = FINVIZ_STOCKS.find(s => s.ticker.toUpperCase() === selectedTicker.toUpperCase());
    if (fin) {
      return {
        ...fin,
        category: 'global_stock' as const,
        changePercent: fin.change
      };
    }

    // 3. Check Expanded Database
    const exp = EXPANDED_STOCK_DATABASE.find(s => s.ticker.toUpperCase() === selectedTicker.toUpperCase());
    if (exp) {
      return {
        ticker: exp.ticker,
        name: exp.name || `${exp.ticker} Inc.`,
        sector: exp.sector || 'Equities',
        price: exp.price || 150.0,
        change: exp.change || 1.25,
        changePercent: exp.changePercent || 0.85,
        pe: exp.pe || 28.4,
        category: 'global_stock' as const
      };
    }

    // 4. Fallback for custom searched symbol (e.g. user types any global stock)
    const seed = selectedTicker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const synthPrice = parseFloat((((seed * 17) % 450) + 25).toFixed(2));
    const synthChange = parseFloat((((seed % 10) - 4.5) * 0.8).toFixed(2));
    const synthChangePct = parseFloat(((synthChange / synthPrice) * 100).toFixed(2));

    return {
      ticker: selectedTicker.toUpperCase(),
      name: `${selectedTicker.toUpperCase()} Asset`,
      sector: selectedTicker.includes('=F') || selectedTicker.includes('XAU') ? 'Commodity Futures' : 'Global Market Security',
      price: synthPrice,
      change: synthChange,
      changePercent: synthChangePct,
      pe: 24.2,
      category: 'global_stock' as const
    };
  }, [selectedTicker, globalUniverse]);

  const currentPrice = stockMeta.price;

  // Generate synthetic high-density 30-bar historical data for the chart with EMAs
  const chartBars = useMemo(() => {
    const bars: any[] = [];
    let p = currentPrice * 0.94;
    const now = Date.now();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 86400000).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const dailyDrift = (Math.random() - 0.47) * 0.024;
      p = parseFloat((p * (1 + dailyDrift)).toFixed(2));
      const high = parseFloat((p * (1 + Math.random() * 0.015)).toFixed(2));
      const low = parseFloat((p * (1 - Math.random() * 0.015)).toFixed(2));
      const volume = Math.floor(15000000 * (0.8 + Math.random() * 0.6));

      bars.push({
        date,
        price: p,
        high,
        low,
        open: p * 0.995,
        close: p,
        volume
      });
    }

    bars[bars.length - 1].price = currentPrice;
    bars[bars.length - 1].close = currentPrice;

    let ema20 = bars[0].price;
    let ema50 = bars[0].price * 0.98;
    const k20 = 2 / (20 + 1);
    const k50 = 2 / (50 + 1);

    return bars.map((b) => {
      ema20 = (b.price * k20) + (ema20 * (1 - k20));
      ema50 = (b.price * k50) + (ema50 * (1 - k50));
      const bbUpper = ema20 * 1.025;
      const bbLower = ema20 * 0.975;

      return {
        ...b,
        ema20: parseFloat(ema20.toFixed(2)),
        ema50: parseFloat(ema50.toFixed(2)),
        bbUpper: parseFloat(bbUpper.toFixed(2)),
        bbLower: parseFloat(bbLower.toFixed(2))
      };
    });
  }, [currentPrice, selectedTicker]);

  // Quant Signal for currently selected ticker
  const quantSignal = useMemo(() => {
    const category = (stockMeta as any).category || 'global_stock';
    return quantTraderBrain.generateStrategyForAsset(
      stockMeta.ticker,
      stockMeta.name,
      category,
      currentPrice,
      stockMeta.changePercent || 0.5,
      22.4
    );
  }, [currentPrice, stockMeta, brainState]);

  // Strategy for inspected global market asset in the Global Radar sub-tab
  const inspectedAssetData = useMemo(() => {
    const item = globalUniverse.find(g => g.ticker === inspectedGlobalAsset) || globalUniverse[0];
    const strategy = quantTraderBrain.generateStrategyForAsset(
      item.ticker,
      item.name,
      item.category,
      item.price,
      item.changePercent,
      item.volatility
    );
    return { item, strategy };
  }, [inspectedGlobalAsset, globalUniverse, brainState]);

  // Filtered global universe list
  const filteredGlobalUniverse = useMemo(() => {
    return globalUniverse.filter(item => {
      const matchesCategory = marketCategoryFilter === 'all' || item.category === marketCategoryFilter;
      const matchesSearch = searchQuery === '' || 
        item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.assetType.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [globalUniverse, marketCategoryFilter, searchQuery]);

  // Execute Paper Order
  const handleExecute = (type: 'LONG' | 'SHORT') => {
    const trade = quantTraderBrain.executeOrder(
      selectedTicker,
      type,
      currentPrice,
      quantSignal.setupName
    );
    setTradeMessage(`Executed ${type} ${trade.quantity} units of ${selectedTicker} @ $${trade.entryPrice.toFixed(2)} (Kelly allocation: ${(trade.kellyFraction * 100).toFixed(1)}%)`);
    setTimeout(() => setTradeMessage(null), 5000);
  };

  // Close Active Position
  const handleCloseActiveTrade = (tradeId: string) => {
    const res = quantTraderBrain.closePosition(tradeId);
    if (res) {
      if (res.isWin) {
        setTradeMessage(`Closed trade with PROFIT +$${res.pnl.toFixed(2)}! Alpha reinforced in brain.`);
      } else {
        setTradeMessage(`Closed trade with LOSS -$${Math.abs(res.pnl).toFixed(2)}. Mistake analyzed and self-correction applied.`);
      }
      setTimeout(() => setTradeMessage(null), 6000);
    }
  };

  // Reset Strategy using Reinforcement Learning
  const handleResetStrategyWithRL = () => {
    setIsResettingRl(true);
    setTimeout(() => {
      const result = quantTraderBrain.resetStrategyWithReinforcementLearning();
      setRlResetFeedback({
        message: result.message,
        reward: result.rewardEarned,
        reinforcedAlpha: result.reinforcedAlpha,
        prevParams: result.previousParameters,
        newParams: result.newParameters
      });
      setIsResettingRl(false);
      setTradeMessage(`Reinforcement Learning Policy Updated! Policy Reward: +${result.rewardEarned}. Active quant parameters refreshed.`);
      setTimeout(() => setTradeMessage(null), 6000);
    }, 600);
  };

  // Quick switch popular tickers & commodities
  const popularTickers = [
    { sym: 'NVDA', label: 'NVDA', type: 'Tech' },
    { sym: 'GLD', label: 'Gold', type: 'Commodity' },
    { sym: 'USO', label: 'Oil', type: 'Commodity' },
    { sym: 'SPY', label: 'S&P 500', type: 'Index' },
    { sym: 'TSM', label: 'TSMC', type: 'Global' },
    { sym: 'SLV', label: 'Silver', type: 'Commodity' },
    { sym: 'AAPL', label: 'Apple', type: 'Tech' },
    { sym: 'BTC-USD', label: 'Bitcoin', type: 'Crypto' }
  ];

  return (
    <div className="space-y-6">
      {/* 1. Sub-Tab Header Strip & Quick Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl backdrop-blur-md">
        
        {/* Terminal Sub-Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs font-bold font-mono">
          <button
            onClick={() => setActiveSubTab('chart')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'chart'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Terminal & Chart</span>
          </button>

          <button
            onClick={() => setActiveSubTab('strategy')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 relative ${
              activeSubTab === 'strategy'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span>Strategy & RL Model</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveSubTab('global_radar')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'global_radar'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Globe className="w-4 h-4 text-blue-400" />
            <span>Global & Commodities</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-sans">RADAR</span>
          </button>

          <button
            onClick={() => setActiveSubTab('options')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'options'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-950/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Options Simulator</span>
          </button>
        </div>

        {/* Global Asset Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  onSelectTicker(searchQuery.trim().toUpperCase());
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              placeholder="Search ANY stock or commodity (e.g. GLD, USO, TSM, NVDA)..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-24 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
            />
            <button
              onClick={() => {
                if (searchQuery.trim()) {
                  onSelectTicker(searchQuery.trim().toUpperCase());
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300"
            >
              Analyze ↵
            </button>
          </div>

          {/* Quick Search Auto-Suggest Dropdown */}
          {isSearchOpen && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] uppercase font-bold text-zinc-500 px-2 py-1">Global Universe Matches</div>
              {filteredGlobalUniverse.slice(0, 8).map(item => (
                <div
                  key={item.ticker}
                  onClick={() => {
                    onSelectTicker(item.ticker);
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 cursor-pointer transition-colors text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.ticker}</span>
                    <span className="text-zinc-400 truncate max-w-[140px] text-[11px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-300">${item.price.toFixed(2)}</span>
                    <span className={`font-bold ${item.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Custom input simulation option */}
              <div 
                onClick={() => {
                  onSelectTicker(searchQuery.trim().toUpperCase());
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
                className="p-2 border-t border-zinc-800 text-[11px] text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer flex items-center justify-between"
              >
                <span>Simulate custom ticker <strong>{searchQuery.trim().toUpperCase()}</strong></span>
                <span className="text-zinc-500">Run Quant Brain &rarr;</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Active Asset Ticker & Context Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-xl">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-black text-white font-mono tracking-tight">{stockMeta.ticker}</h2>
            <span className="text-xs text-zinc-400 font-medium">{stockMeta.name}</span>
          </div>

          <span className="text-zinc-600">·</span>

          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl font-black text-white">${currentPrice.toFixed(2)}</span>
            <span className={`text-xs font-bold flex items-center gap-0.5 ${stockMeta.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {stockMeta.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {stockMeta.change >= 0 ? '+' : ''}{stockMeta.change.toFixed(2)}%
            </span>
          </div>

          <span className="text-zinc-600">·</span>

          <span className="text-xs text-zinc-400 font-mono px-2 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
            {stockMeta.sector}
          </span>
        </div>

        {/* Popular Tickers Quick Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {popularTickers.map(t => (
            <button
              key={t.sym}
              onClick={() => onSelectTicker(t.sym)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                selectedTicker.toUpperCase() === t.sym
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-950/40'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <span>{t.label}</span>
              <span className="text-[9px] text-zinc-500 font-sans">{t.type}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Execution / RL Reset Feedback Toast */}
      {tradeMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs font-medium flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{tradeMessage}</span>
          </div>
          {onNavigateToBrain && (
            <button
              onClick={onNavigateToBrain}
              className="underline text-indigo-300 hover:text-white text-xs shrink-0 ml-3"
            >
              View Brain Reflection &rarr;
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 1: TERMINAL & CHART VIEW                                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'chart' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 8 Cols: Interactive Technical Chart */}
            <div className="lg:col-span-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Target className="w-4 h-4 text-emerald-400" />
                    Technical Structure & Quantitative Envelopes
                  </h3>
                  <p className="text-xs text-zinc-400 font-mono">
                    Kalman trend vector · Bollinger envelopes · Half-Kelly execution
                  </p>
                </div>

                {/* Indicator Toggles */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setShowIndicators(prev => ({ ...prev, ema20: !prev.ema20 }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      showIndicators.ema20 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    EMA 20
                  </button>
                  <button
                    onClick={() => setShowIndicators(prev => ({ ...prev, ema50: !prev.ema50 }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      showIndicators.ema50 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    EMA 50
                  </button>
                  <button
                    onClick={() => setShowIndicators(prev => ({ ...prev, bollinger: !prev.bollinger }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                      showIndicators.bollinger ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    Bollinger (2σ)
                  </button>
                </div>
              </div>

              {/* Interactive Recharts Canvas */}
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartBars} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis 
                      stroke="#71717a" 
                      fontSize={11} 
                      tickLine={false} 
                      domain={['dataMin - 2', 'dataMax + 2']}
                      tickFormatter={v => `$${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#3f3f46',
                        borderRadius: '0.75rem',
                        fontSize: '12px'
                      }}
                      formatter={(val: any, name: any) => {
                        if (name === 'price') return [`$${val}`, 'Close Price'];
                        if (name === 'ema20') return [`$${val}`, '20-EMA'];
                        if (name === 'ema50') return [`$${val}`, '50-EMA'];
                        if (name === 'bbUpper') return [`$${val}`, 'Upper Band'];
                        if (name === 'bbLower') return [`$${val}`, 'Lower Band'];
                        return [val, name];
                      }}
                    />
                    {showIndicators.bollinger && (
                      <>
                        <Line type="monotone" dataKey="bbUpper" stroke="#a855f7" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="bbLower" stroke="#a855f7" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                      </>
                    )}
                    <Area type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#priceGradient)" />
                    {showIndicators.ema20 && (
                      <Line type="monotone" dataKey="ema20" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                    )}
                    {showIndicators.ema50 && (
                      <Line type="monotone" dataKey="ema50" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Technical Footprint Readouts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-zinc-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Kalman Trend Vector</span>
                  <span className="font-mono text-emerald-400 font-bold">{quantSignal.kalmanTrendDrift}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">GARCH Volatility Risk</span>
                  <span className="font-mono text-zinc-300 font-bold">{quantSignal.garchVolatilityRisk} Risk</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">SMC Order Block</span>
                  <span className="font-mono text-indigo-400 font-bold">{quantSignal.orderBlockZone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Optimal Kelly Allocation</span>
                  <span className="font-mono text-amber-400 font-bold">{quantSignal.halfKellyAllocationPct}% of Portfolio</span>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Live Confluence Signal & One-Click Order Execution */}
            <div className="lg:col-span-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-emerald-400" />
                    Adaptive Quant Signal
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {quantSignal.confidence}% Confidence
                  </span>
                </div>

                {/* Signal Badge */}
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">System Recommendation</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-black uppercase font-mono ${
                      quantSignal.isBullish 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {quantSignal.bias}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{quantSignal.setupName}</h4>
                  <div className="text-xs text-zinc-400 font-mono space-y-1">
                    <div className="flex justify-between">
                      <span>Entry: <strong className="text-white">${quantSignal.entryPrice.toFixed(2)}</strong></span>
                      <span>Stop: <strong className="text-rose-400">${quantSignal.stopLoss.toFixed(2)}</strong></span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target 1: <strong className="text-emerald-400">${quantSignal.target1.toFixed(2)}</strong></span>
                      <span>Target 2: <strong className="text-emerald-300">${quantSignal.target2.toFixed(2)}</strong></span>
                    </div>
                    <div className="text-[11px] text-zinc-500 pt-1">
                      Expected Risk:Reward {quantSignal.riskReward}
                    </div>
                  </div>
                </div>

                {/* Confluence Factors */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block">
                    Confluence Factors
                  </span>
                  <ul className="text-xs text-zinc-300 space-y-1">
                    {quantSignal.confluenceFactors.map((cf, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{cf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Kelly Sizing Recommendation */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Half-Kelly Sizing</span>
                    <span className="font-bold text-white">{quantSignal.suggestedSharesOrContracts} units (~${(quantSignal.suggestedSharesOrContracts * currentPrice).toLocaleString()})</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>Capital Weight</span>
                    <span className="text-emerald-400">{quantSignal.halfKellyAllocationPct}% max risk</span>
                  </div>
                </div>
              </div>

              {/* Execution Action */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleExecute('LONG')}
                    className="py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Buy / Long
                  </button>
                  <button
                    onClick={() => handleExecute('SHORT')}
                    className="py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-md shadow-rose-950/40"
                  >
                    <TrendingDown className="w-4 h-4" />
                    Sell / Short
                  </button>
                </div>
                <p className="text-[10px] text-center text-zinc-500">
                  Paper execution records outcome and trains the continuous learning engine
                </p>
              </div>
            </div>
          </div>

          {/* Open Monitored Positions Strip */}
          {brainState.activeTrades.length > 0 && (
            <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Active Monitored Positions ({brainState.activeTrades.length})
                </h3>
                <span className="text-xs text-zinc-500 font-mono">Real-time risk bounding active</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {brainState.activeTrades.map(trade => (
                  <div 
                    key={trade.id}
                    className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-white text-sm">{trade.ticker}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          trade.tradeType === 'LONG' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {trade.tradeType}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">{trade.quantity} units</span>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono text-sm font-black ${
                          trade.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {trade.unrealizedPnl >= 0 ? '+' : ''}${trade.unrealizedPnl.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-zinc-500 block font-mono">
                          ({trade.unrealizedPnlPct >= 0 ? '+' : ''}{trade.unrealizedPnlPct.toFixed(2)}%)
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2">
                      <div>
                        <span className="text-[9px] uppercase text-zinc-500 block">Entry</span>
                        <span>${trade.entryPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-zinc-500 block">Stop</span>
                        <span className="text-rose-400">${trade.stopLoss.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-zinc-500 block">Target</span>
                        <span className="text-emerald-400">${trade.takeProfit1.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCloseActiveTrade(trade.id)}
                      className="w-full py-1.5 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                    >
                      Close Position & Evaluate
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: STRATEGY & REINFORCEMENT LEARNING MODEL VIEW (REQUESTED)        */}
      {/* ========================================================================= */}
      {activeSubTab === 'strategy' && (
        <div className="space-y-6">
          {/* Top Banner: Model Overview & The 'Reset Strategy' Action Button */}
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Q-Policy Gradient Model
                </span>
                <span className="text-xs text-zinc-400 font-mono">
                  Calibrated to Epoch {brainState.strategyParameters?.lastReinforcedEpoch || 18}
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Active Quantitative Parameters & Self-Calibrating Policy
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The Quant model continuously learns from real market trade outcomes and news catalysts. Active hyperparameters govern trade selectivity, Kalman filter trend extraction, GARCH volatility limits, and Half-Kelly money management.
              </p>
            </div>

            {/* Prominent Reset Strategy Button */}
            <div className="shrink-0 flex flex-col items-start md:items-end gap-2">
              <button
                onClick={handleResetStrategyWithRL}
                disabled={isResettingRl}
                className="py-3 px-5 rounded-xl text-xs font-black uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2.5 transition-all shadow-lg shadow-indigo-950/60 disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 text-indigo-200 ${isResettingRl ? 'animate-spin' : ''}`} />
                <span>Reset Strategy (Reinforcement Learning)</span>
              </button>
              <span className="text-[10px] text-zinc-500 font-mono">
                Optimizes parameters on {brainState.successes.length} recent success episodes
              </span>
            </div>
          </div>

          {/* RL Reset Notification Feedback (Before vs After Delta) */}
          {rlResetFeedback && (
            <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 shadow-2xl space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>RL Policy Recalibration Complete</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  Reward Earned: +{rlResetFeedback.reward}
                </span>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                {rlResetFeedback.message}
              </p>

              {/* Delta Comparison Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-indigo-900/60">
                <div className="p-2.5 rounded-lg bg-zinc-950/60">
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">Vol Threshold</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 line-through">{rlResetFeedback.prevParams.volatilityThreshold}%</span>
                    <span className="text-emerald-400 font-bold">&rarr; {rlResetFeedback.newParams.volatilityThreshold}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950/60">
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">Kalman Trend Logic</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 line-through">+{rlResetFeedback.prevParams.trendFollowingThreshold}%</span>
                    <span className="text-emerald-400 font-bold">&rarr; +{rlResetFeedback.newParams.trendFollowingThreshold}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950/60">
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">Half-Kelly Scalar</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 line-through">{(rlResetFeedback.prevParams.halfKellyFraction * 100).toFixed(0)}%</span>
                    <span className="text-emerald-400 font-bold">&rarr; {(rlResetFeedback.newParams.halfKellyFraction * 100).toFixed(0)}%</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-zinc-950/60">
                  <span className="text-[10px] text-zinc-500 block uppercase font-sans">ATR Stop Buffer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 line-through">{rlResetFeedback.prevParams.dynamicStopLossAtr}x</span>
                    <span className="text-emerald-400 font-bold">&rarr; {rlResetFeedback.newParams.dynamicStopLossAtr}x</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Model Parameters Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Volatility Threshold */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Volatility Threshold</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-amber-500/20 text-amber-300">
                  {brainState.strategyParameters?.volatilityThreshold}% GARCH
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {brainState.strategyParameters?.volatilityThreshold}%
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Annualized GARCH(1,1) ceiling. When market regime volatility exceeds this threshold, position sizing is aggressively discounted to protect against tail-risk spikes.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, ((brainState.strategyParameters?.volatilityThreshold || 24) / 40) * 100)}%` }} 
                />
              </div>
            </div>

            {/* 2. Trend-Following Logic (Kalman Drift) */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Trend-Following Drift</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  +{brainState.strategyParameters?.trendFollowingThreshold}% Slope
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                +{brainState.strategyParameters?.trendFollowingThreshold}%
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Minimum Kalman Filter daily drift required before triggering trend continuation entries. Filters out noise and choppy sideways consolidations.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, ((brainState.strategyParameters?.trendFollowingThreshold || 1.4) / 3.0) * 100)}%` }} 
                />
              </div>
            </div>

            {/* 3. Mean Reversion Z-Score */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Mean Reversion Barrier</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-500/20 text-blue-300">
                  {brainState.strategyParameters?.meanReversionZScore}σ Z-Score
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {brainState.strategyParameters?.meanReversionZScore}σ
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ornstein-Uhlenbeck statistical dispersion trigger. Price must deviate by at least this many standard deviations from historical equilibrium before mean-reversion snaps are executed.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-400 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, ((brainState.strategyParameters?.meanReversionZScore || 2.1) / 3.5) * 100)}%` }} 
                />
              </div>
            </div>

            {/* 4. Breakout Volume Multiplier */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Breakout Volume Filter</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-purple-500/20 text-purple-300">
                  {brainState.strategyParameters?.breakoutVolumeMultiplier}x VWAP
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {brainState.strategyParameters?.breakoutVolumeMultiplier}x
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Volume multiple required vs 20-period average. Calibrated after MSTK-101 (False Breakout trap) to reject low-volume retail liquidity sweeps.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-purple-400 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, ((brainState.strategyParameters?.breakoutVolumeMultiplier || 1.8) / 3.0) * 100)}%` }} 
                />
              </div>
            </div>

            {/* 5. Half-Kelly Capital Sizing */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Half-Kelly Sizing</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  {(brainState.strategyParameters?.halfKellyFraction * 100).toFixed(0)}% Scalar
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {(brainState.strategyParameters?.halfKellyFraction * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mathematically optimal capital allocation fraction derived from win-rate ({brainState.stats.winRate}%) and profit factor ({brainState.stats.profitFactor}x) for long-term compound wealth growth.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, (brainState.strategyParameters?.halfKellyFraction || 0.5) * 100)}%` }} 
                />
              </div>
            </div>

            {/* 6. Dynamic ATR Stop Buffer */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Dynamic ATR Stop Buffer</span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-300">
                  {brainState.strategyParameters?.dynamicStopLossAtr}x ATR
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {brainState.strategyParameters?.dynamicStopLossAtr}x
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Average True Range stop distance. Dynamically expanded to prevent stop hunts and wick-outs during normal intra-day price fluctuations.
              </p>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-rose-400 h-full rounded-full transition-all" 
                  style={{ width: `${Math.min(100, ((brainState.strategyParameters?.dynamicStopLossAtr || 1.6) / 2.5) * 100)}%` }} 
                />
              </div>
            </div>

          </div>

          {/* Factor Weights & Policy Reinforcement History */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Factor Weights Allocation */}
            <div className="lg:col-span-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Active Confluence Factor Weightings (Sum = 100%)
                </h3>
                <span className="text-xs font-mono text-zinc-500">Auto-Rebalanced</span>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Kalman Momentum Drift</span>
                    <span className="text-emerald-400 font-bold">{(brainState.weights.momentum * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${brainState.weights.momentum * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Mean Reversion (Ornstein-Uhlenbeck)</span>
                    <span className="text-blue-400 font-bold">{(brainState.weights.mean_reversion * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full" style={{ width: `${brainState.weights.mean_reversion * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Pattern Breakout & Order Blocks</span>
                    <span className="text-purple-400 font-bold">{(brainState.weights.pattern_breakout * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${brainState.weights.pattern_breakout * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">Smart Money Structure (SMC)</span>
                    <span className="text-indigo-400 font-bold">{(brainState.weights.smc_structure * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${brainState.weights.smc_structure * 100}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-zinc-300">News Catalyst Confirmation</span>
                    <span className="text-amber-400 font-bold">{(brainState.weights.news_catalyst * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${brainState.weights.news_catalyst * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Reinforcement Learning Episode History */}
            <div className="lg:col-span-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  RL Optimization Episode History
                </h3>
                <span className="text-xs font-mono text-indigo-300 font-bold">
                  Score: {brainState.strategyParameters?.reinforcementScore}/100
                </span>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {brainState.strategyParameters?.reinforcementHistory?.map((ep, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-1">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white">{ep.trigger}</span>
                      <span className="text-emerald-400 font-bold">+{ep.rewardEarned} Reward</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {ep.summary}
                    </p>
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 pt-0.5">
                      <span>{ep.timestamp}</span>
                      <span>·</span>
                      <span>Model Sharpe: {ep.newSharpe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: GLOBAL MARKETS & COMMODITIES RADAR (REQUESTED)                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'global_radar' && (
        <div className="space-y-6">
          {/* Header Banner & Category Filter Strip */}
          <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Continuous Market Eye
                </span>
                <span className="text-xs text-zinc-400 font-mono">Global Scanner Active</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-1">
                Global Markets & Commodities Intelligence Radar
              </h2>
              <p className="text-xs text-zinc-400">
                The Quant Brain keeps an eye on global equities, precious metals, energy commodities, world indices, and crypto, generating autonomous strategies for every asset.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All Markets' },
                { id: 'commodity', label: 'Commodities (Gold/Oil)' },
                { id: 'global_stock', label: 'Global Tech & Equities' },
                { id: 'index', label: 'World Indices' },
                { id: 'forex_crypto', label: 'Crypto & Bonds' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMarketCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    marketCategoryFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-950/40'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Radar Layout: Left Assets Matrix + Right In-Depth Strategy Dossier */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Cols: Global Market Surveillance Matrix */}
            <div className="lg:col-span-7 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Monitored Market Universe ({filteredGlobalUniverse.length})
                </h3>
                <span className="text-xs text-zinc-500 font-mono">Click asset to inspect strategy</span>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto no-scrollbar">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-[10px] uppercase font-bold text-zinc-500 border-b border-zinc-800 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                    <tr>
                      <th className="py-2.5 px-3">Asset / Ticker</th>
                      <th className="py-2.5 px-3">Price</th>
                      <th className="py-2.5 px-3">24h Change</th>
                      <th className="py-2.5 px-3">Brain Bias</th>
                      <th className="py-2.5 px-3">Confidence</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {filteredGlobalUniverse.map(asset => {
                      const isSelected = inspectedGlobalAsset === asset.ticker;
                      const isBullish = asset.changePercent >= 0;
                      return (
                        <tr 
                          key={asset.ticker}
                          onClick={() => setInspectedGlobalAsset(asset.ticker)}
                          className={`hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-950/30 border-l-2 border-blue-400' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-bold text-white">{asset.ticker}</div>
                            <div className="text-[10px] text-zinc-400 font-sans truncate max-w-[150px]">{asset.name}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-zinc-200">
                            ${asset.price.toFixed(2)}
                          </td>
                          <td className={`py-3 px-3 font-bold ${isBullish ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isBullish ? '+' : ''}{asset.changePercent.toFixed(2)}%
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                              isBullish 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {isBullish ? 'BUY' : 'SHORT'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-zinc-300 font-bold">
                            {Math.floor(75 + (brainState.stats.winRate - 60) * 0.5 + Math.abs(asset.changePercent))}%
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTicker(asset.ticker);
                                setActiveSubTab('chart');
                              }}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-emerald-600 hover:text-white text-[11px] text-zinc-300 transition-colors"
                            >
                              Trade &rarr;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 Cols: Deep Brain Strategy Dossier for Inspected Asset */}
            <div className="lg:col-span-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-400 block font-mono">
                      Brain Strategy Dossier
                    </span>
                    <h3 className="text-lg font-black text-white font-mono">
                      {inspectedAssetData.item.ticker} · ${inspectedAssetData.item.price.toFixed(2)}
                    </h3>
                    <p className="text-xs text-zinc-400">{inspectedAssetData.item.name}</p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase font-mono ${
                    inspectedAssetData.strategy.isBullish 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {inspectedAssetData.strategy.bias}
                  </span>
                </div>

                {/* Setup & Actionable Execution Levels */}
                <div className="p-4 rounded-xl bg-zinc-950/90 border border-zinc-800 space-y-2.5 font-mono">
                  <div className="text-xs font-bold text-white font-sans flex items-center justify-between">
                    <span>{inspectedAssetData.strategy.setupName}</span>
                    <span className="text-emerald-400">{inspectedAssetData.strategy.confidence}% Conviction</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-800/80">
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">Entry Price</span>
                      <span className="text-white font-bold">${inspectedAssetData.strategy.entryPrice.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">Stop-Loss (ATR)</span>
                      <span className="text-rose-400 font-bold">${inspectedAssetData.strategy.stopLoss.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">Take-Profit 1</span>
                      <span className="text-emerald-400 font-bold">${inspectedAssetData.strategy.target1.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase text-zinc-500 block">Take-Profit 2</span>
                      <span className="text-emerald-300 font-bold">${inspectedAssetData.strategy.target2.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/80">
                    <span>Risk-Reward Ratio</span>
                    <span className="font-bold text-zinc-200">{inspectedAssetData.strategy.riskReward}</span>
                  </div>
                </div>

                {/* Confluence Rationale List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block font-mono">
                    Confluence Rationale
                  </span>
                  <ul className="text-xs text-zinc-300 space-y-1.5">
                    {inspectedAssetData.strategy.confluenceFactors.map((cf, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span>{cf}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Macro & Catalyst Tape */}
                <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs text-zinc-400 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Catalyst & Tape Intelligence</span>
                  <p className="leading-relaxed text-zinc-300">{inspectedAssetData.strategy.catalystInsight}</p>
                </div>
              </div>

              {/* Action: Simulate & Load in Terminal */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    onSelectTicker(inspectedAssetData.item.ticker);
                    setActiveSubTab('chart');
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-950/40"
                >
                  <Play className="w-4 h-4" />
                  Load & Simulate {inspectedAssetData.item.ticker} in Terminal
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: OPTIONS & DERIVATIVES SIMULATION VIEW                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'options' && (
        <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                Black-Scholes Options Greeks & Volatility Simulator: {selectedTicker}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Real-time Greeks (Delta, Gamma, Vega, Theta), IV skew curve, and payoff profiles
              </p>
            </div>
          </div>

          <OptionsSimulation
            data={{
              ticker: stockMeta.ticker,
              companyName: stockMeta.name,
              currentPrice: currentPrice,
              change: stockMeta.change,
              changePercent: stockMeta.changePercent,
              high: currentPrice * 1.015,
              low: currentPrice * 0.985,
              volume: 35000000,
              pe: 28.5,
              sector: stockMeta.sector,
              historicalPrices: chartBars.map(b => ({
                date: b.date,
                close: b.price,
                open: b.open,
                high: b.high,
                low: b.low,
                volume: b.volume
              }))
            } as any}
          />
        </div>
      )}

    </div>
  );
};
