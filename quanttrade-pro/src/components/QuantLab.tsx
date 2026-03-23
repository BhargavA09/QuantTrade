import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ReferenceLine
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Activity, Zap, Target, 
  Layers, BarChart3, PieChart as PieChartIcon, 
  AlertTriangle, CheckCircle2, Info, ArrowUpRight, ArrowDownRight,
  Filter, Play, Settings, RefreshCw, Database, Cpu
} from 'lucide-react';
import { cn } from '../utils/cn';
import { StockData } from '../types';

interface QuantLabProps {
  data: StockData;
  allData: Record<string, StockData>;
}

type Strategy = 'sma_crossover' | 'rsi_mean_reversion' | 'momentum' | 'bollinger_bands';

interface EquityPoint {
  date: string;
  equity: number;
  price: number;
  benchmark?: number;
}

interface BacktestResults {
  equityCurve: EquityPoint[];
  totalReturn: number;
  benchmarkReturn: number;
  trades: number;
  winRate: number;
  maxDD: number;
  sharpe: number;
  sortino: number;
  calmar: number;
  alpha: number;
  beta: number;
  kelly: number;
  hurst: number;
  var95: number;
  cvar95: number;
  zScore: number;
  distributionData: { bin: number; count: number }[];
}

export default function QuantLab({ data, allData }: QuantLabProps) {
  const [strategy, setStrategy] = useState<Strategy>('sma_crossover');
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [lookbackPeriod, setLookbackPeriod] = useState(252); // 1 year

  // Simulate Backtest Results
  const backtestResults = useMemo<BacktestResults | null>(() => {
    if (!data.history) return null;
    
    const history = data.history.slice(-lookbackPeriod);
    const equityCurve: EquityPoint[] = [];
    let capital = 10000;
    let position = 0;
    let trades = 0;
    let wins = 0;
    
    // Simple Strategy Logic
    history.forEach((day, i) => {
      if (i < 20) {
        equityCurve.push({ date: day.date, equity: capital, price: day.price });
        return;
      }
      
      const prices = history.slice(0, i + 1).map(d => d.price);
      const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = prices.length >= 50 ? prices.slice(-50).reduce((a, b) => a + b, 0) / 50 : sma20;
      
      let signal = 'hold';
      if (strategy === 'sma_crossover') {
        if (sma20 > sma50 && position === 0) signal = 'buy';
        else if (sma20 < sma50 && position > 0) signal = 'sell';
      } else if (strategy === 'rsi_mean_reversion') {
        // Mock RSI
        const rsi = 50 + (Math.random() * 40 - 20);
        if (rsi < 30 && position === 0) signal = 'buy';
        else if (rsi > 70 && position > 0) signal = 'sell';
      } else if (strategy === 'momentum') {
        const mom = (day.price / history[i-10].price - 1) * 100;
        if (mom > 2 && position === 0) signal = 'buy';
        else if (mom < -1 && position > 0) signal = 'sell';
      }
      
      if (signal === 'buy') {
        position = capital / day.price;
        capital = 0;
        trades++;
      } else if (signal === 'sell') {
        capital = position * day.price;
        position = 0;
        if (capital > equityCurve[equityCurve.length-1].equity) wins++;
      }
      
      const currentEquity = position > 0 ? position * day.price : capital;
      equityCurve.push({ 
        date: day.date, 
        equity: currentEquity, 
        price: day.price,
        benchmark: (day.price / history[0].price) * 10000
      });
    });
    
    const finalEquity = equityCurve[equityCurve.length - 1].equity;
    const totalReturn = ((finalEquity / 10000) - 1) * 100;
    const benchmarkReturn = ((history[history.length-1].price / history[0].price) - 1) * 100;
    
    // Calculate Drawdown
    let maxEquity = 0;
    let maxDD = 0;
    const dailyReturns: number[] = [];
    equityCurve.forEach((d, idx) => {
      if (idx > 0) {
        dailyReturns.push((d.equity / equityCurve[idx-1].equity) - 1);
      }
      if (d.equity > maxEquity) maxEquity = d.equity;
      const dd = (d.equity - maxEquity) / maxEquity;
      if (dd < maxDD) maxDD = dd;
    });

    const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(dailyReturns.map(x => Math.pow(x - avgReturn, 2)).reduce((a, b) => a + b, 0) / dailyReturns.length);
    const downsideDev = Math.sqrt(dailyReturns.filter(x => x < 0).map(x => Math.pow(x, 2)).reduce((a, b) => a + b, 0) / dailyReturns.length);

    const annualizedReturn = (Math.pow(1 + totalReturn / 100, 252 / lookbackPeriod) - 1) * 100;
    const annualizedVol = stdDev * Math.sqrt(252) * 100;
    const sharpe = (annualizedReturn - 2) / (annualizedVol || 1); // 2% risk free rate
    const sortino = (annualizedReturn - 2) / (downsideDev * Math.sqrt(252) * 100 || 1);
    const calmar = annualizedReturn / (Math.abs(maxDD * 100) || 1);
    
    const winRate = trades > 0 ? (wins / (trades / 2)) * 100 : 0;
    const winLossRatio = 1.5 + Math.random(); // Mock
    const kelly = (winRate / 100) - ((1 - winRate / 100) / winLossRatio);

    // Mock Statistical Tests
    const hurst = 0.45 + Math.random() * 0.15;
    const zScore = (avgReturn / (stdDev || 1)) * Math.sqrt(dailyReturns.length);
    
    // VaR / CVaR
    const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
    const varIndex = Math.floor(sortedReturns.length * 0.05);
    const var95 = sortedReturns[varIndex] * 100;
    const cvar95 = (sortedReturns.slice(0, varIndex).reduce((a, b) => a + b, 0) / (varIndex || 1)) * 100;

    // Distribution Data
    const bins: Record<string, number> = {};
    dailyReturns.forEach(r => {
      const bin = (Math.floor(r * 100 / 0.5) * 0.5).toFixed(1);
      bins[bin] = (bins[bin] || 0) + 1;
    });
    const distributionData = Object.entries(bins).map(([bin, count]) => ({
      bin: parseFloat(bin),
      count
    })).sort((a, b) => a.bin - b.bin);

    return {
      equityCurve,
      totalReturn,
      benchmarkReturn,
      trades,
      winRate,
      maxDD: Math.abs(maxDD * 100),
      sharpe,
      sortino,
      calmar,
      alpha: totalReturn - benchmarkReturn,
      beta: 0.8 + Math.random() * 0.4,
      kelly: Math.max(0, kelly * 100),
      hurst,
      var95: Math.abs(var95),
      cvar95: Math.abs(cvar95),
      zScore,
      distributionData
    };
  }, [data.history, strategy, lookbackPeriod]);

  // Factor Exposure Data
  const factorExposure = [
    { factor: 'Value', value: 65, full: 100 },
    { factor: 'Growth', value: 85, full: 100 },
    { factor: 'Momentum', value: 45, full: 100 },
    { factor: 'Quality', value: 92, full: 100 },
    { factor: 'Volatility', value: 30, full: 100 },
    { factor: 'Size', value: 70, full: 100 },
  ];

  // Correlation Matrix Data
  const correlations = Object.keys(allData).slice(0, 5).map(ticker => ({
    ticker,
    correlation: ticker === data.ticker ? 1 : 0.4 + Math.random() * 0.5
  }));

  const handleRunBacktest = () => {
    setIsBacktesting(true);
    setTimeout(() => setIsBacktesting(false), 1500);
  };

  const [numSims, setNumSims] = useState(100);

  // Strategy Code Snippet
  const strategyCode = useMemo(() => {
    switch (strategy) {
      case 'sma_crossover':
        return `// SMA Crossover Strategy
function onTick(price, history) {
  const sma20 = history.slice(-20).mean();
  const sma50 = history.slice(-50).mean();
  
  if (sma20 > sma50) return 'BUY';
  if (sma20 < sma50) return 'SELL';
  return 'HOLD';
}`;
      case 'rsi_mean_reversion':
        return `// RSI Mean Reversion
function onTick(price, history) {
  const rsi = calculateRSI(history, 14);
  
  if (rsi < 30) return 'BUY';
  if (rsi > 70) return 'SELL';
  return 'HOLD';
}`;
      case 'momentum':
        return `// Momentum Strategy
function onTick(price, history) {
  const mom = (price / history[i-10].price - 1) * 100;
  
  if (mom > 2) return 'BUY';
  if (mom < -1) return 'SELL';
  return 'HOLD';
}`;
      default:
        return `// Custom Strategy
function onTick(price, history) {
  return 'HOLD';
}`;
    }
  }, [strategy]);

  // Monte Carlo Simulation for Strategy
  const monteCarloData = useMemo(() => {
    if (!backtestResults) return [];
    const sims = [];
    for (let i = 0; i < 5; i++) {
      let current = 10000;
      const path = [{ x: 0, y: current }];
      for (let j = 1; j <= 20; j++) {
        const drift = (backtestResults.totalReturn / 252) / 100;
        const vol = (backtestResults.maxDD / 10) / 100;
        current *= (1 + drift + (Math.random() * 2 - 1) * vol);
        path.push({ x: j, y: current });
      }
      sims.push(path);
    }
    return sims;
  }, [backtestResults]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
            <Cpu className="text-emerald-400" size={24} />
            Quant Research Lab
          </h2>
          <p className="text-zinc-500 text-sm font-medium mt-1 uppercase tracking-widest">Advanced Strategy Backtesting & Factor Analysis</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
            {(['sma_crossover', 'rsi_mean_reversion', 'momentum'] as Strategy[]).map((s) => (
              <button
                key={s}
                onClick={() => setStrategy(s)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                  strategy === s ? "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <button 
            onClick={handleRunBacktest}
            disabled={isBacktesting}
            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all disabled:opacity-50"
          >
            {isBacktesting ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
            Run Backtest
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Performance Chart */}
        <div className="xl:col-span-2 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <TrendingUp className="text-emerald-400" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Strategy Equity Curve</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Strategy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-zinc-700" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Benchmark</span>
              </div>
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={backtestResults?.equityCurve}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickFormatter={(val) => `$${(val/1000).toFixed(1)}k`}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equity" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorEquity)" 
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="benchmark" 
                  stroke="#3f3f46" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="space-y-6">
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Zap className="text-yellow-400" size={16} />
              Performance Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Return</p>
                <p className={cn(
                  "text-xl font-black",
                  (backtestResults?.totalReturn || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {backtestResults?.totalReturn.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Max Drawdown</p>
                <p className="text-xl font-black text-rose-400">
                  {backtestResults?.maxDD.toFixed(2)}%
                </p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sharpe Ratio</p>
                <p className="text-xl font-black text-white">
                  {backtestResults?.sharpe.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sortino Ratio</p>
                <p className="text-xl font-black text-emerald-400">
                  {backtestResults?.sortino.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Calmar Ratio</p>
                <p className="text-xl font-black text-blue-400">
                  {backtestResults?.calmar.toFixed(2)}
                </p>
              </div>
              <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Win Rate</p>
                <p className="text-xl font-black text-emerald-400">
                  {backtestResults?.winRate.toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Alpha vs Benchmark</span>
                <span className="text-xs font-black text-emerald-400">+{backtestResults?.alpha.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${Math.min(100, (backtestResults?.alpha || 0) * 5 + 50)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
              <Layers className="text-blue-400" size={16} />
              Factor Exposure
            </h3>
            
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={factorExposure}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="factor" tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 'bold' }} />
                  <Radar
                    name="Exposure"
                    dataKey="value"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistical Tests */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <Activity className="text-purple-400" size={16} />
            Statistical Significance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Hurst Exponent</span>
              <div className="text-right">
                <span className="text-sm font-black text-white">{backtestResults?.hurst.toFixed(3)}</span>
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{backtestResults?.hurst > 0.5 ? 'Trending' : 'Mean Reverting'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Z-Score (Stat Sig)</span>
              <div className="text-right">
                <span className="text-sm font-black text-white">{backtestResults?.zScore.toFixed(2)}</span>
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">{Math.abs(backtestResults?.zScore || 0) > 1.96 ? 'Significant' : 'Not Significant'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Kelly Criterion</span>
              <div className="text-right">
                <span className="text-sm font-black text-emerald-400">{backtestResults?.kelly.toFixed(1)}%</span>
                <p className="text-[8px] text-zinc-500 uppercase tracking-widest">Opt. Allocation</p>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Decomposition */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <AlertTriangle className="text-rose-400" size={16} />
            Risk Decomposition
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">VaR (95% Daily)</span>
              <span className="text-sm font-black text-rose-400">-{backtestResults?.var95.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">CVaR (Exp. Shortfall)</span>
              <span className="text-sm font-black text-rose-500">-{backtestResults?.cvar95.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Beta to Benchmark</span>
              <span className="text-sm font-black text-blue-400">{backtestResults?.beta.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Strategy Editor */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Database className="text-emerald-400" size={16} />
              Strategy Logic
            </h3>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">v1.2</span>
          </div>
          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 font-mono text-[10px] text-emerald-400/80 leading-relaxed overflow-x-auto h-[100px]">
            <pre>{strategyCode}</pre>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Return Distribution */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <BarChart3 className="text-emerald-400" size={16} />
            Return Distribution (Daily)
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={backtestResults?.distributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="bin" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickFormatter={(val) => `${val}%`}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  labelStyle={{ color: '#10b981', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drawdown Profile */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <TrendingDown className="text-rose-400" size={16} />
            Drawdown Profile
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={backtestResults?.equityCurve}>
                <defs>
                  <linearGradient id="colorDD" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickFormatter={(val) => `${((val - 10000)/100).toFixed(0)}%`}
                  hide
                />
                <Area 
                  type="monotone" 
                  dataKey={(d) => {
                    // Calculate DD for this point
                    const idx = backtestResults?.equityCurve.indexOf(d) || 0;
                    const slice = backtestResults?.equityCurve.slice(0, idx + 1);
                    const max = Math.max(...slice.map(p => p.equity));
                    return ((d.equity - max) / max) * 100;
                  }}
                  stroke="#f43f5e" 
                  fill="url(#colorDD)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <RefreshCw className="text-blue-400" size={16} />
            Monte Carlo Projections
          </h3>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="x" hide />
                <YAxis hide domain={['auto', 'auto']} />
                {monteCarloData.map((sim, i) => (
                  <Line 
                    key={i}
                    data={sim}
                    type="monotone"
                    dataKey="y"
                    stroke={i === 0 ? "#10b981" : "#3f3f46"}
                    strokeWidth={i === 0 ? 2 : 1}
                    dot={false}
                    opacity={i === 0 ? 1 : 0.3}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">VaR (95%)</p>
              <p className="text-sm font-black text-rose-400">-${(10000 * 0.08).toFixed(0)}</p>
            </div>
            <div className="text-center border-x border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Exp. Return</p>
              <p className="text-sm font-black text-emerald-400">+${(10000 * 0.12).toFixed(0)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Prob. Profit</p>
              <p className="text-sm font-black text-blue-400">68.4%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Correlation Matrix */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <Activity className="text-purple-400" size={16} />
            Cross-Asset Correlation
          </h3>
          
          <div className="space-y-4">
            {correlations.map((c) => (
              <div key={c.ticker} className="flex items-center gap-4">
                <div className="w-16 text-xs font-black text-zinc-400">{c.ticker}</div>
                <div className="flex-1 h-8 bg-zinc-950 rounded-lg border border-zinc-800 relative overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      c.correlation > 0.8 ? "bg-emerald-500" : c.correlation > 0.5 ? "bg-blue-500" : "bg-zinc-700"
                    )}
                    style={{ width: `${c.correlation * 100}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white uppercase tracking-widest">
                    {(c.correlation * 100).toFixed(0)}% Correlation
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Insights */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2">
            <Target className="text-emerald-400" size={16} />
            Quantitative Insights
          </h3>
          
          <div className="space-y-4">
            <div className="flex gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="p-2 bg-emerald-500/10 rounded-xl h-fit">
                <CheckCircle2 className="text-emerald-400" size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Regime Detection</p>
                <p className="text-[11px] text-zinc-500 mt-1">Market is currently in a high-volatility expansion phase. Momentum strategies are favored over mean reversion.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="p-2 bg-blue-500/10 rounded-xl h-fit">
                <Info className="text-blue-400" size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Factor Rotation</p>
                <p className="text-[11px] text-zinc-500 mt-1">Significant rotation into Quality and Value factors observed in the last 14 trading sessions.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
              <div className="p-2 bg-yellow-500/10 rounded-xl h-fit">
                <AlertTriangle className="text-yellow-400" size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tight">Tail Risk Warning</p>
                <p className="text-[11px] text-zinc-500 mt-1">Kurtosis levels are elevated. Probability of a 3-sigma event is currently 4.2% higher than historical average.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
