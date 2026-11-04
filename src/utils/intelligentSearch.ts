/**
 * Intelligent Fuzzy & Nearest Token Search Engine
 * Powered by London Strategic Edge (londonstrategicedge.com) Open Instrument Master.
 */

export interface IntelligentSearchItem {
  ticker: string;
  name: string;
  category: string;
  exchange: string;
  price?: number;
  currency: string;
  aliases?: string[];
}

export interface NearestMatchResult {
  item: IntelligentSearchItem;
  similarityScore: number;
  matchType: 'EXACT' | 'PREFIX' | 'TYPO_CORRECTION' | 'KEYWORD_ALIAS' | 'SUBSTRING';
  matchReason: string;
}

export interface IntelligentSearchResponse {
  query: string;
  resolvedTicker: string;
  exactMatch: IntelligentSearchItem | null;
  didYouMean: IntelligentSearchItem | null;
  nearestMatches: NearestMatchResult[];
  source: string;
}

export const LSE_OPEN_INSTRUMENTS: IntelligentSearchItem[] = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', category: 'US Tech', exchange: 'NASDAQ', price: 204.64, currency: 'USD', aliases: ['NVIDIA', 'NVDIA', 'CHIPS'] },
  { ticker: 'AAPL', name: 'Apple Inc.', category: 'US Tech', exchange: 'NASDAQ', price: 234.80, currency: 'USD', aliases: ['APPLE', 'APPL', 'IPHONE'] },
  { ticker: 'MSFT', name: 'Microsoft Corporation', category: 'US Tech', exchange: 'NASDAQ', price: 428.20, currency: 'USD', aliases: ['MICROSOFT', 'AZURE'] },
  { ticker: 'TSLA', name: 'Tesla, Inc.', category: 'US Tech', exchange: 'NASDAQ', price: 248.50, currency: 'USD', aliases: ['TESLA', 'TSAL', 'EV'] },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', category: 'US Tech', exchange: 'NASDAQ', price: 196.25, currency: 'USD', aliases: ['AMAZON', 'AMAZN', 'AWS'] },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', category: 'US Tech', exchange: 'NASDAQ', price: 178.40, currency: 'USD', aliases: ['GOOGLE', 'ALPHABET', 'GOOG'] },
  { ticker: 'META', name: 'Meta Platforms Inc.', category: 'US Tech', exchange: 'NASDAQ', price: 585.20, currency: 'USD', aliases: ['META', 'FACEBOOK', 'FB'] },
  { ticker: 'PLTR', name: 'Palantir Technologies', category: 'AI & Defense', exchange: 'NYSE', price: 44.60, currency: 'USD', aliases: ['PALANTIR', 'AI'] },
  { ticker: 'AMD', name: 'Advanced Micro Devices', category: 'Semiconductors', exchange: 'NASDAQ', price: 156.40, currency: 'USD', aliases: ['AMD', 'RYZEN'] },
  { ticker: 'COIN', name: 'Coinbase Global Inc.', category: 'Crypto Platform', exchange: 'NASDAQ', price: 214.80, currency: 'USD', aliases: ['COINBASE', 'COIN'] },
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', category: 'Index ETF', exchange: 'NYSE Arca', price: 586.46, currency: 'USD', aliases: ['S&P 500', 'SP500', 'SPY'] },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', category: 'Index ETF', exchange: 'NASDAQ', price: 494.50, currency: 'USD', aliases: ['NASDAQ 100', 'QQQ'] },
  { ticker: 'SHEL.L', name: 'Shell plc', category: 'Energy', exchange: 'LSE (UK)', price: 39.27, currency: 'GBP', aliases: ['SHELL', 'SHEL', 'OIL UK'] },
  { ticker: 'AZN.L', name: 'AstraZeneca PLC', category: 'Healthcare', exchange: 'LSE (UK)', price: 124.50, currency: 'GBP', aliases: ['ASTRAZENECA', 'AZN'] },
  { ticker: 'HSBA.L', name: 'HSBC Holdings plc', category: 'Financials', exchange: 'LSE (UK)', price: 6.80, currency: 'GBP', aliases: ['HSBC', 'HSBA'] },
  { ticker: 'BP.L', name: 'BP p.l.c.', category: 'Energy', exchange: 'LSE (UK)', price: 4.10, currency: 'GBP', aliases: ['BP', 'BRITISH PETROLEUM'] },
  { ticker: 'SHOP.TO', name: 'Shopify Inc.', category: 'E-Commerce', exchange: 'TSX (Canada)', price: 112.40, currency: 'CAD', aliases: ['SHOPIFY', 'SHOP', 'TSX:SHOP'] },
  { ticker: 'RY.TO', name: 'Royal Bank of Canada', category: 'Financials', exchange: 'TSX (Canada)', price: 168.20, currency: 'CAD', aliases: ['ROYAL BANK', 'RBC', 'RY'] },
  { ticker: 'TD.TO', name: 'Toronto-Dominion Bank', category: 'Financials', exchange: 'TSX (Canada)', price: 86.50, currency: 'CAD', aliases: ['TD', 'TD BANK', 'TORONTO DOMINION'] },
  { ticker: 'ENB.TO', name: 'Enbridge Inc.', category: 'Energy', exchange: 'TSX (Canada)', price: 54.15, currency: 'CAD', aliases: ['ENBRIDGE', 'ENB'] },
  { ticker: 'ASML.AS', name: 'ASML Holding NV', category: 'Semiconductors', exchange: 'Euronext AMS', price: 685.20, currency: 'EUR', aliases: ['ASML', 'LITHOGRAPHY'] },
  { ticker: 'GC=F', name: 'Gold Futures (COMEX)', category: 'Precious Metals', exchange: 'COMEX', price: 2685.40, currency: 'USD', aliases: ['GOLD', 'XAU', 'GOLD FUTURES'] },
  { ticker: 'SI=F', name: 'Silver Futures', category: 'Precious Metals', exchange: 'COMEX', price: 32.40, currency: 'USD', aliases: ['SILVER', 'XAG'] },
  { ticker: 'CL=F', name: 'Crude Oil WTI', category: 'Energy Futures', exchange: 'NYMEX', price: 71.20, currency: 'USD', aliases: ['OIL', 'CRUDE', 'WTI'] },
  { ticker: 'BTC-USD', name: 'Bitcoin USD', category: 'Digital Asset', exchange: 'Crypto', price: 68450.00, currency: 'USD', aliases: ['BITCOIN', 'BTC', 'CRYPTO'] },
  { ticker: 'ETH-USD', name: 'Ethereum USD', category: 'Digital Asset', exchange: 'Crypto', price: 2640.00, currency: 'USD', aliases: ['ETHEREUM', 'ETH'] },
  { ticker: 'SOL-USD', name: 'Solana USD', category: 'Digital Asset', exchange: 'Crypto', price: 168.50, currency: 'USD', aliases: ['SOLANA', 'SOL'] },
  { ticker: 'PSEC', name: 'Prospect Capital Corp', category: 'Financials', exchange: 'NASDAQ', price: 1.62, currency: 'USD', aliases: ['PSEC', 'PROSPECT'] },
  { ticker: 'PLUG', name: 'Plug Power Inc.', category: 'Clean Energy', exchange: 'NASDAQ', price: 1.40, currency: 'USD', aliases: ['PLUG POWER', 'PLUG', 'HYDROGEN'] },
  { ticker: 'SNDL', name: 'SNDL Inc.', category: 'Penny Stocks', exchange: 'NASDAQ', price: 1.30, currency: 'USD', aliases: ['SUNDIAL', 'SNDL'] },
  { ticker: 'US.core_inflation_rate', name: 'US Core CPI Inflation (YoY %)', category: 'Macro Series', exchange: 'LSE Macro', price: 2.8, currency: '%', aliases: ['CPI', 'INFLATION', 'CORE CPI'] },
  { ticker: 'US.yield_curve_10y_2y', name: 'US 10Y - 2Y Yield Spread (bps)', category: 'Macro Series', exchange: 'LSE Macro', price: 18.5, currency: 'bps', aliases: ['YIELD CURVE', 'SPREAD', '10Y 2Y'] }
];

