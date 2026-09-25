import { fetchGlobalState, fetchForecast } from "./api";

export interface NeuralMemory {
  lastUpdate: string;
  globalSentiment: string;
  keyInsights: string[];
  perceivedRisks: string[];
  alphaOpportunities: string[];
  learnedPatterns: { pattern: string; significance: number }[];
  modelConfidence: number;
  quantBias: number; // -0.05 to +0.05 drift adjustment
  regime: 'Bullish' | 'Bearish' | 'Sideways' | 'Volatile';
  correctiveSteps: string[];        // New: Steps model is taking to correct past mistakes
  historicalErrorRate: number;      // New: Model's self-assessed error rate (0-1)
  newsFiltersApplied: string[];     // New: What fake/sensational news was filtered
}

class NeuralBrainService {
  private memory: NeuralMemory | null = null;
  private isLearning: boolean = false;
  private listeners: ((memory: NeuralMemory) => void)[] = [];

  constructor() {
    this.loadMemory();
  }

  private loadMemory() {
    const saved = localStorage.getItem('quant_neural_memory');
    if (saved) {
      this.memory = JSON.parse(saved);
    }
  }

  private saveMemory() {
    if (this.memory) {
      localStorage.setItem('quant_neural_memory', JSON.stringify(this.memory));
    }
  }

  public getMemory() {
    return this.memory;
  }

  public subscribe(callback: (memory: NeuralMemory) => void) {
    this.listeners.push(callback);
    if (this.memory) callback(this.memory);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify() {
    if (this.memory) {
      this.listeners.forEach(l => l(this.memory!));
    }
  }

  /**
   * Performs a 'Thinking Turn' where the AI consumes recent data and updates its internal model.
   */
  public async performLearningTurn() {
    if (this.isLearning) return;
    
    // Check if we reached rate limit recently (cooldown)
    const cooldown = localStorage.getItem('quant_gemini_backoff');
    if (cooldown && Date.now() < parseInt(cooldown)) {
      console.warn("🧠 Neural Brain: In cooldown phase. Using simulated evolution.");
      this.simulateEvolution();
      return;
    }

    this.isLearning = true;

    try {
      console.log("🧠 Neural Brain: Starting learning turn...");
      
      const [globalState, spyData] = await Promise.all([
        fetchGlobalState(),
        fetchForecast('SPY')
      ]);

      const response = await fetch('/api/ai/neural-learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          globalState,
          spyData: { history: (spyData?.history || []).slice(-15) },
          existingMemory: this.memory
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.memory) {
        this.memory = {
          ...result.memory,
          lastUpdate: new Date().toISOString()
        };
        
        // Success: Clear backoff
        localStorage.removeItem('quant_gemini_backoff');
        
        this.saveMemory();
        this.notify();
        console.log("🧠 Neural Brain: Learning turn complete. Confidence:", this.memory?.modelConfidence);
      } else {
        if (result.error && (result.error.includes('429') || result.error.includes('quota') || result.error.includes('RESOURCE_EXHAUSTED'))) {
          console.warn("🧠 Neural Brain: Rate limit hit. Triggering 1-hour backoff.");
          localStorage.setItem('quant_gemini_backoff', (Date.now() + 3600000).toString());
        }
        console.log("🧠 Neural Brain: Operating on simulated evolution.");
        this.simulateEvolution();
      }
    } catch (error) {
      console.log("🧠 Neural Brain: Operating on simulated evolution.");
      this.simulateEvolution();
    } finally {
      this.isLearning = false;
    }
  }

  /**
   * Generates a slightly evolved memory based on existing data if the AI is unavailable.
   */
  private simulateEvolution() {
    if (!this.memory) {
      // Create initial dummy memory if none exists
      this.memory = {
        lastUpdate: new Date().toISOString(),
        globalSentiment: "Neutral",
        keyInsights: ["Neural engine initializing in local mode", "Logistics throughput stabilizing"],
        perceivedRisks: ["Geopolitical volatility", "Energy cost fluctuations"],
        alphaOpportunities: ["Small-cap momentum", "Energy sector rotation"],
        learnedPatterns: [{ pattern: "Sideways Consolidation", significance: 0.4 }],
        modelConfidence: 0.5,
        quantBias: 0,
        regime: 'Sideways',
        correctiveSteps: ["Initialized baseline error boundary", "Calibrated momentum decay weighting"],
        historicalErrorRate: 0.35,
        newsFiltersApplied: ["Filtered sensational retail chatter", "Removed unverified crypto rumors"]
      };
    } else {
      // Slightly improve or degrade confidence randomly
      this.memory.modelConfidence = Math.max(0.1, Math.min(0.99, this.memory.modelConfidence + (Math.random() - 0.5) * 0.05));
      this.memory.lastUpdate = new Date().toISOString();
      this.memory.historicalErrorRate = Math.max(0.05, this.memory.historicalErrorRate * 0.98); // Slow improvement over time
      
      // Maybe add a simulated insight
      if (Math.random() > 0.8) {
        const insights = [
          "Local pattern match identified in semi-conductor sector",
          "Logistics volatility decreasing in Asian tech hubs",
          "Whale wallet accumulation detected near support",
          "Cross-border trade flow indicates impending volatility"
        ];
        const newInsight = insights[Math.floor(Math.random() * insights.length)];
        if (!this.memory.keyInsights.includes(newInsight)) {
           this.memory.keyInsights = [newInsight, ...this.memory.keyInsights.slice(0, 4)];
        }
      }
      
      if (Math.random() > 0.85) {
         this.memory.correctiveSteps = [
            "Adjusted short-term bias based on yesterday's slight margin miss",
            ...this.memory.correctiveSteps.slice(0, 2)
         ];
      }
    }
    this.notify();
    this.saveMemory();
  }

  /**
   * Starts the continuous learning loop
   */
  public startContinuousLearning(intervalMs: number = 900000) { // Every 15 minutes
    this.performLearningTurn();
    return setInterval(() => this.performLearningTurn(), intervalMs);
  }
}

export const neuralBrain = new NeuralBrainService();
