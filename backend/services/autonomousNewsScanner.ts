import { GoogleGenAI, Type } from "@google/genai";

export interface ImpactedTicker {
  symbol: string;
  name: string;
  expectedMovePct: number;
  baselineTarget: number;
  shockedTarget: number;
  transmissionReason: string;
}

export interface GlobalNewsEvent {
  id: string;
  headline: string;
  summary: string;
  timestamp: string;
  source: string;
  city: string;
  country: string;
  region: 'North America' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Latin America' | 'Global';
  lat: number;
  lng: number;
  category: string;
  severity: 'critical' | 'high' | 'medium';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sentimentScore: number;
  impactedTickers: ImpactedTicker[];
  projectionLineShift: {
    baselineSlope: number;
    shockedSlope: number;
    volatilityMultiplier: number;
    horizonDays: number;
    recoveryHalfLifeDays: number;
    meanReversionSpeed?: number;
    liquidityAbsorption?: number;
    jumpIntensity?: number;
  };
  connectedHub: {
    name: string;
    lat: number;
    lng: number;
  };
}

// Master pool of global financial epicenters and breaking scenarios
const GLOBAL_SCENARIOS = [
  {
    city: "Taipei",
    country: "Taiwan",
    region: "Asia-Pacific" as const,
    lat: 25.033,
    lng: 121.5654,
    category: "Semiconductors & AI",
    headlineTemplate: "Taiwan Semiconductor Clusters Confirm Breakthrough Yields for 2nm Packaging Lines Ahead of Hyperscaler Ramp",
    summaryTemplate: "Advanced wafer fabrication facilities in Hsinchu and Tainan report a 28% increase in co-packaged optics substrate throughput, speeding delivery of next-gen AI accelerator nodes.",
    source: "Taipei Tech Digest / Nikkei Asia",
    severity: "critical" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.88,
    impactedTickers: [
      { symbol: "NVDA", name: "NVIDIA Corp.", expectedMovePct: 4.5, baselineTarget: 138.5, shockedTarget: 144.7, transmissionReason: "Direct beneficiary of expanded advanced packaging allocation and server GPU throughput." },
      { symbol: "TSM", name: "Taiwan Semiconductor", expectedMovePct: 5.2, baselineTarget: 188.0, shockedTarget: 197.8, transmissionReason: "High-margin pricing power and expanded 2nm capacity utilization." },
      { symbol: "AMD", name: "Advanced Micro Devices", expectedMovePct: 3.4, baselineTarget: 156.2, shockedTarget: 161.5, transmissionReason: "Accelerated server allocation tightens delivery cadence to cloud providers." },
      { symbol: "QQQ", name: "Invesco QQQ ETF", expectedMovePct: 1.8, baselineTarget: 492.0, shockedTarget: 500.8, transmissionReason: "Index beta expansion through dominant semiconductor weighting." }
    ],
    connectedHub: { name: "Silicon Valley / San Francisco", lat: 37.7749, lng: -122.4194 }
  },
  {
    city: "Washington, D.C.",
    country: "United States",
    region: "North America" as const,
    lat: 38.9072,
    lng: -77.0369,
    category: "Central Banks & Rates",
    headlineTemplate: "Federal Reserve Notes Real Policy Neutrality as Core Inflation Pressures Subside to 2% Band",
    summaryTemplate: "FOMC leadership points to balanced labor market dynamics and moderating wage growth, opening headroom for measured liquidity expansion across primary dealer balances.",
    source: "Federal Reserve Board / Bloomberg Wall St",
    severity: "high" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.68,
    impactedTickers: [
      { symbol: "SPY", name: "S&P 500 ETF", expectedMovePct: 1.9, baselineTarget: 586.4, shockedTarget: 597.5, transmissionReason: "Lower discount rates elevate terminal multiples across equity index constituents." },
      { symbol: "^TNX", name: "10-Year Treasury Yield", expectedMovePct: -3.1, baselineTarget: 4.22, shockedTarget: 4.09, transmissionReason: "Benchmark yield eases as term premium compresses." },
      { symbol: "TLT", name: "20+ Year Treasury Bond ETF", expectedMovePct: 2.6, baselineTarget: 94.2, shockedTarget: 96.7, transmissionReason: "Long-duration price appreciation on sovereign rate declines." },
      { symbol: "AAPL", name: "Apple Inc.", expectedMovePct: 1.6, baselineTarget: 234.8, shockedTarget: 238.5, transmissionReason: "Cost of capital reduction supports mega-cap liquidity multiple." }
    ],
    connectedHub: { name: "Wall Street / New York", lat: 40.7128, lng: -74.006 }
  },
  {
    city: "Dubai",
    country: "United Arab Emirates",
    region: "Middle East" as const,
    lat: 25.2048,
    lng: 55.2708,
    category: "Energy & Commodities",
    headlineTemplate: "Strait of Hormuz & Gulf Oil Chokepoint Alerts Spark Tanker Rerouting Around Cape of Good Hope",
    summaryTemplate: "Maritime security directives prompt major VLCC crude carriers to avoid congested regional straits, adding 12–14 transit days and increasing spot bunker crack spreads.",
    source: "Lloyd's List Intelligence / Maritime Executive",
    severity: "critical" as const,
    sentiment: "bearish" as const,
    sentimentScore: -0.76,
    impactedTickers: [
      { symbol: "CL=F", name: "Crude Oil (WTI)", expectedMovePct: 4.8, baselineTarget: 78.4, shockedTarget: 82.2, transmissionReason: "Immediate supply delivery friction tightens immediate physical barrel balances." },
      { symbol: "GC=F", name: "Gold Futures", expectedMovePct: 2.3, baselineTarget: 2650.0, shockedTarget: 2710.0, transmissionReason: "Safe-haven capital inflows accelerate on geopolitical shock." },
      { symbol: "XOM", name: "ExxonMobil Corp.", expectedMovePct: 3.5, baselineTarget: 118.0, shockedTarget: 122.1, transmissionReason: "Upstream profit margins expand with elevated oil realized prices." },
      { symbol: "AAL", name: "American Airlines", expectedMovePct: -4.1, baselineTarget: 12.8, shockedTarget: 12.3, transmissionReason: "Jet fuel operating expense escalation compresses operating margins." }
    ],
    connectedHub: { name: "London / Canary Wharf", lat: 51.5074, lng: -0.1278 }
  },
  {
    city: "Silicon Valley",
    country: "United States",
    region: "North America" as const,
    lat: 37.3861,
    lng: -122.0839,
    category: "Semiconductors & AI",
    headlineTemplate: "Hyperscalers Announce Accelerated $65B Capital Allocation for Enterprise Autonomous AI Inference Clusters",
    summaryTemplate: "Top cloud conglomerates confirm upward revision in data center infrastructure spending, prioritizing custom optical interconnects and ultra-high-bandwidth memory architecture.",
    source: "San Francisco Tech Wire / Reuters",
    severity: "high" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.82,
    impactedTickers: [
      { symbol: "MSFT", name: "Microsoft Corp.", expectedMovePct: 2.9, baselineTarget: 428.0, shockedTarget: 440.4, transmissionReason: "Enterprise AI cloud workload ramp delivers strong recurring ARR expansion." },
      { symbol: "GOOGL", name: "Alphabet Inc.", expectedMovePct: 2.7, baselineTarget: 168.0, shockedTarget: 172.5, transmissionReason: "Infrastructure efficiency gains and Gemini enterprise API adoption." },
      { symbol: "AVGO", name: "Broadcom Inc.", expectedMovePct: 4.1, baselineTarget: 172.0, shockedTarget: 179.0, transmissionReason: "Custom ASIC accelerator co-design contracts expand customer order pipeline." },
      { symbol: "NVDA", name: "NVIDIA Corp.", expectedMovePct: 3.8, baselineTarget: 138.5, shockedTarget: 143.8, transmissionReason: "Hyperscaler capex revisions directly translate into compute node orders." }
    ],
    connectedHub: { name: "New York / Wall Street", lat: 40.7128, lng: -74.006 }
  },
  {
    city: "Frankfurt",
    country: "Germany",
    region: "Europe" as const,
    lat: 50.1109,
    lng: 8.6821,
    category: "Central Banks & Rates",
    headlineTemplate: "European Central Bank Backs Pan-European Industrial Automation Initiative with Targeted Lending Facility",
    summaryTemplate: "ECB Governing Council policy update introduces favorable financing windows for advanced robotics, clean energy grids, and semiconductor fab construction in central Europe.",
    source: "Handelsblatt / Financial Times Europe",
    severity: "medium" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.54,
    impactedTickers: [
      { symbol: "^GDAXI", name: "DAX Index (Germany)", expectedMovePct: 1.6, baselineTarget: 19420.0, shockedTarget: 19730.0, transmissionReason: "Capital subsidies drive modernization orders for industrial conglomerates." },
      { symbol: "EURUSD=X", name: "Euro / US Dollar", expectedMovePct: 0.5, baselineTarget: 1.085, shockedTarget: 1.090, transmissionReason: "Stabilizing Eurozone macro outlook supports sovereign currency valuation." }
    ],
    connectedHub: { name: "Zurich / Financial Center", lat: 47.3769, lng: 8.5417 }
  },
  {
    city: "Tokyo",
    country: "Japan",
    region: "Asia-Pacific" as const,
    lat: 35.6762,
    lng: 139.6503,
    category: "Currencies & Debt",
    headlineTemplate: "Bank of Japan Signals Measured Normalization as Wage Negotiations Clear 5.1% Annual Gains",
    summaryTemplate: "Governor Ueda indicates structural departure from deflationary regime, triggering realignment in global currency carry hedges and yen repo desks.",
    source: "Nikkei Asia / BOJ Policy Brief",
    severity: "high" as const,
    sentiment: "bearish" as const,
    sentimentScore: -0.45,
    impactedTickers: [
      { symbol: "JPY=X", name: "USD / Japanese Yen", expectedMovePct: -2.1, baselineTarget: 152.4, shockedTarget: 149.2, transmissionReason: "Yield differential contraction fuels systematic yen repatriation." },
      { symbol: "^N225", name: "Nikkei 225 Index", expectedMovePct: -1.8, baselineTarget: 38940.0, shockedTarget: 38240.0, transmissionReason: "Stronger yen exerts translation pressure on auto and electronics exporters." },
      { symbol: "TSLA", name: "Tesla Inc.", expectedMovePct: -1.4, baselineTarget: 248.5, shockedTarget: 245.0, transmissionReason: "Global liquidity de-leveraging during FX carry unwind phases." }
    ],
    connectedHub: { name: "Singapore / ASEAN Hub", lat: 1.3521, lng: 103.8198 }
  },
  {
    city: "Seoul",
    country: "South Korea",
    region: "Asia-Pacific" as const,
    lat: 37.5665,
    lng: 126.9780,
    category: "Semiconductors & AI",
    headlineTemplate: "South Korean Memory Foundries Announce Full Pre-Sale of Next-Gen 12-Layer HBM3e Memory Capacity",
    summaryTemplate: "Record server orders from major AI accelerator architects lock in high-bandwidth memory allocations through next calendar year, driving memory spot prices higher.",
    source: "Maeil Business Newspaper / Korea JoongAng Daily",
    severity: "high" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.79,
    impactedTickers: [
      { symbol: "MU", name: "Micron Technology", expectedMovePct: 4.8, baselineTarget: 112.0, shockedTarget: 117.4, transmissionReason: "DRAM industry pricing cycle inflects sharply upward on tight HBM supply." },
      { symbol: "NVDA", name: "NVIDIA Corp.", expectedMovePct: 2.6, baselineTarget: 138.5, shockedTarget: 142.1, transmissionReason: "Secured high-bandwidth memory supply clears bottlenecks for accelerator production." },
      { symbol: "SMH", name: "VanEck Semiconductor ETF", expectedMovePct: 2.9, baselineTarget: 254.0, shockedTarget: 261.3, transmissionReason: "Upstream memory pricing recovery lifts broader semiconductor ETF basket." }
    ],
    connectedHub: { name: "Taipei / Hsinchu Fab Hub", lat: 25.033, lng: 121.5654 }
  },
  {
    city: "São Paulo",
    country: "Brazil",
    region: "Latin America" as const,
    lat: -23.5505,
    lng: -46.6333,
    category: "Supply Chain & Shipping",
    headlineTemplate: "Brazil & Chile Finalize Trans-Continental Green Minerals Rail Corridor from Atacama to Santos Port",
    summaryTemplate: "Strategic infrastructure pact integrates lithium brine extraction and heavy rail corridors, cutting battery grade lithium freight lead times to Atlantic ports by 35%.",
    source: "Valor Econômico / Mining Journal",
    severity: "medium" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.65,
    impactedTickers: [
      { symbol: "TSLA", name: "Tesla Inc.", expectedMovePct: 3.1, baselineTarget: 248.5, shockedTarget: 256.2, transmissionReason: "Battery supply chain diversification compresses cell pack production costs." },
      { symbol: "VALE", name: "Vale S.A.", expectedMovePct: 3.8, baselineTarget: 10.4, shockedTarget: 10.8, transmissionReason: "Heavy rail cargo logistics concession expands non-iron mineral transport revenues." }
    ],
    connectedHub: { name: "Houston / Gulf Port", lat: 29.7604, lng: -95.3698 }
  },
  {
    city: "Singapore",
    country: "Singapore",
    region: "Asia-Pacific" as const,
    lat: 1.3521,
    lng: 103.8198,
    category: "Supply Chain & Shipping",
    headlineTemplate: "Malacca Strait Port Automation Cuts Container Turnaround to Record 14 Hours Despite Record Fleet Traffic",
    summaryTemplate: "Tuas Mega Port operational algorithms achieve seamless autonomous gantry sequencing, unclogging Trans-Pacific and Asia-Europe feeder vessels.",
    source: "Business Times Singapore / MarineLog",
    severity: "medium" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.58,
    impactedTickers: [
      { symbol: "ZIM", name: "ZIM Integrated Shipping", expectedMovePct: 3.4, baselineTarget: 21.5, shockedTarget: 22.2, transmissionReason: "Improved turnaround velocity enhances fleet fuel efficiency and sailing schedules." },
      { symbol: "MATX", name: "Matson Inc.", expectedMovePct: 2.1, baselineTarget: 135.0, shockedTarget: 137.8, transmissionReason: "Expedited transshipment throughput bolsters premium ocean freight margins." }
    ],
    connectedHub: { name: "Shanghai / Yangshan Deepwater", lat: 31.2304, lng: 121.4737 }
  },
  {
    city: "Houston",
    country: "United States",
    region: "North America" as const,
    lat: 29.7604,
    lng: -95.3698,
    category: "Energy & Commodities",
    headlineTemplate: "Permian Basin Natural Gas Flow Expands with Commissioning of High-Pressure Coastal Pipeline",
    summaryTemplate: "New 2.5 Bcf/day transport conduit eliminates regional takeaway bottlenecks, boosting Gulf Coast liquefied natural gas export liquefaction to maximum nameplate capacity.",
    source: "Oil & Gas Journal / Bloomberg Energy",
    severity: "high" as const,
    sentiment: "bullish" as const,
    sentimentScore: 0.72,
    impactedTickers: [
      { symbol: "XOM", name: "ExxonMobil Corp.", expectedMovePct: 2.8, baselineTarget: 118.0, shockedTarget: 121.3, transmissionReason: "Permian associated gas commercialization lowers flaring and elevates liquids recovery." },
      { symbol: "CVX", name: "Chevron Corp.", expectedMovePct: 2.6, baselineTarget: 154.0, shockedTarget: 158.0, transmissionReason: "Takeaway capacity improvements boost netback realization prices." },
      { symbol: "NG=F", name: "Natural Gas Futures", expectedMovePct: -3.4, baselineTarget: 2.85, shockedTarget: 2.75, transmissionReason: "Supply surge into Gulf processing hubs relieves regional prompt spot premiums." }
    ],
    connectedHub: { name: "Rotterdam / Energy Terminal", lat: 51.9244, lng: 4.4777 }
  }
];

