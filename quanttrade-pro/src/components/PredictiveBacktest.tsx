import React from 'react';
import { History } from 'lucide-react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { twMerge } from 'tailwind-merge';
import { clsx, type ClassValue } from 'clsx';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface PredictiveBacktestProps {
  backtest: any;
  currentPrice: number;
}

const PredictiveBacktest = React.memo(({ backtest, currentPrice }: PredictiveBacktestProps) => {
  if (!backtest || !backtest.results) return null;

  const totalProfit = backtest.results.reduce((acc: number, curr: any, idx: number, arr: any[]) => {
    if (idx === 0) return 0;
    const prevActual = arr[idx - 1].actual;
    const predictedTrend = curr.predicted > prevActual;
    const actualTrend = curr.actual > prevActual;
    
    // If we followed the prediction, did we make money?
    if (predictedTrend === actualTrend) {
      return acc + Math.abs(curr.actual - prevActual);
    } else {
      return acc - Math.abs(curr.actual - prevActual);
    }
  }, 0);

  const profitPercent = (totalProfit / backtest.results[0].actual) * 100;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <History size={14} className="text-purple-400" />
          Predictive Backtesting (10D)
        </h3>
        <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase">
          AI Simulation
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Model Accuracy</p>
          <div className="flex items-end gap-2">
            <p className="text-xl font-bold text-zinc-100">{backtest.accuracy}%</p>
            <div className="mb-1 h-1 w-12 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all", Number(backtest.accuracy) > 80 ? "bg-emerald-500" : "bg-amber-500")}
                style={{ width: `${backtest.accuracy}%` }}
              />
            </div>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase mb-1">Theoretical P/L</p>
          <div className="flex items-center gap-1">
            <p className={cn("text-xl font-bold", totalProfit >= 0 ? "text-emerald-400" : "text-rose-400")}>
              {totalProfit >= 0 ? '+' : ''}{totalProfit.toFixed(2)}
            </p>
            <span className={cn("text-[10px] font-bold", totalProfit >= 0 ? "text-emerald-500/50" : "text-rose-500/50")}>
              ({profitPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="h-32 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={backtest.results}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="actual" 
              stroke="#71717a" 
              strokeWidth={1} 
              dot={false} 
              name="Actual"
            />
            <Line 
              type="monotone" 
              dataKey="predicted" 
              stroke="#a855f7" 
              strokeWidth={2} 
              dot={false} 
              name="AI Predicted"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-zinc-600 text-center italic">
        * Theoretical P/L assumes execution on every predicted trend shift.
      </p>
    </div>
  );
});

PredictiveBacktest.displayName = 'PredictiveBacktest';

export default PredictiveBacktest;
