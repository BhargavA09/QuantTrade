/**
 * Monte Carlo Simulation Utility
 * Optimized for performance using typed arrays if possible
 */

/**
 * Quant Simulation Utility
 * Implements Hedge Fund grade mathematical models for price projection.
 */

import { 
  calculateComprehensiveRisk, 
  calibrateOrnsteinUhlenbeck, 
  RiskMeasures, 
  OrnsteinUhlenbeckParams 
} from './quantBooksEngine';

export interface SimulationResult {
  simulations: number[][]; // Selected sample paths for UI
  forecast: { date: string; price: number }[]; // Mean path
  simBounds: { 
    pUpper: number; 
    pLower: number; 
    min: number; 
    max: number; 
    median: number;
    var95: number; // Value at Risk 95%
    var99: number; // Value at Risk 99%
  }[];
  metrics: {
    kellyCriterion: number;
    sharpeRatio: number;
    hurstExponent: number;
    regime: 'Trending' | 'Mean-Reverting' | 'Random Walk';
    annualizedVol: number;
    cVaR95?: number; // Expected Shortfall (Hull)
    ouParams?: OrnsteinUhlenbeckParams;
    riskMeasures?: RiskMeasures;
  };
}

export const runMonteCarlo = (
  currentPrice: number,
  mu: number, // Daily drift
  sigma: number, // Daily volatility
  numSims: number = 200,
  confInterval: number = 0.8,
  days: number = 30,
  history: number[] = [] // Optional history for Hurst calculation
): SimulationResult & { stressBounds?: any[] } => {
  const simulations: number[][] = [];
  const allPaths: number[][] = [];
  const stressPaths: number[][] = [];
  const sigmas: number[] = new Array(numSims).fill(sigma);
  
  // Drift adjustment for Log-Normal distribution
  const driftPerStep = mu - 0.5 * Math.pow(sigma, 2);

  // Initialize all paths
  for (let s = 0; s < numSims; s++) {
    allPaths[s] = [currentPrice];
    stressPaths[s] = [currentPrice];
  }

  // Efficient one-pass simulation with Antithetic Variates (Mark S. Joshi)
  const halfSims = Math.floor(numSims / 2);

  for (let d = 1; d <= days; d++) {
    for (let s = 0; s < halfSims; s++) {
      const sPair = s + halfSims;

      // Volatility persistence
      const lastVol1 = d === 1 ? sigma : sigmas[s];
      const lastVol2 = d === 1 ? sigma : sigmas[sPair];
      const volShock = (Math.random() - 0.5) * 0.005;

      const currentVol1 = Math.max(0.001, lastVol1 * 0.95 + sigma * 0.05 + volShock);
      const currentVol2 = Math.max(0.001, lastVol2 * 0.95 + sigma * 0.05 + volShock);
      sigmas[s] = currentVol1;
      sigmas[sPair] = currentVol2;

      // Antithetic standard normal shock: Z and -Z
      const z = boxMullerTransform();

      // Path 1 (+z)
      const drift1 = mu - 0.5 * currentVol1 * currentVol1;
      const shock1 = currentVol1 * z;
      const nextPrice1 = allPaths[s][d - 1] * Math.exp(drift1 + shock1);
      allPaths[s].push(nextPrice1);

      // Path 2 Antithetic (-z)
      const drift2 = mu - 0.5 * currentVol2 * currentVol2;
      const shock2 = currentVol2 * (-z);
      const nextPrice2 = allPaths[sPair][d - 1] * Math.exp(drift2 + shock2);
      allPaths[sPair].push(nextPrice2);

      // Stress Scenario: 2x Volatility
      const stressVol1 = currentVol1 * 2.2;
      const stressDrift1 = (mu * 0.4) - 0.5 * stressVol1 * stressVol1 - 0.0002;
      stressPaths[s].push(stressPaths[s][d - 1] * Math.exp(stressDrift1 + stressVol1 * z));

      const stressVol2 = currentVol2 * 2.2;
      const stressDrift2 = (mu * 0.4) - 0.5 * stressVol2 * stressVol2 - 0.0002;
      stressPaths[sPair].push(stressPaths[sPair][d - 1] * Math.exp(stressDrift2 + stressVol2 * (-z)));
    }
  }

  // Select first 5 paths for visualization
  for (let i = 0; i < Math.min(5, numSims); i++) {
    simulations.push(allPaths[i]);
  }

  // Calculate statistics per day
  const forecast: { date: string; price: number }[] = [];
  const simBounds: SimulationResult['simBounds'] = [];
  const stressBounds: any[] = [];
  const today = new Date();

  for (let d = 0; d <= days; d++) {
    const dayPrices = allPaths.map(path => path[d]);
    const stressDayPrices = stressPaths.map(path => path[d]);
    
    dayPrices.sort((a, b) => a - b);
    stressDayPrices.sort((a, b) => a - b);

    const lowerIdx = Math.floor(numSims * (1 - confInterval) / 2);
    const upperIdx = Math.floor(numSims * (1 - (1 - confInterval) / 2));
    const medianIdx = Math.floor(numSims / 2);
    const var95Idx = Math.floor(numSims * 0.05);
    const var99Idx = Math.floor(numSims * 0.01);

    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + d);

    if (d > 0) {
      forecast.push({ 
        date: forecastDate.toISOString().split('T')[0], 
        price: currentPrice * Math.exp(mu * d) 
      });
    }

    simBounds.push({
      pLower: dayPrices[lowerIdx] || dayPrices[0],
      pUpper: dayPrices[upperIdx] || dayPrices[dayPrices.length - 1],
      min: dayPrices[0],
      max: dayPrices[dayPrices.length - 1],
      median: dayPrices[medianIdx],
      var95: currentPrice - (dayPrices[var95Idx] || dayPrices[0]),
      var99: currentPrice - (dayPrices[var99Idx] || dayPrices[0])
    });

    stressBounds.push({
      pLower: stressDayPrices[lowerIdx] || stressDayPrices[0],
      pUpper: stressDayPrices[upperIdx] || stressDayPrices[stressDayPrices.length - 1],
      min: stressDayPrices[0],
      max: stressDayPrices[stressDayPrices.length - 1],
      median: stressDayPrices[medianIdx]
    });
  }

  // Quant Metrics
  const annualizedVol = sigma * Math.sqrt(252);
  const annualizedReturn = mu * 252;
  const riskFreeRate = 0.04;
  const sharpe = (annualizedReturn - riskFreeRate) / (annualizedVol || 0.01);
  const kelly = (annualizedReturn - riskFreeRate) / (Math.pow(annualizedVol, 2) || 0.01);

  let hurst = 0.5;
  let returns: number[] = [];
  if (history.length > 1) {
    for (let i = 1; i < history.length; i++) {
      returns.push((history[i] - history[i - 1]) / history[i - 1]);
    }
  }

  if (history.length > 20) {
    hurst = calculateHurstExponent(history);
  }

  let regime: 'Trending' | 'Mean-Reverting' | 'Random Walk' = 'Random Walk';
  if (hurst > 0.6) regime = 'Trending';
  else if (hurst < 0.4) regime = 'Mean-Reverting';

  // Book-derived algorithms (Hull / O-U / CVaR)
  const riskMeasures = calculateComprehensiveRisk(returns, currentPrice * 100);
  const ouParams = history.length > 5 ? calibrateOrnsteinUhlenbeck(history) : undefined;

  return { 
    simulations, 
    forecast: forecast.slice(1), 
    simBounds,
    stressBounds,
    metrics: {
      kellyCriterion: Math.max(0, Math.min(kelly, 1)),
      sharpeRatio: sharpe,
      hurstExponent: hurst,
      regime,
      annualizedVol,
      cVaR95: riskMeasures.expectedShortfall95,
      ouParams,
      riskMeasures
    }
  };
};


function boxMullerTransform() {
  let u1 = 0, u2 = 0;
  while (u1 === 0) u1 = Math.random();
  while (u2 === 0) u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}

/**
 * Hurst Exponent calculation using Rescaled Range (R/S) analysis
 */
function calculateHurstExponent(prices: number[]) {
  if (prices.length < 20) return 0.5;
  
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(Math.log(prices[i] / prices[i - 1]));
  }

  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  
  const deviations = returns.map(r => r - mean);
  const cumulativeDeviations = [deviations[0]];
  for (let i = 1; i < n; i++) {
    cumulativeDeviations.push(cumulativeDeviations[i - 1] + deviations[i]);
  }

  const range = Math.max(...cumulativeDeviations) - Math.min(...cumulativeDeviations);
  const stdDev = Math.sqrt(returns.map(r => Math.pow(r - mean, 2)).reduce((a, b) => a + b, 0) / n);
  
  const rs = range / (stdDev || 0.001);
  const hurst = Math.log(rs) / Math.log(n);
  
  return Math.max(0, Math.min(1, hurst)); // Bounds safety
}

