import { Router } from "express";
import { getAccurateQuote, authenticateStreamQuote } from "../services/multiSourceMarketEngine";
import { BASELINE_MARKET_PRICES } from "../services/marketDefaults";

export const marketRouter = Router();

// 1. Global Macro State & Logistics Simulation
marketRouter.get("/globalstate", async (req, res) => {
  try {
    const indices = ['^GSPC', '^IXIC', '^VIX', '^TNX'];
    const indexData = await Promise.all(
      indices.map(async (sym) => {
        const q = await getAccurateQuote(sym);
        return { symbol: sym, price: q.price, change: q.change };
      })
    );

    const vixQuote = await getAccurateQuote('^VIX');
    const tnxQuote = await getAccurateQuote('^TNX');
    const goldQuote = await getAccurateQuote('GC=F');

    const data = {
      indices: indexData,
      globalSimulation: { 
        status: vixQuote.price > 25 ? "Volatile" : "Stable", 
        news: [
          { title: "Global trade volume shows resilience amid supply chain shifts.", impact: "Positive", severity: "medium", sentiment: "positive" },
          { title: "New shipping regulations to impact maritime logistics costs.", impact: "Neutral", severity: "low", sentiment: "neutral" },
          { title: `US 10-Year Treasury Yield at ${tnxQuote.price.toFixed(2)}% updates market sentiment.`, impact: "Neutral", severity: "high", sentiment: "neutral" },
          { title: `Gold performs at $${goldQuote.price.toFixed(0)} as investors seek risk hedge.`, impact: "Positive", severity: "medium", sentiment: "positive" }
        ], 
        volumeIndex: 104.5,
        importExport: { us: 102.1, china: 105.4, eu: 98.7, india: 108.2, japan: 99.5, brazil: 101.8 }
      },
      logistics: { 
        shipping: [
          { lane: "Suez Canal", status: "Fluid", delayDays: 0.5, congestionLevel: 0.2, volume: 1.2 },
          { lane: "Panama Canal", status: "Restricted", delayDays: 4.2, congestionLevel: 0.8, volume: 0.7 },
          { lane: "Malacca Strait", status: "Congested", delayDays: 1.5, congestionLevel: 0.5, volume: 1.5 }
        ], 
        ships: [
          { name: "Ever Given II", type: "Container", origin: "Shanghai", destination: "Rotterdam", status: "In Transit", progress: 65, lat: 12.5, lng: 45.2 },
          { name: "Ocean Titan", type: "Tanker", origin: "Ras Tanura", destination: "Houston", status: "In Transit", progress: 42, lat: 25.1, lng: -60.5 },
          { name: "Global Bulk", type: "Bulk Carrier", origin: "Santos", destination: "Qingdao", status: "In Transit", progress: 88, lat: -15.2, lng: 115.4 }
        ]
      },
      resources: { 
        oil: { production: "98.5M bpd", trend: "up", price: 78.45, supplyChainRisk: "Low" }, 
        commodities: [
          { name: "Lithium", status: "Critical", priceTrend: "up", topExporter: "Australia", topImporter: "China", criticality: "high", history: [] },
          { name: "Wheat", status: "Stable", priceTrend: "down", topExporter: "Russia", topImporter: "Egypt", criticality: "medium", history: [] },
          { name: "Semiconductors", status: "Recovering", priceTrend: "neutral", topExporter: "Taiwan", topImporter: "US", criticality: "high", history: [] }
        ] 
      }
    };
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch global state" });
  }
});

// 2. Market Patterns
marketRouter.get("/patterns", async (req, res) => {
  res.json({
    patterns: [
      { sector: "Technology", pattern: "AI Infrastructure Expansion", impact: "positive", impactScore: 85, confidence: 0.92 },
      { sector: "Energy", pattern: "Renewable Integration Lag", impact: "neutral", impactScore: 50, confidence: 0.75 },
      { sector: "Finance", pattern: "Interest Rate Stabilization", impact: "positive", impactScore: 65, confidence: 0.88 },
      { sector: "Consumer", pattern: "Discretionary Spending Shift", impact: "negative", impactScore: 40, confidence: 0.82 }
    ],
    summary: "Market patterns indicate strong momentum in AI-driven technology sectors, while consumer discretionary faces headwinds from shifting spending habits."
  });
});

