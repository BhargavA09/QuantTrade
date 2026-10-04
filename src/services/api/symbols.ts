/**
 * Ticker Symbol Resolution, Normalization, and Mapping Utilities.
 * Enables user-friendly lookups for company names (e.g. "APPLE" -> "AAPL").
 */

export const COMMON_TICKER_MAP: Readonly<Record<string, string>> = Object.freeze({
  'FORD': 'F',
  'APPLE': 'AAPL',
  'TESLA': 'TSLA',
  'MICROSOFT': 'MSFT',
  'NVIDIA': 'NVDA',
  'GOOGLE': 'GOOGL',
  'AMAZON': 'AMZN',
  'META': 'META',
  'FACEBOOK': 'META',
  'NETFLIX': 'NFLX',
  'BITCOIN': 'BTC-USD',
  'ETHEREUM': 'ETH-USD',
  'SOLANA': 'SOL-USD',
  'GOLD': 'GC=F',
  'SILVER': 'SI=F',
  'OIL': 'CL=F',
  'CRUDE': 'CL=F',
  'NATGAS': 'NG=F',
  'BPAG': 'BPAG.TO'
});

/**
 * Resolves a potentially mistyped ticker or natural language company name to its standard symbol.
 * 
 * @param input Raw ticker symbol or company name
 * @returns Clean uppercase market ticker symbol
 */
export const resolveTickerSymbol = (input: string): string => {
  if (!input) return 'SPY';
  const normalized = input.trim().toUpperCase();
  if (COMMON_TICKER_MAP[normalized]) {
    return COMMON_TICKER_MAP[normalized];
  }
  return normalized;
};
