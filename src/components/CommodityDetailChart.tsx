import React from 'react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';

const CommodityDetailChart = ({ commodity }: { commodity: any }) => {
  if (!commodity.history || !commodity.supplyDemand) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Price History */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={12} className="text-emerald-400" />
              30D Price History
            </h4>
            <span className="text-xs font-bold text-zinc-300">${commodity.history[commodity.history.length - 1]?.price}</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={commodity.history}>
                <defs>
                  <linearGradient id={`colorPrice-${commodity.name}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  hide 
                />
                <YAxis 
                  hide 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10b981" 
                  fillOpacity={1} 
                  fill={`url(#colorPrice-${commodity.name})`} 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Supply vs Demand */}
        <div className="glass-card p-4">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Activity size={12} className="text-blue-400" />
            Supply vs Demand Dynamics
          </h4>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[commodity.supplyDemand]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', fontSize: '10px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar dataKey="supply" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Supply" />
                <Bar dataKey="demand" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Demand" />
                <Bar dataKey="inventory" fill="#71717a" radius={[4, 4, 0, 0]} name="Inventory" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Flow Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase">Import Vol</p>
          <p className="text-xs font-bold text-zinc-300">{commodity.importVolume || 'N/A'}</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase">Export Vol</p>
          <p className="text-xs font-bold text-zinc-300">{commodity.exportVolume || 'N/A'}</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase">Top Exporter</p>
          <p className="text-xs font-bold text-zinc-300 truncate">{commodity.topExporter || 'N/A'}</p>
        </div>
        <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800">
          <p className="text-[9px] text-zinc-600 font-bold uppercase">Top Importer</p>
          <p className="text-xs font-bold text-zinc-300 truncate">{commodity.topImporter || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default CommodityDetailChart;
