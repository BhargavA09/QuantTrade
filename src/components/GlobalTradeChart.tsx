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

const GlobalTradeChart = ({ importExport }: { importExport: Record<string, number> }) => {
  const data = Object.entries(importExport).map(([name, value]) => ({
    name: name.toUpperCase(),
    volume: value
  }));

  return (
    <div className="h-[250px] w-full mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#71717a' }} width={40} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
          />
          <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.volume >= 0 ? '#10b981' : '#ef4444'} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GlobalTradeChart;
