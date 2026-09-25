import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  AlertTriangle,
  Info,
  Calendar,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { cn } from '../utils/cn';

const YIELD_DATA = [
  { maturity: '1 Mo', months: 1, current: 5.39, previous: 5.37, normal: 2.10 },
  { maturity: '3 Mo', months: 3, current: 5.43, previous: 5.45, normal: 2.30 },
  { maturity: '6 Mo', months: 6, current: 5.35, previous: 5.42, normal: 2.50 },
  { maturity: '1 Yr', months: 12, current: 5.01, previous: 5.12, normal: 2.80 },
  { maturity: '2 Yr', months: 24, current: 4.72, previous: 4.85, normal: 3.10 },
  { maturity: '3 Yr', months: 36, current: 4.51, previous: 4.60, normal: 3.30 },
  { maturity: '5 Yr', months: 60, current: 4.32, previous: 4.41, normal: 3.50 },
  { maturity: '7 Yr', months: 84, current: 4.31, previous: 4.42, normal: 3.70 },
  { maturity: '10 Yr', months: 120, current: 4.30, previous: 4.41, normal: 4.00 },
  { maturity: '20 Yr', months: 240, current: 4.55, previous: 4.64, normal: 4.50 },
  { maturity: '30 Yr', months: 360, current: 4.45, previous: 4.53, normal: 4.80 },
];

