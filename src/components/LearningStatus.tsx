import React from 'react';
import { motion } from 'framer-motion';
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

  if (!insight) return null;

  const handleRetrain = async () => {
    setIsRetraining(true);
    await retrainModel();
    setIsRetraining(false);
    if (onRetrain) onRetrain();
  };

  return (
    <div className="bg-black/40 backdrop-blur-md border-b border-zinc-800/50 px-6 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-8">
      <div className="flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
            <Brain size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Model Engine</span>
            <span className="text-[11px] font-bold text-zinc-200">{insight.modelVersion}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-blue-500/10 text-blue-400">
            <Zap size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Learning Rate</span>
            <span className="text-[11px] font-bold text-zinc-200">{insight.learningRate.toFixed(4)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1 rounded",
            insight.lossTrend === 'decreasing' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
          )}>
            <Activity size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Loss Trend</span>
            <span className={cn(
              "text-[11px] font-bold uppercase",
              insight.lossTrend === 'decreasing' ? "text-emerald-400" : "text-amber-400"
            )}>{insight.lossTrend}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/50 border border-zinc-800">
          <Database size={12} className="text-zinc-500" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Features: {insight.activeFeatures.length} Active</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck size={12} className="text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Model Validated</span>
        </div>

        <button 
          onClick={handleRetrain}
          disabled={isRetraining}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full border transition-all duration-300",
            isRetraining 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400 cursor-not-allowed" 
              : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
          )}
        >
          <RefreshCw size={12} className={cn(isRetraining && "animate-spin")} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">
            {isRetraining ? "Retraining..." : "Retrain Engine"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default LearningStatus;
