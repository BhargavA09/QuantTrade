import React from 'react';
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

export const DistributionChart = ({ simulations }: { simulations: number[][] }) => {
  const finalPrices = simulations.map(s => s[s.length - 1]);
  const min = Math.min(...finalPrices);
  const max = Math.max(...finalPrices);
  const bins = 20;
  const step = (max - min) / bins;
  
  const histogram = Array.from({ length: bins }).map((_, i) => {
    const rangeMin = min + i * step;
    const rangeMax = rangeMin + step;
    const count = finalPrices.filter(p => p >= rangeMin && p < rangeMax).length;
    return {
      range: `$${rangeMin.toFixed(0)}`,
      count
    };
  });

  return (
    <div className="h-[200px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={histogram}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis dataKey="range" tick={{ fontSize: 8, fill: '#71717a' }} />
          <YAxis hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            itemStyle={{ color: '#10b981' }}
          />
          <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]}>
            {histogram.map((entry, index) => (
              <Cell key={`cell-${index}`} fillOpacity={0.4 + (entry.count / simulations.length) * 0.6} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