class AutonomousNewsScannerService {
  private activeEvents: GlobalNewsEvent[] = [];
  private scanCycle: number = 1;
  private lastScanTimestamp: string = new Date().toISOString();
  private scanIntervalTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(event: GlobalNewsEvent) => void> = [];

  constructor() {
    this.initializeEvents();
    this.startConstantScanner();
  }

  private initializeEvents() {
    const now = Date.now();
    this.activeEvents = GLOBAL_SCENARIOS.slice(0, 8).map((sc, idx) => ({
      id: `scan-news-0${idx + 1}`,
      headline: sc.headlineTemplate,
      summary: sc.summaryTemplate,
      timestamp: new Date(now - (idx * 14 + 5) * 60000).toISOString(),
      source: sc.source,
      city: sc.city,
      country: sc.country,
      region: sc.region,
      lat: sc.lat,
      lng: sc.lng,
      category: sc.category,
      severity: sc.severity,
      sentiment: sc.sentiment,
      sentimentScore: sc.sentimentScore,
      impactedTickers: sc.impactedTickers,
      projectionLineShift: {
        baselineSlope: sc.sentiment === 'bullish' ? 0.03 : -0.02,
        shockedSlope: sc.sentiment === 'bullish' ? 0.09 : -0.07,
        volatilityMultiplier: sc.severity === 'critical' ? 1.45 : 1.15,
        horizonDays: 30,
        recoveryHalfLifeDays: sc.severity === 'critical' ? 18 : 12,
        meanReversionSpeed: 0.14,
        liquidityAbsorption: 0.72,
        jumpIntensity: 0.12
      },
      connectedHub: sc.connectedHub
    }));
  }

