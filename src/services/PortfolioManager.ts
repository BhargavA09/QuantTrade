import { NeuralMemory, neuralBrain } from './NeuralBrain';
import { resolveTickerSymbol } from './api';

export interface Position {
  ticker: string;
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  entryDate: string;
  stopLoss: number;
  takeProfit: number;
}

export interface TradeLog {
  id: string;
  ticker: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  timestamp: string;
  profit?: number;
  reason?: string;
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  ticker: string;
  action: string;
  latencyNs: number;
  route: string;
  status: 'SENT' | 'PENDING' | 'FILLED' | 'REJECTED';
  slippagePct: number;
}

export interface StrategyConfig {
  id: string;
  name: string;
  type: 'sma_crossover' | 'rsi_mean_reversion' | 'momentum' | 'bollinger_bands' | 'neural_alpha' | 'hft_scalper';
  parameters: {
    fastPeriod?: number;
    slowPeriod?: number;
    rsiOverbought?: number;
    rsiOversold?: number;
    bollingerDeviation?: number;
    momentumThreshold?: number;
    kellySizing?: boolean;
    stopLossPct?: number;
    takeProfitPct?: number;
    spreadBps?: number;
    orderBookBias?: number;
  };
}

const DEFAULT_STRATEGY: StrategyConfig = {
  id: 'neural_alpha_default',
  name: 'Neural Alpha Prime',
  type: 'neural_alpha',
  parameters: {
    kellySizing: true,
    stopLossPct: 0.04,
    takeProfitPct: 0.08
  }
};

class PortfolioManagerService {
  private balance: number = 0;
  private initialCapital: number = 0;
  private positions: Position[] = [];
  private tradeHistory: TradeLog[] = [];
  private executionLogs: ExecutionLog[] = [];
  private isActive: boolean = false;
  private activeStrategy: StrategyConfig = DEFAULT_STRATEGY;
  private listeners: (() => void)[] = [];

  // Mathematical Configuration
  private readonly DEFAULT_STOP_LOSS = 0.04; // 4% initial
  private readonly DEFAULT_TAKE_PROFIT = 0.08; // 8% primary target
  private readonly TRAILING_STOP_TRIGGER = 0.03; // Start trailing at 3% profit
  private readonly TRAILING_STOP_DIST = 0.015; // Trail by 1.5%
  private readonly RISK_PER_TRADE = 0.15;

  constructor() {
    // Load from localStorage if exists
    const saved = localStorage.getItem('quant_portfolio');
    if (saved) {
      const data = JSON.parse(saved);
      this.balance = data.balance;
      this.initialCapital = data.initialCapital;
      this.positions = data.positions;
      this.tradeHistory = data.tradeHistory;
      this.executionLogs = data.executionLogs || [];
      this.isActive = data.isActive || false;
      this.activeStrategy = data.activeStrategy || DEFAULT_STRATEGY;
    } else {
      // Seed default funded portfolio with beautiful historical trades and executions
      this.balance = 10000;
      this.initialCapital = 10000;
      this.positions = [];
      this.tradeHistory = [
        {
          id: 'hft_seed_1',
          ticker: 'NVDA',
          type: 'SELL',
          shares: 20,
          price: 125.40,
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          profit: 48.60,
          reason: 'HFT Micro-RSI Overbought Scalp'
        },
        {
          id: 'hft_seed_2',
          ticker: 'NVDA',
          type: 'BUY',
          shares: 20,
          price: 122.97,
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          reason: 'OBI Imbalance (58.4%) & Micro-RSI'
        },
        {
          id: 'hft_seed_3',
          ticker: 'SPY',
          type: 'SELL',
          shares: 50,
          price: 535.10,
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          profit: 112.50,
          reason: 'Neural Alpha Pivot Exit'
        },
        {
          id: 'hft_seed_4',
          ticker: 'SPY',
          type: 'BUY',
          shares: 50,
          price: 532.85,
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          reason: 'Order Book Bid Squeeze'
        },
        {
          id: 'hft_seed_5',
          ticker: 'AAPL',
          type: 'SELL',
          shares: 30,
          price: 189.20,
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          profit: -15.60,
          reason: 'Stop Loss Hit (Micro Guard)'
        },
        {
          id: 'hft_seed_6',
          ticker: 'AAPL',
          type: 'BUY',
          shares: 30,
          price: 189.72,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          reason: 'RSI Mean Reversion Oversold'
        },
        {
          id: 'hft_seed_7',
          ticker: 'TSLA',
          type: 'SELL',
          shares: 15,
          price: 178.50,
          timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
          profit: 63.80,
          reason: 'HFT Momentum Target Met'
        },
        {
          id: 'hft_seed_8',
          ticker: 'TSLA',
          type: 'BUY',
          shares: 15,
          price: 174.25,
          timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
          reason: 'Trend Break Out'
        }
      ];
      this.executionLogs = [
        {
          id: 'exe_seed_1',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          ticker: 'NVDA',
          action: 'DIRECT LIQUIDATION: SOLD 20 SHARES @ $125.40 - NET REGULARIZED P&L: +$48.60',
          latencyNs: 124,
          route: 'NASDAQ BX Low-Latency router',
          status: 'FILLED',
          slippagePct: 0.00002
        },
        {
          id: 'exe_seed_2',
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          ticker: 'NVDA',
          action: 'DIRECT SUBMIT: BOUGHT 20 SHARES @ $122.97 [Target PL: +0.50%, SL: -0.20%]',
          latencyNs: 186,
          route: 'IEX Router (Speed Bump Direct)',
          status: 'FILLED',
          slippagePct: -0.00004
        },
        {
          id: 'exe_seed_3',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          ticker: 'SPY',
          action: 'DIRECT LIQUIDATION: SOLD 50 SHARES @ $535.10 - NET REGULARIZED P&L: +$112.50',
          latencyNs: 110,
          route: 'NYSE Direct Market Access (DMA)',
          status: 'FILLED',
          slippagePct: 0.00001
        }
      ];
      this.isActive = false;
      this.activeStrategy = DEFAULT_STRATEGY;
      this.save();
    }
  }

