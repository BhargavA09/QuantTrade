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

  const res = await fetch(`${API_BASE}/delta-gamma-sensitivity?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching delta-gamma sensitivity`);
  return res.json();
}


