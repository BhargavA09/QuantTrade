import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Shield, Target, Activity, RefreshCw } from 'lucide-react';
import { neuralBrain, NeuralMemory } from '../services/NeuralBrain';

export const LearningMonitor: React.FC = () => {
  const [memory, setMemory] = useState<NeuralMemory | null>(neuralBrain.getMemory());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    return neuralBrain.subscribe(m => {
      setMemory(m);
      setIsRefreshing(false);
    });
  }, []);

  const handleManualLearn = async () => {
    setIsRefreshing(true);
    await neuralBrain.performLearningTurn();
  };

  if (!memory) {
    return (
      <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-4">
        <Brain className="w-12 h-12 text-blue-400 animate-pulse" />
        <div>
          <h3 className="text-white font-medium">Neural Engine Initializing</h3>
          <p className="text-gray-400 text-sm">Aggregating market state for initial baseline...</p>
        </div>
        <button 
          onClick={handleManualLearn}
          className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Initialize Core
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-8 h-8 text-blue-400" />
            <motion.div 
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Neural Memory State
            </h2>
            <div className="text-xs text-gray-500 flex items-center gap-2">
              <Activity className="w-3 h-3 text-green-500" />
              Continuous Learning Active • Last updated: {new Date(memory.lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleManualLearn}
          disabled={isRefreshing}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 group"
          title="Force Learning Turn"
        >
          <RefreshCw className={`w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sentiment & Confidence */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
          <div className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Sentiment</div>
          <div className="text-xl font-bold text-white truncate">{memory.globalSentiment}</div>
        </div>
        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
          <div className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-1">Regime</div>
          <div className="text-xl font-bold text-white">{memory.regime || 'Sideways'}</div>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="text-xs text-emerald-400 font-medium uppercase tracking-wider mb-1">Quant Bias</div>
          <div className="text-xl font-bold text-white">{(memory.quantBias > 0 ? '+' : '') + (memory.quantBias * 100).toFixed(2)}%</div>
          <div className="text-[10px] text-gray-500 mt-1">Evolving daily log-drift</div>
        </div>
        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
          <div className="text-xs text-indigo-400 font-medium uppercase tracking-wider mb-1">Confidence</div>
          <div className="text-xl font-bold text-white">{(memory.modelConfidence * 100).toFixed(1)}%</div>
          <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${memory.modelConfidence * 100}%` }}
              className="h-full bg-indigo-500"
            />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
          <div className="text-xs text-rose-400 font-medium uppercase tracking-wider mb-1">Error Rate</div>
          <div className="text-xl font-bold text-white">{((memory.historicalErrorRate || 0.35) * 100).toFixed(1)}%</div>
          <div className="text-[10px] text-gray-500 mt-1">Self-correction index</div>
        </div>
      </div>

      {/* Corrective Steps & News Filtering */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
        {/* Corrective Models */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-medium px-1">
            <RefreshCw className="w-4 h-4" />
            Model Corrections (Self-Learning)
          </div>
          <div className="space-y-2">
            {(memory.correctiveSteps || ["No recent corrections required"]).map((step, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-sm text-amber-100 hover:bg-amber-500/10 transition-colors flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] mt-1.5 shrink-0" />
                {step}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Fake News Filtering */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-medium px-1">
            <Shield className="w-4 h-4" />
            Credibility & News Filters Applied
          </div>
          <div className="space-y-2">
            {(memory.newsFiltersApplied || ["All verified sources retained"]).map((filter, i) => (
              <motion.div 
                key={i}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-sky-500/5 border border-sky-500/10 text-sm text-sky-100 hover:bg-sky-500/10 transition-colors flex items-start gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                {filter}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Insights & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Insights */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-blue-400 font-medium px-1">
            <Zap className="w-4 h-4" />
            Key Insights
          </div>
          <div className="space-y-2">
            {memory.keyInsights.map((insight, i) => (
              <motion.div 
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-white/5 border border-white/5 text-sm text-gray-300 hover:bg-white/10 transition-colors"
              >
                {insight}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Alpha Opportunities */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400 font-medium px-1">
            <Target className="w-4 h-4" />
            Alpha Candidates
          </div>
          <div className="space-y-2">
            {memory.alphaOpportunities.map((opportunity, i) => (
              <motion.div 
                key={i}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="p-3 rounded-lg bg-green-500/5 border border-green-500/10 text-sm text-gray-300 hover:bg-green-500/10 transition-colors flex items-center gap-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                {opportunity}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk & Barriers */}
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
        <div className="flex items-center gap-2 text-red-400 font-medium mb-3">
          <Shield className="w-4 h-4" />
          Neural Risk Assessment
        </div>
        <div className="flex flex-wrap gap-2">
          {memory.perceivedRisks.map((risk, i) => (
            <span key={i} className="px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              {risk}
            </span>
          ))}
        </div>
      </div>

      {/* Learned Patterns */}
      <div className="space-y-3">
        <div className="text-xs text-gray-500 px-1 uppercase font-bold tracking-widest">Learned Relationship Patterns</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {memory.learnedPatterns.map((lp, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-[10px] text-gray-400 px-1">
                <span className="truncate">{lp.pattern}</span>
                <span>{Math.round(lp.significance * 100)}% Sig.</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${lp.significance * 100}%` }}
                  className="h-full bg-blue-500/50"
                  transition={{ duration: 1, delay: i * 0.2 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
