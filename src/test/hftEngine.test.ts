import { describe, it, expect } from 'vitest';
import { 
  executeHFTBacktestSimulation, 
  generateSynthesizedCandles,
  runAutomatedWalkForwardTest,
  runAutomatedMonteCarloTest,
  runAutomatedStressShockTest,
  runAutomatedMultiAssetBatchTest,
  runFullHFTAutomatedTestSuite,
  HFT_STRATEGIES,
  HFTParameters
} from '../utils/hftEngine';

describe('HFT Quantitative Backtesting Engine - Automation Tests', () => {

  const defaultParams: HFTParameters = {
    fastPeriod: 5,
    slowPeriod: 14,
    stopLossPct: 0.01, // 1%
    takeProfitPct: 0.02, // 2%
    trailingStopEnabled: true,
    trailingStopDistPct: 0.006,
    kellySizing: true,
    latencyUs: 250,
    slippageBps: 1.5,
    feeBps: 1.0,
    initialCapital: 100000,
    leverage: 1.0,
    thresholdAggressiveness: 3
  };

  const sampleCandles = generateSynthesizedCandles('SPY', 500, 252);

  describe('Core Simulation Engine', () => {
    it('executes simulation and produces valid equity curves and summary statistics', () => {
      const result = executeHFTBacktestSimulation(sampleCandles, 'hft_obi_scalper', defaultParams);

      expect(result.equityCurve.length).toBeGreaterThan(0);
      expect(result.summary.initialCapital).toBe(100000);
      expect(result.summary.finalEquity).toBeGreaterThan(0);
      expect(typeof result.summary.totalReturnPct).toBe('number');
      expect(typeof result.summary.winRate).toBe('number');
      expect(typeof result.summary.profitFactor).toBe('number');
      expect(typeof result.summary.sharpeRatio).toBe('number');
      expect(typeof result.summary.maxDrawdownPct).toBe('number');
      expect(result.summary.maxDrawdownPct).toBeGreaterThanOrEqual(0);
    });

    it('accurately accounts for slippage and fee friction costs in trade logs', () => {
      const result = executeHFTBacktestSimulation(sampleCandles, 'hft_obi_scalper', defaultParams);

      if (result.trades.length > 0) {
        const firstTrade = result.trades[0];
        expect(firstTrade.slippageCost).toBeGreaterThanOrEqual(0);
        expect(firstTrade.feeCost).toBeGreaterThan(0);
        expect(firstTrade.netPnl).toBeLessThanOrEqual(firstTrade.grossPnl);
        expect(firstTrade.exitReason).toBeDefined();
        expect(firstTrade.shares).toBeGreaterThan(0);
      }
    });

    it('safely handles edge cases like empty candle arrays or zero capital without crashing', () => {
      const emptyResult = executeHFTBacktestSimulation([], 'hft_obi_scalper', defaultParams);
      expect(emptyResult.equityCurve.length).toBe(0);
      expect(emptyResult.trades.length).toBe(0);
      expect(emptyResult.summary.totalTrades).toBe(0);

      const tinyCandles = [{ date: '2026-01-01', price: 100 }];
      const tinyResult = executeHFTBacktestSimulation(tinyCandles, 'hft_obi_scalper', defaultParams);
      expect(tinyResult.trades.length).toBe(0);
    });

    it('executes all 6 HFT strategy algorithms without error', () => {
      for (const strat of HFT_STRATEGIES) {
        const stratParams: HFTParameters = {
          ...defaultParams,
          ...(strat.defaultParams as any)
        };
        const res = executeHFTBacktestSimulation(sampleCandles, strat.id, stratParams);
        expect(res.summary).toBeDefined();
        expect(res.equityCurve.length).toBe(sampleCandles.length);
      }
    });
  });

  describe('Automated Walk-Forward Overfitting Validator', () => {
    it('divides historical candles into In-Sample and Out-of-Sample splits and measures WFE', () => {
      const wfResult = runAutomatedWalkForwardTest(sampleCandles, 'hft_obi_scalper', defaultParams);

      expect(wfResult.inSampleBars).toBeGreaterThan(0);
      expect(wfResult.outOfSampleBars).toBeGreaterThan(0);
      expect(wfResult.inSampleBars + wfResult.outOfSampleBars).toBe(sampleCandles.length);
      expect(typeof wfResult.walkForwardEfficiencyPct).toBe('number');
      expect(['PASSED', 'WARNING', 'FAILED']).toContain(wfResult.status);
      expect(wfResult.diagnostic.length).toBeGreaterThan(10);
    });
  });

  describe('Automated Monte Carlo Permutation Engine', () => {
    it('runs randomized trade sequence reshuffling and computes ruin probability', () => {
      const baseline = executeHFTBacktestSimulation(sampleCandles, 'hft_obi_scalper', defaultParams);
      const mcResult = runAutomatedMonteCarloTest(baseline.trades, 100000, 50);

      expect(mcResult.permutations).toBe(50);
      expect(mcResult.medianFinalEquity).toBeGreaterThan(0);
      expect(mcResult.worstCaseDrawdownPct).toBeGreaterThanOrEqual(0);
      expect(mcResult.confidenceInterval95ReturnPct[0]).toBeLessThanOrEqual(mcResult.confidenceInterval95ReturnPct[1]);
      expect(mcResult.probabilityOfRuinPct).toBeGreaterThanOrEqual(0);
      expect(mcResult.probabilityOfRuinPct).toBeLessThanOrEqual(100);
      expect(['PASSED', 'WARNING', 'FAILED']).toContain(mcResult.status);
    });
  });

  describe('Automated Extreme Stress Shock Testing', () => {
    it('submits strategy to 4 extreme shocks and returns survival diagnostics', () => {
      const stressResult = runAutomatedStressShockTest(sampleCandles, 'hft_obi_scalper', defaultParams);

      expect(stressResult.scenarios.length).toBe(4);
      expect(stressResult.scenarios[0].scenarioName).toContain('Flash Crash');
      expect(stressResult.scenarios[1].scenarioName).toContain('Surge');
      expect(stressResult.scenarios[2].scenarioName).toContain('Liquidity');
      expect(stressResult.scenarios[3].scenarioName).toContain('Latency');
      expect(typeof stressResult.overallSurvives).toBe('boolean');
      expect(['PASSED', 'WARNING', 'FAILED']).toContain(stressResult.status);
    });
  });

  describe('Automated Multi-Asset Cross-Validation', () => {
    it('evaluates strategy consistently across an asset basket', () => {
      const basket = {
        'SPY': generateSynthesizedCandles('SPY', 500, 100),
        'NVDA': generateSynthesizedCandles('NVDA', 130, 100),
        'QQQ': generateSynthesizedCandles('QQQ', 450, 100)
      };

      const multiAssetResult = runAutomatedMultiAssetBatchTest(basket, 'hft_obi_scalper', defaultParams);

      expect(multiAssetResult.testedAssets.length).toBe(3);
      expect(multiAssetResult.consistencyScorePct).toBeGreaterThanOrEqual(0);
      expect(multiAssetResult.consistencyScorePct).toBeLessThanOrEqual(100);
      expect(['PASSED', 'WARNING', 'FAILED']).toContain(multiAssetResult.status);
    });
  });

  describe('Master Automated Quality Report', () => {
    it('compiles full automated report with composite score, status, and recommendations', () => {
      const report = runFullHFTAutomatedTestSuite(sampleCandles, 'hft_obi_scalper', defaultParams);

      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
      expect(report.overallVerdict).toBeDefined();
      expect(report.walkForward).toBeDefined();
      expect(report.monteCarlo).toBeDefined();
      expect(report.stressTest).toBeDefined();
      expect(report.multiAsset).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });
  });
});
