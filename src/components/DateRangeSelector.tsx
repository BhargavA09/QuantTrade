import React from 'react';
import { cn } from '../utils/cn';
import { DateRange } from '../types';

interface DateRangeSelectorProps {
  currentRange: DateRange;
  onRangeChange: (range: DateRange) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ currentRange, onRangeChange }) => {
  const ranges: DateRange[] = ['1M', '3M', '6M', 'ALL'];

  return (
    <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
      {ranges.map((r) => (
        <button
          key={r}
          onClick={() => onRangeChange(r)}
          className={cn(
            "px-2 py-1 text-[10px] font-bold rounded-md transition-all",
            currentRange === r ? "bg-zinc-800 text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
};
