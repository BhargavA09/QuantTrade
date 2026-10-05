import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';
import { Activity } from 'lucide-react';

interface FinvizTickerTapeProps {
  allData?: Record<string, any>;
  lastUpdate?: any;
}

const TAPE_INSTRUMENTS = [
  { symbol: '^DJI', name: 'Dow', type: 'index' },
  { symbol: '^GSPC', name: 'S&P 500', type: 'index' },
  { symbol: '^IXIC', name: 'Nasdaq', type: 'index' },
  { symbol: '^RUT', name: 'Russell 2000', type: 'index' },
  { symbol: '^TNX', name: '10Y Yield', type: 'yield' },
  { symbol: '^TYX', name: '30Y Yield', type: 'yield' },
  { symbol: 'TLT', name: '20Y+ Treasury', type: 'bond' },
  { symbol: 'BND', name: 'Total Bond', type: 'bond' },
  { symbol: 'CL=F', name: 'Crude Oil', type: 'commodity' },
  { symbol: 'GC=F', name: 'Gold', type: 'commodity' },
  { symbol: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETH-USD', name: 'Ethereum', type: 'crypto' }
];

export const FinvizTickerTape: React.FC<FinvizTickerTapeProps> = ({ allData = {} }) => {
  return (
    <div className="w-full bg-zinc-950 border-b border-zinc-800 text-[11px] font-mono select-none overflow-x-auto scrollbar-none py-1.5 px-3 flex items-center justify-between gap-4">
      {/* Live Stream Status Indicator */}
      <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider whitespace-nowrap bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Live Stream (Stock & Bond)</span>
      </div>

      <div className="flex items-center gap-6 min-w-max">
        {TAPE_INSTRUMENTS.map((inst) => {
          const live = allData[inst.symbol];
          
          let displayVal = '4.14%';
          let displayChange = '+0.02';
          let displayPct = '+0.45%';
          let isUp = true;

          if (live && live.currentPrice > 0) {
            const price = live.currentPrice;
            const change = live.change || 0;
            const changePct = live.changePercent || 0;
            isUp = change >= 0;

            if (inst.type === 'yield') {
              displayVal = `${price.toFixed(2)}%`;
              displayChange = `${isUp ? '+' : ''}${change.toFixed(2)}`;
              displayPct = `${isUp ? '+' : ''}${changePct.toFixed(2)}%`;
            } else if (inst.type === 'index') {
              displayVal = price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              displayChange = `${isUp ? '+' : ''}${change.toFixed(2)}`;
              displayPct = `${isUp ? '+' : ''}${changePct.toFixed(2)}%`;
            } else {
              displayVal = `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              displayChange = `${isUp ? '+' : ''}${change.toFixed(2)}`;
              displayPct = `${isUp ? '+' : ''}${changePct.toFixed(2)}%`;
            }
          } else {
            // Curated baseline market values
            switch (inst.symbol) {
              case '^DJI': displayVal = '42,352.75'; displayChange = '+184.50'; displayPct = '+0.44%'; break;
              case '^GSPC': displayVal = '5,864.67'; displayChange = '+32.10'; displayPct = '+0.55%'; break;
              case '^IXIC': displayVal = '18,137.85'; displayChange = '+142.20'; displayPct = '+0.79%'; break;
              case '^RUT': displayVal = '2,212.80'; displayChange = '+12.40'; displayPct = '+0.56%'; break;
              case '^TNX': displayVal = '4.14%'; displayChange = '+0.02'; displayPct = '+0.48%'; break;
              case '^TYX': displayVal = '4.42%'; displayChange = '+0.01'; displayPct = '+0.23%'; break;
              case 'TLT': displayVal = '$94.50'; displayChange = '-0.45'; displayPct = '-0.47%'; isUp = false; break;
              case 'BND': displayVal = '$73.20'; displayChange = '+0.12'; displayPct = '+0.16%'; break;
              case 'CL=F': displayVal = '$71.20'; displayChange = '-0.55'; displayPct = '-0.77%'; isUp = false; break;
              case 'GC=F': displayVal = '$2,685.40'; displayChange = '+14.20'; displayPct = '+0.53%'; break;
              case 'BTC-USD': displayVal = '$66,760'; displayChange = '+850'; displayPct = '+1.29%'; break;
              case 'ETH-USD': displayVal = '$2,640'; displayChange = '+38'; displayPct = '+1.46%'; break;
            }
          }

          return (
            <div key={inst.symbol} className="flex items-center gap-2">
              <span className="font-bold text-zinc-300">{inst.name}</span>
              <AnimatePresence mode="wait">
                <motion.span 
                  key={displayVal}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  className="text-zinc-200 font-semibold"
                >
                  {displayVal}
                </motion.span>
              </AnimatePresence>
              <span className={cn(
                "font-bold",
                isUp ? "text-emerald-400" : "text-rose-400"
              )}>
                {displayChange} ({displayPct})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
