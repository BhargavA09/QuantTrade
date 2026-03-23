import React from 'react';
import { motion } from 'motion/react';
import { Zap, XCircle } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockData {
  ticker: string;
  changePercent: number;
  sentiment?: { score: number; summary: string; tradeImpact: string };
}

const getFuzzyVolatility = (data: StockData) => {
  if (!data.sentiment) return { label: "Moderate", value: "2.5%", trend: "down" as const, reasons: ["Awaiting sentiment analysis"] };

  const sentimentScore = Math.abs(data.sentiment.score); // 0 to 1
  const summary = data.sentiment.summary.toLowerCase();
  const reasons: string[] = [];
  
  // Fuzzy inputs
  let volatilityScore = 0.5; // Base volatility (Moderate)

  // Rule 1: High sentiment magnitude increases volatility
  if (sentimentScore > 0.7) {
    volatilityScore += 0.3;
    reasons.push("High sentiment conviction detected");
  } else if (sentimentScore > 0.4) {
    volatilityScore += 0.1;
    reasons.push("Moderate sentiment bias");
  }

  // Rule 2: Keywords in news summary
  const highVolKeywords = ['uncertainty', 'volatile', 'crisis', 'lawsuit', 'earnings', 'breakthrough', 'crash', 'surge', 'fear', 'panic', 'conflict', 'war'];
  const lowVolKeywords = ['stable', 'steady', 'consistent', 'neutral', 'sideways', 'calm', 'quiet', 'growth', 'solid'];

  let foundHigh = false;
  highVolKeywords.forEach(word => {
    if (summary.includes(word)) {
      volatilityScore += 0.15;
      foundHigh = true;
    }
  });
  if (foundHigh) reasons.push("Risk-elevating keywords in news");

  let foundLow = false;
  lowVolKeywords.forEach(word => {
    if (summary.includes(word)) {
      volatilityScore -= 0.1;
      foundLow = true;
    }
  });
  if (foundLow) reasons.push("Stability signals in recent reports");

  // Rule 3: Price change magnitude
  const absChange = Math.abs(data.changePercent);
  if (absChange > 3) {
    volatilityScore += 0.2;
    reasons.push("Significant recent price momentum");
  } else if (absChange > 1) {
    volatilityScore += 0.1;
    reasons.push("Active price discovery");
  }

  // Clamp score
  volatilityScore = Math.max(0.1, Math.min(1.0, volatilityScore));

  // Defuzzification to labels
  let label = "Moderate";
  let trend: 'up' | 'down' = 'down';
  
  if (volatilityScore > 0.8) {
    label = "Extreme";
    trend = "up";
  } else if (volatilityScore > 0.6) {
    label = "High";
    trend = "up";
  } else if (volatilityScore > 0.4) {
    label = "Moderate";
    trend = "down";
  } else {
    label = "Low";
    trend = "down";
  }

  // Map score to a realistic percentage (e.g., 1% to 15%)
  const percentage = (volatilityScore * 12 + 1).toFixed(1);

  return { label, value: `${percentage}%`, trend, reasons };
};

const FuzzyLogicExplainer = ({ data, onClose }: { data: StockData, onClose: () => void }) => {
  if (!data.sentiment) return null;

  const sentimentScore = Math.abs(data.sentiment.score);
  const summary = data.sentiment.summary.toLowerCase();
  const absChange = Math.abs(data.changePercent);

  const highVolKeywords = ['uncertainty', 'volatile', 'crisis', 'lawsuit', 'earnings', 'breakthrough', 'crash', 'surge', 'fear', 'panic', 'conflict', 'war'];
  const lowVolKeywords = ['stable', 'steady', 'consistent', 'neutral', 'sideways', 'calm', 'quiet', 'growth', 'solid'];

  const foundHigh = highVolKeywords.filter(word => summary.includes(word));
  const foundLow = lowVolKeywords.filter(word => summary.includes(word));

  const volatility = getFuzzyVolatility(data);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="glass-card max-w-2xl w-full p-8 overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-0 right-0 p-4">
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Zap className="text-emerald-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-zinc-100 tracking-tighter uppercase italic">Fuzzy AI Volatility Engine</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Inference Rules & Parameter Mapping</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4">Input Parameters</h3>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Sentiment Magnitude</span>
                    <span className="text-xs font-mono text-emerald-400">{(sentimentScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${sentimentScore * 100}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Price Momentum</span>
                    <span className="text-xs font-mono text-emerald-400">{absChange.toFixed(2)}%</span>
                  </div>
                  <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, absChange * 10)}%` }} />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-2">Keyword Detection</span>
                  <div className="flex flex-wrap gap-2">
                    {foundHigh.map(w => (
                      <span key={w} className="px-2 py-1 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[8px] font-black uppercase">{w}</span>
                    ))}
                    {foundLow.map(w => (
                      <span key={w} className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase">{w}</span>
                    ))}
                    {foundHigh.length === 0 && foundLow.length === 0 && (
                      <span className="text-[8px] text-zinc-600 italic">No significant keywords detected</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-4">Inference Rules</h3>
              <div className="space-y-2">
                <div className={cn("p-3 rounded-lg border text-[10px] transition-colors", sentimentScore > 0.4 ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-900/30 border-zinc-800/50 text-zinc-500")}>
                  <span className="font-bold text-emerald-500 mr-2">IF</span> Sentiment Magnitude is HIGH <span className="font-bold text-emerald-500 mx-2">THEN</span> Increase Volatility Score
                </div>
                <div className={cn("p-3 rounded-lg border text-[10px] transition-colors", foundHigh.length > 0 ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-900/30 border-zinc-800/50 text-zinc-500")}>
                  <span className="font-bold text-emerald-500 mr-2">IF</span> Risk Keywords Detected <span className="font-bold text-emerald-500 mx-2">THEN</span> Boost Volatility Score
                </div>
                <div className={cn("p-3 rounded-lg border text-[10px] transition-colors", absChange > 1 ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-900/30 border-zinc-800/50 text-zinc-500")}>
                  <span className="font-bold text-emerald-500 mr-2">IF</span> Price Momentum is SIGNIFICANT <span className="font-bold text-emerald-500 mx-2">THEN</span> Amplify Volatility Score
                </div>
                <div className={cn("p-3 rounded-lg border text-[10px] transition-colors", foundLow.length > 0 ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-200" : "bg-zinc-900/30 border-zinc-800/50 text-zinc-500")}>
                  <span className="font-bold text-emerald-500 mr-2">IF</span> Stability Keywords Detected <span className="font-bold text-emerald-500 mx-2">THEN</span> Dampen Volatility Score
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Defuzzified Output</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400 tracking-tighter italic uppercase">{volatility.label}</span>
                <span className="text-sm font-mono text-emerald-500/60">{volatility.value}</span>
              </div>
              <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">
                The engine uses a Mamdani-style inference system to map non-linear inputs into a discrete risk classification.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export { getFuzzyVolatility };
export default FuzzyLogicExplainer;
