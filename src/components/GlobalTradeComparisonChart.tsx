import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const GlobalTradeComparisonChart = ({ data }: { data: Record<string, number> }) => {
  const chartData = useMemo(() => {
    return Object.entries(data).map(([region, volume]) => ({
      name: region.toUpperCase(),
      volume: volume,
    })).sort((a, b) => b.volume - a.volume);
  }, [data]);

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
          />
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const val = payload[0].value as number;
                return (
                  <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg shadow-xl">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">{payload[0].payload.name}</p>
                    <p className={cn("text-sm font-bold", val >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {val >= 0 ? '+' : ''}{val}%
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar dataKey="volume" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.volume >= 0 ? '#10b981' : '#ef4444'} 
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GlobalTradeComparisonChart;
