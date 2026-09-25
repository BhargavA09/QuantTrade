import React from 'react';
import { FINVIZ_INDEX_TICKERS } from '../../data/finvizData';
import { cn } from '../../utils/cn';

export const FinvizTickerTape: React.FC = () => {
  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 text-[11px] font-mono select-none overflow-x-auto scrollbar-none py-1.5 px-3">
      <div className="flex items-center gap-6 min-w-max">
        {FINVIZ_INDEX_TICKERS.map((item) => (
          <div key={item.symbol} className="flex items-center gap-2">
            <span className="font-bold text-zinc-300">{item.name}</span>
            <span className="text-zinc-400 font-semibold">{item.value}</span>
            <span className={cn(
              "font-bold",
              item.up ? "text-emerald-400" : "text-rose-400"
            )}>
              {item.change} ({item.pct})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
