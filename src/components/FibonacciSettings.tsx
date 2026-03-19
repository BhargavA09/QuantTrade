import React from 'react';
import { Settings2, Save } from 'lucide-react';
import { cn } from '../utils/cn';

const FIB_LEVELS = {
  zero: { value: 0, label: '0.0%', color: '#94a3b8' },
  twentyThree: { value: 0.236, label: '23.6%', color: '#f87171' },
  thirtyEight: { value: 0.382, label: '38.2%', color: '#fbbf24' },
  fifty: { value: 0.5, label: '50.0%', color: '#34d399' },
  sixtyOne: { value: 0.618, label: '61.8%', color: '#60a5fa' },
  seventyEight: { value: 0.786, label: '78.6%', color: '#818cf8' },
  one: { value: 1, label: '100.0%', color: '#a78bfa' },
  oneSixtyOne: { value: 1.618, label: '161.8%', color: '#f472b6' }
};

const FIB_PRESETS = {
  'Standard': [0, 0.382, 0.5, 0.618, 1],
  'Deep': [0, 0.618, 0.786, 1],
  'Full': [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1],
  'Extensions': [1, 1.618]
};

interface FibonacciSettingsProps {
  selectedFibLevels: number[];
  setSelectedFibLevels: (levels: number[]) => void;
}

export const FibonacciSettings: React.FC<FibonacciSettingsProps> = ({
  selectedFibLevels,
  setSelectedFibLevels
}) => {
  return (
    <div className="glass-card p-4 bg-zinc-900/50 border-zinc-800">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Settings2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Fibonacci Levels</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Retracement & Extension</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {Object.keys(FIB_PRESETS).map((preset) => (
            <button
              key={preset}
              onClick={() => setSelectedFibLevels(FIB_PRESETS[preset as keyof typeof FIB_PRESETS])}
              className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 bg-zinc-950 border border-zinc-800 rounded hover:border-zinc-700 hover:text-zinc-200 transition-all"
            >
              {preset}
            </button>
          ))}
          <div className="w-px h-6 bg-zinc-800 mx-2" />
          <button
            onClick={() => {
              const name = prompt('Preset Name:');
              if (name) {
                // In a real app, this would save to state/localStorage
                console.log('Saving preset:', name, selectedFibLevels);
              }
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded hover:bg-emerald-500/20 transition-all"
          >
            <Save size={12} />
            Save Custom
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(FIB_LEVELS).map(([key, level]) => (
          <button
            key={key}
            onClick={() => {
              if (selectedFibLevels.includes(level.value)) {
                setSelectedFibLevels(selectedFibLevels.filter(l => l !== level.value));
              } else {
                setSelectedFibLevels([...selectedFibLevels, level.value]);
              }
            }}
            className={cn(
              "px-3 py-2 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-2",
              selectedFibLevels.includes(level.value)
                ? "bg-zinc-100 border-zinc-100 text-zinc-900"
                : "bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700"
            )}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: level.color }} />
            {level.label} ({level.value})
          </button>
        ))}
      </div>
    </div>
  );
};
