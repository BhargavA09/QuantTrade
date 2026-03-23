import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  LogOut
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
      title: "Core Terminal",
      items: [
        { id: 'summary', label: 'Intelligence Summary', icon: Home, color: 'text-emerald-400' },
        { id: 'portfolio', label: 'Portfolio Optimizer', icon: Briefcase, color: 'text-blue-400' },
        { id: 'dashboard', label: 'Trade Terminal', icon: TrendingUp, color: 'text-emerald-400' },
        { id: 'quantlab', label: 'Quant Research Lab', icon: BarChart3, color: 'text-purple-400' },
      ]
    },
    {
      title: "Model Engineering",
      items: [
        { id: 'projection', label: 'Neural Validation', icon: PieChartIcon, color: 'text-purple-400' },
        { id: 'fundamentals', label: 'Feature Engineering', icon: BarChart3, color: 'text-blue-400' },
        { id: 'risk', label: 'Risk Engine', icon: AlertCircle, color: 'text-rose-400' },
      ]
    },
    {
      title: "Market Microstructure",
      items: [
        { id: 'daytrading', label: 'Execution Engine', icon: Zap, color: 'text-amber-400' },
        { id: 'logistics', label: 'Global Trade & Ship Tracking', icon: Ship, color: 'text-emerald-400' },
        { id: 'global', label: 'Macro Signals', icon: Globe, color: 'text-blue-400' },
        { id: 'markets', label: 'Asset Explorer', icon: LayoutGrid, color: 'text-zinc-400' },
        { id: 'options', label: 'Options Trading', icon: LayoutGrid, color: 'text-purple-400' },
        { id: 'fairvalue', label: 'Fair Value Analysis', icon: BarChart3, color: 'text-emerald-400' },
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
            className="relative w-full max-w-[280px] bg-zinc-950 border-l border-zinc-800 h-full flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <Zap size={18} className="text-white fill-white" />
                </div>
                <span className="font-bold tracking-tighter text-lg">QuantTrade</span>
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
                          <item.icon size={18} className={cn(activeTab === item.id ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300")} />
                          <span className="text-sm font-bold">{item.label}</span>
                        </div>
                        <ChevronRight size={14} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeTab === item.id && "opacity-100")} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
              <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-zinc-900 transition-colors cursor-pointer group">
                <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden">
                  <img src="https://picsum.photos/seed/user/100/100" alt="User" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-200">Quant Analyst</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">Pro Account</p>
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
