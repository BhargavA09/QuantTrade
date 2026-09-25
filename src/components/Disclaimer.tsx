import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { motion } from 'motion/react';

const Disclaimer = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-amber-200 text-[9px] font-medium tracking-wide"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={12} className="text-amber-500 shrink-0" />
        <span className="font-black uppercase tracking-widest">Regulatory Notice:</span>
        <span className="opacity-80">Educational Simulation Only. Not Financial Advice. No Real Assets Involved.</span>
      </div>
      <div className="hidden sm:block w-px h-3 bg-amber-500/20" />
      <div className="flex items-center gap-2">
        <Info size={12} className="text-amber-500/50 shrink-0" />
        <span className="opacity-60 italic">Data provided for research purposes. All simulations are statistical projections.</span>
      </div>
    </motion.div>
  );
};

export default Disclaimer;
