import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldAlert, 
  Activity, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  DollarSign
} from 'lucide-react';
import { cn } from '../utils/cn';
import { StockData } from '../types';

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

interface OpenPosition {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  shares: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number;
  takeProfit: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  timestamp: string;
}

interface ExecutionLog {
  id: string;
  time: string;
  type: 'ORDER_SUBMITTED' | 'ORDER_FILLED' | 'STOP_TRIGGERED' | 'TP_TRIGGERED' | 'POSITION_CLOSED';
  message: string;
  side?: 'BUY' | 'SELL';
  pnl?: number;
}

interface LiveStrategyExecutionProps {
  data: StockData;
  activeStrategyName?: string;
  initialStopLossPct?: number;
  initialTakeProfitPct?: number;
}

export default function LiveStrategyExecution({
  data,
  activeStrategyName = 'Neural Alpha Multi-Factor Engine',
  initialStopLossPct = 0.04,
  initialTakeProfitPct = 0.08,
}: LiveStrategyExecutionProps) {
  const ticker = data.ticker || 'SPY';
  const basePrice = data.currentPrice || 500;

  const [livePrice, setLivePrice] = useState<number>(basePrice);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [orderSizeShares, setOrderSizeShares] = useState<number>(50);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [cashBalance, setCashBalance] = useState<number>(100000.0);
  const [realizedPnl, setRealizedPnl] = useState<number>(0.0);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: 'init_1',
      time: new Date().toLocaleTimeString(),
      type: 'ORDER_SUBMITTED',
      message: `Execution engine initialized for ${ticker}. Virtual Portfolio: $100,000.00`
    }
  ]);

  // Sync price if basePrice changes
  useEffect(() => {
    setLivePrice(basePrice);
  }, [basePrice]);

  // Live price tick simulation loop
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setLivePrice(prev => {
        // Random drift with small micro-fluctuations (0.05% to 0.15%)
        const delta = (Math.random() - 0.49) * (prev * 0.0018);
        const newPrice = Math.max(0.5, prev + delta);

        // Check active positions for stop loss or take profit hits
        setOpenPositions(currentPositions => {
          const updated: OpenPosition[] = [];
          currentPositions.forEach(pos => {
            const pnl = (newPrice - pos.entryPrice) * pos.shares;
            const pnlPct = ((newPrice - pos.entryPrice) / pos.entryPrice) * 100;

            const isStopHit = newPrice <= pos.stopLoss;
            const isTpHit = newPrice >= pos.takeProfit;

            if (isStopHit || isTpHit) {
              const exitType = isStopHit ? 'STOP_TRIGGERED' : 'TP_TRIGGERED';
              const reason = isStopHit ? `Stop-Loss triggered @ $${newPrice.toFixed(2)}` : `Take-Profit target achieved @ $${newPrice.toFixed(2)}`;
              
              setCashBalance(c => c + pos.shares * newPrice);
              setRealizedPnl(r => r + pnl);

              setExecutionLogs(logs => [
                {
                  id: `log_${Date.now()}_${Math.random()}`,
                  time: new Date().toLocaleTimeString(),
                  type: exitType,
                  message: `[AUTO-EXIT] ${reason} on ${pos.shares} ${pos.ticker} shares. Realized PnL: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPct.toFixed(2)}%)`,
                  side: 'SELL',
                  pnl
                },
                ...logs.slice(0, 40)
              ]);
            } else {
              updated.push({
                ...pos,
                currentPrice: newPrice,
                unrealizedPnl: pnl,
                unrealizedPnlPct: pnlPct
              });
            }
          });
          return updated;
        });

        return newPrice;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Order Book levels calculated around livePrice
  const orderBook = {
    asks: [
      { price: livePrice + 0.30, size: 450, total: 1250 },
      { price: livePrice + 0.20, size: 320, total: 800 },
      { price: livePrice + 0.10, size: 210, total: 480 },
      { price: livePrice + 0.05, size: 270, total: 270 },
    ],
    bids: [
      { price: livePrice - 0.05, size: 310, total: 310 },
      { price: livePrice - 0.10, size: 280, total: 590 },
      { price: livePrice - 0.20, size: 410, total: 1000 },
      { price: livePrice - 0.30, size: 550, total: 1550 },
    ]
  };

  // Submit manual or algorithmic paper order
  const handleExecuteOrder = (side: 'BUY' | 'SELL') => {
    const cost = orderSizeShares * livePrice;
    if (side === 'BUY' && cost > cashBalance) {
      alert("Insufficient cash balance for this order size.");
      return;
    }

    const sl = livePrice * (1.0 - initialStopLossPct);
    const tp = livePrice * (1.0 + initialTakeProfitPct);

    if (side === 'BUY') {
      const newPos: OpenPosition = {
        id: `pos_${Date.now()}`,
        ticker,
        side: 'BUY',
        shares: orderSizeShares,
        entryPrice: livePrice,
        currentPrice: livePrice,
        stopLoss: sl,
        takeProfit: tp,
        unrealizedPnl: 0,
        unrealizedPnlPct: 0,
        timestamp: new Date().toLocaleTimeString()
      };

      setCashBalance(c => c - cost);
      setOpenPositions(prev => [newPos, ...prev]);

      setExecutionLogs(logs => [
        {
          id: `log_${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'ORDER_FILLED',
          message: `[FILL] BOUGHT ${orderSizeShares} ${ticker} @ $${livePrice.toFixed(2)} (SL: $${sl.toFixed(2)}, TP: $${tp.toFixed(2)})`,
          side: 'BUY'
        },
        ...logs.slice(0, 40)
      ]);
    } else {
      // Selling open positions
      if (openPositions.length === 0) {
        alert("No open positions to close.");
        return;
      }
      handleFlattenAll();
    }
  };

  // Flatten all open positions
  const handleFlattenAll = () => {
    if (openPositions.length === 0) return;

    let totalProceeds = 0;
    let totalPnl = 0;

    openPositions.forEach(pos => {
      const proceeds = pos.shares * livePrice;
      const pnl = (livePrice - pos.entryPrice) * pos.shares;
      totalProceeds += proceeds;
      totalPnl += pnl;
    });

    setCashBalance(c => c + totalProceeds);
    setRealizedPnl(r => r + totalPnl);
    setOpenPositions([]);

    setExecutionLogs(logs => [
      {
        id: `log_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        type: 'POSITION_CLOSED',
        message: `[FLATTEN] Closed all positions @ $${livePrice.toFixed(2)}. Net PnL: ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`,
        side: 'SELL',
        pnl: totalPnl
      },
      ...logs.slice(0, 40)
    ]);
  };

  // Reset paper portfolio
  const handleReset = () => {
    setCashBalance(100000.0);
    setRealizedPnl(0.0);
    setOpenPositions([]);
    setExecutionLogs([
      {
        id: `log_${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        type: 'ORDER_SUBMITTED',
        message: `Reset paper portfolio to $100,000.00 cash.`
      }
    ]);
  };

  const totalUnrealizedPnl = openPositions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalPortfolioValue = cashBalance + openPositions.reduce((acc, p) => acc + p.shares * livePrice, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with Stats */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              isRunning ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            )} />
            <h3 className="text-base font-black uppercase tracking-wider text-white">
              Live Paper Strategy Execution Engine
            </h3>
            <span className="text-[10px] font-mono font-bold bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">
              {isRunning ? "LOOP ACTIVE" : "PAUSED"}
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Real-time algorithmic execution simulator with simulated L2 order book, bracket orders, and tick fills.
          </p>
        </div>

        {/* Live Portfolio Barometer */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 font-mono">
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-sans">Portfolio Value</span>
            <span className="text-sm font-black text-white mt-0.5 block">${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-sans">Unrealized PnL</span>
            <span className={cn(
              "text-sm font-black mt-0.5 block",
              totalUnrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}${totalUnrealizedPnl.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-sans">Realized PnL</span>
            <span className={cn(
              "text-sm font-black mt-0.5 block",
              realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {realizedPnl >= 0 ? '+' : ''}${realizedPnl.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block font-sans">Live {ticker} Price</span>
            <span className="text-sm font-black text-emerald-400 mt-0.5 block animate-pulse">${livePrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 2. Middle Grid: Execution Controls + Order Book + Open Positions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Order Execution Desk */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Zap size={14} className="text-emerald-400" />
                Algorithm Execution Desk
              </h4>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={cn(
                  "p-1.5 rounded-lg text-xs font-bold uppercase transition-all flex items-center gap-1 border",
                  isRunning 
                    ? "bg-zinc-800 text-amber-400 border-amber-500/30 hover:bg-zinc-700" 
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                )}
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
                {isRunning ? "Pause Loop" : "Resume"}
              </button>
            </div>

            {/* Active Strategy Info */}
            <div className="p-3 rounded-2xl bg-black/40 border border-zinc-800/60 text-xs">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 block font-bold">Active Engine</span>
              <span className="font-bold text-white block mt-0.5">{activeStrategyName}</span>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400 font-mono">
                <span>Stop Loss: <strong className="text-rose-400">-{((initialStopLossPct)*100).toFixed(1)}%</strong></span>
                <span>•</span>
                <span>Take Profit: <strong className="text-emerald-400">+{(initialTakeProfitPct*100).toFixed(1)}%</strong></span>
              </div>
            </div>

            {/* Order Size Selector */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1.5">
                Order Size (Shares): {orderSizeShares} (~${(orderSizeShares * livePrice).toFixed(0)})
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map(s => (
                  <button
                    key={s}
                    onClick={() => setOrderSizeShares(s)}
                    className={cn(
                      "py-1.5 rounded-xl text-xs font-mono font-bold transition-all border",
                      orderSizeShares === s
                        ? "bg-zinc-700 text-white border-zinc-500"
                        : "bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleExecuteOrder('BUY')}
                className="py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-wider text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight size={14} />
                BUY {ticker}
              </button>

              <button
                onClick={handleFlattenAll}
                disabled={openPositions.length === 0}
                className={cn(
                  "py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-1.5",
                  openPositions.length > 0
                    ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30"
                    : "bg-zinc-900 text-zinc-600 border-zinc-800 cursor-not-allowed"
                )}
              >
                <ShieldAlert size={14} />
                Flatten All
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60">
              <span>Available Cash: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <button
                onClick={handleReset}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <RotateCcw size={10} />
                Reset
              </button>
            </div>
          </div>

          {/* Micro L2 Order Book View */}
          <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-400">Simulated Order Book</span>
              <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">L2 Depth</span>
            </div>

            {/* Asks (Sell orders) */}
            <div className="space-y-1">
              {orderBook.asks.map((ask, i) => (
                <div key={i} className="flex justify-between text-rose-400/90 text-[11px]">
                  <span>${ask.price.toFixed(2)}</span>
                  <span className="text-zinc-500">{ask.size} shares</span>
                  <span className="text-zinc-600 font-sans text-[10px]">${ask.total}</span>
                </div>
              ))}
            </div>

            {/* Spread marker */}
            <div className="py-1 px-3 bg-zinc-950 rounded-xl border border-zinc-800/80 flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-400">${livePrice.toFixed(2)}</span>
              <span className="text-[10px] font-sans text-zinc-500 font-normal">Spread: $0.10 (0.02%)</span>
            </div>

            {/* Bids (Buy orders) */}
            <div className="space-y-1">
              {orderBook.bids.map((bid, i) => (
                <div key={i} className="flex justify-between text-emerald-400/90 text-[11px]">
                  <span>${bid.price.toFixed(2)}</span>
                  <span className="text-zinc-500">{bid.size} shares</span>
                  <span className="text-zinc-600 font-sans text-[10px]">${bid.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Open Positions & Real-time Execution Audit Stream */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Positions Table */}
          <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Layers size={14} className="text-blue-400" />
                Active Open Positions ({openPositions.length})
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">Bracket Guards Active</span>
            </div>

            {openPositions.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-xs bg-black/20 rounded-2xl border border-zinc-900">
                No active positions. Execute a trade or let the algorithmic loop auto-fill.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                {openPositions.map(pos => (
                  <div
                    key={pos.id}
                    className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{pos.ticker}</span>
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {pos.side} {pos.shares}x
                        </span>
                        <span className="text-[10px] text-zinc-500 font-sans">@ ${pos.entryPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-zinc-400 mt-1">
                        <span>SL: <strong className="text-rose-400">${pos.stopLoss.toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>TP: <strong className="text-emerald-400">${pos.takeProfit.toFixed(2)}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={cn(
                        "text-sm font-black block",
                        pos.unrealizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {pos.unrealizedPnl >= 0 ? '+' : ''}${pos.unrealizedPnl.toFixed(2)} ({pos.unrealizedPnlPct >= 0 ? '+' : ''}{pos.unrealizedPnlPct.toFixed(2)}%)
                      </span>
                      <span className="text-[10px] text-zinc-500 font-sans block mt-0.5">Mark: ${livePrice.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-time Execution Feed & Audit Log */}
          <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                Algorithmic Execution Stream
              </h4>
              <span className="text-[10px] text-zinc-500 font-mono">Live Fill Telemetry</span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
              {executionLogs.map(log => (
                <div
                  key={log.id}
                  className={cn(
                    "p-2.5 rounded-xl border flex items-start justify-between gap-3 text-xs leading-relaxed",
                    log.type === 'STOP_TRIGGERED'
                      ? "bg-rose-500/5 border-rose-500/20 text-rose-300"
                      : log.type === 'TP_TRIGGERED'
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                      : log.type === 'ORDER_FILLED'
                      ? "bg-blue-500/5 border-blue-500/20 text-blue-300"
                      : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                  )}
                >
                  <div className="flex-1">
                    <span className="text-[9px] text-zinc-500 font-sans mr-2 block sm:inline">{log.time}</span>
                    <span>{log.message}</span>
                  </div>
                  {log.pnl !== undefined && (
                    <span className={cn(
                      "font-bold text-[11px] whitespace-nowrap",
                      log.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {log.pnl >= 0 ? '+' : ''}${log.pnl.toFixed(2)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
