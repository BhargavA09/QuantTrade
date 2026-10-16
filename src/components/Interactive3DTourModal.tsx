import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe,
  Cpu,
  Brain,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  MousePointer,
  RotateCw,
  Compass
} from 'lucide-react';

interface Interactive3DTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: any) => void;
}

export default function Interactive3DTourModal({
  isOpen,
  onClose,
  onNavigateToTab
}: Interactive3DTourModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);

  const steps = [
    {
      title: 'Global 3D News & Market Shock Radar',
      subtitle: 'Real-Time News Engine with 3D Earth Projection',
      icon: Globe,
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-400',
      description:
        'The platform continuously scans worldwide breaking financial wires across 9 global exchange hubs. News events are positioned on a real-time 3D WebGL globe with dynamic transmission arcs, sentiment shock scoring, and forward price projection lines.',
      actionTab: 'newsscan3d',
      actionLabel: 'Launch 3D News Radar',
      highlights: [
        'Interactive 3D Earth: drag to orbit, zoom, or auto-spin',
        'Click beacons to inspect affected sectors (Tech, Semis, Macro)',
        'Forward price trajectory chart with confidence cones',
        'Custom Headline Injector: test any breaking news instantly'
      ]
    },
    {
      title: 'Institutional Data Engineering & HFT Engine',
      subtitle: 'Multi-layer Feature Pipelines & Sub-Millisecond Calibration',
      icon: Cpu,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-400',
      description:
        'Engineered after top institutional quantitative architectures. Processes raw tick data through Bronze, Silver, and Gold validation pipelines with micro-calibration for high-frequency execution buffers.',
      actionTab: 'quantlab',
      actionLabel: 'Open Quant Lab',
      highlights: [
        'Bronze/Silver/Gold data validation pipelines with zero NaN drift',
        'Micro-calibration telemetry with sub-millisecond execution buffers',
        'Synthetic Monte Carlo backtesting across 10,000+ market paths',
        'One-click deployment to live algorithmic strategy engine'
      ]
    },
    {
      title: 'Adaptive Trader AI & Neural Signals',
      subtitle: 'Fuzzy Logic Inference & Market Regime Filtering',
      icon: Brain,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
      description:
        'Combines neural alpha factor models with fuzzy logic decision boundaries to identify high-probability trading setups while filtering out false breakouts during high volatility.',
      actionTab: 'traderai',
      actionLabel: 'Open Adaptive Trader AI',
      highlights: [
        'Automated trade suggestions with clear risk/reward ratios',
        'Adaptive stop-loss & take-profit adjustments',
        'Multi-factor alpha scoring across volatility and volume profiles',
        'Live simulated order routing and performance tracking'
      ]
    },
    {
      title: 'Ambient 3D Spatial Environment',
      subtitle: 'Hardware-Accelerated WebGL Background & 3D Interactive Dock',
      icon: Layers,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
      description:
        'The entire application is wrapped in an interactive 3D WebGL spatial engine. Cards tilt dynamically with cursor parallax, and the bottom 3D Dock offers instantaneous 1-click navigation.',
      actionTab: 'summary',
      actionLabel: 'Explore 3D Dashboard',
      highlights: [
        'Interactive mouse parallax on background grid and particles',
        'Configurable 3D modes (Cyber Grid, Quantum Horizon, Neural Cloud)',
        '3D Card tilt with holographic specular glare on hover',
        'Quick 3D Navigation Dock with live status indicators'
      ]
    }
  ];

  if (!isOpen) return null;

  const activeStepData = steps[currentStep];
  const StepIcon = activeStepData.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden relative"
          style={{
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(6, 182, 212, 0.2)'
          }}
        >
          {/* Header Bar */}
          <div className="px-6 py-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white tracking-tight">
                  3D Interactive Platform Guide
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Step {currentStep + 1} of {steps.length} • Explore Next-Gen Quant Features
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Step Card */}
            <div className={`p-5 rounded-2xl bg-gradient-to-br ${activeStepData.color} border`}>
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-zinc-950/60 border border-white/10 shrink-0">
                  <StepIcon size={28} />
                </div>
                <div className="space-y-1 flex-1">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 font-bold">
                    {activeStepData.subtitle}
                  </span>
                  <h4 className="text-xl font-bold text-white tracking-tight">
                    {activeStepData.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed pt-1">
                    {activeStepData.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                Key Interactive Capabilities
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeStepData.highlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-300"
                  >
                    <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="px-6 py-4 bg-zinc-900/60 border-t border-zinc-800 flex items-center justify-between">
            {/* Step Indicators */}
            <div className="flex items-center gap-1.5">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2 rounded-full transition-all ${
                    currentStep === idx
                      ? 'w-6 bg-cyan-400'
                      : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-3">
              {/* Direct Tab Launcher */}
              <button
                onClick={() => {
                  onNavigateToTab(activeStepData.actionTab);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all hover:scale-105"
              >
                <span>{activeStepData.actionLabel}</span>
                <ArrowRight size={14} />
              </button>

              {/* Next/Close */}
              {currentStep < steps.length - 1 ? (
                <button
                  onClick={() => setCurrentStep((prev) => prev + 1)}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