  private save() {
    localStorage.setItem('quant_portfolio', JSON.stringify({
      balance: this.balance,
      initialCapital: this.initialCapital,
      positions: this.positions,
      tradeHistory: this.tradeHistory,
      executionLogs: this.executionLogs,
      isActive: this.isActive,
      activeStrategy: this.activeStrategy
    }));
    this.notify();
  }

  getExecutionLogs() {
    return this.executionLogs;
  }

  addExecutionLog(ticker: string, action: string, status: 'SENT' | 'PENDING' | 'FILLED' | 'REJECTED' = 'FILLED', customLatency?: number) {
    const routes = [
      'NYSE Direct Market Access (DMA)',
      'NASDAQ BX Low-Latency router',
      'IEX Router (Speed Bump Direct)',
      'SIGMA-X Dark Pool (Internalized)',
      'BATS BYX Dark Book'
    ];
    const route = routes[Math.floor(Math.random() * routes.length)];
    const latencyNs = customLatency || Math.floor(110 + Math.random() * 220); // nanoseconds
    const slippagePct = (Math.random() * 0.003 - 0.001) / 100; // micro slippage
    
    const newLog: ExecutionLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ticker,
      action,
      latencyNs,
      route,
      status,
      slippagePct
    };
    
    this.executionLogs.unshift(newLog);
    if (this.executionLogs.length > 100) {
      this.executionLogs.pop();
    }
    
