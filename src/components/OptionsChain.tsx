import React from 'react';
import { ChevronRight } from 'lucide-react';

interface OptionsChainProps {
  currentPrice: number;
}

export const OptionsChain: React.FC<OptionsChainProps> = ({ currentPrice }) => {
  const options = [
    { strike: (currentPrice * 1.05).toFixed(0), type: 'Call', iv: '24.2%', delta: '0.45' },
    { strike: (currentPrice * 0.95).toFixed(0), type: 'Put', iv: '28.1%', delta: '-0.38' },
    { strike: (currentPrice * 1.10).toFixed(0), type: 'Call', iv: '22.5%', delta: '0.22' },
  ];

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-bold mb-4">Options Chain Implied Volatility</h3>
      <div className="space-y-3">
        {options.map((opt, i) => (
          <div key={i} className="flex items-center justify-between p-3 bg-zinc-950 rounded-xl border border-zinc-800">
            <div>
              <p className="text-xs font-bold">${opt.strike} {opt.type}</p>
              <p className="text-[10px] text-zinc-500">IV: {opt.iv}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-mono text-emerald-400">Δ {opt.delta}</p>
              <ChevronRight size={14} className="text-zinc-700 inline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
