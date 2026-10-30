/**
 * Quant Portfolio Suite Service
 * Connects directly to Python Quant Core backend for all 5 projects
 * Includes client-side mathematical fallbacks for instantaneous UI feedback
 */

export interface MomentumBacktestResult {
  success: boolean;
  ticker: string;
  lookbackDays: number;
  totalReturnPct: number;
  benchmarkReturnPct: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdownPct: number;
  winRate: number;
  totalTrades: number;
  trades: Array<{
    id: string;
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    shares: number;
    capital: number;
    pnl?: number;
    pnlPct?: number;
    reason: string;
  }>;
  chartData: Array<{
    date: string;
    portfolio: number;
    benchmark: number;
    price: number;
    smaShort: number;
    smaLong: number;
  }>;
  pythonCode: string;
}

export interface MonteCarloRiskResult {
  success: boolean;
  ticker: string;
  initialPrice: number;
  horizonDays: number;
  numSimulations: number;
  var95Pct: number;
  var99Pct: number;
  cvar95Pct: number;
  probProfit: number;
  expectedMedian: number;
  fanChartData: Array<{
    day: string;
    p5: number;
    p25: number;
    median: number;
    p75: number;
    p95: number;
    path1?: number;
    path2?: number;
    path3?: number;
  }>;
  histogram: Array<{
    range: string;
    count: number;
    density: number;
  }>;
  pythonCode: string;
}

export interface PairsTradingResult {
  success: boolean;
  pair: string;
  tickerY: string;
  tickerX: string;
  hedgeRatioBeta: number;
  adfStatistic: number;
  pValue: number;
  isCointegrated: boolean;
  halfLifeDays: number;
  totalTrades: number;
  cumulativePnl: number;
  chartData: Array<{
    date: string;
    yPrice: number;
    xPrice: number;
    spread: number;
    zScore: number;
    upperBand: number;
    lowerBand: number;
    portfolio: number;
  }>;
  trades: Array<{
    date: string;
    action: string;
    zScore: number;
    spread: number;
    yPrice?: number;
    xPrice?: number;
    pnl?: number;
  }>;
  pythonCode: string;
}

export interface EfficientFrontierResult {
  success: boolean;
  tickers: string[];
  riskFreeRate: number;
  maxSharpePortfolio: {
    ret: number;
    vol: number;
    sharpe: number;
    weights: Record<string, number>;
  };
  minVolatilityPortfolio: {
    ret: number;
    vol: number;
    sharpe: number;
    weights: Record<string, number>;
  };
  simulatedPortfolios: Array<{
    ret: number;
    vol: number;
    sharpe: number;
    weights: Record<string, number>;
  }>;
  frontierCurve: Array<{
    vol: number;
    ret: number;
    sharpe: number;
  }>;
  correlationMatrix: {
    tickers: string[];
    matrix: number[][];
  };
  pythonCode: string;
}

export interface PortfolioDocumentationResult {
  success: boolean;
  readme: string;
  interviewGuide: Array<{
    category: string;
    question: string;
    defense: string;
    improvement: string;
  }>;
}

const API_BASE = '/api/quant';

export async function fetchMomentumBacktest(params: {
  ticker?: string;
  lookback?: number;
  stopLoss?: number;
  takeProfit?: number;
}): Promise<MomentumBacktestResult> {
  const query = new URLSearchParams();
  if (params.ticker) query.append('ticker', params.ticker);
  if (params.lookback) query.append('lookback', String(params.lookback));
  if (params.stopLoss) query.append('stopLoss', String(params.stopLoss));
  if (params.takeProfit) query.append('takeProfit', String(params.takeProfit));

  const res = await fetch(`${API_BASE}/momentum?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching momentum backtest`);
  return res.json();
}

export async function fetchMonteCarloRisk(params: {
  ticker?: string;
  price?: number;
  horizon?: number;
  sims?: number;
  vol?: number;
  jump?: number;
}): Promise<MonteCarloRiskResult> {
  const query = new URLSearchParams();
  if (params.ticker) query.append('ticker', params.ticker);
  if (params.price) query.append('price', String(params.price));
  if (params.horizon) query.append('horizon', String(params.horizon));
  if (params.sims) query.append('sims', String(params.sims));
  if (params.vol) query.append('vol', String(params.vol));
  if (params.jump !== undefined) query.append('jump', String(params.jump));

  const res = await fetch(`${API_BASE}/monte-carlo?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching Monte Carlo risk`);
  return res.json();
}

