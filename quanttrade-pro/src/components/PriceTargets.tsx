import React from 'react';
import { StockData } from '../types';

interface PriceTargetsProps {
  data: StockData;
}

export const PriceTargets: React.FC<PriceTargetsProps> = ({ data }) => {
  if (!data || !data.forecast) return null;

  const bearishPrice = data.simulations 
    ? Math.min(...data.simulations.map(s => s[s.length - 1])).toFixed(2) 
    : '---';
  
  const baseCasePrice = data.forecast[data.forecast.length - 1].price;
  
  const bullishPrice = data.simulations 
    ? Math.max(...data.simulations.map(s => s[s.length - 1])).toFixed(2) 
    : '---';

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="glass-card p-3 border-rose-500/10">
        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Bearish</p>
        <p className="text-lg font-bold text-rose-400">${bearishPrice}</p>
      </div>
      <div className="glass-card p-3 border-zinc-500/10">
        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Base Case</p>
        <p className="text-lg font-bold text-zinc-100">${baseCasePrice}</p>
      </div>
      <div className="glass-card p-3 border-emerald-500/10">
        <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Bullish</p>
        <p className="text-lg font-bold text-emerald-400">${bullishPrice}</p>
      </div>
    </div>
  );
};
