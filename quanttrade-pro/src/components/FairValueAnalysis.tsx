import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calculator, DollarSign, TrendingUp, TrendingDown, Info, BarChart3, Activity } from 'lucide-react';
import { StockData } from '../types';

interface FairValueAnalysisProps {
  data: StockData;
}

const FairValueAnalysis: React.FC<FairValueAnalysisProps> = ({ data }) => {
  const currentPrice = data.currentPrice;
  
  // Pre-calculated fair values (simulated based on current price for demonstration)
  const dcfValue = currentPrice * 1.15; // Discounted Cash Flow
  const grahamNumber = currentPrice * 0.92; // Graham Number
  const multiplesValue = currentPrice * 1.08; // Comparable Multiples
  
  const averageFairValue = (dcfValue + grahamNumber + multiplesValue) / 3;
  const marginOfSafety = ((averageFairValue - currentPrice) / currentPrice) * 100;

  const [customGrowthRate, setCustomGrowthRate] = useState(5);
  const [customDiscountRate, setCustomDiscountRate] = useState(10);
  const [customEps, setCustomEps] = useState(currentPrice / 15); // Rough EPS estimate

  // Simple DCF Calculator
  const calculateCustomDCF = () => {
    let value = 0;
    let currentCashFlow = customEps;
    for (let i = 1; i <= 5; i++) {
      currentCashFlow *= (1 + customGrowthRate / 100);
      value += currentCashFlow / Math.pow(1 + customDiscountRate / 100, i);
    }
    // Terminal value (assuming 2% perpetual growth)
    const terminalValue = (currentCashFlow * 1.02) / ((customDiscountRate - 2) / 100);
    value += terminalValue / Math.pow(1 + customDiscountRate / 100, 5);
    return value;
  };

  const customDCFValue = calculateCustomDCF();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Summary Card */}
        <div className="glass-card p-6 lg:col-span-3 bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <BarChart3 size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-zinc-100 tracking-tight">Intrinsic Value Analysis</h2>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{data.ticker} Valuation Models</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Price</p>
              <p className="text-2xl font-black font-mono text-zinc-100">${currentPrice.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Avg Fair Value</p>
              <p className="text-2xl font-black font-mono text-blue-400">${averageFairValue.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 md:col-span-2 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Margin of Safety</p>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-black font-mono ${marginOfSafety > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {marginOfSafety > 0 ? '+' : ''}{marginOfSafety.toFixed(2)}%
                  </span>
                  {marginOfSafety > 0 ? <TrendingUp size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
                </div>
              </div>
              <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${marginOfSafety > 10 ? 'bg-emerald-500/20 text-emerald-400' : marginOfSafety < -10 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {marginOfSafety > 10 ? 'Undervalued' : marginOfSafety < -10 ? 'Overvalued' : 'Fairly Valued'}
              </div>
            </div>
          </div>
        </div>

        {/* Pre-calculated Models */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-emerald-500" />
            Valuation Models
          </h3>
          <div className="space-y-4">
            {[
              { name: 'Discounted Cash Flow (DCF)', value: dcfValue, desc: 'Estimates value based on expected future cash flows.' },
              { name: 'Graham Number', value: grahamNumber, desc: 'Defensive valuation based on EPS and Book Value.' },
              { name: 'Comparable Multiples', value: multiplesValue, desc: 'Valuation based on industry peer P/E and EV/EBITDA.' }
            ].map((model, i) => (
              <div key={i} className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-between group hover:border-zinc-700 transition-colors">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-zinc-200">{model.name}</h4>
                  <p className="text-[10px] text-zinc-500 mt-1">{model.desc}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-black font-mono text-zinc-100">${model.value.toFixed(2)}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${model.value > currentPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {((model.value - currentPrice) / currentPrice * 100).toFixed(1)}% {model.value > currentPrice ? 'Upside' : 'Downside'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Calculator */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-blue-500" />
            Custom DCF Calculator
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                Expected Growth Rate (%)
              </label>
              <input 
                type="range" 
                min="0" max="30" step="1"
                value={customGrowthRate}
                onChange={(e) => setCustomGrowthRate(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-right text-xs font-mono text-zinc-300 mt-1">{customGrowthRate}%</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">
                Discount Rate (%)
              </label>
              <input 
                type="range" 
                min="5" max="20" step="1"
                value={customDiscountRate}
                onChange={(e) => setCustomDiscountRate(Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="text-right text-xs font-mono text-zinc-300 mt-1">{customDiscountRate}%</div>
            </div>
            <div className="pt-4 border-t border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Calculated Fair Value</p>
              <div className="flex items-end gap-3">
                <span className="text-3xl font-black font-mono text-blue-400">
                  ${customDCFValue.toFixed(2)}
                </span>
                <span className={`text-xs font-bold mb-1 ${customDCFValue > currentPrice ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {((customDCFValue - currentPrice) / currentPrice * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FairValueAnalysis;
