import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Layers, 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Cpu, 
  Calculator, 
  Activity, 
  Compass, 
  HelpCircle 
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from 'recharts';
import { StockData } from '../types';
import { fetchOptions } from '../services/api';
import { 
  blackScholesGreeks, 
  binomialTreeCRR, 
  monteCarloAntithetic, 
  asianOptionPricing, 
  barrierOptionPricing,
  calculateComprehensiveRisk,
  simulateMertonJumpDiffusion
} from '../utils/quantBooksEngine';

interface OptionsSimulationProps {
  data: StockData;
}

type PricingEngine = 'black_scholes' | 'binomial_crr' | 'joshi_antithetic' | 'exotics';

const OptionsSimulation: React.FC<OptionsSimulationProps> = ({ data }) => {
  const currentPrice = data.currentPrice;
  const [expiration, setExpiration] = useState('');
  const [optionType, setOptionType] = useState<'calls' | 'puts'>('calls');
  const [pricingEngine, setPricingEngine] = useState<PricingEngine>('black_scholes');
  const [optionsData, setOptionsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [riskFreeRate, setRiskFreeRate] = useState(0.045);
  const [selectedStrike, setSelectedStrike] = useState<number>(currentPrice);
  const [barrierLevel, setBarrierLevel] = useState<number>(currentPrice * 0.9);

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      const result = await fetchOptions(data.ticker, expiration || undefined);
      if (result) {
        setOptionsData(result);
        if (!expiration && result.expirationDates && result.expirationDates.length > 0) {
          setExpiration(result.expirationDates[0].split('T')[0]);
        }
      }
      setLoading(false);
    };
    loadOptions();
  }, [data.ticker, expiration]);

  const rawChain = optionsData?.options?.[0]?.[optionType] || [];
  const expirations = optionsData?.expirationDates || [];

  // Calculate Time to Expiration in Years
  const tYears = useMemo(() => {
    if (!expiration) return 30 / 365;
    const expDate = new Date(expiration).getTime();
    const now = Date.now();
    const days = Math.max(1, (expDate - now) / (1000 * 60 * 60 * 24));
    return days / 365;
  }, [expiration]);

  // Compute Greeks and Theoretical Pricing for each strike (Hull & Joshi)
  const enrichedChain = useMemo(() => {
    return rawChain.map((opt: any) => {
      const strike = opt.strike;
      const iv = opt.impliedVolatility > 0 ? opt.impliedVolatility : 0.25;
      
      const bsGreeks = blackScholesGreeks(
        currentPrice,
        strike,
        tYears,
        riskFreeRate,
        iv,
        optionType === 'calls' ? 'call' : 'put'
      );

      // Cox-Ross-Rubinstein American Option Pricing (Early Exercise)
      const crrResult = binomialTreeCRR(
        currentPrice,
        strike,
        tYears,
        riskFreeRate,
        iv,
        25,
        'american',
        optionType === 'calls' ? 'call' : 'put'
      );

      // Joshi Antithetic Monte Carlo
      const mcResult = monteCarloAntithetic(
        currentPrice,
        strike,
        tYears,
        riskFreeRate,
        iv,
        1000,
        optionType === 'calls' ? 'call' : 'put'
      );

      const earlyExercisePremium = Math.max(0, crrResult.price - bsGreeks.price);

      return {
        ...opt,
        bsPrice: bsGreeks.price,
        crrPrice: crrResult.price,
        mcPrice: mcResult.price,
        earlyExercisePremium,
        delta: bsGreeks.delta,
        gamma: bsGreeks.gamma,
        vega: bsGreeks.vega,
        theta: bsGreeks.theta,
        rho: bsGreeks.rho,
        intrinsic: bsGreeks.intrinsicValue,
        timeValue: bsGreeks.timeValue
      };
    }).sort((a: any, b: any) => a.strike - b.strike);
  }, [rawChain, currentPrice, tYears, riskFreeRate, optionType]);

  // Filter chain to focus on near-the-money strikes
  const filteredChain = useMemo(() => {
    return enrichedChain.filter((opt: any) => {
      const distance = Math.abs(opt.strike - currentPrice) / currentPrice;
      return distance < 0.25;
    });
  }, [enrichedChain, currentPrice]);

  // Set default selected strike
  useEffect(() => {
    if (filteredChain.length > 0 && (!selectedStrike || Math.abs(selectedStrike - currentPrice) > currentPrice * 0.3)) {
      const closest = filteredChain.reduce((prev: any, curr: any) => 
        Math.abs(curr.strike - currentPrice) < Math.abs(prev.strike - currentPrice) ? curr : prev
      );
      setSelectedStrike(closest.strike);
      setBarrierLevel(Number((closest.strike * 0.92).toFixed(2)));
    }
  }, [filteredChain, currentPrice]);

  // Selected Option Greeks and Joshi Exotic Pricing
  const activeOption = useMemo(() => {
    return enrichedChain.find((o: any) => o.strike === selectedStrike) || enrichedChain[0] || null;
  }, [enrichedChain, selectedStrike]);

  const exoticPricing = useMemo(() => {
    const iv = activeOption?.impliedVolatility || 0.25;
    const strike = selectedStrike || currentPrice;
    const optKind = optionType === 'calls' ? 'call' : 'put';

    const asian = asianOptionPricing(currentPrice, strike, tYears, riskFreeRate, iv, 25, 1200, optKind);
    const barrierDownOut = barrierOptionPricing(currentPrice, strike, barrierLevel, 'down-and-out', tYears, riskFreeRate, iv, 35, 1200, optKind);
    const barrierUpOut = barrierOptionPricing(currentPrice, strike, strike * 1.12, 'up-and-out', tYears, riskFreeRate, iv, 35, 1200, optKind);

    return { asian, barrierDownOut, barrierUpOut };
  }, [activeOption, selectedStrike, currentPrice, tYears, riskFreeRate, optionType, barrierLevel]);

  // Value-at-Risk & Risk Analysis from Hull Chapter 22
  const portfolioRisk = useMemo(() => {
    const returns: number[] = [];
    if (data.history && data.history.length > 2) {
      for (let i = 1; i < data.history.length; i++) {
        returns.push((data.history[i].close - data.history[i - 1].close) / data.history[i - 1].close);
      }
    }
    return calculateComprehensiveRisk(returns, currentPrice * 100);
  }, [data.history, currentPrice]);

  // Volatility Smile Chart Data
  const volSmileData = useMemo(() => {
    return filteredChain.map((opt: any) => ({
      strike: `$${opt.strike}`,
      strikeNum: opt.strike,
      iv: Number(((opt.impliedVolatility || 0) * 100).toFixed(2)),
      bsPrice: Number(opt.bsPrice.toFixed(2)),
      marketPrice: Number((opt.lastPrice || opt.bsPrice).toFixed(2))
    }));
  }, [filteredChain]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-inner">
              <Layers size={22} className="text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-zinc-100 tracking-tight">Quantitative Derivatives Engine</h2>
                <span className="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-purple-500/30">
                  Hull & Joshi Models
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                {data.ticker} · Spot ${currentPrice.toFixed(2)} · Vol Surface & Analytical Greeks
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Call / Put Toggle */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button 
                onClick={() => setOptionType('calls')}
                className={`px-5 py-2 text-[10px] font-black rounded-lg uppercase transition-all ${optionType === 'calls' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Calls
              </button>
              <button 
                onClick={() => setOptionType('puts')}
                className={`px-5 py-2 text-[10px] font-black rounded-lg uppercase transition-all ${optionType === 'puts' ? 'bg-rose-500 text-black shadow-lg shadow-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Puts
              </button>
            </div>

            {/* Expiration Dropdown */}
            <select 
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500/50"
            >
              {expirations.map((exp: string) => {
                const date = new Date(exp);
                return (
                  <option key={exp} value={exp.split('T')[0]}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </option>
                );
              })}
            </select>

            {/* Risk-Free Rate Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 text-xs font-mono text-zinc-400">
              <span className="text-[10px] uppercase font-bold text-zinc-500">r:</span>
              <span className="text-zinc-200 font-bold">{(riskFreeRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Pricing Engine Tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-zinc-800/60">
          <button
            onClick={() => setPricingEngine('black_scholes')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              pricingEngine === 'black_scholes' 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                : 'bg-zinc-950/60 text-zinc-400 border-zinc-850 hover:text-zinc-200'
            }`}
          >
            <Calculator size={12} />
            Black-Scholes & Greeks (Hull)
          </button>
          <button
            onClick={() => setPricingEngine('binomial_crr')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              pricingEngine === 'binomial_crr' 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                : 'bg-zinc-950/60 text-zinc-400 border-zinc-850 hover:text-zinc-200'
            }`}
          >
            <Compass size={12} />
            CRR Binomial Tree (American)
          </button>
          <button
            onClick={() => setPricingEngine('joshi_antithetic')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              pricingEngine === 'joshi_antithetic' 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                : 'bg-zinc-950/60 text-zinc-400 border-zinc-850 hover:text-zinc-200'
            }`}
          >
            <Cpu size={12} />
            Antithetic Monte Carlo (Joshi)
          </button>
          <button
            onClick={() => setPricingEngine('exotics')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 border ${
              pricingEngine === 'exotics' 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm' 
                : 'bg-zinc-950/60 text-zinc-400 border-zinc-850 hover:text-zinc-200'
            }`}
          >
            <Activity size={12} />
            Exotic Asian & Barrier Options
          </button>
        </div>
      </div>

      {/* Model-Specific Spotlight Panel */}
      {pricingEngine === 'exotics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 bg-zinc-900/50 border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Asian Arithmetic Option</span>
              <span className="text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-bold">Joshi Ch. 6</span>
            </div>
            <p className="text-2xl font-black font-mono text-zinc-100">${exoticPricing.asian.price.toFixed(2)}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Path-dependent average price derivative. Reduces volatility manipulation risk near expiry.
            </p>
          </div>

          <div className="glass-card p-5 bg-zinc-900/50 border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Down-and-Out Barrier</span>
              <span className="text-[9px] bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded font-bold">Knockout @ ${barrierLevel.toFixed(2)}</span>
            </div>
            <p className="text-2xl font-black font-mono text-zinc-100">${exoticPricing.barrierDownOut.price.toFixed(2)}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Breach Probability: <span className="text-rose-400 font-mono font-bold">{exoticPricing.barrierDownOut.breachRate.toFixed(1)}%</span>. Option ceases to exist if spot breaches barrier.
            </p>
          </div>

          <div className="glass-card p-5 bg-zinc-900/50 border-zinc-800 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Up-and-Out Barrier</span>
              <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-bold">Knockout @ ${(selectedStrike * 1.12).toFixed(2)}</span>
            </div>
            <p className="text-2xl font-black font-mono text-zinc-100">${exoticPricing.barrierUpOut.price.toFixed(2)}</p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Knocks out if asset rallies past ceiling. Ideal for structured yield enhancement.
            </p>
          </div>
        </div>
      )}

      {/* Analytical Greeks Cards for Selected Strike */}
      {activeOption && (
        <div className="glass-card p-5 bg-zinc-900/30 border-zinc-800/80 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                Analytical Greeks for ${activeOption.strike} Strike
              </span>
              <span className="text-[9px] text-purple-400 font-mono">
                BSM Theo: ${activeOption.bsPrice.toFixed(2)} | CRR: ${activeOption.crrPrice.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              Early Exercise Premium: +${activeOption.earlyExercisePremium.toFixed(2)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Delta (Δ)</span>
              <p className="text-base font-black font-mono text-zinc-100 mt-1">{activeOption.delta.toFixed(3)}</p>
              <span className="text-[9px] text-zinc-500">Hedge Ratio</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Gamma (Γ)</span>
              <p className="text-base font-black font-mono text-emerald-400 mt-1">{activeOption.gamma.toFixed(4)}</p>
              <span className="text-[9px] text-zinc-500">Δ Acceleration</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Vega (ν)</span>
              <p className="text-base font-black font-mono text-purple-400 mt-1">${activeOption.vega.toFixed(3)}</p>
              <span className="text-[9px] text-zinc-500">per 1% Vol</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Theta (Θ)</span>
              <p className="text-base font-black font-mono text-rose-400 mt-1">${activeOption.theta.toFixed(3)}</p>
              <span className="text-[9px] text-zinc-500">Daily Decay</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-zinc-800/60">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-black block">Rho (ρ)</span>
              <p className="text-base font-black font-mono text-blue-400 mt-1">${activeOption.rho.toFixed(3)}</p>
              <span className="text-[9px] text-zinc-500">per 1% Rate</span>
            </div>
          </div>
        </div>
      )}

      {/* Volatility Smile Chart (Hull Ch. 20) */}
      <div className="glass-card p-5 bg-zinc-900/30 border-zinc-800/80 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={15} className="text-purple-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300">
              Implied Volatility Smile & Skew (Hull Chapter 20)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-500">
            ATM Vol: {((activeOption?.impliedVolatility || 0.25) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={volSmileData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.5} />
              <XAxis dataKey="strike" stroke="#71717a" tick={{ fontSize: 10, fill: '#71717a' }} />
              <YAxis domain={['auto', 'auto']} stroke="#71717a" tick={{ fontSize: 10, fill: '#71717a' }} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.75rem', fontSize: '11px' }}
                formatter={(val: any) => [`${val}%`, 'Implied Volatility']}
              />
              <Line 
                type="monotone" 
                dataKey="iv" 
                stroke="#a855f7" 
                strokeWidth={2} 
                dot={{ r: 3, fill: '#a855f7' }} 
                activeDot={{ r: 5 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comprehensive Options Chain Table with Multi-Model Valuation */}
      <div className="glass-card overflow-hidden relative min-h-[300px] border-zinc-800/80 rounded-2xl">
        {loading && (
          <div className="absolute inset-0 z-10 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="animate-spin text-purple-400" size={32} />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/70 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="p-3.5">Strike</th>
                <th className="p-3.5 text-right">Market Price</th>
                <th className="p-3.5 text-right">BSM Theo</th>
                <th className="p-3.5 text-right">American CRR</th>
                <th className="p-3.5 text-right">Delta (Δ)</th>
                <th className="p-3.5 text-right">Gamma (Γ)</th>
                <th className="p-3.5 text-right">Theta (Θ)</th>
                <th className="p-3.5 text-right">Implied Vol</th>
                <th className="p-3.5 text-center">Inspect</th>
              </tr>
            </thead>
            <tbody>
              {filteredChain.map((opt: any, i: number) => {
                const isSelected = opt.strike === selectedStrike;
                const isATM = Math.abs(opt.strike - currentPrice) < currentPrice * 0.015;

                return (
                  <tr 
                    key={i} 
                    onClick={() => setSelectedStrike(opt.strike)}
                    className={`border-b border-zinc-800/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-purple-500/10' : opt.inTheMoney ? 'bg-zinc-900/15 hover:bg-zinc-900/40' : 'hover:bg-zinc-900/30'
                    }`}
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black font-mono ${isATM ? 'text-purple-400' : isSelected ? 'text-white' : 'text-zinc-200'}`}>
                          ${opt.strike.toFixed(2)}
                        </span>
                        {isATM && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-black bg-purple-500/20 text-purple-300 uppercase">ATM</span>
                        )}
                        {opt.inTheMoney && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-400 uppercase">ITM</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-sm font-bold font-mono text-zinc-100">${(opt.lastPrice || opt.bsPrice).toFixed(2)}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-mono font-bold text-zinc-300">${opt.bsPrice.toFixed(2)}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-mono font-bold text-emerald-400">${opt.crrPrice.toFixed(2)}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-mono text-zinc-300">{opt.delta.toFixed(3)}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-mono text-zinc-400">{opt.gamma.toFixed(4)}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-mono text-rose-400">${opt.theta.toFixed(3)}</span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-xs font-mono text-zinc-400">{((opt.impliedVolatility || 0) * 100).toFixed(1)}%</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStrike(opt.strike);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                          isSelected 
                            ? 'bg-purple-500 text-black border-transparent font-black' 
                            : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Active' : 'Analyze'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredChain.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-zinc-500 text-sm">
                    No derivatives chain available for this expiration.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Value-at-Risk & Risk Management (Hull Chapter 22) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 border-zinc-800/60 rounded-2xl bg-zinc-950/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Parametric VaR 95%</p>
            <ShieldAlert size={12} className="text-amber-400" />
          </div>
          <p className="text-xl font-black font-mono text-amber-400">${portfolioRisk.parametricVaR95.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">1-Day Max Loss (95% CI)</p>
        </div>

        <div className="glass-card p-4 border-zinc-800/60 rounded-2xl bg-zinc-950/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Expected Shortfall (CVaR)</p>
            <ShieldAlert size={12} className="text-rose-400" />
          </div>
          <p className="text-xl font-black font-mono text-rose-400">${portfolioRisk.expectedShortfall95.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Average Tail Loss beyond VaR</p>
        </div>

        <div className="glass-card p-4 border-zinc-800/60 rounded-2xl bg-zinc-950/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cornish-Fisher VaR</p>
            <ShieldAlert size={12} className="text-purple-400" />
          </div>
          <p className="text-xl font-black font-mono text-purple-400">${portfolioRisk.cornishFisherVaR95.toFixed(0)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Skewness: {portfolioRisk.skewness.toFixed(2)} | Fat Tails</p>
        </div>

        <div className="glass-card p-4 border-zinc-800/60 rounded-2xl bg-zinc-950/40">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Kurtosis</p>
            <Activity size={12} className="text-zinc-400" />
          </div>
          <p className="text-xl font-black font-mono text-zinc-100">{portfolioRisk.kurtosis.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 mt-1">{portfolioRisk.kurtosis > 3 ? 'Leptokurtic (Heavy Tails)' : 'Normal Kurtosis'}</p>
        </div>
      </div>
    </div>
  );
};

export default OptionsSimulation;
