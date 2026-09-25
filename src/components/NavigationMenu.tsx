import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Logo } from './Logo';
import { 
  X, 
  Home, 
  Briefcase, 
  TrendingUp, 
  Zap, 
  PieChart as PieChartIcon, 
  BarChart3, 
  AlertCircle, 
  Ship, 
  Globe, 
  LayoutGrid,
  ChevronRight,
  Settings,
  User,
  LogOut,
  Brain,
  Activity
} from 'lucide-react';
import { cn } from '../utils/cn';

interface NavigationMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ isOpen, onClose, activeTab, onTabChange }) => {
  const menuGroups = [
    {
      title: "Overview",
      items: [
        { id: 'finviz', label: 'Finviz Quant Trade', description: 'Finviz treemap, screener & quant projections', icon: LayoutGrid, color: 'text-emerald-400' },
        { id: 'summary', label: 'Dashboard', description: 'Core system status & market overview', icon: Home, color: 'text-emerald-400' },
        { id: 'portfolio', label: 'Portfolio', description: 'Track & manage your simulated assets', icon: Briefcase, color: 'text-blue-400' },
        { id: 'markets', label: 'Global Markets', description: 'Interactive heatmap & global stats', icon: LayoutGrid, color: 'text-zinc-400' },
      ]
    },
    {
      title: "AI & Neural Core",
      items: [
        { id: 'neural', label: 'Neural Engine', description: 'Real-time AI learning & pattern logs', icon: Brain, color: 'text-blue-400' },
        { id: 'aiscan', label: 'AI Vision Scan', description: 'Neural visual chart recognition', icon: Zap, color: 'text-emerald-400' },
        { id: 'quant', label: 'Quant Agent', description: 'Autonomous agent trade simulations', icon: Briefcase, color: 'text-blue-400' },
        { id: 'projection', label: 'Neural Projection', description: 'Predictive modeling & forecasts', icon: PieChartIcon, color: 'text-purple-400' },
      ]
    },
    {
      title: "Research & Analysis",
      items: [
        { id: 'dashboard', label: 'Intelligence', description: 'Deep market analysis & sentiment', icon: TrendingUp, color: 'text-emerald-400' },
        { id: 'technical', label: 'Technical Analysis', description: 'Multi-factor oscillators & pivot trends', icon: Activity, color: 'text-emerald-400' },
        { id: 'advancedchart', label: 'Technical Charts', description: 'Professional-grade charting engine', icon: Activity, color: 'text-blue-400' },
        { id: 'fundamentals', label: 'Fundamentals', description: 'Company health & feature engineering', icon: BarChart3, color: 'text-blue-400' },
        { id: 'fairvalue', label: 'Valuation', description: 'Intrinsic value & model comparison', icon: BarChart3, color: 'text-emerald-400' },
        { id: 'options', label: 'Options Chain', description: 'Derivatives data & Greeks analysis', icon: LayoutGrid, color: 'text-purple-400' },
      ]
    },
    {
      title: "Simulations & Labs",
      items: [
        { id: 'quantlab', label: 'Strategy Lab', description: 'Build & backtest custom strategies', icon: BarChart3, color: 'text-purple-400' },
        { id: 'daytrading', label: 'Market Sim', description: 'High-frequency momentum scans', icon: Zap, color: 'text-amber-400' },
        { id: 'montecarlo', label: 'Monte Carlo Lab', description: 'Statistical risk & path simulations', icon: Activity, color: 'text-emerald-400' },
        { id: 'risk', label: 'Risk Analysis', description: 'Portfolio exposure & stress testing', icon: AlertCircle, color: 'text-rose-400' },
      ]
    },
    {
      title: "Economics & Systems",
      items: [
        { id: 'logistics', label: 'Supply Chain', description: 'Trade flows & logistics monitoring', icon: Ship, color: 'text-emerald-400' },
        { id: 'global', label: 'Macro Economics', description: 'World economy simulation & trends', icon: Globe, color: 'text-blue-400' },
        { id: 'yieldcurve', label: 'Yield Curve', description: 'Treasury yields & economic indicators', icon: Activity, color: 'text-amber-400' },
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[320px] bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo size={32} className="icon-glow-emerald" />
                <span className="font-bold tracking-tighter text-lg">QuantLab</span>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-900 rounded-xl transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 no-scrollbar">
              {menuGroups.map((group, idx) => (
                <div key={idx} className="space-y-3">
                  <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.2em] px-2">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          onClose();
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-2xl transition-all group",
                          activeTab === item.id 
                            ? "bg-emerald-500/10 text-emerald-400" 
                            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <item.icon size={18} className={cn(activeTab === item.id ? "text-emerald-400 icon-glow-emerald" : "text-zinc-500 group-hover:text-zinc-300")} />
                          <div>
                            <span className="text-sm font-bold block">{item.label}</span>
                            <span className="text-[10px] text-zinc-500 font-medium group-hover:text-zinc-400 transition-colors">{item.description}</span>
                          </div>
                        </div>
                        <ChevronRight size={14} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeTab === item.id && "opacity-100")} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
              <button 
                onClick={() => {
                  onClose();
                  // We'll pass a prop to open the contact modal
                  if ((window as any).openContactModal) {
                    (window as any).openContactModal();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 p-3 mb-4 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors border border-emerald-500/20"
              >
                <span className="text-sm font-bold">Contact Support</span>
              </button>
              
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-900 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                  <img src="https://picsum.photos/seed/user/100/100" alt="User" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-200">Quant Analyst</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Active Session</p>
                </div>
                <Settings size={16} className="text-zinc-600 group-hover:text-zinc-400" />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default NavigationMenu;
