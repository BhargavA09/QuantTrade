import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, Play, Pause, History, TrendingUp, TrendingDown, RefreshCcw, 
  DollarSign, Brain, Activity, Terminal, Sliders, Cpu, Layers, 
  Radio, Database, Zap, Shield, HelpCircle, ArrowRightLeft, RadioReceiver, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { portfolioManager, Position, TradeLog, ExecutionLog } from '../services/PortfolioManager';
import { neuralBrain } from '../services/NeuralBrain';
import { cn } from '../utils/cn';

export const QuantBot: React.FC<{ ticker?: string; currentPrice?: number }> = ({ ticker, currentPrice }) => {
  const [stats, setStats] = useState(portfolioManager.getStats());
  const [positions, setPositions] = useState<Position[]>(portfolioManager.getPositions());
  const [history, setHistory] = useState<TradeLog[]>(portfolioManager.getHistory());
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>(portfolioManager.getExecutionLogs());
  const [isBotActive, setIsBotActive] = useState(portfolioManager.isBotActive());
  const [capitalInput, setCapitalInput] = useState('10000');
  const [manualShares, setManualShares] = useState('10');
  const [activeTab, setActiveTab] = useState<'radar' | 'positions'>('radar');

  // Simulated live microstructure stats that fluctuate on ticks
  const [obi, setObi] = useState(0.51);
  const [ticksPerSec, setTicksPerSec] = useState(14);
  const [spreadBps, setSpreadBps] = useState(0.85);

  useEffect(() => {
    return portfolioManager.subscribe(() => {
      setStats(portfolioManager.getStats());
      setPositions([...portfolioManager.getPositions()]);
      setHistory([...portfolioManager.getHistory()]);
      setExecutionLogs([...portfolioManager.getExecutionLogs()]);
      setIsBotActive(portfolioManager.isBotActive());
    });
  }, []);

  // Fluctuate micro-structure stats dynamically to simulate continuous high-speed exchange order queues
  useEffect(() => {
    const interval = setInterval(() => {
      if (isBotActive) {
        setObi(prev => {
          const shift = (Math.random() - 0.5) * 0.08;
          return Math.max(0.35, Math.min(0.65, prev + shift));
        });
        setTicksPerSec(() => Math.floor(10 + Math.random() * 8));
        setSpreadBps(prev => {
          const shift = (Math.random() - 0.5) * 0.1;
          return Math.max(0.4, Math.min(2.2, prev + shift));
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isBotActive]);

  const handleInitialize = () => {
    const amount = parseFloat(capitalInput);
    if (isNaN(amount) || amount <= 0) return;
    portfolioManager.initialize(amount);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your portfolio and clear all DMA telemetry? This will return the bot to standby capital.')) {
      portfolioManager.reset();
    }
  };

  // High Frequency Symbols list showing continuous scan targets
  const hftTargets = useMemo(() => {
    return [
      { name: 'SPY', spread: '0.4 bps', state: 'LIQUID', weight: '35%' },
      { name: 'NVDA', spread: '1.2 bps', state: 'VOLATILE', weight: '25%' },
      { name: 'AAPL', spread: '0.8 bps', state: 'LIQUID', weight: '15%' },
      { name: 'TSLA', spread: '2.1 bps', state: 'HIGH-BETA', weight: '15%' },
      { name: 'QQQ', spread: '0.5 bps', state: 'LIQUID', weight: '10%' }
    ];
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 rounded-3xl bg-zinc-900/50 border border-zinc-805/50 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
            <Cpu className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">AI Neural Quant Execution</h2>
              <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-wider",
                isBotActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse" : "bg-zinc-800 text-zinc-400 border border-zinc-700"
              )}>
                {isBotActive ? 'ACTIVE HFT RUNNING' : 'STANDBY'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">High Frequency DMA Edge v3.2</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          {stats.initialCapital > 0 && (
            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/20 transition-all active:scale-95 bg-zinc-900/50"
              title="Liquify & Reset Portfolio"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          )}
          <button
            onClick={() => portfolioManager.toggleBot(!isBotActive)}
            className={cn(
              "px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg",
              isBotActive 
                ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                : "bg-emerald-500 text-black border border-emerald-400 hover:bg-emerald-400"
            )}
          >
            {isBotActive ? <><Pause className="w-4 h-4 fill-current" /> Deactivate AI</> : <><Play className="w-4 h-4 fill-current" /> Deploy AI Strategist</>}
          </button>
        </div>
      </div>

      {stats.initialCapital === 0 ? (
        <div className="p-16 text-center border-2 border-dashed border-zinc-800 rounded-3xl bg-black/40">
          <div className="max-w-xs mx-auto space-y-6">
            <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mx-auto border border-emerald-500/10">
              <DollarSign className="w-10 h-10 text-emerald-500/50" />
            </div>
            <div className="space-y-2">
              <h3 className="text-white text-xl font-bold">Fund the Quant Core</h3>
              <p className="text-zinc-500 text-sm">Transfer virtual capital to set trade limits. The high-frequency strategist will instantly begin scanning order books for market inefficiencies.</p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="number"
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white font-mono outline-none focus:border-emerald-500/50 transition-colors text-center"
                placeholder="Initial Capital (USD)"
              />
              <button 
                onClick={handleInitialize}
                className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400 shadow-lg shadow-emerald-500/10 transition-all"
              >
                Capitalize & Launch Desk
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* AI Internal State (Learning parameters) */}
          <div className="p-4 rounded-2xl bg-black/50 border border-zinc-800 grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                   <Activity className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Regime Calibration</div>
                   <div className="text-white font-bold text-sm">{isBotActive ? (neuralBrain.getMemory()?.regime || 'Calibrating...') : 'Standby'}</div>
                </div>
             </div>
             <div className="flex items-center gap-3 border-zinc-800/50 md:border-l md:pl-4">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/10">
                   <Zap className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Signal Confidence</div>
                   <div className="text-purple-400 font-mono font-bold text-sm">{((neuralBrain.getMemory()?.modelConfidence || 0) * 100).toFixed(1)}%</div>
                </div>
             </div>
             <div className="flex items-center gap-3 border-zinc-800/50 md:border-l md:pl-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/10">
                   <Terminal className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">HFT Order Latency</div>
                   <div className="text-blue-400 font-mono text-sm font-bold">~148 microseconds</div>
                </div>
             </div>
             <div className="flex items-center gap-3 border-zinc-800/50 md:border-l md:pl-4">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/10">
                   <Brain className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Self-Assessed Error</div>
                   <div className="text-orange-400 font-mono text-sm font-bold">{((neuralBrain.getMemory()?.historicalErrorRate || 0.35) * 100).toFixed(1)}%</div>
                </div>
             </div>
          </div>

          {/* Core Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/30">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Portfolio Value</p>
              <div className="text-xl font-black text-white">$ {stats.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/30">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Available Cash</p>
              <div className="text-xl font-bold text-white font-mono">$ {stats.balance.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/30">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Trading ROI</p>
              <div className={cn("text-xl font-bold flex items-center gap-1", stats.totalPnL >= 0 ? "text-emerald-400" : "text-red-400")}>
                {stats.totalPnL >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {stats.pnlPercent.toFixed(2)} %
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/30 border border-zinc-700/30">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Active Positions</p>
              <div className="text-xl font-bold text-white">{stats.activePositions} contracts</div>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab('radar')}
              className={cn(
                "px-5 py-3 text-xs font-bold font-mono tracking-wider transition-all border-b-2 flex items-center gap-2 relative",
                activeTab === 'radar' 
                  ? "border-emerald-500 text-emerald-400" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Radio className="w-4 h-4" />
              HIGH-FREQUENCY RADAR DESK
              {isBotActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute right-2 top-3" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('positions')}
              className={cn(
                "px-5 py-3 text-xs font-bold font-mono tracking-wider transition-all border-b-2 flex items-center gap-2",
                activeTab === 'positions' 
                  ? "border-emerald-500 text-emerald-400" 
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Layers className="w-4 h-4" />
              PORTFOLIO POSITIONS & HANDLES
              {positions.length > 0 && (
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] rounded font-mono font-black">
                  {positions.length}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'radar' ? (
              <motion.div 
                key="radar-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Microstructure Metrics & Gauge */}
                <div className="flex flex-col gap-4 lg:col-span-1">
                  <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800 flex flex-col gap-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-emerald-400" /> ORDER BOOK MICROSTRUCTURE
                    </h3>

                    {/* Order Book Imbalance Slider */}
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[10px] uppercase font-mono font-semibold text-zinc-500">Book Imbalance (OBI)</span>
                        <span className="text-xs font-bold font-mono text-emerald-450">{isBotActive ? (obi * 100).toFixed(1) : '50.0'}%</span>
                      </div>
                      
                      {/* Depth Gauge Visual */}
                      <div className="h-2 rounded-full bg-zinc-800/50 relative overflow-hidden flex">
                        <div 
                          className="h-full bg-emerald-500/20 text-right pr-1 transition-all duration-300"
                          style={{ width: `${obi * 100}%` }}
                        />
                        <div className="w-0.5 h-full bg-zinc-300 absolute left-1/2 -ml-px" />
                      </div>
                      
                      <div className="flex justify-between text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-widest">
                        <span>BID PRESSURE (BUY)</span>
                        <span>ASK DENSITY (SELL)</span>
                      </div>
                    </div>

                    {/* High-frequency Micro-Parameters */}
                    <div className="space-y-3 pt-2">
                      <div className="flex justify-between py-1.5 border-b border-zinc-900 text-xs">
                        <span className="text-zinc-500 font-medium">Tick-by-Tick Feed Velocity</span>
                        <span className="text-white font-mono font-bold">{isBotActive ? ticksPerSec : 0} ticks/sec</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-zinc-900 text-xs">
                        <span className="text-zinc-500 font-medium">Inside Bid-Ask Spread</span>
                        <span className="text-emerald-450 font-mono font-bold">{isBotActive ? spreadBps.toFixed(2) : '0.00'} bps</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-zinc-900 text-xs">
                        <span className="text-zinc-500 font-medium">Kalman Drift Gain (KG)</span>
                        <span className="text-white font-mono font-bold">0.1425</span>
                      </div>
                      <div className="flex justify-between py-1.5 text-xs">
                        <span className="text-zinc-500 font-medium">Execution Engine Cooldown</span>
                        <span className="text-indigo-400 font-mono font-semibold">0.02ms</span>
                      </div>
                    </div>
                  </div>

                  {/* Autopilot Scan targets */}
                  <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800 flex flex-col gap-3">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 mb-1">
                      <RadioReceiver className="w-4 h-4 text-emerald-400" /> ACTIVE ARBITRAGE ARRAYS
                    </h3>
                    
                    <div className="space-y-2">
                      {hftTargets.map((stock) => (
                        <div key={stock.name} className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-wider font-mono">{stock.name}</span>
                            <span className="text-[8px] font-mono px-1.5 py-0.2 bg-zinc-850 border border-zinc-800 text-zinc-400 rounded">
                              {stock.weight}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-zinc-500">Spread: {stock.spread}</span>
                            <span className={cn(
                              "text-[8px] font-black tracking-widest font-mono",
                              stock.state === 'VOLATILE' ? 'text-orange-400' : (stock.state === 'HIGH-BETA' ? 'text-indigo-400' : 'text-emerald-450')
                            )}>{stock.state}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct Telemetry Low Latency Stream */}
                 <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl bg-zinc-950/70 border border-indigo-500/10 flex-1 flex flex-col gap-3 min-h-[420px] max-h-[500px]">
                      <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                        <div className="flex items-center gap-2">
                           <Terminal className="w-5 h-5 text-indigo-400" />
                           <h3 className="text-xs font-black text-white uppercase tracking-widest">Direct Market Access (DMA) Order Router Telemetry</h3>
                        </div>
                        <span className="text-[8px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-black">
                          SPEED-BUMP PROOFED
                        </span>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1 space-y-2 scrollbar-none font-mono text-xs">
                        {executionLogs.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-12 text-zinc-650">
                             <Layers className="w-10 h-10 mb-2 opacity-10 text-zinc-400" />
                             <p className="font-semibold text-zinc-500 font-mono text-[11px] uppercase tracking-wider">No low-latency routing logs found</p>
                             <p className="text-[10px] text-zinc-600 mt-1">Deploy the AI Strategist and trade live on tickers to witness multi-venue execution routing.</p>
                          </div>
                        ) : (
                          <AnimatePresence initial={false}>
                            {executionLogs.map((log) => (
                              <motion.div
                                key={log.id}
                                initial={{ opacity: 0, x: 20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0 }}
                                className="p-3 rounded-lg border border-zinc-900 bg-zinc-950/80 hover:border-zinc-800 transition-colors flex flex-col gap-1.5"
                              >
                                <div className="flex items-center justify-between text-[10px]">
                                   <div className="flex items-center gap-2">
                                      <span className="text-emerald-400 font-bold">[{log.ticker}]</span>
                                      <span className="text-zinc-500">{new Date(log.timestamp).toLocaleTimeString() + '.' + String(new Date(log.timestamp).getMilliseconds()).padStart(3, '0')}</span>
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <span className="text-zinc-600 text-[9px] font-semibold">{log.route}</span>
                                      <span className="px-1 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20">
                                        Latency: {log.latencyNs}ns
                                      </span>
                                   </div>
                                </div>
                                <div className="text-zinc-300 font-medium break-all text-[11px] leading-relaxed">
                                   {log.action}
                                </div>
                                <div className="flex items-center justify-between text-[9px] text-zinc-500 border-t border-zinc-900/60 pt-1">
                                   <span>Slippage: <span className="text-emerald-450 font-bold">{(log.slippagePct * 100).toFixed(5)}%</span></span>
                                   <span className="flex items-center gap-1">
                                      ROUTE CHECK: <span className="text-indigo-400 select-none font-bold">ACK FILL</span>
                                   </span>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        )}
                      </div>
                    </div>
                 </div>
              </motion.div>
            ) : (
              <motion.div 
                key="positions-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Manual Execution Section */}
                {ticker && currentPrice && (
                  <div className="p-4 rounded-2xl bg-black/40 border border-zinc-850 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                         <ArrowRightLeft className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">DMA Manual Execution Desk</div>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-base font-bold text-white font-mono">{ticker}</span>
                          <span className="text-sm font-mono text-emerald-400 font-bold">${currentPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <div className="flex bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                        <span className="px-3 py-2 text-[10px] font-bold text-zinc-500 bg-zinc-800/50 flex items-center font-mono">QTY</span>
                        <input
                          type="number"
                          value={manualShares}
                          onChange={(e) => setManualShares(e.target.value)}
                          className="w-16 px-2 py-2 bg-transparent text-white font-mono text-sm outline-none text-center"
                        />
                      </div>
                      
                      <div className="flex gap-2 flex-1 md:flex-none">
                        <button
                          onClick={() => portfolioManager.manualBuy(ticker, parseInt(manualShares), currentPrice)}
                          disabled={parseInt(manualShares) * currentPrice > stats.balance}
                          className="flex-1 md:flex-none px-5 py-2.5 bg-emerald-500 text-black font-black text-xs rounded-xl hover:bg-emerald-450 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 text-center font-mono uppercase tracking-widest"
                        >
                          BUY DMA
                        </button>
                        <button
                          onClick={() => portfolioManager.manualSell(ticker, parseInt(manualShares), currentPrice)}
                          className="flex-1 md:flex-none px-5 py-2.5 bg-zinc-800 text-white font-bold text-xs rounded-xl hover:bg-zinc-700 transition-all active:scale-95 text-center font-mono uppercase tracking-widest"
                        >
                          SELL DMA
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Active Positions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-zinc-500 px-2 uppercase tracking-widest">
                      <Database className="w-4 h-4 text-emerald-400" /> Outstanding Positions
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence mode='popLayout'>
                        {positions.length === 0 ? (
                          <div className="p-8 text-center text-zinc-650 border border-zinc-800/50 rounded-2xl bg-zinc-900/20 font-mono text-xs uppercase tracking-wider">
                            No active asset contracts held
                          </div>
                        ) : (
                          positions.map((pos, idx) => (
                            <motion.div
                              key={`${pos.ticker}-${idx}`}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/50 flex flex-col gap-3 group hover:border-emerald-500/20 transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-base font-mono">{pos.ticker}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black font-mono">
                                      {pos.shares} SHARES
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-zinc-500 mt-0.5 font-mono">BASE PRICE: ${pos.avgPrice.toFixed(2)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-base font-bold text-white font-mono">${(pos.shares * pos.currentPrice).toLocaleString()}</div>
                                  <div className={cn("text-xs font-bold font-mono", pos.pnl >= 0 ? "text-emerald-400" : "text-red-400")}>
                                    {pos.pnl >= 0 ? '+' : ''}{pos.pnl.toFixed(2)} ({((pos.pnl / (pos.avgPrice * pos.shares)) * 100).toFixed(2)}%)
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2">
                                 <div className="p-2 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <div className="text-[9px] font-bold text-red-500/60 uppercase tracking-widest font-mono">Safety stop</div>
                                    <div className="text-xs font-mono text-shadow text-red-400/85">${pos.stopLoss.toFixed(2)}</div>
                                 </div>
                                 <div className="p-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest font-mono">Take Target</div>
                                    <div className="text-xs font-mono text-shadow text-emerald-450/85">${pos.takeProfit.toFixed(2)}</div>
                                 </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Trade History */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-black text-zinc-500 px-2 uppercase tracking-widest">
                      <History className="w-4 h-4 text-emerald-400" /> Executed Deal Ledger
                    </div>
                    <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-none pr-1">
                      {history.length === 0 ? (
                        <div className="p-8 text-center text-zinc-650 border border-zinc-800/50 rounded-2xl bg-zinc-900/20 font-mono text-xs uppercase tracking-wider">
                          No settled trades on ledger
                        </div>
                      ) : (
                        history.map(log => (
                          <div 
                            key={log.id} 
                            className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-900 flex items-center justify-between group hover:border-zinc-800 transition-colors font-mono text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                log.type === 'BUY' ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/10" : "bg-indigo-500/10 text-indigo-405 border border-indigo-500/10"
                              )}>
                                <div className="text-[10px] font-black">{log.type === 'BUY' ? 'BT' : 'ST'}</div>
                              </div>
                              <div>
                                <div className="text-sm font-bold text-white">{log.ticker}</div>
                                <div className="text-[9px] text-zinc-500 font-semibold tracking-tight leading-none mt-0.5">
                                  {log.reason || 'Manual Dispatch'}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-zinc-300 font-bold">${log.price.toFixed(2)}</div>
                              {log.profit !== undefined ? (
                                <div className={cn("text-[10px] font-bold", log.profit >= 0 ? "text-emerald-400" : "text-red-400")}>
                                  {log.profit >= 0 ? '+' : ''}${log.profit.toFixed(2)}
                                </div>
                              ) : (
                                <div className="text-[9px] text-zinc-600">
                                  {new Date(log.timestamp).toLocaleTimeString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};
