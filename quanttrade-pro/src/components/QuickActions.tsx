import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Briefcase, 
  Zap, 
  TrendingUp, 
  X,
  PlusCircle,
  Activity,
  BarChart3
} from 'lucide-react';
import { cn } from '../utils/cn';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'search', label: 'Search Ticker', icon: Search, color: 'bg-emerald-500' },
    { id: 'trade', label: 'Add Trade', icon: Briefcase, color: 'bg-blue-500' },
    { id: 'quantlab', label: 'Quant Lab', icon: BarChart3, color: 'bg-purple-500' },
    { id: 'daytrade', label: 'Day Trading', icon: Zap, color: 'bg-amber-500' },
    { id: 'analysis', label: 'Run Analysis', icon: Activity, color: 'bg-zinc-700' },
  ];

  return (
    <div className="fixed bottom-24 right-6 z-[90]">
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-full right-0 mb-4 space-y-3">
            {actions.map((action, idx) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  onAction(action.id);
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 group"
              >
                <span className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-bold text-zinc-200 uppercase tracking-widest shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform hover:scale-110 active:scale-95",
                  action.color
                )}>
                  <action.icon size={20} />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-3xl flex items-center justify-center text-white shadow-2xl transition-all duration-300",
          isOpen ? "bg-zinc-800 rotate-45" : "bg-emerald-500"
        )}
      >
        <Plus size={28} className={cn("transition-transform duration-300", isOpen && "rotate-45")} />
      </motion.button>
    </div>
  );
};

export default QuickActions;