export function damerauLevenshteinDistance(source: string, target: string): number {
  const s = source.toUpperCase();
  const t = target.toUpperCase();
  const n = s.length;
  const m = t.length;
  if (n === 0) return m;
  if (m === 0) return n;

  const d: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && s[i - 1] === t[j - 2] && s[i - 2] === t[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[n][m];
}

export function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.trim().toUpperCase();
  const s2 = str2.trim().toUpperCase();
  if (s1 === s2) return 100;
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 100;

  if (s2.startsWith(s1) || s1.startsWith(s2)) {
    const ratio = Math.min(s1.length, s2.length) / maxLen;
    return Math.round(75 + ratio * 24);
  }
  if (s2.includes(s1) || s1.includes(s2)) {
    const ratio = Math.min(s1.length, s2.length) / maxLen;
    return Math.round(65 + ratio * 30);
  }

  const dist = damerauLevenshteinDistance(s1, s2);
  const sim = (1 - dist / maxLen) * 100;
  return Math.max(0, Math.round(sim));
}

export function findNearestRelevantMatch(query: string, limit: number = 6): IntelligentSearchResponse {
  const rawClean = query.trim().toUpperCase();
  if (!rawClean) {
    return {
      query: '',
      resolvedTicker: 'NVDA',
      exactMatch: null,
      didYouMean: null,
      nearestMatches: [],
      source: 'London Strategic Edge Open Universe (londonstrategicedge.com)'
    };
  }

  const exact = LSE_OPEN_INSTRUMENTS.find(
    inst => inst.ticker === rawClean || inst.ticker.replace(/\.(TO|L|AS|PA|DE|T|HK|AX|V)$/, '') === rawClean
  );

  const scoredList: NearestMatchResult[] = [];

  for (const inst of LSE_OPEN_INSTRUMENTS) {
    const tickerScore = calculateSimilarity(rawClean, inst.ticker);
    const bareTicker = inst.ticker.split('.')[0];
    const bareScore = calculateSimilarity(rawClean, bareTicker);
    const nameScore = calculateSimilarity(rawClean, inst.name);

    let aliasScore = 0;
    if (inst.aliases) {
      for (const al of inst.aliases) {
        const sc = calculateSimilarity(rawClean, al);
        if (sc > aliasScore) aliasScore = sc;
      }
    }

    let finalScore = Math.max(tickerScore, bareScore, aliasScore, nameScore * 0.9);
    let matchType: NearestMatchResult['matchType'] = 'SUBSTRING';
    let matchReason = `Relevant ${inst.category} asset`;

    if (rawClean === inst.ticker || rawClean === bareTicker) {
      finalScore = 100;
      matchType = 'EXACT';
      matchReason = 'Exact symbol match';
    } else if (aliasScore >= 90) {
      finalScore = Math.max(finalScore, 96);
      matchType = 'KEYWORD_ALIAS';
      matchReason = `Direct keyword alias for ${inst.name}`;
    } else if (inst.ticker.startsWith(rawClean) || bareTicker.startsWith(rawClean)) {
      finalScore = Math.max(finalScore, 88);
      matchType = 'PREFIX';
      matchReason = `Symbol starts with "${rawClean}"`;
    } else if (damerauLevenshteinDistance(rawClean, inst.ticker) <= 2 || damerauLevenshteinDistance(rawClean, bareTicker) <= 2) {
      finalScore = Math.max(finalScore, 82);
      matchType = 'TYPO_CORRECTION';
      matchReason = `Closest phonetic & typo match to ${inst.ticker}`;
    } else if (inst.name.toUpperCase().includes(rawClean)) {
      matchType = 'SUBSTRING';
      matchReason = `Name contains "${rawClean}"`;
    }

    if (finalScore >= 45) {
      scoredList.push({
        item: inst,
        similarityScore: Math.min(100, Math.round(finalScore)),
        matchType,
        matchReason
      });
    }
  }

  scoredList.sort((a, b) => b.similarityScore - a.similarityScore);
  const topMatches = scoredList.slice(0, limit);
  const didYouMean = (!exact && topMatches.length > 0 && topMatches[0].similarityScore >= 60)
    ? topMatches[0].item
    : null;

  const resolvedTicker = exact ? exact.ticker : (didYouMean ? didYouMean.ticker : rawClean);

  return {
    query: rawClean,
    resolvedTicker,
    exactMatch: exact || null,
    didYouMean,
    nearestMatches: topMatches,
    source: 'London Strategic Edge Open Universe (londonstrategicedge.com)'
  };
}
