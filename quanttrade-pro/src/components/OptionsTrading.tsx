import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, TrendingUp, TrendingDown, ChevronRight, Info, Layers, BarChart3 } from 'lucide-react';
import { StockData } from '../types';

interface OptionsTradingProps {
  data: StockData;
}

const OptionsTrading: React.FC<OptionsTradingProps> = ({ data }) => {
  const currentPrice = data.currentPrice;
  const [expiration, setExpiration] = useState('2026-04-17');
  const [optionType, setOptionType] = useState<'calls' | 'puts'>('calls');

  // Generate mock options chain around current price
  const generateChain = (type: 'calls' | 'puts') => {
    const strikes = [];
    const step = currentPrice > 100 ? 5 : 1;
    const baseStrike = Math.round(currentPrice / step) * step;
    
    for (let i = -5; i <= 5; i++) {
      const strike = baseStrike + (i * step);
      const distance = Math.abs(strike - currentPrice) / currentPrice;
      
      // Mock pricing logic
      let price = type === 'calls' 
        ? Math.max(0.01, (currentPrice - strike) + (currentPrice * 0.05 * Math.exp(-distance * 10)))
        : Math.max(0.01, (strike - currentPrice) + (currentPrice * 0.05 * Math.exp(-distance * 10)));
      
      // Add some randomness
      price = price * (1 + (Math.random() * 0.1 - 0.05));

      const iv = 20 + (distance * 100) + (Math.random() * 5);
      const delta = type === 'calls' 
        ? Math.max(0.01, Math.min(0.99, 0.5 - (strike - currentPrice) / (currentPrice * 0.1)))
        : Math.min(-0.01, Math.max(-0.99, -0.5 - (strike - currentPrice) / (currentPrice * 0.1)));
      
      const gamma = 0.05 * Math.exp(-Math.pow((strike - currentPrice) / (currentPrice * 0.05), 2));
      const volume = Math.floor(Math.random() * 5000 * Math.exp(-distance * 5));
      const oi = volume * (2 + Math.random() * 3);

      strikes.push({
        strike,
        price,
        iv,
        delta,
        gamma,
        volume,
        oi: Math.floor(oi),
        inTheMoney: type === 'calls' ? strike < currentPrice : strike > currentPrice
      });
    }
    return strikes;
  };

  const chain = generateChain(optionType);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-card p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Layers size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-100 tracking-tight">Options Chain Analysis</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{data.ticker} Derivatives</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
              <button 
                onClick={() => setOptionType('calls')}
                className={`px-6 py-2 text-[10px] font-black rounded-lg uppercase transition-all ${optionType === 'calls' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Calls
              </button>
              <button 
                onClick={() => setOptionType('puts')}
                className={`px-6 py-2 text-[10px] font-black rounded-lg uppercase transition-all ${optionType === 'puts' ? 'bg-rose-500 text-black shadow-lg shadow-rose-500/20' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Puts
              </button>
            </div>
            
            <select 
              value={expiration}
              onChange={(e) => setExpiration(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500/50"
            >
              <option value="2026-03-27">Mar 27, 2026 (5d)</option>
              <option value="2026-04-17">Apr 17, 2026 (26d)</option>
              <option value="2026-05-15">May 15, 2026 (54d)</option>
              <option value="2026-06-19">Jun 19, 2026 (89d)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Options Chain Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-900/50 border-b border-zinc-800">
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Strike</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Last Price</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Vol / OI</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Implied Vol</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Delta</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Gamma</th>
                <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {chain.map((opt, i) => (
                <tr 
                  key={i} 
                  className={`border-b border-zinc-800/50 hover:bg-zinc-900/30 transition-colors ${opt.inTheMoney ? 'bg-zinc-900/10' : ''}`}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black font-mono ${opt.strike === Math.round(currentPrice) ? 'text-purple-400' : 'text-zinc-200'}`}>
                        ${opt.strike.toFixed(2)}
                      </span>
                      {opt.inTheMoney && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-zinc-800 text-zinc-400 uppercase tracking-widest">ITM</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm font-bold font-mono text-zinc-100">${opt.price.toFixed(2)}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-zinc-300">{opt.volume.toLocaleString()}</span>
                      <span className="text-[10px] text-zinc-600">{opt.oi.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs font-mono text-zinc-400">{opt.iv.toFixed(1)}%</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`text-xs font-mono font-bold ${opt.delta > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {opt.delta > 0 ? '+' : ''}{opt.delta.toFixed(3)}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-xs font-mono text-zinc-400">{opt.gamma.toFixed(4)}</span>
                  </td>
                  <td className="p-4 text-center">
                    <button className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 uppercase tracking-widest hover:bg-purple-500/20 transition-colors">
                      Trade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Greeks Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'IV Rank', value: '42.5%', desc: 'Moderate volatility' },
          { label: 'Put/Call Ratio', value: '0.85', desc: 'Bullish sentiment' },
          { label: 'Expected Move', value: '±$4.50', desc: 'By expiration' },
          { label: 'Historical Vol', value: '28.2%', desc: '30-day realized' }
        ].map((stat, i) => (
          <div key={i} className="glass-card p-4 border-zinc-800/50">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-xl font-black font-mono text-zinc-100">{stat.value}</p>
            <p className="text-[10px] text-zinc-600 mt-1">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OptionsTrading;
