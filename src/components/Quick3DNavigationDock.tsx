import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Cpu,
  Brain,
  Activity,
  Sparkles,
  TrendingUp,
  PieChart,
  Sliders,
  Maximize2,
  Minimize2,
  Compass,
  Command,
  Search
} from 'lucide-react';

interface Quick3DNavigationDockProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenSearch?: () => void;
}

export default function Quick3DNavigationDock({
  activeTab,
  onSelectTab,
  onOpenSearch
}: Quick3DNavigationDockProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const dockItems = [
    {
      id: 'newsscan3d',
      label: '3D News Radar',
      icon: Globe,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20 border-cyan-500/60 shadow-cyan-500/30',
      badge: '3D'
    },
    {
      id: 'quantlab',
      label: 'Strategy & Stanford Lab',
      icon: Cpu,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/20 border-purple-500/60 shadow-purple-500/30',
      badge: 'HFT'
    },
    {
      id: 'traderai',
      label: 'Adaptive Trader AI',
      icon: Brain,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 border-emerald-500/60 shadow-emerald-500/30',
      badge: 'LIVE'
    },
    {
      id: 'finviz',
      label: 'Finviz Quant Screener',
      icon: Sparkles,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 border-amber-500/60 shadow-amber-500/30'
    },
    {
      id: 'advancedchart',
      label: 'Interactive Charts',
      icon: Activity,
      color: 'text-blue-400',
      activeBg: 'bg-blue-500/20 border-blue-500/60 shadow-blue-500/30'
    },
    {
      id: 'summary',
      label: 'Terminal Overview',
      icon: TrendingUp,
      color: 'text-rose-400',
      activeBg: 'bg-rose-500/20 border-rose-500/60 shadow-rose-500/30'
    },
    {
      id: 'portfolio',
      label: 'Portfolio & Risk',
      icon: PieChart,
      color: 'text-teal-400',
      activeBg: 'bg-teal-500/20 border-teal-500/60 shadow-teal-500/30'
    }
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 select-none">
      <motion.div
        layout
        className="flex items-center gap-1.5 p-2 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl backdrop-blur-2xl"
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.15)'
        }}
      >
        {/* Toggle Minimize/Maximize Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          title={isExpanded ? 'Minimize 3D Navigation Dock' : 'Expand 3D Navigation Dock'}
        >
          {isExpanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
        </button>

        {/* Search / Command trigger */}
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-mono text-zinc-400 hover:text-white bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/60 transition-colors"
            title="Search tickers or commands"
          >
            <Search size={13} className="text-cyan-400" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="text-[9px] bg-zinc-800 px-1 py-0.5 rounded text-zinc-400">⌘K</kbd>
          </button>
        )}

        {/* Expanded 3D Dock Items */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center gap-1 sm:gap-2"
            >
              <div className="h-5 w-[1px] bg-zinc-800 mx-1" />

              {dockItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isHovered = hoveredIndex === index;

                return (
                  <motion.button
                    key={item.id}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => onSelectTab(item.id)}
                    whileHover={{ scale: 1.15, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`relative p-2 sm:px-3 sm:py-2 rounded-xl flex items-center gap-2 border transition-all duration-200 group ${
                      isActive
                        ? `${item.activeBg} border shadow-lg text-white`
                        : 'bg-zinc-900/40 hover:bg-zinc-800/80 border-transparent text-zinc-400 hover:text-zinc-100'
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`transition-colors ${
                        isActive ? 'text-white' : item.color
                      }`}
                    />

                    <span
                      className={`hidden lg:inline text-xs font-semibold tracking-wide ${
                        isActive ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      {item.label}
                    </span>

                    {item.badge && (
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold hidden sm:inline">
                        {item.badge}
                      </span>
                    )}

                    {/* Active Glow Underline */}
                    {isActive && (
                      <motion.div
                        layoutId="activeDockGlow"
                        className="absolute -bottom-1 left-3 right-3 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)]"
                      />
                    )}

                    {/* Tooltip on Mobile/Tablet when label hidden */}
                    {isHovered && (
                      <div className="lg:hidden absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-[10px] font-medium whitespace-nowrap shadow-xl pointer-events-none">
                        {item.label}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
