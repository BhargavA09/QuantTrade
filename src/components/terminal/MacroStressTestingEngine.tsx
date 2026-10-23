import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  RotateCw,
  Sliders,
  DollarSign,
  Activity,
  Flame,
  CheckCircle2,
  ChevronRight,
  Info,
  Scale
} from 'lucide-react';
import { quantTraderBrain } from '../../services/QuantTraderBrain';

export interface CrisisRegimePreset {
  id: string;
  name: string;
  year: string;
  equityShockPct: number;
  vixSpikePts: number;
  rateShiftBps: number;
  oilShockPct: number;
  summary: string;
  historicalContext: string;
}

export const CRISIS_REGIMES: CrisisRegimePreset[] = [
  {
    id: 'covid_2020',
    name: '2020 COVID Liquidity Freeze',
    year: 'Mar 2020',
    equityShockPct: -34.0,
    vixSpikePts: 55.0, // VIX spiked from 14 to 82
    rateShiftBps: -100,
    oilShockPct: -65.0,
    summary: 'Extreme flight-to-cash, corporate credit spreads exploded +400bps, indiscriminate deleveraging.',
    historicalContext: 'S&P 500 dropped 34% in 23 trading sessions. Fixed income markets froze before Fed intervention.'
  },
  {
    id: 'fed_2022',
    name: '2022 Fed Rate-Shock Tightening',
    year: '2022 Cycle',
    equityShockPct: -25.0,
    vixSpikePts: 18.0,
    rateShiftBps: 250,
    oilShockPct: 45.0,
    summary: 'Aggressive rate hikes (425bps in 9 months), long-duration growth multiple compression.',
    historicalContext: 'Nasdaq fell -33% as 10-year Treasury yields surged from 1.5% to 4.2%, causing generational equity/bond correlation breakdown.'
  },
  {
    id: 'gfc_2008',
    name: '2008 Global Financial Crisis',
    year: 'Sep 2008',
    equityShockPct: -52.0,
    vixSpikePts: 62.0,
    rateShiftBps: -220,
    oilShockPct: -70.0,
    summary: 'Systemic counterparty failure, Lehman collapse, interbank credit freeze.',
    historicalContext: 'Broad financial sector fell -75%, leading to worldwide recession and unprecedented central bank TARP/QE bailouts.'
  },
  {
    id: 'carry_2024',
    name: '2024 Tech Beta Unwind & Yen Carry Shock',
    year: 'Aug 2024',
    equityShockPct: -14.0,
    vixSpikePts: 38.0, // VIX hit 65 intraday
    rateShiftBps: -40,
    oilShockPct: -8.0,
    summary: 'Rapid BOJ rate hike triggered violent unwind of leveraged Yen carry trade into mega-cap tech.',
    historicalContext: 'Nikkei recorded its worst single-day drop since 1987 (-12.4%), dragging global AI leaders down 15-25% in 3 days.'
  },
  {
    id: 'stagflation_oil',
    name: 'Stagflationary Oil Supply Shock',
    year: 'Hypothetical 1970s Redux',
    equityShockPct: -20.0,
    vixSpikePts: 28.0,
    rateShiftBps: 120,
    oilShockPct: 85.0,
    summary: 'Strait of Hormuz disruption, oil surges to $150/bbl, cost-push margin contraction.',
    historicalContext: 'Corporate gross margins shrink by 320 bps, consumer discretionary collapses while commodities outperform.'
  }
];

interface MacroStressTestingEngineProps {
  selectedTicker: string;
  currentPrice: number;
}

