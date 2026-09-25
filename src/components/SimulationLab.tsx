import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, TrendingDown, History, 
  ArrowUpRight, ArrowDownRight, Trash2, Zap, 
  Target, Activity, Info, AlertTriangle,
  RefreshCw, DollarSign, BarChart3
} from 'lucide-react';
import { cn } from '../utils/cn';
import { StockData } from '../types';

interface SimulationLabProps {
  data: StockData;
}

interface Holding {
  ticker: string;
  shares: number;
  avgPrice: number;
}

interface SimulationRecord {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  date: string;
}

const INITIAL_BALANCE = 100000;

export default function SimulationLab({ data }: SimulationLabProps) {
  const [balance, setBalance] = useState<number>(() => {
    const saved = localStorage.getItem('sim_balance');
    return saved ? parseFloat(saved) : INITIAL_BALANCE;
  });

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('sim_holdings');
    return saved ? JSON.parse(saved) : [];
  });

  const [history, setHistory] = useState<SimulationRecord[]>(() => {
    const saved = localStorage.getItem('sim_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [sharesToSimulate, setSharesToSimulate] = useState<number>(10);
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<number>(data.currentPrice);

  // Persist state
  useEffect(() => {
    localStorage.setItem('sim_balance', balance.toString());
    localStorage.setItem('sim_holdings', JSON.stringify(holdings));
    localStorage.setItem('sim_history', JSON.stringify(history));
  }, [balance, holdings, history]);

  const currentHolding = useMemo(() => 
    holdings.find(h => h.ticker === data.ticker), 
  [holdings, data.ticker]);

  const portfolioValue = useMemo(() => {
    const holdingsValue = holdings.reduce((acc, h) => {
      const price = h.ticker === data.ticker ? data.currentPrice : h.avgPrice;
      return acc + (h.shares * price);
    }, 0);
    return balance + holdingsValue;
  }, [balance, holdings, data.ticker, data.currentPrice]);

  const totalPnL = portfolioValue - INITIAL_BALANCE;
  const pnlPercent = (totalPnL / INITIAL_BALANCE) * 100;

  const handleBuy = () => {
    const cost = sharesToSimulate * data.currentPrice;
    if (cost > balance) return;

    const newSimulation: SimulationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      ticker: data.ticker,
      type: 'BUY',
      shares: sharesToSimulate,
      price: data.currentPrice,
      date: new Date().toISOString()
    };

    setBalance(prev => prev - cost);
    setHistory(prev => [newSimulation, ...prev]);

    setHoldings(prev => {
      const existing = prev.find(h => h.ticker === data.ticker);
      if (existing) {
        const totalShares = existing.shares + sharesToSimulate;
        const totalCost = (existing.shares * existing.avgPrice) + cost;
        return prev.map(h => h.ticker === data.ticker 
          ? { ...h, shares: totalShares, avgPrice: totalCost / totalShares }
          : h
        );
      }
      return [...prev, { ticker: data.ticker, shares: sharesToSimulate, avgPrice: data.currentPrice }];
    });
  };

  const handleSell = () => {
    if (!currentHolding || currentHolding.shares < sharesToSimulate) return;

    const credit = sharesToSimulate * data.currentPrice;
    const newSimulation: SimulationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      ticker: data.ticker,
      type: 'SELL',
      shares: sharesToSimulate,
      price: data.currentPrice,
      date: new Date().toISOString()
    };

    setBalance(prev => prev + credit);
    setHistory(prev => [newSimulation, ...prev]);

    setHoldings(prev => {
      const existing = prev.find(h => h.ticker === data.ticker);
      if (existing && existing.shares > sharesToSimulate) {
        return prev.map(h => h.ticker === data.ticker 
          ? { ...h, shares: existing.shares - sharesToSimulate }
          : h
        );
      }
      return prev.filter(h => h.ticker !== data.ticker);
    });
  };

  const resetSimulation = () => {
    if (window.confirm('Are you sure you want to reset the simulation? All progress will be lost.')) {
      setBalance(INITIAL_BALANCE);
      setHoldings([]);
      setHistory([]);
      localStorage.removeItem('sim_balance');
      localStorage.removeItem('sim_holdings');
      localStorage.removeItem('sim_history');
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Wallet className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Simulated Capital</p>
              <h3 className="text-2xl font-black text-white tracking-tighter">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Portfolio Value</p>
            <h3 className="text-xl font-black text-white tracking-tighter">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-2xl border",
            totalPnL >= 0 ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
          )}>
            {totalPnL >= 0 ? <TrendingUp className="text-emerald-400" size={24} /> : <TrendingDown className="text-rose-400" size={24} />}
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total P/L</p>
            <h3 className={cn(
              "text-xl font-black tracking-tighter",
              totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {totalPnL >= 0 ? '+' : ''}{totalPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs ml-1 opacity-70">({pnlPercent.toFixed(2)}%)</span>
            </h3>
          </div>
        </div>

        <button 
          onClick={resetSimulation}
          className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 flex flex-col items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/30 transition-all group"
        >
          <RefreshCw className="text-zinc-500 group-hover:text-rose-400 transition-colors mb-1" size={20} />
          <span className="text-[10px] font-bold text-zinc-500 group-hover:text-rose-400 uppercase tracking-widest">Reset Sim</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Simulation Terminal */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Zap className="text-blue-400" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Simulation Terminal: {data.ticker}</h3>
              </div>
              <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(['MARKET', 'LIMIT'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setOrderType(type)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                      orderType === type ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label htmlFor="shares-input" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Shares to Simulate</label>
                    <span className="text-[10px] font-mono font-bold text-zinc-400">{sharesToSimulate} Shares</span>
                  </div>
                  <input 
                    id="shares-input"
                    type="range" 
                    min="1" 
                    max="1000" 
                    step="1" 
                    value={sharesToSimulate} 
                    onChange={(e) => setSharesToSimulate(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex gap-2">
                    {[10, 50, 100, 500].map(v => (
                      <button 
                        key={v}
                        onClick={() => setSharesToSimulate(v)}
                        className="flex-1 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {orderType === 'LIMIT' && (
                  <div className="space-y-2">
                    <label htmlFor="limit-price-input" className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Limit Price</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                      <input 
                        id="limit-price-input"
                        type="number" 
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(parseFloat(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-8 pr-4 text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Current Price</span>
                    <span className="text-sm font-black text-white">${data.currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Simulation Value</span>
                    <span className="text-sm font-black text-blue-400">${(sharesToSimulate * data.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Est. Balance After</span>
                    <span className="text-sm font-black text-zinc-400">${(balance - sharesToSimulate * data.currentPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={handleBuy}
                  disabled={balance < sharesToSimulate * data.currentPrice}
                  className="flex-1 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:opacity-50 disabled:grayscale py-8 flex flex-col items-center justify-center gap-2"
                >
                  <ArrowUpRight size={24} />
                  Simulate Buy {sharesToSimulate} Shares
                </button>
                <button 
                  onClick={handleSell}
                  disabled={!currentHolding || currentHolding.shares < sharesToSimulate}
                  className="flex-1 bg-rose-500 text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-rose-400 transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)] disabled:opacity-50 disabled:grayscale py-8 flex flex-col items-center justify-center gap-2"
                >
                  <ArrowDownRight size={24} />
                  Simulate Sell {sharesToSimulate} Shares
                </button>
              </div>
            </div>
          </div>

          {/* Current Holdings */}
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-xl">
                  <Target className="text-purple-400" size={20} />
                </div>
                <h3 className="text-lg font-bold text-white uppercase tracking-tight">Current Simulated Holdings</h3>
              </div>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{holdings.length} Positions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {holdings.map((h, i) => {
                const currentPrice = h.ticker === data.ticker ? data.currentPrice : h.avgPrice;
                const pnl = (currentPrice - h.avgPrice) * h.shares;
                const pnlPct = ((currentPrice / h.avgPrice) - 1) * 100;
                
                return (
                  <motion.div 
                    key={`${h.ticker}-${i}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-xl font-black text-white tracking-tighter">{h.ticker}</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{h.shares} Shares</p>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          "text-sm font-black",
                          pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>
                          {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                        </p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase tracking-widest",
                          pnl >= 0 ? "text-emerald-500/50" : "text-rose-500/50"
                        )}>
                          {pnlPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800/50">
                      <div>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Avg Price</p>
                        <p className="text-xs font-bold text-zinc-300">${h.avgPrice.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-0.5">Market Value</p>
                        <p className="text-xs font-bold text-zinc-300">${(h.shares * currentPrice).toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {holdings.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl">
                  <BarChart3 size={32} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold uppercase tracking-widest">No active positions</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Simulation History */}
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 h-fit">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-xl">
                <History className="text-amber-400" size={20} />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-tight">Simulation History</h3>
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((simulation, i) => (
              <motion.div 
                key={simulation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    simulation.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                  )}>
                    {simulation.type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-white">{simulation.ticker}</span>
                      <span className={cn(
                        "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
                        simulation.type === 'BUY' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                      )}>
                        {simulation.type}
                      </span>
                    </div>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase">{new Date(simulation.date).toLocaleDateString()} {new Date(simulation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-zinc-200">{simulation.shares} @ ${simulation.price.toFixed(2)}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest">${(simulation.shares * simulation.price).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
            {history.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-600">
                <Activity size={24} className="mb-2 opacity-20" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No simulations executed yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simulation Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex gap-4">
          <div className="p-2 bg-blue-500/10 rounded-xl h-fit">
            <Info className="text-blue-400" size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tight">Risk-Free Learning</p>
            <p className="text-[11px] text-zinc-500 mt-1">Practice simulation strategies without risking real capital. Use the lab to test entry and exit points.</p>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex gap-4">
          <div className="p-2 bg-amber-500/10 rounded-xl h-fit">
            <AlertTriangle className="text-amber-400" size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tight">Market Realism</p>
            <p className="text-[11px] text-zinc-500 mt-1">Simulation uses real-time price data. Remember that slippage and commission are not factored in here.</p>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl h-fit">
            <Activity className="text-emerald-400" size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tight">Strategy Validation</p>
            <p className="text-[11px] text-zinc-500 mt-1">Compare your manual simulation results with the QuantLab backtests to refine your edge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
