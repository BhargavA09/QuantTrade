import React, { useState } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip,
  Cell
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Pattern {
  sector: string;
  pattern: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  confidence: number;
}

interface TradePatternVisualizerProps {
  patterns: Pattern[];
  summary: string;
}

const TradePatternVisualizer: React.FC<TradePatternVisualizerProps> = ({ patterns, summary }) => {
  const [view, setView] = useState<'radar' | 'list'>('radar');

  // Prepare data for Radar Chart
  const radarData = patterns.map(p => ({
    subject: p.sector,
    A: Math.abs(p.impactScore),
    fullMark: 100,
    impact: p.impact,
    score: p.impactScore
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-emerald-500" />
          <h3 className="text-xs font-black uppercase tracking-widest text-zinc-100">Trade Pattern Intelligence</h3>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setView('radar')}
            className={cn(
              "px-4 py-1.5 text-[10px] font-black rounded-lg uppercase transition-all", 
              view === 'radar' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Radar
          </button>
          <button 
            onClick={() => setView('list')}
            className={cn(
              "px-4 py-1.5 text-[10px] font-black rounded-lg uppercase transition-all", 
              view === 'list' ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            List
          </button>
        </div>
      </div>

      <div className="p-5 rounded-[2rem] bg-zinc-900/30 border border-zinc-800/50 backdrop-blur-sm">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Info size={16} className="text-emerald-400" />
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed italic">
            {summary}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'radar' ? (
            <motion.div
              key="radar"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-[400px] w-full flex items-center justify-center"
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#71717a', fontSize: 10, fontWeight: 800 }} 
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 100]} 
                    tick={false} 
                    axisLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#27272a', 
                      borderRadius: '16px',
                      fontSize: '10px'
                    }}
                  />
                  <Radar
                    name="Impact Intensity"
                    dataKey="A"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {patterns.map((p, i) => (
                <div 
                  key={i}
                  className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 hover:border-emerald-500/30 transition-colors group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-100">{p.sector}</h4>
                      <div className="flex items-center gap-1 mt-1">
                        {p.impact === 'positive' ? (
                          <TrendingUp size={12} className="text-emerald-500" />
                        ) : p.impact === 'negative' ? (
                          <TrendingDown size={12} className="text-rose-500" />
                        ) : (
                          <Minus size={12} className="text-zinc-500" />
                        )}
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-tighter",
                          p.impact === 'positive' ? "text-emerald-500" : p.impact === 'negative' ? "text-rose-500" : "text-zinc-500"
                        )}>
                          {p.impact} Impact
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-black font-mono text-zinc-100">
                        {p.impactScore > 0 ? '+' : ''}{p.impactScore}
                      </span>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Score</p>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {p.pattern}
                  </p>
                  <div className="mt-4 pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase">Confidence</span>
                      <span className="text-[10px] font-mono font-bold text-zinc-200">{(p.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "w-1 h-3 rounded-full",
                            idx < Math.ceil(Math.abs(p.impactScore) / 20) 
                              ? (p.impactScore > 0 ? "bg-emerald-500" : "bg-rose-500") 
                              : "bg-zinc-800"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TradePatternVisualizer;
