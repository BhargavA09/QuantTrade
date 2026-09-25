import React from 'react';
import { motion } from 'motion/react';
import { Brain, Zap, Activity, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { ModelInsight } from '../types';
import { cn } from '../utils/cn';
import { retrainModel } from '../services/api';

interface LearningStatusProps {
  insight?: ModelInsight;
  onRetrain?: () => void;
}

const LearningStatus: React.FC<LearningStatusProps> = ({ insight, onRetrain }) => {
  const [isRetraining, setIsRetraining] = React.useState(false);
  const [learningMetrics, setLearningMetrics] = React.useState({
    learningRate: insight?.learningRate || 0.001,
    lossTrend: insight?.lossTrend || 'decreasing',
    epochs: 14502
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLearningMetrics(prev => ({
        learningRate: prev.learningRate * (0.99 + Math.random() * 0.02),
        lossTrend: Math.random() > 0.8 ? (prev.lossTrend === 'decreasing' ? 'stable' : 'decreasing') : prev.lossTrend,
        epochs: prev.epochs + Math.floor(Math.random() * 5)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!insight) return null;

  const handleRetrain = async () => {
    setIsRetraining(true);
    await retrainModel();
    setIsRetraining(false);
    if (onRetrain) onRetrain();
  };

  return (
    <div className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 px-6 py-3 flex items-center justify-between overflow-x-auto no-scrollbar gap-8 relative z-50">
      <div className="scanline opacity-[0.02]" />
      
      <div className="flex items-center gap-8 shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
            <Brain size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Neural Engine</span>
            <span className="text-[11px] font-black text-white tracking-tighter glow-text-emerald">{insight.modelVersion}</span>
          </div>
        </div>

        <div className="h-8 w-[1px] bg-zinc-800/50" />

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Zap size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Learning Rate</span>
            <span className="text-[11px] font-mono font-bold text-blue-400 glow-text-blue">{learningMetrics.learningRate.toFixed(6)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg border transition-colors",
            learningMetrics.lossTrend === 'decreasing' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          )}>
            <Activity size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Loss Trend</span>
            <span className={cn(
              "text-[11px] font-black uppercase tracking-tighter",
              learningMetrics.lossTrend === 'decreasing' ? "text-emerald-400 glow-text-emerald" : "text-amber-400"
            )}>{learningMetrics.lossTrend}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <RefreshCw size={16} className="animate-spin-slow" style={{ animationDuration: '4s' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.2em]">Continuous Training</span>
            <span className="text-[11px] font-mono font-bold text-purple-400">EPOCH {learningMetrics.epochs.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 relative z-10">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
          <Database size={12} className="text-zinc-500" />
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Features: {insight.activeFeatures.length} Active</span>
        </div>
        
        <button 
          onClick={handleRetrain}
          disabled={isRetraining}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-lg border transition-all duration-300 shadow-lg",
            isRetraining 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-not-allowed" 
              : "bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400 font-black"
          )}
        >
          <RefreshCw size={12} className={cn(isRetraining && "animate-spin")} />
          <span className="text-[10px] uppercase tracking-widest">
            {isRetraining ? "Retraining..." : "Retrain Engine"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default LearningStatus;