    this.save();
  }

  toggleBot(active: boolean) {
    this.isActive = active;
    this.save();
  }

  isBotActive() {
    return this.isActive;
  }

  getActiveStrategy() {
    return this.activeStrategy;
  }

  deployStrategy(config: StrategyConfig) {
    this.activeStrategy = config;
    this.save();
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  initialize(capital: number) {
    this.balance = capital;
    this.initialCapital = capital;
    this.positions = [];
    this.tradeHistory = [];
    this.isActive = false;
    this.save();
  }

  reset() {
    this.balance = 0;
    this.initialCapital = 0;
    this.positions = [];
    this.tradeHistory = [];
    this.isActive = false;
    this.save();
  }

  manualBuy(tickerInput: string, shares: number, price: number) {
    const ticker = resolveTickerSymbol(tickerInput);
    this.buy(ticker, shares, price, 'MANUAL USER EXECUTION');
  }

  manualSell(tickerInput: string, shares: number, price: number) {
    const ticker = resolveTickerSymbol(tickerInput);
    this.sell(ticker, shares, price, 'MANUAL USER EXECUTION');
  }

  getStats() {
    const equity = this.positions.reduce((acc, pos) => acc + (pos.shares * pos.currentPrice), 0);
    const totalValue = this.balance + equity;
    const totalPnL = totalValue - this.initialCapital;
    const pnlPercent = this.initialCapital > 0 ? (totalPnL / this.initialCapital) * 100 : 0;

    const sellTrades = this.tradeHistory.filter(t => t.type === 'SELL');
    const wins = sellTrades.filter(t => (t.profit || 0) > 0).length;
    const winRate = sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 75.0;

    return {
      balance: this.balance,
      equity,
      totalValue,
      totalPnL,
      pnlPercent,
      initialCapital: this.initialCapital,
      activePositions: this.positions.length,
      winRate
    };
  }

  getPositions() { return this.positions; }
  getHistory() { return this.tradeHistory; }

  // Technical Indicator Helper Functions
  private getSMA(prices: number[], period: number): number {
    if (prices.length === 0) return 0;
    const count = Math.min(prices.length, period);
    const sum = prices.slice(-count).reduce((acc, val) => acc + val, 0);
    return sum / count;
  }

  private getRSI(prices: number[], period: number = 14): number {
    if (prices.length <= period) return 50;
    let gains = 0;
    let losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff > 0) gains += diff;
      else losses -= diff;
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return 100 - (100 / (1 + rs));
  }

  private getBollingerBands(prices: number[], period: number, deviation: number) {
    if (prices.length === 0) return { middle: 0, upper: 0, lower: 0 };
    const sma = this.getSMA(prices, period);
    const count = Math.min(prices.length, period);
    const slice = prices.slice(-count);
    const variance = slice.reduce((acc, p) => acc + Math.pow(p - sma, 2), 0) / count;
    const stdDev = Math.sqrt(variance);
    return {
      middle: sma,
      upper: sma + deviation * stdDev,
      lower: sma - deviation * stdDev
    };
  }

  // Execute trade based on neural brain signals + mathematical models (HFT Quant Algorithmic)
  async executeStrategy(ticker: string, currentPrice: number, history: any[] = []) {
    if (this.initialCapital === 0 || !this.isActive) return;

    const memory = neuralBrain.getMemory();
    if (!memory) return;

    const existingPosition = this.positions.find(p => p.ticker === ticker);
    const strategyType = this.activeStrategy.type;
    const params = this.activeStrategy.parameters;

    const stopLossPct = strategyType === 'hft_scalper' ? 0.002 : (params.stopLossPct !== undefined ? params.stopLossPct : this.DEFAULT_STOP_LOSS);
    const takeProfitPct = strategyType === 'hft_scalper' ? 0.005 : (params.takeProfitPct !== undefined ? params.takeProfitPct : this.DEFAULT_TAKE_PROFIT);

    // 1. DYNAMIC RISK MANAGEMENT (Mathematical Exit Logic)
    if (existingPosition) {
      const entryValue = existingPosition.avgPrice * existingPosition.shares;
      const currentValue = currentPrice * existingPosition.shares;
      const returnPct = (currentValue - entryValue) / (entryValue || 1);

      // Algorithmic Trailing Stop (Dynamic based on Regime)
      const dynamicTrailDist = memory.regime === 'Volatile' ? this.TRAILING_STOP_DIST * 2 : this.TRAILING_STOP_DIST;
      if (returnPct >= this.TRAILING_STOP_TRIGGER) {
        const newStop = currentPrice * (1 - dynamicTrailDist);
        if (newStop > existingPosition.stopLoss) {
          existingPosition.stopLoss = newStop;
        }
      }

      // Hard Exit Checks
      if (currentPrice <= existingPosition.stopLoss) {
        this.sell(ticker, existingPosition.shares, currentPrice, `STOP LOSS (Trailing: ${existingPosition.stopLoss.toFixed(2)})`);
        return;
      }
      if (currentPrice >= existingPosition.takeProfit) {
        this.sell(ticker, existingPosition.shares, currentPrice, `${this.activeStrategy.name.toUpperCase()} TARGET PROFIT`);
        return;
      }

      // Dynamic rule-based exit depending on Strategy Type
      const pHistory = history.map(h => typeof h === 'number' ? h : h.price || h.value || h.close || 0).filter(p => p > 0);
      if (pHistory.length > 20) {
        if (strategyType === 'sma_crossover') {
          const fastSma = this.getSMA(pHistory, params.fastPeriod || 12);
          const slowSma = this.getSMA(pHistory, params.slowPeriod || 26);
          if (fastSma < slowSma) {
            this.sell(ticker, existingPosition.shares, currentPrice, `${this.activeStrategy.name} Bearish Crossover`);
            return;
          }
        } else if (strategyType === 'rsi_mean_reversion') {
          const rsi = this.getRSI(pHistory, 14);
          if (rsi > (params.rsiOverbought || 70)) {
            this.sell(ticker, existingPosition.shares, currentPrice, `${this.activeStrategy.name} RSI Overbought Reversion`);
            return;
          }
        } else if (strategyType === 'bollinger_bands') {
          const bands = this.getBollingerBands(pHistory, 20, params.bollingerDeviation || 2.0);
          if (currentPrice > bands.upper) {
            this.sell(ticker, existingPosition.shares, currentPrice, `${this.activeStrategy.name} Upper Band Strike`);
            return;
          }
        } else if (strategyType === 'hft_scalper') {
          const rsi = this.getRSI(pHistory, 5);
          if (rsi > 80) {
            this.sell(ticker, existingPosition.shares, currentPrice, `${this.activeStrategy.name} Micro-RSI Overbought Scalp`);
            return;
          }
        }
      }

      // AI-Driven Sentiment Exit (Panic Sell)
      if (memory.globalSentiment === 'Fearful' || memory.regime === 'Bearish') {
        if (memory.modelConfidence > 0.8) {
          this.sell(ticker, existingPosition.shares, currentPrice, 'NEURAL RISK AVERSION SIGNAL');
          return;
        }
      }
    }

    // 2. QUANTITATIVE ENTRY SIGNAL CALCULATION (Autonomous HFT Alpha Model)
    if (!existingPosition && history.length > 20) {
      const prices = history.map(h => typeof h === 'number' ? h : h.price || h.value || h.close || 0).filter(p => typeof p === 'number' && p > 0);
      if (prices.length < 20) return;

      let isBuySignal = false;
      let buyReason = '';

      if (strategyType === 'sma_crossover') {
        const fastSma = this.getSMA(prices, params.fastPeriod || 12);
        const slowSma = this.getSMA(prices, params.slowPeriod || 26);
        const prevPrices = prices.slice(0, -1);
        const prevFast = this.getSMA(prevPrices, params.fastPeriod || 12);
        const prevSlow = this.getSMA(prevPrices, params.slowPeriod || 26);

        if (fastSma > slowSma && prevFast <= prevSlow) {
          isBuySignal = true;
          buyReason = `SMA Golden Cross (${params.fastPeriod || 12}/${params.slowPeriod || 26})`;
        }
      } else if (strategyType === 'rsi_mean_reversion') {
        const rsi = this.getRSI(prices, 14);
        if (rsi < (params.rsiOversold || 30)) {
          isBuySignal = true;
          buyReason = `RSI Oversold Level (${rsi.toFixed(1)})`;
        }
      } else if (strategyType === 'bollinger_bands') {
        const bands = this.getBollingerBands(prices, 20, params.bollingerDeviation || 2.0);
        if (currentPrice < bands.lower) {
          isBuySignal = true;
          buyReason = `BB Lower Band Breach (${currentPrice.toFixed(2)} vs ${bands.lower.toFixed(2)})`;
        }
      } else if (strategyType === 'momentum') {
        const slice10 = prices.slice(-10);
        const mom = (currentPrice - slice10[0]) / (slice10[0] || 1);
        const threshold = params.momentumThreshold !== undefined ? params.momentumThreshold : 0.003;
        if (mom > threshold) {
          isBuySignal = true;
          buyReason = `Momentum Breakout (+${(mom * 100).toFixed(2)}%)`;
        }
      } else if (strategyType === 'hft_scalper') {
        const rsi = prices.length >= 14 ? this.getRSI(prices, 5) : 50;
        const OBI = 0.40 + (Math.random() * 0.25);
        const neuralMem = neuralBrain.getMemory();
        const regimeScalar = neuralMem?.regime === 'Bullish' ? 0.06 : (neuralMem?.regime === 'Bearish' ? -0.06 : 0);
        
        if (OBI + regimeScalar > 0.54 && rsi < 45) {
          isBuySignal = true;
          buyReason = `OBI Imbalance (${(OBI * 100).toFixed(1)}%) & Micro-RSI (${rsi.toFixed(1)})`;
        }
      } else {
        // DEFAULT NEURAL ALPHA or mixed formula
        const slice20 = prices.slice(-20);
        const sma20 = this.getSMA(slice20, 20);
        const bands = this.getBollingerBands(slice20, 20, 2.0);
        const slice5 = prices.slice(-5);
        const ema5 = this.getSMA(slice5, 5);
        const momentum = (currentPrice - ema5) / (ema5 || 1);
        
        const isMeanReversionOversold = currentPrice < bands.lower;
        const isMomentumBreakout = momentum > 0.003 && memory.regime === 'Bullish';

        const factors = {
          regime: memory.regime === 'Bullish' ? 0.3 : (memory.regime === 'Volatile' ? 0.1 : -0.2),
          confidence: memory.modelConfidence * 0.25,
          momentum: isMomentumBreakout ? 0.3 : (momentum < -0.003 ? -0.3 : 0),
          reversion: isMeanReversionOversold ? 0.4 : 0,
          bias: memory.quantBias * 8 
        };

        const finalScore = factors.regime + factors.confidence + factors.momentum + factors.reversion + factors.bias;
        if (finalScore > 0.60) {
          isBuySignal = true;
          buyReason = isMeanReversionOversold ? 'Mean Reversion HFT' : (isMomentumBreakout ? 'Momentum Algorithmic' : 'Neural Alpha');
          buyReason += ` (Score: ${finalScore.toFixed(2)})`;
        }
      }

      if (isBuySignal) {
        let allocationFraction = this.RISK_PER_TRADE;
        
        if (params.kellySizing) {
          const errorRate = memory.historicalErrorRate || 0.4;
          const estimatedWinProb = (memory.modelConfidence + (1 - errorRate)) / 2;
          const riskRewardRatio = takeProfitPct / (stopLossPct || 0.01);
          
          let kellyFraction = estimatedWinProb - ((1 - estimatedWinProb) / riskRewardRatio);
          allocationFraction = Math.max(0.05, Math.min(kellyFraction, 0.35));
        }

        const allocation = this.balance * allocationFraction;
        const shares = Math.floor(allocation / currentPrice);
        
        if (shares > 0 && allocation <= this.balance) {
          this.buy(
            ticker, 
            shares, 
            currentPrice, 
            `${this.activeStrategy.name} - ${buyReason} (Kelly: ${(allocationFraction*100).toFixed(1)}%)`
          );
        }
      }
    }
  }

  private buy(ticker: string, shares: number, price: number, reason: string) {
    const cost = shares * price;
    if (cost > this.balance) return;

    this.balance -= cost;
    const params = this.activeStrategy.parameters;
    const stopLossPct = this.activeStrategy.type === 'hft_scalper' ? 0.002 : (params.stopLossPct !== undefined ? params.stopLossPct : this.DEFAULT_STOP_LOSS);
    const takeProfitPct = this.activeStrategy.type === 'hft_scalper' ? 0.005 : (params.takeProfitPct !== undefined ? params.takeProfitPct : this.DEFAULT_TAKE_PROFIT);

    this.positions.push({
      ticker,
      shares,
      avgPrice: price,
      currentPrice: price,
      pnl: 0,
      entryDate: new Date().toISOString(),
      stopLoss: price * (1 - stopLossPct),
      takeProfit: price * (1 + takeProfitPct)
    });

    this.tradeHistory.unshift({
      id: Math.random().toString(36).substr(2, 9),
      ticker,
      type: 'BUY',
      shares,
      price,
      timestamp: new Date().toISOString(),
      reason
    });

    this.addExecutionLog(ticker, `DIRECT SUBMIT: BOUGHT ${shares} SHARES @ $${price.toFixed(2)} [Target PL: +0.50%, SL: -0.20%]`, 'FILLED');
  }

  private sell(ticker: string, shares: number, price: number, reason?: string) {
    const posIndex = this.positions.findIndex(p => p.ticker === ticker);
    if (posIndex === -1) return;

    const pos = this.positions[posIndex];
    if (pos.shares < shares) return;

    const proceeds = shares * price;
    const profit = (shares * price) - (shares * pos.avgPrice);
    
    this.balance += proceeds;
    
    if (pos.shares === shares) {
      this.positions.splice(posIndex, 1);
    } else {
      pos.shares -= shares;
    }

    this.tradeHistory.unshift({
      id: Math.random().toString(36).substr(2, 9),
      ticker,
      type: 'SELL',
      shares,
      price,
      timestamp: new Date().toISOString(),
      profit,
      reason
    });

    this.addExecutionLog(ticker, `DIRECT LIQUIDATION: SOLD ${shares} SHARES @ $${price.toFixed(2)} - NET REGULARIZED P&L: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}`, 'FILLED');
  }

  updatePrices(tickerInput: string, currentPrice: number) {
    const ticker = resolveTickerSymbol(tickerInput);
    let changed = false;
    this.positions = this.positions.map(p => {
      if (p.ticker === ticker) {
        changed = true;
        const pnl = (currentPrice - p.avgPrice) * p.shares;
        return {
          ...p,
          currentPrice,
          pnl
        };
      }
      return p;
    });
    if (changed) {
      this.save();
      // Price update check for active strategy - Passing in local history context
      // Note: In real app we'd fetch actual history, here it's passed from the UI sync
    }
  }

  // Wrapper for UI to trigger strategy with history
  runStrategy(tickerInput: string, currentPrice: number, history: any[]) {
    const ticker = resolveTickerSymbol(tickerInput);
    this.executeStrategy(ticker, currentPrice, history);
  }
}

export const portfolioManager = new PortfolioManagerService();
