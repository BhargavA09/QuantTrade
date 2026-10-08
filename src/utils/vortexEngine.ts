/**
 * Quantitative Vortex Projection Engine
 * Implements non-linear dynamical systems, Vortex Indicator (VI+/VI-) analysis,
 * Phase-Space vorticity flow fields, and macro bond-coupled spiral attractor trajectories.
 */

export interface VortexCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export type VortexRegime = 'spiral_attractor' | 'trend_vortex' | 'turbulent_breakout' | 'bond_coupled';

export interface VortexParams {
  currentPrice: number;
  history?: VortexCandle[];
  period?: number;              // Lookback period L (default 14)
  angularVelocity?: number;     // Omega (spiral rotation frequency: 0.2 to 3.0, default 1.0)
  damping?: number;             // Gamma (spiral convergence rate: 0.01 to 0.25, default 0.05)
  regime?: VortexRegime;        // Dynamics mode
  bondYield10Y?: number;        // Live 10Y Treasury yield (e.g. 4.14%)
  horizonDays?: number;         // Projection horizon (15 to 90 days, default 30)
  numStreamlines?: number;      // Number of particle trajectories
  volatility?: number;          // Daily annualized volatility estimate
}

export interface VortexIndicatorPoint {
  date: string;
  viPlus: number;
  viMinus: number;
  deltaVI: number;
  threshold: number;
}

export interface VortexProjectionTimelinePoint {
  date: string;
  day: number;
  meanSpiral: number;
  upperSpiral: number;
  lowerSpiral: number;
  attractorPrice: number;
  streamline1: number;
  streamline2: number;
  streamline3: number;
  streamline4: number;
  phaseAngleDeg: number;
  vorticityScore: number;
}

export interface PhasePlanePoint {
  displacement: number;  // x = (Price - Attractor) / Attractor (in %)
  momentum: number;      // y = Velocity / Return (in %)
  date?: string;
  t?: number;
  label?: string;
}

export interface VortexEngineResult {
  timeline: VortexProjectionTimelinePoint[];
  indicatorHistory: VortexIndicatorPoint[];
  phasePlaneOrbit: PhasePlanePoint[];
  metrics: {
    viPlus: number;
    viMinus: number;
    deltaVI: number;
    vortexRatio: number;
    vorticityScore: number;        // -100 to +100
    angularMomentum: number;
    circulation: number;
    signal: 'BULLISH_GOLDEN_VORTEX' | 'BEARISH_POLAR_VORTEX' | 'EQUILIBRIUM_SWIRL' | 'HIGH_TURBULENCE';
    signalConfidence: number;      // 0 - 100%
    crossStatus: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'CONVERGING';
    attractorPrice: number;
    targetHorizonPrice: number;
    targetUpperPrice: number;
    targetLowerPrice: number;
    expectedReturnPct: number;
    bondCouplingDrag: number;      // Basis points drag/pull from 10Y bond rate
  };
}

/**
 * Calculates standard Botes & Siepman Vortex Indicator series (VI+ and VI-)
 */
