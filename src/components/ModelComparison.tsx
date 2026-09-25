import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, ReferenceLine, AreaChart, Area
} from 'recharts';
import { 
  Cpu, Brain, Activity, TrendingUp, TrendingDown, 
  AlertCircle, Info, CheckCircle2, Zap
} from 'lucide-react';
import { motion } from 'motion/react';
import { StockData } from '../types';
import { cn } from '../utils/cn';

interface ModelComparisonProps {
  models: { name: string; forecast: { date: string; price: number }[]; confidence: string }[];
  currentPrice: number;
}

export default function ModelComparison({ models, currentPrice }: ModelComparisonProps) {

  const chartData = useMemo(() => {
    if (models.length === 0) return [];

    // Align all model forecasts by date
    const dateMap: Record<string, any> = {};
    
    models.forEach(model => {
      model.forecast.forEach(point => {
        if (!dateMap[point.date]) {
          dateMap[point.date] = { date: point.date };
        }
        dateMap[point.date][model.name.split(' ')[0]] = point.price;
      });
    });

    return Object.values(dateMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [models]);

  const divergence = useMemo(() => {
    if (chartData.length === 0) return 0;
    const lastPoint = chartData[chartData.length - 1];
    const prices = models.map(m => lastPoint[m.name.split(' ')[0]]).filter(p => p !== undefined);
    if (prices.length < 2) return 0;
    
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    return ((max - min) / min) * 100;
  }, [chartData, models]);

  const getConfidenceColor = (confidence: string) => {
    switch (confidence.toLowerCase()) {
      case 'high': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
    }
  };

  if (models.length === 0) return null;

  return (
    <div className="bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
            <Brain className="text-purple-400" size={24} />
            Multi-Model Forecast Comparison
          </h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Ensemble Analysis: GBM vs ARIMA vs LSTM
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "px-4 py-2 rounded-2xl border flex items-center gap-2",
            divergence > 5 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          )}>
            <Activity size={16} />
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Model Divergence</p>
              <p className="text-sm font-black">{divergence.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Model Cards */}
        <div className="lg:col-span-1 space-y-4">
          {models.map((model, idx) => (
            <motion.div 
              key={model.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 hover:border-zinc-700 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-lg border uppercase tracking-widest",
                  getConfidenceColor(model.confidence)
                )}>
                  {model.confidence} Confidence
                </span>
                <Zap size={14} className={idx === 0 ? "text-emerald-400" : idx === 1 ? "text-blue-400" : "text-amber-400"} />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">{model.name.split(' (')[0]}</h4>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tight mb-3">
                {model.name.split('(')[1]?.replace(')', '') || 'Predictive Model'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400">Target</span>
                <span className="text-sm font-black text-white">
                  ${model.forecast[model.forecast.length - 1].price.toFixed(2)}
                </span>
              </div>
            </motion.div>
          ))}

          <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-purple-400" />
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Ensemble Insight</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              {divergence > 5 
                ? "High divergence detected. Models are reacting differently to recent volatility. Exercise caution with LSTM projections."
                : "Models show strong convergence. High statistical probability of the projected trend continuing."}
            </p>
          </div>
        </div>

        {/* Comparison Chart */}
        <div className="lg:col-span-3 bg-zinc-950 rounded-2xl border border-zinc-800 p-4">
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#4b5563" 
                  fontSize={10} 
                  tickFormatter={(val) => `$${val}`}
                  axisLine={false}
                  tickLine={false}
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="GBM" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={false}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="ARIMA" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={false}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="LSTM" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="3 3"
                  dot={false}
                  animationDuration={1500}
                />
                <ReferenceLine y={currentPrice} stroke="#4b5563" strokeDasharray="3 3" label={{ value: 'Current', position: 'left', fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-6 px-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">GBM: Stochastic Drift</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ARIMA: Time-Series AutoReg</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">LSTM: Deep Learning Memory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
