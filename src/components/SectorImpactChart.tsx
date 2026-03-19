import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import SectorHeatmap from './SectorHeatmap';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Pattern {
  sector: string;
  pattern: string;
  impact: 'positive' | 'negative' | 'neutral';
  impactScore: number;
  confidence: number;
}

const SectorImpactChart = ({ patterns }: { patterns: Pattern[] }) => {
  const [view, setView] = useState<'bar' | 'heatmap'>('bar');

  return (
    <div className="space-y-6 mt-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutGrid size={14} className="text-emerald-500" />
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sector Impact Analysis</h4>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setView('bar')}
            className={cn("px-3 py-1 text-[8px] font-bold rounded uppercase transition-all", view === 'bar' ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-500")}
          >
            Bar Chart
          </button>
          <button 
            onClick={() => setView('heatmap')}
            className={cn("px-3 py-1 text-[8px] font-bold rounded uppercase transition-all", view === 'heatmap' ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-500")}
          >
            Heatmap
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === 'bar' ? (
            <div className="h-[300px] w-full bg-zinc-950/30 rounded-3xl p-4 border border-zinc-800/50">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patterns} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                  <XAxis type="number" domain={[-100, 100]} stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="sector" type="category" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px', borderRadius: '12px' }}
                    cursor={{ fill: '#27272a', opacity: 0.4 }}
                  />
                  <Bar dataKey="impactScore" radius={[0, 4, 4, 0]} barSize={20}>
                    {patterns.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.impactScore > 0 ? '#10b981' : entry.impactScore < 0 ? '#ef4444' : '#71717a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <SectorHeatmap patterns={patterns} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default SectorImpactChart;