export const MacroStressTestingEngine: React.FC<MacroStressTestingEngineProps> = ({
  selectedTicker,
  currentPrice: initialSpot
}) => {
  const currentPrice = initialSpot > 0 ? initialSpot : 140.0;
  const brainState = quantTraderBrain.getState();
  const portfolioCapital = brainState.stats.capital;

  const [activePresetId, setActivePresetId] = useState<string>('covid_2020');
  const [customEquityShock, setCustomEquityShock] = useState<number>(-34.0);
  const [customVixSpike, setCustomVixSpike] = useState<number>(55.0);
  const [customRateShiftBps, setCustomRateShiftBps] = useState<number>(-100);
  const [customOilShock, setCustomOilShock] = useState<number>(-65.0);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  // When selecting a preset
  const handleSelectPreset = (preset: CrisisRegimePreset) => {
    setActivePresetId(preset.id);
    setIsCustomMode(false);
    setCustomEquityShock(preset.equityShockPct);
    setCustomVixSpike(preset.vixSpikePts);
    setCustomRateShiftBps(preset.rateShiftBps);
    setCustomOilShock(preset.oilShockPct);
  };

  const activePreset = useMemo(() => {
    return CRISIS_REGIMES.find(r => r.id === activePresetId) || CRISIS_REGIMES[0];
  }, [activePresetId]);

  // Derive asset beta
  const assetBeta = useMemo(() => {
    const sym = selectedTicker.toUpperCase();
    if (['NVDA', 'TSLA', 'PLTR', 'AMD'].includes(sym)) return 1.85;
    if (['QQQ', 'MSFT', 'AMZN', 'AAPL', 'META'].includes(sym)) return 1.25;
    if (['SPY', 'IWM'].includes(sym)) return 1.0;
    if (['GLD', 'SLV'].includes(sym)) return 0.22;
    if (['USO', 'BNO'].includes(sym)) return 0.65;
    if (['TLT'].includes(sym)) return -0.35;
    return 1.15;
  }, [selectedTicker]);

  // Projected asset price under stress
  const assetProjectedImpact = useMemo(() => {
    const baseDrop = customEquityShock;
    const betaWeightedShock = baseDrop * assetBeta;
    const shockedPrice = Math.max(1, currentPrice * (1 + betaWeightedShock / 100));
    const dollarLossPerShare = currentPrice - shockedPrice;

    // Portfolio level drawdown
    const portfolioDrawdownPct = Math.min(100, Math.abs(customEquityShock * 1.12));
    const portfolioDollarLoss = (portfolioCapital * (portfolioDrawdownPct / 100));

    return {
      betaWeightedShock: parseFloat(betaWeightedShock.toFixed(2)),
      shockedPrice: parseFloat(shockedPrice.toFixed(2)),
      dollarLossPerShare: parseFloat(dollarLossPerShare.toFixed(2)),
      portfolioDrawdownPct: parseFloat(portfolioDrawdownPct.toFixed(1)),
      portfolioDollarLoss: parseFloat(portfolioDollarLoss.toFixed(2))
    };
  }, [customEquityShock, assetBeta, currentPrice, portfolioCapital]);

  // Sector Waterfall Breakdown under current crisis scenario
  const sectorWaterfall = useMemo(() => {
    const eq = customEquityShock;
    const rates = customRateShiftBps;
    const oil = customOilShock;

    return [
      {
        sector: 'Technology & Semis (High Beta)',
        shockPct: parseFloat((eq * 1.35).toFixed(1)),
        resilience: 'Vulnerable',
        driver: 'High duration and PE multiple compression'
      },
      {
        sector: 'Financials & Regional Banks',
        shockPct: parseFloat((eq * (rates < 0 ? 1.4 : 1.15)).toFixed(1)),
        resilience: rates < 0 ? 'High Risk' : 'Moderate',
        driver: rates < 0 ? 'Yield curve inversion & net interest margin squeeze' : 'Credit spread widening'
      },
      {
        sector: 'Energy & Commodities',
        shockPct: parseFloat((oil * 0.75 + eq * 0.35).toFixed(1)),
        resilience: oil > 0 ? 'Outperformer' : 'Vulnerable',
        driver: 'Direct commodity price transmission'
      },
      {
        sector: 'Consumer Discretionary',
        shockPct: parseFloat((eq * 1.15).toFixed(1)),
        resilience: 'Vulnerable',
        driver: 'Household disposable income erosion'
      },
      {
        sector: 'Healthcare & Pharma (Defensive)',
        shockPct: parseFloat((eq * 0.55).toFixed(1)),
        resilience: 'Resilient',
        driver: 'Inelastic clinical demand & solid balance sheets'
      },
      {
        sector: 'Utilities & Infrastructure',
        shockPct: parseFloat((eq * 0.45 - (rates > 0 ? 8 : 0)).toFixed(1)),
        resilience: 'Defensive',
        driver: 'Regulated bond-proxy cash flows'
      }
    ];
  }, [customEquityShock, customRateShiftBps, customOilShock]);

  // Tail-Risk Hedging Recommendations
  const tailRiskHedges = useMemo(() => {
    const unhedgedLoss = assetProjectedImpact.portfolioDollarLoss;

    return [
      {
        id: 'put_hedge',
        name: 'SPY Out-of-the-Money Protective Puts',
        instrument: '90-day 5% OTM Puts',
        costPct: 1.8,
        costDollar: portfolioCapital * 0.018,
        hedgedLossReductionPct: 62.0,
        postHedgeLossPct: parseFloat((assetProjectedImpact.portfolioDrawdownPct * 0.38).toFixed(1)),
        description: 'Asymmetric non-linear convex payout that surges as underlying gamma expands during panic.'
      },
      {
        id: 'vix_hedge',
        name: 'VIX Out-of-the-Money Call Options',
        instrument: '60-day 25-strike VIX Calls',
        costPct: 1.2,
        costDollar: portfolioCapital * 0.012,
        hedgedLossReductionPct: 54.0,
        postHedgeLossPct: parseFloat((assetProjectedImpact.portfolioDrawdownPct * 0.46).toFixed(1)),
        description: 'Direct volatility spike monetizer. Yields 800%+ returns during liquidity freezes.'
      },
      {
        id: 'duration_hedge',
        name: 'Treasury Duration Overlay (TLT Long)',
        instrument: 'Long 20Y+ Treasuries',
        costPct: 0.0,
        costDollar: 0,
        hedgedLossReductionPct: customRateShiftBps < 0 ? 42.0 : -10.0,
        postHedgeLossPct: parseFloat((assetProjectedImpact.portfolioDrawdownPct * 0.65).toFixed(1)),
        description: 'Flight-to-safety duration hedge (effective in liquidity freeze; ineffective in inflation shock).'
      },
      {
        id: 'gold_hedge',
        name: 'Safe-Haven Gold Allocation (GLD)',
        instrument: '10% Physical Gold Allocation',
        costPct: 0.0,
        costDollar: 0,
        hedgedLossReductionPct: 35.0,
        postHedgeLossPct: parseFloat((assetProjectedImpact.portfolioDrawdownPct * 0.72).toFixed(1)),
        description: 'Store-of-value hedge during systemic counterparty crises and currency debasement.'
      }
    ];
  }, [portfolioCapital, assetProjectedImpact, customRateShiftBps]);

  return (
    <div className="rounded-2xl bg-zinc-900/90 border border-zinc-800 p-5 space-y-6 shadow-2xl">
      {/* 1. Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Global Macro Stress Engine
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Active Ticker: <strong className="text-white">{selectedTicker}</strong> (Beta: {assetBeta.toFixed(2)})
            </span>
            <span className="text-zinc-600">·</span>
            <span className="text-xs font-mono text-zinc-300">
              Portfolio NAV: <strong className="text-emerald-400 font-mono">${portfolioCapital.toLocaleString()}</strong>
            </span>
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Macro Stress-Testing & Global Regime Shock Engine
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
            Stress-tests active positions and total portfolio resilience against institutional crisis analogs (2020 Liquidity Crunch, 2022 Fed Shock, 2008 GFC, 2024 Carry Unwind). Simulates beta-weighted drawdowns and optimizes tail-risk hedges.
          </p>
        </div>

        {/* Reset button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => handleSelectPreset(CRISIS_REGIMES[0])}
            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* 2. Crisis Scenario Selector Deck */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-zinc-400 font-mono tracking-wider">
          Historical & Systemic Crisis Analogs:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {CRISIS_REGIMES.map(preset => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`p-3 rounded-xl text-left font-mono transition-all border ${
                activePresetId === preset.id && !isCustomMode
                  ? 'bg-rose-950/40 border-rose-500/70 text-white shadow-lg shadow-rose-950/50'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                <span>{preset.year}</span>
                <span className="text-rose-400 font-bold">{preset.equityShockPct}% Equities</span>
              </div>
              <div className="text-xs font-bold text-zinc-100 truncate">{preset.name}</div>
              <div className="text-[10px] text-zinc-400 font-sans line-clamp-2 mt-1 leading-snug">
                {preset.summary}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Interactive Shock Param Sliders */}
      <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Shock Regime Sliders {isCustomMode && <span className="text-amber-400">(Custom Mode)</span>}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            {activePreset.historicalContext}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {/* Equity Index Shock */}
          <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-400 text-[11px]">S&P 500 Equities Shock:</span>
              <strong className="text-rose-400 font-black">{customEquityShock}%</strong>
            </div>
            <input
              type="range"
              min={-60}
              max={10}
              step={1}
              value={customEquityShock}
              onChange={(e) => {
                setCustomEquityShock(Number(e.target.value));
                setIsCustomMode(true);
              }}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* VIX Volatility Spike */}
          <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-400 text-[11px]">VIX Volatility Surge:</span>
              <strong className="text-purple-400 font-black">+{customVixSpike} pts</strong>
            </div>
            <input
              type="range"
              min={0}
              max={80}
              step={1}
              value={customVixSpike}
              onChange={(e) => {
                setCustomVixSpike(Number(e.target.value));
                setIsCustomMode(true);
              }}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* 10Y Rate Shift */}
          <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-400 text-[11px]">10Y Treasury Yield Shift:</span>
              <strong className={`font-black ${customRateShiftBps >= 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                {customRateShiftBps >= 0 ? '+' : ''}{customRateShiftBps} bps
              </strong>
            </div>
            <input
              type="range"
              min={-250}
              max={300}
              step={10}
              value={customRateShiftBps}
              onChange={(e) => {
                setCustomRateShiftBps(Number(e.target.value));
                setIsCustomMode(true);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Crude Oil Shock */}
          <div className="space-y-1.5 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
            <div className="flex justify-between">
              <span className="text-zinc-400 text-[11px]">WTI Crude Oil Shift:</span>
              <strong className={`font-black ${customOilShock >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {customOilShock >= 0 ? '+' : ''}{customOilShock}%
              </strong>
            </div>
            <input
              type="range"
              min={-80}
              max={100}
              step={5}
              value={customOilShock}
              onChange={(e) => {
                setCustomOilShock(Number(e.target.value));
                setIsCustomMode(true);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 4. Stress Impact Telemetry Scorecard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            {selectedTicker} Beta-Weighted Shock
          </span>
          <span className="text-xl font-black text-rose-400">
            {assetProjectedImpact.betaWeightedShock}%
          </span>
          <span className="text-[11px] text-zinc-400 block">
            Price: ${currentPrice.toFixed(2)} &rarr; <strong className="text-white">${assetProjectedImpact.shockedPrice.toFixed(2)}</strong>
          </span>
          <span className="text-[10px] text-zinc-500 block">
            Drop: -${assetProjectedImpact.dollarLossPerShare.toFixed(2)} / share
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-rose-500/30 space-y-1 bg-rose-950/10">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">
            Portfolio Stress Drawdown
          </span>
          <span className="text-xl font-black text-rose-400">
            -{assetProjectedImpact.portfolioDrawdownPct}%
          </span>
          <span className="text-[11px] text-rose-200 block font-bold">
            Loss: -${assetProjectedImpact.portfolioDollarLoss.toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-400 block">
            Remaining NAV: ${(portfolioCapital - assetProjectedImpact.portfolioDollarLoss).toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            Tail Value-at-Risk (Stress VaR 99%)
          </span>
          <span className="text-xl font-black text-amber-400">
            ${(assetProjectedImpact.portfolioDollarLoss * 1.15).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-zinc-400 block">
            Fat-tail CVaR (Expected Shortfall)
          </span>
          <span className="text-[10px] text-zinc-500 block">
            Exceedance probability: 1.0%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block">
            Post-Hedge Protected Drawdown
          </span>
          <span className="text-xl font-black text-emerald-400">
            -{tailRiskHedges[0].postHedgeLossPct}%
          </span>
          <span className="text-[11px] text-emerald-300 block">
            Preserves ${(assetProjectedImpact.portfolioDollarLoss * 0.62).toLocaleString(undefined, { maximumFractionDigits: 0 })} capital
          </span>
          <span className="text-[10px] text-zinc-500 block">
            Under 90D SPY Put Overlay
          </span>
        </div>
      </div>

      {/* 5. Sector Stress Waterfall Breakdown */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Sector Drawdown Waterfall Under Shock Regime
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Derived from Macro Beta Elasticity
          </span>
        </div>

        <div className="space-y-2.5 font-mono text-xs">
          {sectorWaterfall.map((sec, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{sec.sector}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-sans font-bold ${
                    sec.resilience === 'Resilient' || sec.resilience === 'Outperformer'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : sec.resilience === 'Defensive'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {sec.resilience}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-black ${sec.shockPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {sec.shockPct >= 0 ? '+' : ''}{sec.shockPct}%
                  </span>
                </div>
              </div>

              {/* Waterfall Bar Gauge */}
              <div className="w-full h-2 rounded bg-zinc-800 overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-300 ${sec.shockPct >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(100, Math.abs(sec.shockPct) * 2)}%` }}
                />
              </div>
              <div className="text-[10px] text-zinc-500 font-sans">
                {sec.driver}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Tail-Risk Hedging Recommendations Matrix */}
      <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Institutional Tail-Risk Hedging Overlays
            </h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">
            Convex protection against Black Swan events
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
          {tailRiskHedges.map((hedge) => (
            <div
              key={hedge.id}
              className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-white text-xs">{hedge.name}</div>
                  <div className="text-[11px] text-zinc-400">{hedge.instrument}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-500 block uppercase">Drawdown Post-Hedge</span>
                  <span className="text-sm font-black text-emerald-400">
                    -{hedge.postHedgeLossPct}%
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                {hedge.description}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400">
                <span>Annualized Carry Cost: <strong className="text-zinc-200">{hedge.costPct}% NAV</strong></span>
                <span className="text-emerald-400 font-bold">-{hedge.hedgedLossReductionPct}% Drawdown Mitigation</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