export function calculateVortexIndicator(candles: VortexCandle[], period: number = 14): {
  history: VortexIndicatorPoint[];
  latestViPlus: number;
  latestViMinus: number;
} {
  if (!candles || candles.length < period + 2) {
    // Generate synthetic stable VI
    const synthHistory: VortexIndicatorPoint[] = [];
    const baseDate = new Date();
    for (let i = 20; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - i);
      synthHistory.push({
        date: d.toISOString().split('T')[0],
        viPlus: 1.05 + Math.sin(i * 0.4) * 0.15,
        viMinus: 0.95 - Math.sin(i * 0.4) * 0.15,
        deltaVI: (1.05 + Math.sin(i * 0.4) * 0.15) - (0.95 - Math.sin(i * 0.4) * 0.15),
        threshold: 1.0
      });
    }
    const last = synthHistory[synthHistory.length - 1];
    return {
      history: synthHistory,
      latestViPlus: last.viPlus,
      latestViMinus: last.viMinus
    };
  }

  const vmPlus: number[] = [0];
  const vmMinus: number[] = [0];
  const trueRange: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i];
    const prev = candles[i - 1];

    // VM+ = |High_t - Low_{t-1}|
    vmPlus.push(Math.abs(cur.high - prev.low));
    // VM- = |Low_t - High_{t-1}|
    vmMinus.push(Math.abs(cur.low - prev.high));

    // True Range
    const tr1 = cur.high - cur.low;
    const tr2 = Math.abs(cur.high - prev.close);
    const tr3 = Math.abs(cur.low - prev.close);
    trueRange.push(Math.max(tr1, tr2, tr3));
  }

  const history: VortexIndicatorPoint[] = [];

  for (let i = period; i < candles.length; i++) {
    let sumVmPlus = 0;
    let sumVmMinus = 0;
    let sumTr = 0;

    for (let j = 0; j < period; j++) {
      sumVmPlus += vmPlus[i - j];
      sumVmMinus += vmMinus[i - j];
      sumTr += trueRange[i - j];
    }

    const trSafe = sumTr > 0 ? sumTr : 1.0;
    const viP = parseFloat((sumVmPlus / trSafe).toFixed(4));
    const viM = parseFloat((sumVmMinus / trSafe).toFixed(4));

    history.push({
      date: candles[i].date,
      viPlus: viP,
      viMinus: viM,
      deltaVI: parseFloat((viP - viM).toFixed(4)),
      threshold: 1.0
    });
  }

  const last = history[history.length - 1] || { viPlus: 1.05, viMinus: 0.95 };
  return {
    history,
    latestViPlus: last.viPlus,
    latestViMinus: last.viMinus
  };
}

/**
 * Computes the full non-linear Phase-Space Vortex dynamical projection
 */
