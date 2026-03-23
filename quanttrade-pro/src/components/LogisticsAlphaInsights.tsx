import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown, Info, Package, Ship, Globe } from 'lucide-react';
import { cn } from '../utils/cn';

interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  affectedSectors: string[];
  confidence: number;
  metric: string;
  value: string;
}

interface LogisticsAlphaInsightsProps {
  data?: {
    id: string;
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    affectedSectors: string[];
    confidence: number;
    metric: string;
    value: string;
  }[];
}

const LogisticsAlphaInsights: React.FC<LogisticsAlphaInsightsProps> = ({ data }) => {
  const defaultInsights: Insight[] = [
    {
      id: '1',
      title: 'Suez Canal Congestion Spike',
      description: 'Recent 15% increase in transit times through the Suez Canal is leading to inventory shortages in European retail.',
      impact: 'negative',
      affectedSectors: ['Consumer Discretionary', 'Retail', 'Logistics'],
      confidence: 88,
      metric: 'Transit Delay',
      value: '+4.2 Days'
    },
    {
      id: '2',
      title: 'Semiconductor Cargo Surge',
      description: 'Air freight volumes for high-value electronics from Taiwan to US West Coast have hit a 6-month high, suggesting strong tech demand.',
      impact: 'positive',
      affectedSectors: ['Technology', 'Semiconductors'],
      confidence: 92,
      metric: 'Air Freight Vol',
      value: '+22%'
    },
    {
      id: '3',
      title: 'Iron Ore Port Inventory Build-up',
      description: 'Significant build-up of iron ore at major Chinese ports indicates a potential slowdown in industrial production.',
      impact: 'negative',
      affectedSectors: ['Materials', 'Industrial', 'Mining'],
      confidence: 75,
      metric: 'Port Inventory',
      value: '145M Tons'
    },
    {
      id: '4',
      title: 'Panama Canal Water Level Recovery',
      description: 'Improving water levels in the Panama Canal are allowing for increased daily transits, easing US East Coast supply chains.',
      impact: 'positive',
      affectedSectors: ['Energy', 'Agriculture', 'Shipping'],
      confidence: 82,
      metric: 'Daily Transits',
      value: '32/Day'
    }
  ];

  const insights = (data && data.length > 0) ? data : defaultInsights;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
          <Info size={14} className="text-emerald-400" />
          Logistics-Driven Alpha Insights
        </h3>
        <span className="text-[8px] font-black text-zinc-600 uppercase tracking-tighter">AI-Generated from Ship Tracking Data</span>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {insights.map((insight, idx) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-all group"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-xl",
                  insight.impact === 'positive' ? "bg-emerald-500/10 text-emerald-400" : 
                  insight.impact === 'negative' ? "bg-rose-500/10 text-rose-400" : "bg-zinc-800 text-zinc-400"
                )}>
                  {insight.impact === 'positive' ? <TrendingUp size={16} /> : 
                   insight.impact === 'negative' ? <TrendingDown size={16} /> : <Info size={16} />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-100">{insight.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">{insight.metric}:</span>
                    <span className={cn(
                      "text-[9px] font-black uppercase",
                      insight.impact === 'positive' ? "text-emerald-400" : 
                      insight.impact === 'negative' ? "text-rose-400" : "text-zinc-400"
                    )}>{insight.value}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-black text-zinc-600 uppercase tracking-tighter">Confidence</div>
                <div className="text-xs font-bold text-zinc-400">{insight.confidence}%</div>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed mb-4">
              {insight.description}
            </p>

            <div className="flex flex-wrap gap-1.5 pt-3 border-t border-zinc-800/50">
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mr-1">Affected:</span>
              {insight.affectedSectors.map((sector, sIdx) => (
                <span key={sIdx} className="px-2 py-0.5 rounded bg-zinc-800 text-[8px] font-bold text-zinc-400 uppercase">
                  {sector}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 mt-6">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={16} className="text-amber-400" />
          <h4 className="text-xs font-bold text-zinc-200">Economic Integration Warning</h4>
        </div>
        <p className="text-[10px] text-zinc-500 leading-relaxed">
          Logistics data is a leading indicator. Delays in shipping lanes often precede earnings misses in retail and manufacturing by 4-6 weeks. Current congestion levels in the Malacca Strait suggest potential headwinds for consumer electronics in Q3.
        </p>
      </div>
    </div>
  );
};

export default LogisticsAlphaInsights;