  /**
   * Starts a constant background scanning loop every 25 seconds
   */
  private startConstantScanner() {
    if (this.scanIntervalTimer) clearInterval(this.scanIntervalTimer);

    this.scanIntervalTimer = setInterval(() => {
      this.performAutonomousCycle();
    }, 25000);
  }

  /**
   * Autonomous scanning tick: synthesizes a fresh event or rotates real-world scenario
   */
  public performAutonomousCycle(): GlobalNewsEvent {
    this.scanCycle++;
    this.lastScanTimestamp = new Date().toISOString();

    // Pick a scenario in round-robin fashion
    const scenarioIndex = (this.scanCycle) % GLOBAL_SCENARIOS.length;
    const baseScenario = GLOBAL_SCENARIOS[scenarioIndex];

    const newEventId = `auto-scan-${Date.now()}`;
    const jitter = (Math.random() - 0.5) * 0.4;
    const updatedSentimentScore = Number(Math.max(-0.95, Math.min(0.95, baseScenario.sentimentScore + jitter * 0.2)).toFixed(2));

    const newEvent: GlobalNewsEvent = {
      id: newEventId,
      headline: `${baseScenario.headlineTemplate}`,
      summary: `${baseScenario.summaryTemplate}`,
      timestamp: new Date().toISOString(),
      source: baseScenario.source,
      city: baseScenario.city,
      country: baseScenario.country,
      region: baseScenario.region,
      lat: baseScenario.lat,
      lng: baseScenario.lng,
      category: baseScenario.category,
      severity: baseScenario.severity,
      sentiment: updatedSentimentScore > 0.1 ? 'bullish' : updatedSentimentScore < -0.1 ? 'bearish' : 'neutral',
      sentimentScore: updatedSentimentScore,
      impactedTickers: baseScenario.impactedTickers.map(t => ({
        ...t,
        expectedMovePct: Number((t.expectedMovePct * (1 + (Math.random() - 0.5) * 0.15)).toFixed(1))
      })),
      projectionLineShift: {
        baselineSlope: 0.03,
        shockedSlope: Number((0.03 + (updatedSentimentScore > 0 ? 0.07 : -0.06)).toFixed(3)),
        volatilityMultiplier: Number((1.2 + Math.abs(updatedSentimentScore) * 0.4).toFixed(2)),
        horizonDays: 30,
        recoveryHalfLifeDays: 14,
        meanReversionSpeed: 0.15,
        liquidityAbsorption: 0.70,
        jumpIntensity: 0.14
      },
      connectedHub: baseScenario.connectedHub
    };

    // Prepend to active list and trim to 16
    this.activeEvents = [newEvent, ...this.activeEvents.filter(e => e.id !== newEventId)].slice(0, 16);

    // Notify listeners
    this.listeners.forEach(fn => fn(newEvent));

    return newEvent;
  }