export async function fetchPairsTrading(params: {
  tickerY?: string;
  tickerX?: string;
  lookback?: number;
  entryZ?: number;
}): Promise<PairsTradingResult> {
  const query = new URLSearchParams();
  if (params.tickerY) query.append('tickerY', params.tickerY);
  if (params.tickerX) query.append('tickerX', params.tickerX);
  if (params.lookback) query.append('lookback', String(params.lookback));
  if (params.entryZ) query.append('entryZ', String(params.entryZ));

  const res = await fetch(`${API_BASE}/pairs-trading?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching pairs trading`);
  return res.json();
}

export async function fetchEfficientFrontier(params: {
  tickers?: string[];
  rf?: number;
  maxWeight?: number;
}): Promise<EfficientFrontierResult> {
  const query = new URLSearchParams();
  if (params.tickers && params.tickers.length > 0) query.append('tickers', params.tickers.join(','));
  if (params.rf) query.append('rf', String(params.rf));
  if (params.maxWeight) query.append('maxWeight', String(params.maxWeight));

  const res = await fetch(`${API_BASE}/efficient-frontier?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching efficient frontier`);
  return res.json();
}

export async function fetchPortfolioDocumentation(): Promise<PortfolioDocumentationResult> {
  const res = await fetch(`${API_BASE}/documentation`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching portfolio documentation`);
  return res.json();
}

export interface CorrelationAssetDetail {
  ticker: string;
  name: string;
  category: string;
  sector: string;
  baseBeta: number;
  baseVol: number;
}

export interface PrimaryCorrelationItem {
  ticker: string;
  name: string;
  category: string;
  sector: string;
  correlation: number;
  regime: string;
  description: string;
}

export interface CorrelationMatrixResult {
  success: boolean;
  primaryTicker: string;
  lookbackDays: number;
  universeType: string;
  tickers: string[];
  assetDetails: CorrelationAssetDetail[];
  matrix: number[][];
  primaryCorrelations: PrimaryCorrelationItem[];
  topDriver: PrimaryCorrelationItem;
  topHedge: PrimaryCorrelationItem;
  insights: {
    betaSPY: number;
    betaQQQ: number;
    averageCorrelation: number;
    systematicFactorExposure: string;
    pcaFirstComponentVariancePct: number;
    diversificationScore: number;
  };
  rollingTimeline: Array<{
    date: string;
    corrSPY: number;
    corrQQQ: number;
  }>;
  timestamp: string;
}

export async function fetchCorrelationMatrix(params: {
  ticker?: string;
  universe?: 'all' | 'indices' | 'sectors' | 'macro';
  lookback?: number;
}): Promise<CorrelationMatrixResult> {
  const query = new URLSearchParams();
  if (params.ticker) query.append('ticker', params.ticker);
  if (params.universe) query.append('universe', params.universe);
  if (params.lookback) query.append('lookback', String(params.lookback));

  const res = await fetch(`${API_BASE}/correlation-matrix?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching correlation matrix`);
  return res.json();
}

export interface SensitivityCurvePoint {
  priceShockPct: number;
  stockPrice: number;
  positionDelta: number;
  rehedgeShares: number;
  linearPnl: number;
  convexPnl: number;
  exactPnl: number;
  convexityGap: number;
  isBreached: boolean;
}

export interface StressMatrixCell {
  volScenario: 'crush' | 'base' | 'spike';
  volLabel: string;
  priceShockPct: number;
  shockedPrice: number;
  delta: number;
  rehedgeShares: number;
  pnl: number;
  breach: boolean;
}

export interface StressMatrixRow {
  priceShockPct: number;
  shockedPrice: number;
  cells: StressMatrixCell[];
}

export interface DeltaGammaSensitivityResult {
  success: boolean;
  ticker: string;
  spotPrice: number;
  positionType: string;
  quantity: number;
  sharesHeld: number;
  targetDelta: number;
  toleranceBand: number;
  baseIv: number;
  daysToExpiry: number;
  shocks: {
    priceShockPct: number;
    volShockPct: number;
    shockedPrice: number;
    shockedIv: number;
  };
  baseGreeks: {
    netDelta: number;
    dollarDelta: number;
    netGamma: number;
    dollarGamma1Pct: number;
    netVega: number;
    netVanna: number;
  };
  shockedGreeks: {
    shockedDelta: number;
    deltaDrift: number;
    deltaDriftPct: number;
  };
  hedgingRequirement: {
    status: 'IN_TOLERANCE' | 'REHEDGE_BUY' | 'REHEDGE_SELL';
    action: string;
    rebalanceShares: number;
    rebalanceNotional: number;
    urgency: 'LOW' | 'MODERATE' | 'HIGH';
    isOutsideTolerance: boolean;
  };
  pnlDecomposition: {
    linearDeltaPnl: number;
    gammaConvexityPnl: number;
    vegaPnl: number;
    totalTaylorPnl: number;
    convexityAlphaAdvantage: number;
  };
  gammaRisk: {
    score: number;
    regime: string;
  };
  sensitivityCurve: SensitivityCurvePoint[];
  stressMatrix: StressMatrixRow[];
  timestamp: string;
}

const deltaGammaCache = new Map<string, { timestamp: number; data: DeltaGammaSensitivityResult }>();

function normCdf(x: number): number {
  const b1 = 0.319381530;
  const b2 = -0.356563782;
  const b3 = 1.781477937;
  const b4 = -1.821255978;
  const b5 = 1.330274429;
  const p = 0.2316419;
  const c = 0.39894228;
  if (x >= 0.0) {
    const t = 1.0 / (1.0 + p * x);
    return 1.0 - c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  } else {
    const t = 1.0 / (1.0 - p * x);
    return c * Math.exp(-x * x / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
  }
}

function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function calcBsGreeks(S: number, K: number, T: number, r: number, sigma: number, optType: 'call' | 'put') {
  if (T <= 0.0001 || sigma <= 0.0001 || S <= 0 || K <= 0) {
    return { delta: optType === 'call' ? 1.0 : 0.0, gamma: 0.0, vega: 0.0, vanna: 0.0, price: Math.max(0, optType === 'call' ? S - K : K - S) };
  }
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  const pdfD1 = normPdf(d1);
  const delta = optType === 'call' ? normCdf(d1) : normCdf(d1) - 1.0;
  const gamma = pdfD1 / (S * sigma * Math.sqrt(T));
  const vega = (S * pdfD1 * Math.sqrt(T)) / 100.0;
  const vanna = -(pdfD1 * d2) / sigma;
  const price = optType === 'call'
    ? S * normCdf(d1) - K * Math.exp(-r * T) * normCdf(d2)
    : K * Math.exp(-r * T) * normCdf(-d2) - S * normCdf(-d1);
  return { delta, gamma, vega, vanna, price: Math.max(0, price) };
}

export function generateClientDeltaGammaSensitivity(params: {
  ticker: string;
  spot: number;
  positionType?: string;
  qty?: number;
  targetDelta?: number;
  priceShock?: number;
  volShock?: number;
  iv?: number;
  dte?: number;
  tolerance?: number;
}): DeltaGammaSensitivityResult {
  const S0 = Math.max(1.0, params.spot || 140.0);
  const positionType = params.positionType || 'long_equity';
  const quantity = params.qty !== undefined ? params.qty : 100;
  const targetDelta = params.targetDelta || 0.0;
  const priceShockPct = params.priceShock || 0.0;
  const volShockPct = params.volShock || 0.0;
  const sigma0 = Math.max(0.05, params.iv || 0.32);
  const daysToExpiry = Math.max(1, params.dte || 30);
  const toleranceBand = params.tolerance !== undefined ? params.tolerance : 5.0;
  const r = 0.045;
  const T = daysToExpiry / 365.0;

  let sharesHeld = 0.0;
  let callsContracts = 0.0;
  let callsStrike = S0;
  let putsContracts = 0.0;
  let putsStrike = S0;

  if (positionType === 'long_equity') {
    sharesHeld = Number(quantity);
  } else if (positionType === 'short_equity') {
    sharesHeld = -Number(quantity);
  } else if (positionType === 'delta_hedged_straddle') {
    const contracts = Math.max(1.0, quantity / 100.0);
    callsContracts = contracts;
    putsContracts = contracts;
    const callG = calcBsGreeks(S0, S0, T, r, sigma0, 'call');
    const putG = calcBsGreeks(S0, S0, T, r, sigma0, 'put');
    const optDelta = (callG.delta * callsContracts * 100.0) + (putG.delta * putsContracts * 100.0);
    sharesHeld = targetDelta - optDelta;
  } else if (positionType === 'covered_call') {
    const contracts = Math.max(1.0, quantity / 100.0);
    sharesHeld = contracts * 100.0;
    callsContracts = -contracts;
    callsStrike = Number((S0 * 1.05).toFixed(2));
  } else if (positionType === 'protective_collar') {
    const contracts = Math.max(1.0, quantity / 100.0);
    sharesHeld = contracts * 100.0;
    putsContracts = contracts;
    putsStrike = Number((S0 * 0.95).toFixed(2));
    callsContracts = -contracts;
    callsStrike = Number((S0 * 1.05).toFixed(2));
  } else {
    sharesHeld = Number(quantity);
  }

  const callBase = callsContracts !== 0 ? calcBsGreeks(S0, callsStrike, T, r, sigma0, 'call') : { delta: 0, gamma: 0, vega: 0, vanna: 0, price: 0 };
  const putBase = putsContracts !== 0 ? calcBsGreeks(S0, putsStrike, T, r, sigma0, 'put') : { delta: 0, gamma: 0, vega: 0, vanna: 0, price: 0 };

  const netDelta0 = sharesHeld + (callBase.delta * callsContracts * 100.0) + (putBase.delta * putsContracts * 100.0);
  const netGamma0 = (callBase.gamma * callsContracts * 100.0) + (putBase.gamma * putsContracts * 100.0);
  const netVega0 = (callBase.vega * callsContracts * 100.0) + (putBase.vega * putsContracts * 100.0);
  const netVanna0 = (callBase.vanna * callsContracts * 100.0) + (putBase.vanna * putsContracts * 100.0);

  const deltaS = S0 * (priceShockPct / 100.0);
  const deltaSigma = volShockPct / 100.0;
  const shockedPrice = Number(Math.max(0.01, S0 + deltaS).toFixed(2));
  const shockedIv = Number(Math.max(0.01, sigma0 + deltaSigma).toFixed(4));

  const callShocked = callsContracts !== 0 ? calcBsGreeks(shockedPrice, callsStrike, T, r, shockedIv, 'call') : { delta: 0, gamma: 0, vega: 0, vanna: 0, price: 0 };
  const putShocked = putsContracts !== 0 ? calcBsGreeks(shockedPrice, putsStrike, T, r, shockedIv, 'put') : { delta: 0, gamma: 0, vega: 0, vanna: 0, price: 0 };

  const activeShockedDelta = (callsContracts !== 0 || putsContracts !== 0)
    ? sharesHeld + (callShocked.delta * callsContracts * 100.0) + (putShocked.delta * putsContracts * 100.0)
    : netDelta0 + (netGamma0 * deltaS) + (netVanna0 * deltaSigma);

  const rebalanceShares = -(activeShockedDelta - targetDelta);
  const deltaDrift = activeShockedDelta - targetDelta;
  const isOutsideTolerance = Math.abs(deltaDrift) > toleranceBand;

  let status: 'IN_TOLERANCE' | 'REHEDGE_BUY' | 'REHEDGE_SELL' = 'IN_TOLERANCE';
  let action = 'DELTA NEUTRAL — No re-hedge necessary';
  let urgency: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';

  if (isOutsideTolerance) {
    if (rebalanceShares > 0) {
      status = 'REHEDGE_BUY';
      action = `BUY ${Math.abs(Number(rebalanceShares.toFixed(1)))} shares at $${shockedPrice.toFixed(2)} to restore neutral delta`;
      urgency = Math.abs(deltaDrift) > toleranceBand * 2.5 ? 'HIGH' : 'MODERATE';
    } else {
      status = 'REHEDGE_SELL';
      action = `SELL ${Math.abs(Number(rebalanceShares.toFixed(1)))} shares at $${shockedPrice.toFixed(2)} to restore neutral delta`;
      urgency = Math.abs(deltaDrift) > toleranceBand * 2.5 ? 'HIGH' : 'MODERATE';
    }
  }

  const linearDeltaPnl = netDelta0 * deltaS;
  const gammaConvexityPnl = 0.5 * netGamma0 * (deltaS * deltaS);
  const vegaPnl = netVega0 * (deltaSigma * 100.0);
  const totalTaylorPnl = linearDeltaPnl + gammaConvexityPnl + vegaPnl;

  const gammaRel = Math.abs(netGamma0) * S0 / Math.max(1.0, Math.abs(sharesHeld) + 1.0);
  const gammaScore = Math.min(100.0, Number((gammaRel * 40.0).toFixed(1)));
  const gammaRegime = gammaScore < 20
    ? 'LOW / LINEAR (Minimal curvature)'
    : gammaScore < 50
    ? 'MODERATE / CONVEX (Regular rehedging)'
    : 'HIGH / EXPLOSIVE (Continuous rehedging required)';

  // Sensitivity Curve
  const sensitivityCurve: SensitivityCurvePoint[] = [];
  for (let shock = -20; shock <= 20; shock += 2) {
    const sShocked = Number((S0 * (1.0 + shock / 100.0)).toFixed(2));
    const ds = sShocked - S0;
    const cPt = callsContracts !== 0 ? calcBsGreeks(sShocked, callsStrike, T, r, sigma0, 'call') : { delta: 0, price: 0 };
    const pPt = putsContracts !== 0 ? calcBsGreeks(sShocked, putsStrike, T, r, sigma0, 'put') : { delta: 0, price: 0 };

    const exactDelta = sharesHeld + (cPt.delta * callsContracts * 100.0) + (pPt.delta * putsContracts * 100.0);
    const linPnl = netDelta0 * ds;
    const cvxPnl = linPnl + 0.5 * netGamma0 * (ds * ds);
    const exactPnl = (callsContracts !== 0 || putsContracts !== 0)
      ? (sharesHeld * ds) + ((cPt.price - callBase.price) * callsContracts * 100.0) + ((pPt.price - putBase.price) * putsContracts * 100.0)
      : linPnl;

    sensitivityCurve.push({
      priceShockPct: shock,
      stockPrice: sShocked,
      positionDelta: Number(exactDelta.toFixed(2)),
      rehedgeShares: Number((-(exactDelta - targetDelta)).toFixed(1)),
      linearPnl: Number(linPnl.toFixed(2)),
      convexPnl: Number(cvxPnl.toFixed(2)),
      exactPnl: Number(exactPnl.toFixed(2)),
      convexityGap: Number((exactPnl - linPnl).toFixed(2)),
      isBreached: Math.abs(exactDelta - targetDelta) > toleranceBand
    });
  }

  // Stress Matrix
  const stressMatrix: StressMatrixRow[] = [];
  const pShocks = [-15, -10, -5, -2, 0, 2, 5, 10, 15];
  const volScenarios: Array<{ key: 'crush' | 'base' | 'spike'; label: string; dVol: number }> = [
    { key: 'crush', label: '-25% IV (Vol Crush)', dVol: -0.25 * sigma0 },
    { key: 'base', label: 'Flat IV (Current)', dVol: 0.0 },
    { key: 'spike', label: '+35% IV (Vol Spike)', dVol: 0.35 * sigma0 }
  ];

  for (const pShock of pShocks) {
    const sP = Number((S0 * (1.0 + pShock / 100.0)).toFixed(2));
    const ds = sP - S0;
    const cells = volScenarios.map(vs => {
      const sSigma = Math.max(0.01, sigma0 + vs.dVol);
      const cM = callsContracts !== 0 ? calcBsGreeks(sP, callsStrike, T, r, sSigma, 'call') : { delta: 0, price: 0 };
      const pM = putsContracts !== 0 ? calcBsGreeks(sP, putsStrike, T, r, sSigma, 'put') : { delta: 0, price: 0 };
      const cellDelta = sharesHeld + (cM.delta * callsContracts * 100.0) + (pM.delta * putsContracts * 100.0);
      const cellPnl = (callsContracts !== 0 || putsContracts !== 0)
        ? (sharesHeld * ds) + ((cM.price - callBase.price) * callsContracts * 100.0) + ((pM.price - putBase.price) * putsContracts * 100.0)
        : (netDelta0 * ds) + (0.5 * netGamma0 * ds * ds) + (netVega0 * vs.dVol * 100.0);

      return {
        volScenario: vs.key,
        volLabel: vs.label,
        priceShockPct: pShock,
        shockedPrice: sP,
        delta: Number(cellDelta.toFixed(2)),
        rehedgeShares: Number((-(cellDelta - targetDelta)).toFixed(1)),
        pnl: Number(cellPnl.toFixed(2)),
        breach: Math.abs(cellDelta - targetDelta) > toleranceBand
      };
    });

    stressMatrix.push({
      priceShockPct: pShock,
      shockedPrice: sP,
      cells
    });
  }

  return {
    success: true,
    ticker: params.ticker.toUpperCase(),
    spotPrice: S0,
    positionType,
    quantity,
    sharesHeld: Number(sharesHeld.toFixed(1)),
    targetDelta,
    toleranceBand,
    baseIv: Number(sigma0.toFixed(4)),
    daysToExpiry,
    shocks: {
      priceShockPct,
      volShockPct,
      shockedPrice,
      shockedIv
    },
    baseGreeks: {
      netDelta: Number(netDelta0.toFixed(2)),
      dollarDelta: Number((netDelta0 * S0).toFixed(2)),
      netGamma: Number(netGamma0.toFixed(4)),
      dollarGamma1Pct: Number((0.5 * netGamma0 * (0.01 * S0) * (0.01 * S0)).toFixed(2)),
      netVega: Number(netVega0.toFixed(2)),
      netVanna: Number(netVanna0.toFixed(4))
    },
    shockedGreeks: {
      shockedDelta: Number(activeShockedDelta.toFixed(2)),
      deltaDrift: Number(deltaDrift.toFixed(2)),
      deltaDriftPct: Number((netDelta0 !== 0 ? (deltaDrift / Math.abs(netDelta0)) * 100.0 : 0.0).toFixed(1))
    },
    hedgingRequirement: {
      status,
      action,
      rebalanceShares: Number(rebalanceShares.toFixed(1)),
      rebalanceNotional: Number((Math.abs(rebalanceShares) * shockedPrice).toFixed(2)),
      urgency,
      isOutsideTolerance
    },
    pnlDecomposition: {
      linearDeltaPnl: Number(linearDeltaPnl.toFixed(2)),
      gammaConvexityPnl: Number(gammaConvexityPnl.toFixed(2)),
      vegaPnl: Number(vegaPnl.toFixed(2)),
      totalTaylorPnl: Number(totalTaylorPnl.toFixed(2)),
      convexityAlphaAdvantage: Number((totalTaylorPnl - linearDeltaPnl).toFixed(2))
    },
    gammaRisk: {
      score: gammaScore,
      regime: gammaRegime
    },
    sensitivityCurve,
    stressMatrix,
    timestamp: new Date().toISOString()
  };
}

export async function fetchDeltaGammaSensitivity(params: {
  ticker: string;
  spot: number;
  positionType?: string;
  qty?: number;
  targetDelta?: number;
  priceShock?: number;
  volShock?: number;
  iv?: number;
  dte?: number;
  tolerance?: number;
}): Promise<DeltaGammaSensitivityResult> {
  const query = new URLSearchParams();
  query.append('ticker', params.ticker);
  query.append('spot', String(params.spot));
  if (params.positionType) query.append('positionType', params.positionType);
  if (params.qty !== undefined) query.append('qty', String(params.qty));
  if (params.targetDelta !== undefined) query.append('targetDelta', String(params.targetDelta));
  if (params.priceShock !== undefined) query.append('priceShock', String(params.priceShock));
  if (params.volShock !== undefined) query.append('volShock', String(params.volShock));
  if (params.iv !== undefined) query.append('iv', String(params.iv));
  if (params.dte !== undefined) query.append('dte', String(params.dte));
  if (params.tolerance !== undefined) query.append('tolerance', String(params.tolerance));

  const cacheKey = query.toString();
  const cached = deltaGammaCache.get(cacheKey);
  const now = Date.now();
  if (cached && (now - cached.timestamp) < 15000) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE}/delta-gamma-sensitivity?${cacheKey}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    clearTimeout(timeoutId);

    // If rate limited (HTTP 429), server offline, or returning non-JSON (e.g. HTML <!doctype)
    if (!res.ok || res.status === 429) {
      const fallback = generateClientDeltaGammaSensitivity(params);
      deltaGammaCache.set(cacheKey, { timestamp: now, data: fallback });
      return fallback;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const fallback = generateClientDeltaGammaSensitivity(params);
      deltaGammaCache.set(cacheKey, { timestamp: now, data: fallback });
      return fallback;
    }

    const data: DeltaGammaSensitivityResult = await res.json();
    if (data && data.success) {
      deltaGammaCache.set(cacheKey, { timestamp: now, data });
      return data;
    }

    const fallback = generateClientDeltaGammaSensitivity(params);
    deltaGammaCache.set(cacheKey, { timestamp: now, data: fallback });
    return fallback;
  } catch {
    // Graceful instantaneous mathematical fallback without surfacing fatal error
    const fallback = generateClientDeltaGammaSensitivity(params);
    deltaGammaCache.set(cacheKey, { timestamp: now, data: fallback });
    return fallback;
  }
}