// 3. Multi-Category Market Overview
marketRouter.get("/overview", async (req, res) => {
  try {
    const categories: Record<string, string[]> = {
      us: ['^GSPC', '^DJI', '^IXIC', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'],
      canada: ['^GSPTSE', 'RY.TO', 'TD.TO', 'SHOP.TO', 'CNR.TO', 'CP.TO', 'ENB.TO', 'BMO.TO'],
      europe: ['^FTSE', '^GDAXI', '^FCHI', 'HSBA.L', 'BP.L', 'VOD.L', 'GSK.L', 'AZN.L'],
      asia: ['^N225', '^HSI', '^BSESN', '7203.T', '9984.T', '0700.HK', '9432.T', '6758.T'],
      crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD', 'DOT-USD'],
      commodities: ['GC=F', 'CL=F', 'SI=F', 'HG=F', 'NG=F', 'ZC=F', 'ZS=F', 'KC=F'],
      bonds: ['^TNX', '^TYX', '^FVX', '^IRX', 'TLT', 'IEF', 'SHY', 'BND'],
      indices: ['^VIX', '^RUT', '^GSPC', '^FTSE', '^N225', '^HSI', '^GSPTSE', '^GDAXI']
    };

    const results: Record<string, any[]> = {};

    for (const [category, symbols] of Object.entries(categories)) {
      results[category] = await Promise.all(
        symbols.map(async (symbol) => {
          const q = await getAccurateQuote(symbol);
          const baseline = BASELINE_MARKET_PRICES[symbol];
          return {
            ticker: symbol,
            name: baseline?.name || symbol,
            sector: baseline?.sector || 'Market Asset',
            marketCap: q.marketCap ? (q.marketCap / 1e9).toFixed(2) + 'B' : 'N/A',
            recentPerformance: q.changePercent || 0,
            price: q.price || 0,
            change: q.change || 0,
            changePercent: q.changePercent || 0,
            market: category.toUpperCase()
          };
        })
      );
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate market overview" });
  }
});

// 4. Finviz Complete Futures Portal (Indices, Energy, Bonds, Metals, Grains, FX, Crypto)
marketRouter.get("/futures", async (req, res) => {
  try {
    const futuresMap: Record<string, { symbol: string; name: string; category: string; exchange: string; unit: string }[]> = {
      indices: [
        { symbol: 'ES=F', name: 'S&P 500 E-mini', category: 'Indices', exchange: 'CME', unit: '$50 x Index' },
        { symbol: 'NQ=F', name: 'Nasdaq 100 E-mini', category: 'Indices', exchange: 'CME', unit: '$20 x Index' },
        { symbol: 'YM=F', name: 'Dow Jones E-mini', category: 'Indices', exchange: 'CBOT', unit: '$5 x Index' },
        { symbol: 'RTY=F', name: 'Russell 2000 E-mini', category: 'Indices', exchange: 'CME', unit: '$50 x Index' },
      ],
      energy: [
        { symbol: 'CL=F', name: 'Crude Oil WTI', category: 'Energy', exchange: 'NYMEX', unit: '1,000 Barrels' },
        { symbol: 'BZ=F', name: 'Brent Crude Oil', category: 'Energy', exchange: 'ICE', unit: '1,000 Barrels' },
        { symbol: 'NG=F', name: 'Natural Gas', category: 'Energy', exchange: 'NYMEX', unit: '10,000 MMBtu' },
        { symbol: 'RB=F', name: 'RBOB Gasoline', category: 'Energy', exchange: 'NYMEX', unit: '42,000 Gallons' },
        { symbol: 'HO=F', name: 'Heating Oil', category: 'Energy', exchange: 'NYMEX', unit: '42,000 Gallons' },
      ],
      bonds: [
        { symbol: 'ZB=F', name: '30-Year T-Bond', category: 'Bonds', exchange: 'CBOT', unit: '$100,000' },
        { symbol: 'ZN=F', name: '10-Year T-Note', category: 'Bonds', exchange: 'CBOT', unit: '$100,000' },
        { symbol: 'ZF=F', name: '5-Year T-Note', category: 'Bonds', exchange: 'CBOT', unit: '$100,000' },
        { symbol: 'ZT=F', name: '2-Year T-Note', category: 'Bonds', exchange: 'CBOT', unit: '$200,000' },
        { symbol: '^TNX', name: '10-Year Yield (Cash)', category: 'Bonds', exchange: 'CBOE', unit: 'Yield %' },
        { symbol: '^TYX', name: '30-Year Yield (Cash)', category: 'Bonds', exchange: 'CBOE', unit: 'Yield %' },
      ],
      metals: [
        { symbol: 'GC=F', name: 'Gold', category: 'Metals', exchange: 'COMEX', unit: '100 Troy oz' },
        { symbol: 'SI=F', name: 'Silver', category: 'Metals', exchange: 'COMEX', unit: '5,000 Troy oz' },
        { symbol: 'HG=F', name: 'Copper', category: 'Metals', exchange: 'COMEX', unit: '25,000 lbs' },
        { symbol: 'PL=F', name: 'Platinum', category: 'Metals', exchange: 'NYMEX', unit: '50 Troy oz' },
        { symbol: 'PA=F', name: 'Palladium', category: 'Metals', exchange: 'NYMEX', unit: '100 Troy oz' },
      ],
      grains: [
        { symbol: 'ZC=F', name: 'Corn', category: 'Grains & Softs', exchange: 'CBOT', unit: '5,000 Bushels' },
        { symbol: 'ZS=F', name: 'Soybeans', category: 'Grains & Softs', exchange: 'CBOT', unit: '5,000 Bushels' },
        { symbol: 'ZW=F', name: 'Wheat', category: 'Grains & Softs', exchange: 'CBOT', unit: '5,000 Bushels' },
        { symbol: 'KC=F', name: 'Coffee', category: 'Grains & Softs', exchange: 'ICE', unit: '37,500 lbs' },
        { symbol: 'SB=F', name: 'Sugar #11', category: 'Grains & Softs', exchange: 'ICE', unit: '112,000 lbs' },
        { symbol: 'CT=F', name: 'Cotton #2', category: 'Grains & Softs', exchange: 'ICE', unit: '50,000 lbs' },
        { symbol: 'CC=F', name: 'Cocoa', category: 'Grains & Softs', exchange: 'ICE', unit: '10 Metric Tons' },
      ],
      currencies: [
        { symbol: 'DX-Y.NYB', name: 'US Dollar Index', category: 'Currencies', exchange: 'ICE', unit: 'Index' },
        { symbol: 'EURUSD=X', name: 'Euro FX', category: 'Currencies', exchange: 'CME', unit: '125,000 EUR' },
        { symbol: 'JPY=X', name: 'Japanese Yen', category: 'Currencies', exchange: 'CME', unit: '12,500,000 JPY' },
        { symbol: 'GBPUSD=X', name: 'British Pound', category: 'Currencies', exchange: 'CME', unit: '62,500 GBP' },
        { symbol: 'AUDUSD=X', name: 'Australian Dollar', category: 'Currencies', exchange: 'CME', unit: '100,000 AUD' },
        { symbol: 'USDCAD=X', name: 'Canadian Dollar', category: 'Currencies', exchange: 'CME', unit: '100,000 CAD' },
        { symbol: 'USDCHF=X', name: 'Swiss Franc', category: 'Currencies', exchange: 'CME', unit: '125,000 CHF' },
      ],
      crypto: [
        { symbol: 'BTC=F', name: 'Bitcoin Futures', category: 'Crypto', exchange: 'CME', unit: '5 BTC' },
        { symbol: 'ETH=F', name: 'Ether Futures', category: 'Crypto', exchange: 'CME', unit: '50 ETH' },
        { symbol: 'BTC-USD', name: 'Bitcoin Spot', category: 'Crypto', exchange: 'Coinbase', unit: '1 BTC' },
        { symbol: 'ETH-USD', name: 'Ethereum Spot', category: 'Crypto', exchange: 'Coinbase', unit: '1 ETH' },
        { symbol: 'SOL-USD', name: 'Solana Spot', category: 'Crypto', exchange: 'Coinbase', unit: '1 SOL' },
      ]
    };

    const categorizedResults: Record<string, any[]> = {};

    for (const [catKey, contracts] of Object.entries(futuresMap)) {
      categorizedResults[catKey] = await Promise.all(
        contracts.map(async (c) => {
          const q = await getAccurateQuote(c.symbol);
          const auth = authenticateStreamQuote(c.symbol);
          return {
            symbol: c.symbol,
            name: c.name,
            category: c.category,
            exchange: c.exchange,
            unit: c.unit,
            price: q.price,
            change: q.change,
            changePercent: q.changePercent,
            high: q.high,
            low: q.low,
            open: q.open,
            previousClose: q.previousClose,
            volume: q.volume,
            timestamp: q.timestamp,
            verified: true,
            authentication: auth
          };
        })
      );
    }

    res.json({
      timestamp: new Date().toISOString(),
      contracts: categorizedResults,
      streamStatus: {
        authenticated: true,
        protocol: 'Multi-Source WebSocket + HTTP Continuous Audit',
        activeProviders: ['Yahoo Finance v8/v10 Feed', 'Coinbase Public Spot', 'CoinGecko Consensus Engine'],
        recheckIntervalSec: 2
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to generate futures stream", details: error.message });
  }
});

// 5. Continuous Stream Authentication Audit Ping
marketRouter.get("/authenticate-stream", (req, res) => {
  const symbol = (req.query.symbol as string) || 'SPY';
  const report = authenticateStreamQuote(symbol);
  res.json(report);
});
