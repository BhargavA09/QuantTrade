import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Layers,
  Zap,
  Target,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Clock,
  Compass,
  Flame,
  CheckCircle2,
  Sliders,
  DollarSign,
  Maximize2,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import {
  fetchVolumeLensOrderFlow,
  fetchVolumeLensDOM,
  fetchFuturesUniverse,
  VolumeLensOrderFlowResponse,
  FuturesSpecification,
  FootprintBar,
  FootprintLevel,
  DomLadderData,
  FALLBACK_FUTURES_UNIVERSE
} from '../../services/api/volumeLensService';
import { quantTraderBrain } from '../../services/QuantTraderBrain';

interface VolumeLensOrderFlowViewProps {
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onTradeExecuted?: (message: string) => void;
}

export const VolumeLensOrderFlowView: React.FC<VolumeLensOrderFlowViewProps> = ({
  selectedTicker,
  onSelectTicker,
  onTradeExecuted
}) => {
  const [futuresUniverse, setFuturesUniverse] = useState<FuturesSpecification[]>(FALLBACK_FUTURES_UNIVERSE);
  const [activeTimeframe, setActiveTimeframe] = useState<'1m' | '5m' | '15m' | '1H' | '1D'>('5m');
  const [imbalanceThreshold, setImbalanceThreshold] = useState<number>(3.0); // 300% institutional ratio
  const [orderFlowData, setOrderFlowData] = useState<VolumeLensOrderFlowResponse | null>(null);
  const [domLadder, setDomLadder] = useState<DomLadderData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [orderQty, setOrderQty] = useState<number>(1);
  const [paperPnl, setPaperPnl] = useState<number>(0);
  const [activeContracts, setActiveContracts] = useState<number>(0);
  const [positionSide, setPositionSide] = useState<'FLAT' | 'LONG' | 'SHORT'>('FLAT');
  const [executionFeedback, setExecutionFeedback] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Load futures universe catalog once
  useEffect(() => {
    fetchFuturesUniverse().then(univ => {
      if (univ && univ.length > 0) {
        setFuturesUniverse(univ);
      }
    });
  }, []);

  // Fetch live order flow package whenever ticker or timeframe changes
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchVolumeLensOrderFlow(selectedTicker, activeTimeframe);
      setOrderFlowData(data);
      if (data.domLadder) {
        setDomLadder(data.domLadder);
      }
    } catch (err) {
      console.warn('VolumeLens load error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTicker, activeTimeframe]);

  useEffect(() => {
    loadData();
    // Refresh DOM / Footprint every 4 seconds for active simulation
    const interval = setInterval(() => {
      fetchVolumeLensDOM(selectedTicker).then(d => {
        if (d) setDomLadder(d);
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedTicker, activeTimeframe, loadData]);

  // Current instrument spec
  const currentSpec = useMemo(() => {
    return (
      futuresUniverse.find(f => f.symbol.toUpperCase() === selectedTicker.toUpperCase()) ||
      orderFlowData?.specification || {
        symbol: selectedTicker,
        name: `${selectedTicker} Derivative`,
        exchange: 'US Exchanges',
        category: 'Equity / Derivative',
        tickSize: 0.01,
        tickValue: 1.0,
        contractMultiplier: 100,
        currency: 'USD',
        marginRequirement: 3500,
        tradingHours: '09:30-16:00 EST',
        settlement: 'Physical Delivery',
        activeMonth: 'SPOT',
        basePrice: orderFlowData?.spotPrice || 150.0,
        dailyVolumeAvg: 10000000,
        openInterest: 1000000
      }
    );
  }, [futuresUniverse, selectedTicker, orderFlowData]);

  const currentPrice = orderFlowData?.spotPrice || currentSpec.basePrice;

  // Filtered futures list for search
  const filteredUniverse = useMemo(() => {
    if (!searchQuery.trim()) return futuresUniverse;
    const q = searchQuery.toLowerCase();
    return futuresUniverse.filter(
      f =>
        f.symbol.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.exchange.toLowerCase().includes(q)
    );
  }, [futuresUniverse, searchQuery]);

  // Order Execution Simulation in DOM
  const handleExecuteOrder = (side: 'BUY' | 'SELL') => {
    const tickVal = currentSpec.tickValue;
    const mult = currentSpec.contractMultiplier;
    const fillPrice = side === 'BUY' 
      ? (domLadder?.asks[domLadder.asks.length - 1]?.price || currentPrice) 
      : (domLadder?.bids[0]?.price || currentPrice);

    if (side === 'BUY') {
      if (positionSide === 'SHORT') {
        const pnlDelta = (currentPrice - fillPrice) * orderQty * tickVal;
        setPaperPnl(prev => prev + pnlDelta);
        setPositionSide('FLAT');
        setActiveContracts(0);
        setExecutionFeedback(`Covered SHORT ${orderQty} ctrs @ $${fillPrice.toFixed(2)}`);
      } else {
        setPositionSide('LONG');
        setActiveContracts(prev => prev + orderQty);
        setExecutionFeedback(`Filled LONG ${orderQty} ${selectedTicker} @ $${fillPrice.toFixed(2)} [Tick: $${tickVal}]`);
      }
    } else {
      if (positionSide === 'LONG') {
        const pnlDelta = (fillPrice - currentPrice) * orderQty * tickVal;
        setPaperPnl(prev => prev + pnlDelta);
        setPositionSide('FLAT');
        setActiveContracts(0);
        setExecutionFeedback(`Sold LONG ${orderQty} ctrs @ $${fillPrice.toFixed(2)}`);
      } else {
        setPositionSide('SHORT');
        setActiveContracts(prev => prev + orderQty);
        setExecutionFeedback(`Filled SHORT ${orderQty} ${selectedTicker} @ $${fillPrice.toFixed(2)} [Margin: $${(currentSpec.marginRequirement * orderQty).toLocaleString()}]`);
      }
    }

    // Also register order with Quant Trader Brain
    quantTraderBrain.executeOrder(
      selectedTicker,
      side === 'BUY' ? 'LONG' : 'SHORT',
      fillPrice,
      `VolumeLens Order Flow ${orderFlowData?.cvdDivergence?.bias || 'Footprint Sweep'}`
    );

    if (onTradeExecuted) {
      onTradeExecuted(`VolumeLens Executed ${side} ${orderQty} contracts of ${selectedTicker} @ $${fillPrice.toFixed(2)}`);
    }

    setTimeout(() => setExecutionFeedback(null), 4500);
  };

  const handleFlatten = () => {
    setPositionSide('FLAT');
    setActiveContracts(0);
    setExecutionFeedback(`Position FLATTENED for ${selectedTicker}. All open orders canceled.`);
    setTimeout(() => setExecutionFeedback(null), 4500);
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & FUTURES PRESETS SELECTOR                                   */}
      {/* ========================================================================= */}
      <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-2xl backdrop-blur-md space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide uppercase font-mono">
                  VolumeLens Institutional Order Flow & Futures
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold font-mono">
                  FOOTPRINT & CVD
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  L2 DOM LIVE
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Reverse-engineered VolumeLens architecture: Bid x Ask cluster footprints, diagonal imbalances (≥300%), CVD divergence & DOM ladder.
              </p>
            </div>
          </div>

          {/* Quick Search & Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs">
                <Search className="w-3.5 h-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search Futures / Equities..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  className="bg-transparent text-white placeholder-zinc-500 outline-none w-44 font-mono text-xs"
                />
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSearchOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-72 max-h-72 overflow-y-auto bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1 font-mono text-xs">
                    {filteredUniverse.map(f => (
                      <button
                        key={f.symbol}
                        onClick={() => {
                          onSelectTicker(f.symbol);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full p-2 rounded-lg text-left flex items-center justify-between hover:bg-zinc-900 transition-all ${
                          selectedTicker.toUpperCase() === f.symbol.toUpperCase()
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                            : 'text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-white">{f.symbol}</div>
                          <div className="text-[10px] text-zinc-500 truncate max-w-[170px]">{f.name}</div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 block">
                            {f.category}
                          </span>
                          <span className="text-[10px] text-zinc-400">${f.basePrice.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 transition-all flex items-center justify-center"
              title="Refresh Tape & Order Flow"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Tickers Carousel (Futures & High Order-Flow Equities) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pt-1 border-t border-zinc-800/80 text-xs font-mono">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider shrink-0 font-bold">
            Futures Universe:
          </span>
          {futuresUniverse.map(spec => {
            const isSelected = selectedTicker.toUpperCase() === spec.symbol.toUpperCase();
            return (
              <button
                key={spec.symbol}
                onClick={() => onSelectTicker(spec.symbol)}
                className={`px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-all font-bold ${
                  isSelected
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-400'
                    : 'bg-zinc-950/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800/70'
                }`}
              >
                <span>{spec.symbol}</span>
                <span className={`text-[10px] font-normal opacity-75 ${isSelected ? 'text-cyan-100' : 'text-zinc-500'}`}>
                  ${spec.basePrice < 10 ? spec.basePrice.toFixed(3) : spec.basePrice.toFixed(1)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Granularity & Imbalance Parameter Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase">Timeframe:</span>
            {(['1m', '5m', '15m', '1H', '1D'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  activeTimeframe === tf
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 font-bold uppercase flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              Imbalance Ratio:
            </span>
            {[2.5, 3.0, 4.0].map(ratio => (
              <button
                key={ratio}
                onClick={() => setImbalanceThreshold(ratio)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  imbalanceThreshold === ratio
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {ratio * 100}%
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <span className="text-zinc-500">Contract:</span>
            <span className="text-white font-bold">{currentSpec.name}</span>
            <span className="text-zinc-500">| Tick:</span>
            <span className="text-cyan-300 font-bold">{currentSpec.tickSize} (${currentSpec.tickValue})</span>
            <span className="text-zinc-500">| Mult:</span>
            <span className="text-zinc-300">{currentSpec.contractMultiplier}x</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN WORKSPACE: FOOTPRINT CHART (LEFT) & DOM LADDER (RIGHT)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT / CENTER: FOOTPRINT CHART & CUMULATIVE VOLUME DELTA (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          {/* A. Footprint Candlestick Grid */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white uppercase tracking-wider">
                  Footprint Candle Clusters · Bid x Ask Order Imbalance
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                  Diagonal Imbalance Threshold: {imbalanceThreshold * 100}%
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Aggressive Buying (Ask ≥ {imbalanceThreshold * 100}%)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Aggressive Selling (Bid ≥ {imbalanceThreshold * 100}%)
                </span>
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span className="w-2 h-2 rounded bg-amber-400 border border-amber-300" />
                  POC Level
                </span>
              </div>
            </div>

            {/* Interactive Footprint Bars Container */}
            <div className="overflow-x-auto no-scrollbar scroll-smooth py-2">
              <div className="flex items-stretch gap-2.5 min-w-[700px] justify-between">
                {orderFlowData?.footprintBars && orderFlowData.footprintBars.length > 0 ? (
                  orderFlowData.footprintBars.map((bar, idx) => {
                    const isBullishCandle = bar.close >= bar.open;
                    const isHovered = hoveredBarIndex === idx;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                        className={`flex-1 rounded-xl p-2 transition-all flex flex-col justify-between border ${
                          isHovered
                            ? 'bg-zinc-850 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                            : isBullishCandle
                            ? 'bg-zinc-950/70 border-emerald-900/40 hover:border-emerald-700/60'
                            : 'bg-zinc-950/70 border-rose-900/40 hover:border-rose-700/60'
                        }`}
                      >
                        {/* Bar Top Header: Time & Trapped Badge */}
                        <div className="text-center pb-1.5 border-b border-zinc-850">
                          <div className="text-[10px] text-zinc-400 font-bold">{bar.timestamp}</div>
                          {bar.trappedBuyers && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold block mt-0.5 animate-pulse">
                              TRAPPED BUYERS
                            </span>
                          )}
                          {bar.trappedSellers && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold block mt-0.5 animate-pulse">
                              TRAPPED SELLERS
                            </span>
                          )}
                          {bar.stackedBuyImbalance && !bar.trappedBuyers && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-300 font-bold block mt-0.5">
                              BUY SWEEP
                            </span>
                          )}
                          {bar.stackedSellImbalance && !bar.trappedSellers && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-300 font-bold block mt-0.5">
                              SELL SWEEP
                            </span>
                          )}
                        </div>

                        {/* Candlestick Footprint Price Levels (Sorted from High to Low) */}
                        <div className="py-1.5 space-y-1 flex-1 flex flex-col justify-center">
                          {[...bar.levels].reverse().map((lvl, lIdx) => {
                            return (
                              <div
                                key={lIdx}
                                className={`text-[9px] px-1 py-0.5 rounded flex items-center justify-between gap-1 transition-colors ${
                                  lvl.isPoc
                                    ? 'bg-amber-400/15 border border-amber-400/50 shadow-sm'
                                    : 'bg-zinc-900/80 border border-zinc-800/60'
                                }`}
                              >
                                {/* Bid Side Volume (Market Sellers hitting Bid) */}
                                <span
                                  className={`text-right w-7 font-bold ${
                                    lvl.bidImbalance
                                      ? 'bg-rose-500/30 text-rose-300 px-0.5 rounded font-black border border-rose-500/50'
                                      : 'text-zinc-400'
                                  }`}
                                >
                                  {lvl.bidVolume}
                                </span>

                                {/* Price Node */}
                                <span className="text-[8px] text-zinc-500 font-semibold px-0.5">
                                  {lvl.price < 10 ? lvl.price.toFixed(3) : lvl.price.toFixed(1)}
                                </span>

                                {/* Ask Side Volume (Market Buyers lifting Ask) */}
                                <span
                                  className={`text-left w-7 font-bold ${
                                    lvl.askImbalance
                                      ? 'bg-emerald-500/30 text-emerald-300 px-0.5 rounded font-black border border-emerald-500/50'
                                      : 'text-zinc-400'
                                  }`}
                                >
                                  {lvl.askVolume}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Bar Summary Footer */}
                        <div className="pt-1.5 border-t border-zinc-850 text-center space-y-0.5 text-[9px]">
                          <div className="flex items-center justify-between text-zinc-400 px-0.5">
                            <span>Vol:</span>
                            <span className="text-zinc-200 font-bold">{bar.totalVolume.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between px-0.5">
                            <span className="text-zinc-500">Delta:</span>
                            <span
                              className={`font-black ${
                                bar.delta > 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {bar.delta > 0 ? `+${bar.delta}` : bar.delta} ({bar.deltaPercent}%)
                            </span>
                          </div>
                          <div className="flex items-center justify-between px-0.5 text-zinc-400">
                            <span className="text-zinc-500">CVD:</span>
                            <span className="font-bold text-cyan-300">
                              {bar.cumulativeDelta > 0 ? `+${bar.cumulativeDelta}` : bar.cumulativeDelta}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center w-full text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Synthesizing real-time footprint clusters...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* B. Cumulative Volume Delta (CVD) Oscillator & Divergence Radar */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 text-xs">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white uppercase tracking-wider">
                  Cumulative Volume Delta (CVD) & Institutional Divergence
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {orderFlowData?.cvdDivergence?.title || 'Continuous CVD Stream'}
                </span>
              </div>
            </div>

            {/* CVD Divergence Signal Banner */}
            {orderFlowData?.cvdDivergence && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-3 text-xs ${
                  orderFlowData.cvdDivergence.score > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                    : orderFlowData.cvdDivergence.score < 0
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
              >
                {orderFlowData.cvdDivergence.score > 0 ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : orderFlowData.cvdDivergence.score < 0 ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <Activity className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>{orderFlowData.cvdDivergence.title}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900/80 font-mono">
                      Bias: {orderFlowData.cvdDivergence.bias}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-300 font-sans">
                    {orderFlowData.cvdDivergence.description}
                  </p>
                </div>
              </div>
            )}

            {/* CVD Delta Bars Visualizer */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Session Delta Progression by Bar</span>
                <span className="text-cyan-300 font-bold">
                  Net Session CVD: {orderFlowData?.footprintBars[orderFlowData.footprintBars.length - 1]?.cumulativeDelta || 0} contracts
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1.5 h-16 items-end bg-zinc-950 p-2 rounded-xl border border-zinc-850">
                {orderFlowData?.footprintBars.map((b, i) => {
                  const maxAbsDelta = Math.max(
                    ...orderFlowData.footprintBars.map(x => Math.abs(x.delta)),
                    100
                  );
                  const hPct = Math.min(100, Math.max(15, (Math.abs(b.delta) / maxAbsDelta) * 100));
                  const isPos = b.delta >= 0;

                  return (
                    <div key={i} className="flex flex-col items-center justify-end h-full">
                      <div
                        style={{ height: `${hPct}%` }}
                        className={`w-full rounded-sm transition-all ${
                          isPos
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            : 'bg-gradient-to-t from-rose-600 to-rose-400'
                        }`}
                        title={`Bar ${b.timestamp}: Delta ${b.delta > 0 ? '+' : ''}${b.delta}`}
                      />
                      <span className="text-[8px] text-zinc-500 mt-1">{b.timestamp.split(':')[1]}m</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: LIVE DOM LADDER & ONE-CLICK ORDER EXECUTION (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-3 font-mono">
            {/* DOM Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white uppercase tracking-wider">
                  Level 2 DOM Ladder
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                Spread: {domLadder?.spreadTicks || 1} tick (${(domLadder?.spreadDollars || currentSpec.tickSize).toFixed(currentSpec.tickSize < 0.1 ? 4 : 2)})
              </span>
            </div>

            {/* Depth Sentiment Pill */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-850 text-[11px]">
              <span className="text-zinc-400">Order Book Imbalance:</span>
              <span className="text-zinc-200 font-bold">
                Bid/Ask: {domLadder?.bidAskRatio || 1.12}x ({domLadder?.depthSentiment || 'BULLISH SUPPORT'})
              </span>
            </div>

            {/* DOM Price Ladder Table */}
            <div className="bg-zinc-950 rounded-xl border border-zinc-850 overflow-hidden text-xs">
              <div className="grid grid-cols-3 p-2 bg-zinc-900/80 text-[10px] uppercase font-bold text-zinc-400 border-b border-zinc-800">
                <div className="text-left">Ask Depth</div>
                <div className="text-center">Price</div>
                <div className="text-right">Bid Depth</div>
              </div>

              {/* ASKS (Sellers above market) */}
              <div className="divide-y divide-zinc-900">
                {domLadder?.asks.slice(0, 6).map((lvl, idx) => {
                  const maxAsk = Math.max(...(domLadder?.asks.map(a => a.size) || [100]));
                  const widthPct = Math.min(100, Math.round((lvl.size / maxAsk) * 100));

                  return (
                    <div
                      key={`ask-${idx}`}
                      className="grid grid-cols-3 p-1.5 items-center hover:bg-zinc-900/40 relative"
                    >
                      {/* Depth Bar Background */}
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="absolute left-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
                      />
                      <div className="relative text-left font-bold text-rose-300 flex items-center gap-1">
                        <span>{lvl.size}</span>
                        {lvl.isIcebergWall && (
                          <span className="text-[8px] px-1 rounded bg-rose-500/30 text-rose-200">WALL</span>
                        )}
                      </div>
                      <div className="relative text-center text-rose-400 font-bold">
                        ${lvl.price < 10 ? lvl.price.toFixed(3) : lvl.price.toFixed(2)}
                      </div>
                      <div className="relative text-right text-zinc-600">-</div>
                    </div>
                  );
                })}

                {/* CURRENT MARKET SPREAD MIDPOINT */}
                <div className="grid grid-cols-3 p-1.5 bg-cyan-950/40 border-y border-cyan-800/40 items-center text-center">
                  <div className="text-[10px] text-cyan-400 font-bold text-left pl-1">SPOT</div>
                  <div className="text-xs text-white font-black">
                    ${currentPrice < 10 ? currentPrice.toFixed(3) : currentPrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-cyan-400 font-bold text-right pr-1">L1 TAPE</div>
                </div>

                {/* BIDS (Buyers below market) */}
                {domLadder?.bids.slice(0, 6).map((lvl, idx) => {
                  const maxBid = Math.max(...(domLadder?.bids.map(b => b.size) || [100]));
                  const widthPct = Math.min(100, Math.round((lvl.size / maxBid) * 100));

                  return (
                    <div
                      key={`bid-${idx}`}
                      className="grid grid-cols-3 p-1.5 items-center hover:bg-zinc-900/40 relative"
                    >
                      {/* Depth Bar Background */}
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
                      />
                      <div className="relative text-left text-zinc-600">-</div>
                      <div className="relative text-center text-emerald-400 font-bold">
                        ${lvl.price < 10 ? lvl.price.toFixed(3) : lvl.price.toFixed(2)}
                      </div>
                      <div className="relative text-right font-bold text-emerald-300 flex items-center justify-end gap-1">
                        {lvl.isIcebergWall && (
                          <span className="text-[8px] px-1 rounded bg-emerald-500/30 text-emerald-200">WALL</span>
                        )}
                        <span>{lvl.size}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* One-Click Futures Execution Controls */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Contracts Qty:</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 5, 10].map(qty => (
                    <button
                      key={qty}
                      onClick={() => setOrderQty(qty)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        orderQty === qty
                          ? 'bg-cyan-600 text-white'
                          : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-850'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Feedback Banner */}
              {executionFeedback && (
                <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-[11px] text-cyan-200 text-center font-bold animate-fadeIn">
                  {executionFeedback}
                </div>
              )}

              {/* BUY / SELL Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleExecuteOrder('BUY')}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
                >
                  <TrendingUp className="w-4 h-4" />
                  Buy MKT ({orderQty})
                </button>
                <button
                  onClick={() => handleExecuteOrder('SELL')}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/40 transition-all active:scale-95"
                >
                  <TrendingDown className="w-4 h-4" />
                  Sell MKT ({orderQty})
                </button>
              </div>

              {/* Flatten Button */}
              {positionSide !== 'FLAT' && (
                <button
                  onClick={handleFlatten}
                  className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold transition-all"
                >
                  Flatten Position ({activeContracts} {positionSide}) · Paper PnL: ${paperPnl.toFixed(2)}
                </button>
              )}
            </div>

            {/* Contract Specifications Mini Card */}
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1.5 text-[11px]">
              <div className="text-zinc-400 font-bold uppercase text-[10px]">
                Contract Specifications: {currentSpec.symbol}
              </div>
              <div className="grid grid-cols-2 gap-1 text-zinc-300">
                <div>
                  <span className="text-zinc-500">Exchange:</span> {currentSpec.exchange}
                </div>
                <div>
                  <span className="text-zinc-500">Margin:</span> ${currentSpec.marginRequirement.toLocaleString()}
                </div>
                <div>
                  <span className="text-zinc-500">Settlement:</span> {currentSpec.settlement}
                </div>
                <div>
                  <span className="text-zinc-500">Month:</span> {currentSpec.activeMonth}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VOLUMELENS AI MENTOR & INSTITUTIONAL TAPE INTERPRETER                   */}
      {/* ========================================================================= */}
      {orderFlowData?.aiMentor && (
        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl space-y-4 font-mono">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  VolumeLens AI Order Flow Mentor & Tape Narrator
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Institutional footprint interpretation, trapped trader identification, and algorithmic execution levels.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[9px] uppercase text-zinc-500 block">Order Flow Conviction</span>
                <span className={`text-xs font-black ${
                  orderFlowData.aiMentor.institutionalScore > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {orderFlowData.aiMentor.institutionalScore > 0 ? '+' : ''}{orderFlowData.aiMentor.institutionalScore}/100
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                orderFlowData.aiMentor.setup.bias === 'BULLISH'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : orderFlowData.aiMentor.setup.bias === 'BEARISH'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}>
                {orderFlowData.aiMentor.regime.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Suggested Institutional Play */}
            <div className="md:col-span-5 p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-sans">{orderFlowData.aiMentor.setup.name}</span>
                <span className="text-emerald-400 font-bold">{orderFlowData.aiMentor.setup.confidencePct}% Probability</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-zinc-850">
                <div>
                  <span className="text-[9px] uppercase text-zinc-500 block">Live Entry</span>
                  <span className="text-white font-bold">${orderFlowData.aiMentor.setup.entryPrice.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-zinc-500 block">Invalidation (Stop)</span>
                  <span className="text-rose-400 font-bold">${orderFlowData.aiMentor.setup.stopLoss.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-zinc-500 block">Target 1 (POC)</span>
                  <span className="text-emerald-400 font-bold">${orderFlowData.aiMentor.setup.target1.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-zinc-500 block">Target 2 (VAH/VAL)</span>
                  <span className="text-emerald-300 font-bold">${orderFlowData.aiMentor.setup.target2.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-850">
                <span>Risk / Reward Ratio</span>
                <span className="text-zinc-200 font-bold">{orderFlowData.aiMentor.setup.riskReward}:1</span>
              </div>

              <button
                onClick={() => handleExecuteOrder(orderFlowData.aiMentor.setup.bias === 'BULLISH' ? 'BUY' : 'SELL')}
                className="w-full mt-2 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-950/40"
              >
                <Zap className="w-3.5 h-3.5" />
                Deploy {orderFlowData.aiMentor.setup.bias} Order Flow Setup
              </button>
            </div>

            {/* Tape Walkthrough Narrative */}
            <div className="md:col-span-7 p-4 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                Tape Reader Confluence & Footprint Diagnostics
              </span>
              <ul className="space-y-1.5 text-xs text-zinc-300">
                {orderFlowData.aiMentor.tapeNarrative.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
