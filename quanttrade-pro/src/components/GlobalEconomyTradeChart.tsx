import React, { useMemo } from 'react';
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

const GlobalEconomyTradeChart = ({ data }: { data: Record<string, number> }) => {
  const chartData = useMemo(() => {
    return Object.entries(data).map(([region, volume]) => ({
      name: region.toUpperCase(),
      volume: volume,
      color: volume >= 0 ? '#10b981' : '#ef4444'
    }));
  }, [data]);

  return (
    <div className="h-64 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 10 }} 
            unit="%"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
            itemStyle={{ fontWeight: 'bold' }}
            cursor={{ fill: '#18181b' }}
          />
          <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GlobalEconomyTradeChart;
