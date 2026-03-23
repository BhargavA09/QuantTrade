import React from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

interface RiskReturnData {
  ticker: string;
  return: number;
  volatility: number;
  sharpe: number;
}

const RiskReturnScatterPlot = ({ data }: { data: RiskReturnData[] }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" dataKey="volatility" name="Volatility" unit="%" tick={{ fontSize: 10, fill: '#71717a' }} label={{ value: 'Volatility', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#71717a' }} />
          <YAxis type="number" dataKey="return" name="Return" unit="%" tick={{ fontSize: 10, fill: '#71717a' }} label={{ value: 'Return', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#71717a' }} />
          <ZAxis type="number" dataKey="sharpe" range={[50, 400]} name="Sharpe Ratio" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', fontSize: '10px' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload;
                return (
                  <div className="bg-zinc-900 border border-zinc-800 p-2 rounded shadow-xl">
                    <p className="font-bold text-emerald-400">{item.ticker}</p>
                    <p className="text-zinc-400">Return: {item.return}%</p>
                    <p className="text-zinc-400">Vol: {item.volatility}%</p>
                    <p className="text-zinc-400">Sharpe: {item.sharpe}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Assets" data={data} fill="#3b82f6">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.sharpe > 1 ? '#10b981' : entry.sharpe > 0.5 ? '#3b82f6' : '#ef4444'} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskReturnScatterPlot;