export const YieldCurveAnalysis: React.FC = () => {
  const [activeView, setActiveView] = useState<'current' | 'comparison' | 'normal'>('current');

  // Calculate spreads
  const spread2y10y = YIELD_DATA[8].current - YIELD_DATA[4].current; // 10Y - 2Y
  const spread3m10y = YIELD_DATA[8].current - YIELD_DATA[1].current; // 10Y - 3M
  
  const isInverted = spread2y10y < 0 || spread3m10y < 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <Activity className="text-emerald-500" />
            Treasury Yield Curve Analysis
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Analyze the shape of the yield curve to make macroeconomic and portfolio allocation decisions.
          </p>
        </div>
        
        <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 self-start">
          <button
            onClick={() => setActiveView('current')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeView === 'current' 
                ? "bg-emerald-500 text-zinc-950 shadow-lg shadow-emerald-500/20" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Current
          </button>
          <button
            onClick={() => setActiveView('comparison')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeView === 'comparison' 
                ? "bg-blue-500 text-zinc-950 shadow-lg shadow-blue-500/20" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Historical Shift
          </button>
          <button
            onClick={() => setActiveView('normal')}
            className={cn(
              "px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all",
              activeView === 'normal' 
                ? "bg-purple-500 text-zinc-950 shadow-lg shadow-purple-500/20" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            Normal vs Inverted
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl">
        <h3 className="text-sm font-bold text-zinc-100 mb-6 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 size={16} className="text-emerald-400" />
          Yield Curve Visualization
        </h3>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={YIELD_DATA} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis 
                dataKey="maturity" 
                stroke="#52525b" 
                tick={{ fill: '#71717a', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                stroke="#52525b" 
                tick={{ fill: '#71717a', fontSize: 12 }} 
                tickFormatter={(val) => `${val}%`}
                domain={['dataMin - 0.5', 'dataMax + 0.5']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '12px' }}
                itemStyle={{ color: '#e4e4e7', fontSize: '12px', fontWeight: 'bold' }}
                labelStyle={{ color: '#a1a1aa', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}
                formatter={(value: number) => [`${value.toFixed(2)}%`, 'Yield']}
              />
              
              {activeView === 'current' && (
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  name="Current Yield" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#18181b', stroke: '#10b981', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#047857', strokeWidth: 2 }}
                />
              )}
              
              {activeView === 'comparison' && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    name="Current Yield" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#18181b', stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="previous" 
                    name="1 Month Ago" 
                    stroke="#71717a" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}

              {activeView === 'normal' && (
                <>
                  <Line 
                    type="monotone" 
                    dataKey="current" 
                    name="Current (Inverted)" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#18181b', stroke: '#f43f5e', strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="normal" 
                    name="Normal Shape" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Status Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl col-span-1">
          <h3 className="text-xs font-black text-zinc-400 mb-4 uppercase tracking-widest flex items-center gap-2">
            <Activity size={14} className="text-amber-400" />
            Curve Status
          </h3>
          
          <div className="space-y-4">
            <div className={cn(
              "p-4 rounded-2xl border flex items-start gap-3",
              isInverted ? "bg-rose-500/10 border-rose-500/20" : "bg-emerald-500/10 border-emerald-500/20"
            )}>
              {isInverted ? (
                <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
              ) : (
                <TrendingUp className="text-emerald-400 shrink-0 mt-0.5" size={18} />
              )}
              <div>
                <p className={cn("text-sm font-bold", isInverted ? "text-rose-400" : "text-emerald-400")}>
                  {isInverted ? "Yield Curve is Inverted" : "Yield Curve is Normal"}
                </p>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  {isInverted 
                    ? "Short-term interest rates are higher than long-term rates. Historically, this has been a leading indicator of economic recession." 
                    : "Long-term interest rates are higher than short-term rates, reflecting normal economic expansion and inflation expectations."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">2Y-10Y Spread</p>
                <p className={cn("text-lg font-mono font-black", spread2y10y < 0 ? "text-rose-400" : "text-emerald-400")}>
                  {spread2y10y > 0 ? '+' : ''}{spread2y10y.toFixed(2)} bps
                </p>
              </div>
              <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">3M-10Y Spread</p>
                <p className={cn("text-lg font-mono font-black", spread3m10y < 0 ? "text-rose-400" : "text-emerald-400")}>
                  {spread3m10y > 0 ? '+' : ''}{spread3m10y.toFixed(2)} bps
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Financial Decisions */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-3xl col-span-1 md:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <BarChart3 size={120} />
          </div>
          
          <h3 className="text-xs font-black text-zinc-400 mb-6 uppercase tracking-widest flex items-center gap-2 relative z-10">
            <Info size={14} className="text-blue-400" />
            Financial Decision Impact
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl hover:bg-zinc-900/60 transition-colors">
              <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                <TrendingDown size={14} className="text-amber-400" />
                Borrowing & Debt
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                In an inverted curve environment, short-term borrowing costs are elevated. Wait to lock in long-term fixed rates as they are expected to fall if central banks cut rates to stimulate the economy.
              </p>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded inline-block">
                Action: Favor variable debt (short-term)
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl hover:bg-zinc-900/60 transition-colors">
              <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                <Activity size={14} className="text-emerald-400" />
                Portfolio Allocation
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Equities may face pressure during an inversion-induced slowdown. High short-term yields offer attractive risk-free returns on cash, while long-duration bonds appreciate when rates eventually drop.
              </p>
              <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded inline-block">
                Action: Increase Cash/Short-duration
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl hover:bg-zinc-900/60 transition-colors">
              <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                <Calendar size={14} className="text-purple-400" />
                Real Estate / Mortgages
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                Long-term mortgage rates generally track the 10-year yield. While an inverted curve might mean slightly lower mortgage rates relative to short-term loans, a recession could affect property values.
              </p>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 bg-purple-500/10 px-2 py-1 rounded inline-block">
                Action: Delay major purchases if risky
              </div>
            </div>

            <div className="bg-zinc-950/40 border border-zinc-800/60 p-4 rounded-2xl hover:bg-zinc-900/60 transition-colors">
              <h4 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                <TrendingUp size={14} className="text-rose-400" />
                Business Expansion
              </h4>
              <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                A recession warning from the yield curve suggests a contraction in consumer demand. Businesses should prioritize liquidity, build cash reserves, and delay debt-funded expansions.
              </p>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-1 rounded inline-block">
                Action: Conserve capital & liquidity
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};
