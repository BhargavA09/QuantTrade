export interface DetailedStockItem {
  ticker: string;
  name: string;
  sector: 'Tech & AI' | 'Semiconductors' | 'Indices & ETFs' | 'Crypto & Digital' | 'Financials' | 'Healthcare' | 'Consumer & Energy';
  industry: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  pe: number;
  dividendYield: number;
  beta: number;
  volatility: string;
  trend: 'bullish' | 'neutral' | 'bearish';
  volume: string;
  summary: string;
}

export const EXPANDED_STOCK_DATABASE: DetailedStockItem[] = [
  // Tech & AI Giants
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductors',
    industry: 'Semiconductors & AI Accelerators',
    price: 136.75,
    change: 2.15,
    changePercent: 1.60,
    marketCap: '$3.34T',
    pe: 48.2,
    dividendYield: 0.03,
    beta: 1.68,
    volatility: '38.4%',
    trend: 'bullish',
    volume: '58.2M',
    summary: 'Global leader in GPU architecture, Tensor core accelerators, and enterprise AI computing platforms.'
  },
  {
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Tech & AI',
    industry: 'Consumer Hardware & Ecosystem',
    price: 234.80,
    change: 1.85,
    changePercent: 0.79,
    marketCap: '$3.56T',
    pe: 34.5,
    dividendYield: 0.44,
    beta: 1.05,
    volatility: '18.2%',
    trend: 'bullish',
    volume: '45.2M',
    summary: 'Consumer technology powerhouse anchored by iPhone, Mac, wearable services, and Apple Intelligence.'
  },
  {
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Tech & AI',
    industry: 'Cloud Infrastructure & Enterprise Software',
    price: 422.60,
    change: 3.10,
    changePercent: 0.74,
    marketCap: '$3.14T',
    pe: 35.8,
    dividendYield: 0.72,
    beta: 0.98,
    volatility: '19.4%',
    trend: 'bullish',
    volume: '21.4M',
    summary: 'Dominant enterprise cloud infrastructure provider via Azure, Windows ecosystem, and OpenAI commercialization.'
  },
  {
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Tech & AI',
    industry: 'Internet Search, Cloud & AI Research',
    price: 178.40,
    change: 1.90,
    changePercent: 1.08,
    marketCap: '$2.21T',
    pe: 24.2,
    dividendYield: 0.45,
    beta: 1.08,
    volatility: '24.5%',
    trend: 'bullish',
    volume: '24.8M',
    summary: 'Global search and digital advertising monopoly expanding rapidly through Google Cloud and Gemini models.'
  },
  {
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Tech & AI',
    industry: 'Cloud Compute & Global E-Commerce',
    price: 196.25,
    change: 2.40,
    changePercent: 1.24,
    marketCap: '$2.05T',
    pe: 43.6,
    dividendYield: 0.00,
    beta: 1.15,
    volatility: '26.8%',
    trend: 'bullish',
    volume: '31.2M',
    summary: 'Cloud market leader via AWS coupled with premier global logistics and retail fulfillment footprint.'
  },
  {
    ticker: 'META',
    name: 'Meta Platforms Inc.',
    sector: 'Tech & AI',
    industry: 'Social Networks & Open-Source AI',
    price: 582.30,
    change: 4.60,
    changePercent: 0.80,
    marketCap: '$1.47T',
    pe: 27.6,
    dividendYield: 0.35,
    beta: 1.22,
    volatility: '31.2%',
    trend: 'bullish',
    volume: '14.8M',
    summary: 'World-leading social ecosystem with 3B+ daily active users driving record monetization and open AI weights.'
  },
  {
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Tech & AI',
    industry: 'Electric Vehicles, Robotics & Autonomous AI',
    price: 248.50,
    change: 5.20,
    changePercent: 2.14,
    marketCap: '$792B',
    pe: 64.2,
    dividendYield: 0.00,
    beta: 2.34,
    volatility: '52.6%',
    trend: 'bullish',
    volume: '62.4M',
    summary: 'Pioneer in EV production, energy storage megapacks, full self-driving neural networks, and humanoid robotics.'
  },

  // Semiconductors & AI Hardware
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    sector: 'Semiconductors',
    industry: 'CPUs, GPUs & Data Center Accelerators',
    price: 158.40,
    change: 2.80,
    changePercent: 1.80,
    marketCap: '$256B',
    pe: 98.4,
    dividendYield: 0.00,
    beta: 1.72,
    volatility: '44.1%',
    trend: 'bullish',
    volume: '38.5M',
    summary: 'Key competitor in high-performance computing, EPYC server chips, and MI300 series AI accelerators.'
  },
  {
    ticker: 'TSM',
    name: 'Taiwan Semiconductor Mfg',
    sector: 'Semiconductors',
    industry: 'Advanced Semiconductor Foundry',
    price: 188.70,
    change: 3.40,
    changePercent: 1.83,
    marketCap: '$978B',
    pe: 29.8,
    dividendYield: 1.12,
    beta: 1.25,
    volatility: '28.4%',
    trend: 'bullish',
    volume: '16.4M',
    summary: 'The world primary foundry manufacturing 90%+ of cutting-edge 3nm and 5nm silicon for NVIDIA, Apple, and AMD.'
  },
  {
    ticker: 'AVGO',
    name: 'Broadcom Inc.',
    sector: 'Semiconductors',
    industry: 'Custom Silicon, Networking & Infrastructure',
    price: 174.50,
    change: 2.60,
    changePercent: 1.51,
    marketCap: '$815B',
    pe: 45.8,
    dividendYield: 1.21,
    beta: 1.32,
    volatility: '32.1%',
    trend: 'bullish',
    volume: '22.1M',
    summary: 'Provider of critical data-center networking switches, enterprise storage, and custom ASIC accelerators.'
  },
  {
    ticker: 'PLTR',
    name: 'Palantir Technologies',
    sector: 'Tech & AI',
    industry: 'Enterprise AI & Defense Analytics',
    price: 43.50,
    change: 0.85,
    changePercent: 1.99,
    marketCap: '$98B',
    pe: 88.5,
    dividendYield: 0.00,
    beta: 2.15,
    volatility: '58.2%',
    trend: 'bullish',
    volume: '52.1M',
    summary: 'Government and enterprise operational AI intelligence platform experiencing explosive AIP platform adoption.'
  },
  {
    ticker: 'NFLX',
    name: 'Netflix Inc.',
    sector: 'Tech & AI',
    industry: 'Streaming Entertainment & Media',
    price: 712.40,
    change: 8.50,
    changePercent: 1.21,
    marketCap: '$306B',
    pe: 41.5,
    dividendYield: 0.00,
    beta: 1.28,
    volatility: '29.4%',
    trend: 'bullish',
    volume: '4.8M',
    summary: 'Global leader in subscription streaming entertainment generating record free cash flow and advertising margin.'
  },

  // Leading Indices & ETFs
  {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    sector: 'Indices & ETFs',
    industry: 'US Large Cap Blend Index',
    price: 586.20,
    change: 3.80,
    changePercent: 0.65,
    marketCap: '$560B',
    pe: 26.5,
    dividendYield: 1.24,
    beta: 1.00,
    volatility: '11.8%',
    trend: 'bullish',
    volume: '54.2M',
    summary: 'The primary benchmark ETF tracking 500 leading publicly traded United States corporations.'
  },
  {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    sector: 'Indices & ETFs',
    industry: 'Nasdaq 100 Growth Index',
    price: 494.50,
    change: 4.90,
    changePercent: 1.00,
    marketCap: '$285B',
    pe: 32.1,
    dividendYield: 0.62,
    beta: 1.18,
    volatility: '16.5%',
    trend: 'bullish',
    volume: '38.4M',
    summary: 'Premier technology and growth ETF tracking the 100 largest non-financial Nasdaq-listed innovators.'
  },
  {
    ticker: 'DIA',
    name: 'SPDR Dow Jones Industrial ETF',
    sector: 'Indices & ETFs',
    industry: 'Large Cap Blue Chip Value',
    price: 428.10,
    change: 1.20,
    changePercent: 0.28,
    marketCap: '$35B',
    pe: 22.4,
    dividendYield: 1.75,
    beta: 0.88,
    volatility: '10.2%',
    trend: 'bullish',
    volume: '3.6M',
    summary: 'Tracks 30 prominent, established blue-chip US corporate market leaders with steady cash returns.'
  },
  {
    ticker: 'IWM',
    name: 'iShares Russell 2000 ETF',
    sector: 'Indices & ETFs',
    industry: 'US Small-Cap Blend Index',
    price: 221.40,
    change: 2.10,
    changePercent: 0.96,
    marketCap: '$68B',
    pe: 18.9,
    dividendYield: 1.38,
    beta: 1.26,
    volatility: '21.4%',
    trend: 'bullish',
    volume: '26.4M',
    summary: 'Barometer of US domestic economic health measuring the performance of approximately 2,000 small-cap equities.'
  },
  {
    ticker: 'SMH',
    name: 'VanEck Semiconductor ETF',
    sector: 'Indices & ETFs',
    industry: 'Semiconductor Industry Benchmark',
    price: 254.30,
    change: 4.20,
    changePercent: 1.68,
    marketCap: '$24B',
    pe: 36.4,
    dividendYield: 0.54,
    beta: 1.55,
    volatility: '33.2%',
    trend: 'bullish',
    volume: '7.8M',
    summary: 'Concentrated basket ETF tracking the 25 most influential global semiconductor manufacturers and equipment makers.'
  },

  // Crypto & Digital Assets
  {
    ticker: 'BTC-USD',
    name: 'Bitcoin USD',
    sector: 'Crypto & Digital',
    industry: 'Decentralized Sovereign Store of Value',
    price: 66200.00,
    change: 1450.00,
    changePercent: 2.24,
    marketCap: '$1.30T',
    pe: 0,
    dividendYield: 0.00,
    beta: 2.80,
    volatility: '52.4%',
    trend: 'bullish',
    volume: '$28.4B',
    summary: 'The inaugural peer-to-peer digital commodity with algorithmic hard cap supply of 21 million units.'
  },
  {
    ticker: 'ETH-USD',
    name: 'Ethereum USD',
    sector: 'Crypto & Digital',
    industry: 'Global Decentralized Virtual Machine',
    price: 2640.00,
    change: 75.00,
    changePercent: 2.92,
    marketCap: '$318B',
    pe: 0,
    dividendYield: 0.00,
    beta: 3.20,
    volatility: '59.1%',
    trend: 'bullish',
    volume: '$14.2B',
    summary: 'Premier smart-contract computational infrastructure securing multi-billion dollar decentralized finance protocols.'
  },
  {
    ticker: 'SOL-USD',
    name: 'Solana USD',
    sector: 'Crypto & Digital',
    industry: 'High-Throughput Layer-1 Blockchain',
    price: 158.40,
    change: 6.80,
    changePercent: 4.48,
    marketCap: '$74B',
    pe: 0,
    dividendYield: 0.00,
    beta: 3.90,
    volatility: '72.5%',
    trend: 'bullish',
    volume: '$3.8B',
    summary: 'Ultra high-speed parallelized blockchain processing 2,500+ real transactions per second with sub-cent fees.'
  },
  {
    ticker: 'COIN',
    name: 'Coinbase Global Inc.',
    sector: 'Financials',
    industry: 'Crypto Infrastructure & Asset Custody',
    price: 182.50,
    change: 4.20,
    changePercent: 2.36,
    marketCap: '$45B',
    pe: 38.2,
    dividendYield: 0.00,
    beta: 3.10,
    volatility: '68.4%',
    trend: 'bullish',
    volume: '8.9M',
    summary: 'Leading regulated digital currency exchange and primary institutional custodian for spot ETF products.'
  },

  // Financials & Value Leaders
  {
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financials',
    industry: 'Diversified Global Banking & Capital Markets',
    price: 224.60,
    change: 1.80,
    changePercent: 0.81,
    marketCap: '$642B',
    pe: 12.3,
    dividendYield: 2.14,
    beta: 1.06,
    volatility: '16.4%',
    trend: 'bullish',
    volume: '8.9M',
    summary: 'Largest US money-center bank delivering industry-leading Return on Tangible Common Equity (ROTCE).'
  },
  {
    ticker: 'V',
    name: 'Visa Inc.',
    sector: 'Financials',
    industry: 'Global Digital Payment Rails',
    price: 282.40,
    change: 1.10,
    changePercent: 0.39,
    marketCap: '$574B',
    pe: 30.1,
    dividendYield: 0.74,
    beta: 0.94,
    volatility: '14.2%',
    trend: 'bullish',
    volume: '5.2M',
    summary: 'Tollbooth network processing over 200 billion global payment transactions with 50%+ net profit margins.'
  },
  {
    ticker: 'BRK.B',
    name: 'Berkshire Hathaway Inc.',
    sector: 'Financials',
    industry: 'Multi-Industry Conglomerate & Insurance',
    price: 462.80,
    change: 1.40,
    changePercent: 0.30,
    marketCap: '$994B',
    pe: 21.4,
    dividendYield: 0.00,
    beta: 0.85,
    volatility: '12.1%',
    trend: 'neutral',
    volume: '3.1M',
    summary: 'Fortress balance sheet with $300B+ cash reserves, leading property/casualty insurance, and diverse operating companies.'
  },

  // Healthcare Leaders
  {
    ticker: 'LLY',
    name: 'Eli Lilly and Company',
    sector: 'Healthcare',
    industry: 'Metabolic & Oncology Therapeutics',
    price: 894.20,
    change: 12.40,
    changePercent: 1.41,
    marketCap: '$849B',
    pe: 114.2,
    dividendYield: 0.58,
    beta: 0.68,
    volatility: '26.2%',
    trend: 'bullish',
    volume: '2.8M',
    summary: 'Pharmaceutical pioneer transforming obesity and diabetes treatments with blockbuster GLP-1/GIP agonists.'
  },
  {
    ticker: 'UNH',
    name: 'UnitedHealth Group Inc.',
    sector: 'Healthcare',
    industry: 'Managed Healthcare & Optum Data Services',
    price: 588.60,
    change: 2.10,
    changePercent: 0.36,
    marketCap: '$542B',
    pe: 28.5,
    dividendYield: 1.43,
    beta: 0.62,
    volatility: '15.8%',
    trend: 'neutral',
    volume: '3.4M',
    summary: 'The largest healthcare provider and health insurer in the US combined with the high-margin Optum analytics unit.'
  },

  // Consumer & Energy
  {
    ticker: 'WMT',
    name: 'Walmart Inc.',
    sector: 'Consumer & Energy',
    industry: 'Omnichannel Retail & Grocery Monopoly',
    price: 81.30,
    change: 0.65,
    changePercent: 0.81,
    marketCap: '$652B',
    pe: 31.8,
    dividendYield: 1.02,
    beta: 0.52,
    volatility: '13.4%',
    trend: 'bullish',
    volume: '16.8M',
    summary: 'World largest revenue company accelerating high-margin retail media advertising and automated e-commerce.'
  },
  {
    ticker: 'COST',
    name: 'Costco Wholesale Corp.',
    sector: 'Consumer & Energy',
    industry: 'Membership Warehouse Club',
    price: 914.50,
    change: 4.80,
    changePercent: 0.53,
    marketCap: '$405B',
    pe: 54.2,
    dividendYield: 0.51,
    beta: 0.78,
    volatility: '17.2%',
    trend: 'bullish',
    volume: '1.9M',
    summary: 'Unrivaled membership renewal loyalty (93%+) driving consistent recurring cash flows and negative working capital.'
  },
  {
    ticker: 'XOM',
    name: 'Exxon Mobil Corporation',
    sector: 'Consumer & Energy',
    industry: 'Integrated Global Oil & Gas Major',
    price: 122.40,
    change: -0.80,
    changePercent: -0.65,
    marketCap: '$546B',
    pe: 14.8,
    dividendYield: 3.12,
    beta: 0.92,
    volatility: '21.5%',
    trend: 'neutral',
    volume: '14.2M',
    summary: 'Low-cost upstream production in Guyana and Permian Basin generating disciplined shareholder dividend returns.'
  }
];

export const STOCK_SECTORS = [
  'All',
  'Tech & AI',
  'Semiconductors',
  'Indices & ETFs',
  'Crypto & Digital',
  'Financials',
  'Healthcare',
  'Consumer & Energy'
] as const;

export type StockSectorType = typeof STOCK_SECTORS[number];

export function searchDatabase(query: string, sector: StockSectorType = 'All'): DetailedStockItem[] {
  const q = query.trim().toUpperCase();
  return EXPANDED_STOCK_DATABASE.filter(item => {
    const matchesSector = sector === 'All' || item.sector === sector;
    if (!matchesSector) return false;
    if (!q) return true;
    return (
      item.ticker.includes(q) ||
      item.name.toUpperCase().includes(q) ||
      item.industry.toUpperCase().includes(q)
    );
  });
}
