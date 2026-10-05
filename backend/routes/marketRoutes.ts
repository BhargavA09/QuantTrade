import { Router } from "express";
import { getAccurateQuote } from "../services/multiSourceMarketEngine";
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
