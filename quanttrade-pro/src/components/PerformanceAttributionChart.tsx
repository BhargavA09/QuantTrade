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

interface AttributionData {
  name: string;
  value: number;
}

const PerformanceAttributionChart = ({ data }: { data: AttributionData[] }) => {
  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} unit="bps" />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#71717a' }} width={80} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceAttributionChart;
