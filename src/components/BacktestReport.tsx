import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { RefreshCw } from 'lucide-react';

interface BacktestData {
  results: { date: string; actual: number; predicted: number; error: number }[];
  accuracy: number;
}

const BacktestReport = ({ backtest }: { backtest: BacktestData }) => {
  return (
    <div className="glass-card p-4 border-blue-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <RefreshCw size={14} className="text-blue-400" />
          Stability Backtest Report
        </h3>
        <span className="text-xs font-bold text-blue-400">{backtest.accuracy}% Accuracy</span>
      </div>
      <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={backtest.results}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} dot={false} name="Actual" />
            <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" dot={false} name="Predicted" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[9px] text-zinc-500 mt-2 italic">
        Comparing last 10 days of historical data against model predictions for stability verification.
      </p>
    </div>
  );
};

export default BacktestReport;