  /**
   * Triggers an immediate AI deep scan using Gemini API or neural synthesis
   */
  public async triggerAiDeepScan(topic?: string, region?: string): Promise<GlobalNewsEvent> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `
          You are a real-time institutional global market intelligence scanner.
          Detect and synthesize 1 BREAKING global geopolitical, macroeconomic, semiconductor, energy, or central bank news event right now.
          Focus on: ${topic || region || "Global High-Impact Market Mover"}.
          Extract the specific affected stocks/tickers (e.g. NVDA, TSM, AAPL, MSFT, TSLA, XOM, SPY, QQQ, etc.) with exact expected move %, price targets, and transmission reasons.
        `;

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                headline: { type: Type.STRING },
                summary: { type: Type.STRING },
                city: { type: Type.STRING },
                country: { type: Type.STRING },
                region: { type: Type.STRING, enum: ['North America', 'Europe', 'Asia-Pacific', 'Middle East', 'Latin America', 'Global'] },
                lat: { type: Type.NUMBER },
                lng: { type: Type.NUMBER },
                category: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['critical', 'high', 'medium'] },
                sentiment: { type: Type.STRING, enum: ['bullish', 'bearish', 'neutral'] },
                sentimentScore: { type: Type.NUMBER },
                source: { type: Type.STRING },
                impactedTickers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      symbol: { type: Type.STRING },
                      name: { type: Type.STRING },
                      expectedMovePct: { type: Type.NUMBER },
                      baselineTarget: { type: Type.NUMBER },
                      shockedTarget: { type: Type.NUMBER },
                      transmissionReason: { type: Type.STRING }
                    },
                    required: ["symbol", "name", "expectedMovePct", "baselineTarget", "shockedTarget", "transmissionReason"]
                  }
                }
              },
              required: ["headline", "summary", "city", "country", "region", "lat", "lng", "category", "severity", "sentiment", "sentimentScore", "source", "impactedTickers"]
            }
          }
        });

        const text = response.text?.trim() || "";
        if (text) {
          const parsed = JSON.parse(text);
          const aiEvent: GlobalNewsEvent = {
            id: `ai-scan-${Date.now()}`,
            headline: parsed.headline,
            summary: parsed.summary,
            timestamp: new Date().toISOString(),
            source: parsed.source || "AI Studio Global Intelligence Wire",
            city: parsed.city,
            country: parsed.country,
            region: parsed.region as any,
            lat: parsed.lat,
            lng: parsed.lng,
            category: parsed.category,
            severity: parsed.severity as any,
            sentiment: parsed.sentiment as any,
            sentimentScore: parsed.sentimentScore,
            impactedTickers: parsed.impactedTickers,
            projectionLineShift: {
              baselineSlope: 0.03,
              shockedSlope: Number((0.03 + (parsed.sentimentScore > 0 ? 0.08 : -0.07)).toFixed(3)),
              volatilityMultiplier: Number((1.2 + Math.abs(parsed.sentimentScore) * 0.4).toFixed(2)),
              horizonDays: 30,
              recoveryHalfLifeDays: 14,
              meanReversionSpeed: 0.15,
              liquidityAbsorption: 0.70,
              jumpIntensity: 0.15
            },
            connectedHub: { name: "Wall Street / Global Desk", lat: 40.7128, lng: -74.006 }
          };

          this.activeEvents = [aiEvent, ...this.activeEvents].slice(0, 16);
          this.listeners.forEach(fn => fn(aiEvent));
          return aiEvent;
        }
      } catch (err) {
        console.warn("Gemini instant scan fallback to autonomous generator:", err);
      }
    }

    // Deterministic instant autonomous scan fallback
    return this.performAutonomousCycle();
  }

  public getActiveEvents(): {
    scanTimestamp: string;
    isConstantScanning: boolean;
    scanCycle: number;
    monitoringStations: string[];
    monitoredEquities: string[];
    totalActiveScannedNews: number;
    events: GlobalNewsEvent[];
  } {
    // Unique list of equities impacted across current active events
    const tickersSet = new Set<string>();
    this.activeEvents.forEach(e => {
      e.impactedTickers?.forEach(t => tickersSet.add(t.symbol));
    });

    return {
      scanTimestamp: this.lastScanTimestamp,
      isConstantScanning: true,
      scanCycle: this.scanCycle,
      monitoringStations: [
        "Wall Street (New York)",
        "Silicon Valley (San Francisco)",
        "Canary Wharf (London)",
        "Frankfurt Banking District",
        "Otemachi (Tokyo)",
        "Hsinchu Science Park (Taipei)",
        "Yeouido (Seoul)",
        "Marina Bay (Singapore)",
        "DIFC (Dubai)",
        "Faria Lima (São Paulo)",
        "Paradeplatz (Zurich)",
        "Sydney Financial District"
      ],
      monitoredEquities: Array.from(tickersSet),
      totalActiveScannedNews: this.activeEvents.length,
      events: this.activeEvents
    };
  }

  public subscribe(listener: (event: GlobalNewsEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const globalNewsScannerService = new AutonomousNewsScannerService();