export function runQuantVortexProjection(params: VortexParams): VortexEngineResult {
  const {
    currentPrice,
    history = [],
    period = 14,
    angularVelocity = 1.0,
    damping = 0.05,
    regime = 'spiral_attractor',
    bondYield10Y = 4.14,
    horizonDays = 30,
    volatility = 0.02
  } = params;

  // 1. Calculate historical Vortex Indicator (VI+ / VI-)
  const { history: indicatorHistory, latestViPlus, latestViMinus } = calculateVortexIndicator(history, period);
  const deltaVI = latestViPlus - latestViMinus;
  const vortexRatio = latestViMinus > 0 ? latestViPlus / latestViMinus : 1.0;

  // 2. Derive Equilibrium Attractor Price
  // Use 20-period EMA or DCF-like anchor
  let recentAvg = currentPrice;
  if (history.length >= 10) {
    const slice = history.slice(-Math.min(30, history.length));
    const sum = slice.reduce((acc, c) => acc + c.close, 0);
    recentAvg = sum / slice.length;
  }

  // Coupling with 10Y Bond Market Yield:
  // Higher real yields compress equity multiple attractor; lower yields expand it
  const bondHurdleSpread = (bondYield10Y - 4.0) * 0.015; // 1.5% attractor drift per 100bps yield shift
  const attractorPrice = recentAvg * (1 - bondHurdleSpread);

  // Initial displacement in phase space
  const initialDisplacement = currentPrice - attractorPrice;
  const initialMomentum = history.length > 2 
    ? (history[history.length - 1].close - history[history.length - 3].close) / 2
    : deltaVI * currentPrice * 0.01;

  // Initial phase angle phi_0 in radians
  const phi0 = Math.atan2(initialMomentum, initialDisplacement === 0 ? 0.001 : initialDisplacement);

  // 3. Construct Forward Spiral Trajectories
  const timeline: VortexProjectionTimelinePoint[] = [];
  const today = new Date();
  const effectiveOmega = (angularVelocity * 2 * Math.PI) / 30; // 30-day baseline cycle
  const effectiveGamma = damping;

  // Regime scaling coefficients
  let regimeDirectionMultiplier = 1.0;
  let regimeExpansionMultiplier = 1.0;

  switch (regime) {
    case 'trend_vortex':
      // Archimedean expansion in direction of deltaVI
      regimeDirectionMultiplier = deltaVI >= 0 ? 1.6 : -1.6;
      regimeExpansionMultiplier = 0.8;
      break;
    case 'turbulent_breakout':
      // High vorticity divergence
      regimeDirectionMultiplier = deltaVI >= 0 ? 1.2 : -1.2;
      regimeExpansionMultiplier = 1.8;
      break;
    case 'bond_coupled':
      // Strong gravitational pull toward bond-adjusted attractor
      regimeDirectionMultiplier = (4.0 - bondYield10Y) * 0.3;
      regimeExpansionMultiplier = 0.6;
      break;
    case 'spiral_attractor':
    default:
      // Damped harmonic attractor
      regimeDirectionMultiplier = 1.0;
      regimeExpansionMultiplier = 1.0;
      break;
  }

  // Pre-seed pseudo-random deterministic shocks for smooth particles
  const particleSeeds = [
    { noise: 0.008, phaseShift: 0.4, drift: 0.0004 },
    { noise: -0.007, phaseShift: -0.5, drift: -0.0003 },
    { noise: 0.012, phaseShift: 0.9, drift: 0.0006 },
    { noise: -0.011, phaseShift: -0.8, drift: -0.0005 }
  ];

  for (let d = 1; d <= horizonDays; d++) {
    const projDate = new Date(today);
    projDate.setDate(projDate.getDate() + d);

    const t = d;
    // Damped harmonic vortex oscillator equation:
    // P(t) = P_attractor + A_0 * e^(-gamma * t) * cos(omega * t + phi0) + Drift_vortex(t)
    const decay = Math.exp(-effectiveGamma * t);
    const oscillatoryComponent = initialDisplacement * decay * Math.cos(effectiveOmega * t + phi0);

    // Directional vortex force proportional to net vorticity
    const vortexDrift = (deltaVI * currentPrice * 0.015 * regimeDirectionMultiplier) * Math.sqrt(t / 10);

    // Mean spiral price
    let meanSpiral = attractorPrice + oscillatoryComponent + vortexDrift;
    meanSpiral = Math.max(meanSpiral, currentPrice * 0.2);

    // Dynamic spiral cone boundaries (expanding with square root of time)
    const coneSpread = currentPrice * volatility * Math.sqrt(t) * regimeExpansionMultiplier;
    const upperSpiral = parseFloat((meanSpiral + coneSpread).toFixed(2));
    const lowerSpiral = parseFloat((Math.max(meanSpiral - coneSpread, currentPrice * 0.15)).toFixed(2));

    // Calculate individual particle streamlines with vortex rotational turbulence
    const s1 = parseFloat((meanSpiral + Math.sin(t * 0.3 + particleSeeds[0].phaseShift) * coneSpread * 0.6 + particleSeeds[0].drift * t * currentPrice).toFixed(2));
    const s2 = parseFloat((meanSpiral + Math.cos(t * 0.25 + particleSeeds[1].phaseShift) * coneSpread * 0.5 + particleSeeds[1].drift * t * currentPrice).toFixed(2));
    const s3 = parseFloat((meanSpiral + Math.sin(t * 0.4 + particleSeeds[2].phaseShift) * coneSpread * 0.85 + particleSeeds[2].drift * t * currentPrice).toFixed(2));
    const s4 = parseFloat((meanSpiral - Math.cos(t * 0.35 + particleSeeds[3].phaseShift) * coneSpread * 0.8 + particleSeeds[3].drift * t * currentPrice).toFixed(2));

    const phaseAngleDeg = Math.round(((phi0 + effectiveOmega * t) * (180 / Math.PI)) % 360);
    const vorticityScore = Math.max(-100, Math.min(100, Math.round(deltaVI * 120 * regimeDirectionMultiplier)));

    timeline.push({
      date: projDate.toISOString().split('T')[0],
      day: d,
      meanSpiral: parseFloat(meanSpiral.toFixed(2)),
      upperSpiral,
      lowerSpiral,
      attractorPrice: parseFloat(attractorPrice.toFixed(2)),
      streamline1: s1,
      streamline2: s2,
      streamline3: s3,
      streamline4: s4,
      phaseAngleDeg: phaseAngleDeg < 0 ? phaseAngleDeg + 360 : phaseAngleDeg,
      vorticityScore
    });
  }

  // 4. Construct 2D Phase-Plane Vortex Orbit (Displacement vs Momentum)
  const phasePlaneOrbit: PhasePlanePoint[] = [];

  // Historical phase orbit (last 15 candles)
  if (history.length >= 6) {
    const subset = history.slice(-15);
    for (let i = 1; i < subset.length; i++) {
      const p = subset[i].close;
      const prev = subset[i - 1].close;
      const disp = parseFloat((((p - attractorPrice) / attractorPrice) * 100).toFixed(2));
      const mom = parseFloat((((p - prev) / prev) * 100).toFixed(2));
      phasePlaneOrbit.push({
        displacement: disp,
        momentum: mom,
        date: subset[i].date,
        label: i === subset.length - 1 ? 'Current Market State' : undefined
      });
    }
  } else {
    // Synthetic initial orbit
    phasePlaneOrbit.push({ displacement: 0.5, momentum: 0.2, label: 'Current Market State' });
  }

  // Forward projected phase spiral orbit (30 days)
  for (let i = 0; i < Math.min(30, timeline.length); i += 2) {
    const pt = timeline[i];
    const prevPt = i > 0 ? timeline[i - 1] : { meanSpiral: currentPrice };
    const disp = parseFloat((((pt.meanSpiral - attractorPrice) / attractorPrice) * 100).toFixed(2));
    const mom = parseFloat((((pt.meanSpiral - prevPt.meanSpiral) / prevPt.meanSpiral) * 100).toFixed(2));
    phasePlaneOrbit.push({
      displacement: disp,
      momentum: mom,
      t: pt.day,
      label: `T+${pt.day}D Vortex Forecast`
    });
  }

  // 5. Synthesis Metrics and Signal Evaluation
  let signal: VortexEngineResult['metrics']['signal'] = 'EQUILIBRIUM_SWIRL';
  if (latestViPlus > 1.15 && deltaVI > 0.15) {
    signal = 'BULLISH_GOLDEN_VORTEX';
  } else if (latestViMinus > 1.15 && deltaVI < -0.15) {
    signal = 'BEARISH_POLAR_VORTEX';
  } else if (Math.abs(deltaVI) > 0.3 || regime === 'turbulent_breakout') {
    signal = 'HIGH_TURBULENCE';
  }

  const crossStatus = deltaVI > 0.05 
    ? 'GOLDEN_CROSS' 
    : deltaVI < -0.05 
      ? 'DEATH_CROSS' 
      : 'CONVERGING';

  const finalHorizonPoint = timeline[timeline.length - 1] || { meanSpiral: currentPrice, upperSpiral: currentPrice, lowerSpiral: currentPrice };
  const expectedReturnPct = parseFloat((((finalHorizonPoint.meanSpiral - currentPrice) / currentPrice) * 100).toFixed(2));

  // Angular Momentum and Circulation in dynamical units
  const angularMomentum = parseFloat((initialDisplacement * initialMomentum * 0.001).toFixed(3));
  const circulation = parseFloat((2 * Math.PI * effectiveOmega * Math.abs(initialDisplacement) * 0.1).toFixed(2));
  const signalConfidence = Math.min(99, Math.round(Math.abs(deltaVI) * 180 + 40));

  return {
    timeline,
    indicatorHistory,
    phasePlaneOrbit,
    metrics: {
      viPlus: latestViPlus,
      viMinus: latestViMinus,
      deltaVI: parseFloat(deltaVI.toFixed(4)),
      vortexRatio: parseFloat(vortexRatio.toFixed(3)),
      vorticityScore: Math.round(deltaVI * 100),
      angularMomentum,
      circulation,
      signal,
      signalConfidence,
      crossStatus,
      attractorPrice: parseFloat(attractorPrice.toFixed(2)),
      targetHorizonPrice: finalHorizonPoint.meanSpiral,
      targetUpperPrice: finalHorizonPoint.upperSpiral,
      targetLowerPrice: finalHorizonPoint.lowerSpiral,
      expectedReturnPct,
      bondCouplingDrag: parseFloat((bondHurdleSpread * 100).toFixed(2))
    }
  };
}
