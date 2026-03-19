import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '../utils/cn';

interface Model {
  name: string;
  confidence: string;
  forecast: { date: string; price: number }[];
}

interface ModelComparisonProps {
  models: Model[];
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({ models }) => {
  if (!models) return null;

  return (
    <section>
      <h4 className="text-zinc-100 font-semibold mb-3 flex items-center gap-2">
        <Activity size={16} className="text-emerald-400" />
        Forecast Model Comparison
      </h4>
      <p className="text-xs text-zinc-500 mb-4 italic">
        Comparison of different predictive methodologies for the next 30 days.
      </p>
      <div className="space-y-3">
        {models.map((model, idx) => (
          <div key={idx} className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-zinc-200">{model.name}</p>
              <div className={cn(
                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter",
                model.confidence === 'High' ? 'bg-emerald-500/10 text-emerald-400' : 
                model.confidence === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
              )}>
                {model.confidence} Confidence
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-zinc-500 mb-1">Methodology</p>
                <p className="text-[10px] text-zinc-400 max-w-[200px]">
                  {model.name.includes('GBM') ? 'Stochastic process using drift and volatility.' : 
                   model.name.includes('ARIMA') ? 'Statistical model for time series forecasting.' : 
                   'Deep learning model for complex pattern recognition.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-mono font-bold text-zinc-100 leading-none">
                  ${model.forecast[model.forecast.length - 1].price.toFixed(2)}
                </p>
                <p className="text-[10px] text-zinc-500 mt-1">30D Target Price</p>
              </div>
            </div>
            <div className="mt-3 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  model.confidence === 'High' ? 'bg-emerald-500 w-[90%]' : 
                  model.confidence === 'Medium' ? 'bg-amber-500 w-[60%]' : 'bg-rose-500 w-[30%]'
                )}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
